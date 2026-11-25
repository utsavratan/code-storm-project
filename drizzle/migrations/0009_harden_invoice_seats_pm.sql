CREATE OR REPLACE FUNCTION public.verify_invoice(_invoice_number text)
 RETURNS TABLE(invoice_number text, project_name text, client_name text, client_company text, total_amount numeric, status text, invoice_date date, due_date date, paid_at timestamp with time zone, reference_id text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT x.invoice_number, x.project_name,
    CASE WHEN public.has_role(auth.uid(),'admin') OR x.owner_id = auth.uid() THEN x.client_name END,
    CASE WHEN public.has_role(auth.uid(),'admin') OR x.owner_id = auth.uid() THEN x.client_company END,
    CASE WHEN public.has_role(auth.uid(),'admin') OR x.owner_id = auth.uid() THEN x.total_amount END,
    x.status, x.invoice_date, x.due_date, x.paid_at, x.reference_id
  FROM (
    SELECT mi.invoice_number, mi.project_name, mc.full_name AS client_name, mc.company_name AS client_company,
           mi.total_amount, mi.status, mi.invoice_date, mi.due_date, mi.paid_at::timestamptz AS paid_at, mi.reference_id, NULL::uuid AS owner_id
    FROM public.manual_invoices mi LEFT JOIN public.manual_clients mc ON mc.id = mi.client_id
    WHERE length(btrim(coalesce(_invoice_number,''))) BETWEEN 3 AND 80
      AND (upper(btrim(mi.invoice_number)) = upper(btrim(_invoice_number))
        OR upper(btrim(coalesce(mi.reference_id,''))) = upper(btrim(_invoice_number)))
    UNION ALL
    SELECT pr.invoice_number, coalesce(sr.title,'Project payment'), p.full_name, coalesce(sr.company_name, p.company),
           pr.amount, pr.status, (pr.paid_at AT TIME ZONE 'Asia/Kolkata')::date, NULL::date, pr.paid_at, NULL::text, pr.user_id
    FROM public.payment_requests pr
    LEFT JOIN public.service_requests sr ON sr.id = pr.service_request_id
    LEFT JOIN public.profiles p ON p.user_id = pr.user_id
    WHERE pr.status = 'paid' AND length(btrim(coalesce(_invoice_number,''))) BETWEEN 3 AND 80
      AND upper(btrim(pr.invoice_number)) = upper(btrim(_invoice_number))
    UNION ALL
    SELECT vs.invoice_number, 'Verification ' || initcap(vs.plan_type) || ' Plan (1 year)', p.full_name, p.company,
           vs.amount, 'paid', (vs.paid_at AT TIME ZONE 'Asia/Kolkata')::date, NULL::date, vs.paid_at, NULL::text, vs.user_id
    FROM public.verification_subscriptions vs LEFT JOIN public.profiles p ON p.user_id = vs.user_id
    WHERE vs.paid_at IS NOT NULL AND length(btrim(coalesce(_invoice_number,''))) BETWEEN 3 AND 80
      AND upper(btrim(vs.invoice_number)) = upper(btrim(_invoice_number))
  ) x LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.event_seats_taken(_event_id uuid)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT count(*)::int FROM public.event_registrations r
  WHERE r.event_id = _event_id AND r.status IN ('confirmed','pending_payment')
    AND (EXISTS (SELECT 1 FROM public.events e WHERE e.id = _event_id AND e.is_published)
         OR auth.uid() IS NULL AND current_user IN ('postgres','service_role')
         OR public.has_role(auth.uid(),'admin') OR public.current_employee_id() IS NOT NULL);
$function$;

CREATE OR REPLACE FUNCTION public.guard_service_request_pm()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.assigned_pm_id := OLD.assigned_pm_id;
    NEW.pm_assigned_at := OLD.pm_assigned_at;
    RETURN NEW;
  END IF;
  IF NEW.assigned_pm_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_verified = true)
     OR NOT EXISTS (SELECT 1 FROM public.project_managers WHERE id = NEW.assigned_pm_id AND is_available) THEN
    NEW.assigned_pm_id := NULL; NEW.pm_assigned_at := NULL;
  ELSE
    NEW.pm_assigned_at := now();
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS guard_service_request_pm ON public.service_requests;
CREATE TRIGGER guard_service_request_pm BEFORE INSERT OR UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.guard_service_request_pm();