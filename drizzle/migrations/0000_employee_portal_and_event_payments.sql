ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS cashfree_order_id text,
  ADD COLUMN IF NOT EXISTS cashfree_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS ticket_emailed_at timestamptz;

CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.employees
  WHERE is_active = true AND lower(btrim(email)) = lower(coalesce(auth.jwt() ->> 'email',''))
    AND coalesce(auth.jwt() ->> 'email','') <> ''
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.current_employee_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_employee_id() TO authenticated;

GRANT SELECT ON public.employees, public.hr_documents, public.events TO authenticated;
GRANT SELECT, INSERT ON public.leave_requests TO authenticated;

CREATE POLICY "Employees view own record" ON public.employees FOR SELECT TO authenticated
  USING (id = public.current_employee_id());
CREATE POLICY "Employees view own documents" ON public.hr_documents FOR SELECT TO authenticated
  USING (public.current_employee_id() IS NOT NULL AND employee_id = public.current_employee_id());
CREATE POLICY "Employees view own leave" ON public.leave_requests FOR SELECT TO authenticated
  USING (employee_id = public.current_employee_id());
CREATE POLICY "Employees apply for leave" ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id = public.current_employee_id() AND status = 'pending' AND to_date >= from_date);
CREATE POLICY "Employees view all events" ON public.events FOR SELECT TO authenticated
  USING (public.current_employee_id() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.employee_event_stats()
RETURNS TABLE(event_id uuid, registered int, checked_in int, waitlist int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.event_id,
    count(*) FILTER (WHERE r.status IN ('confirmed','pending_payment'))::int,
    count(*) FILTER (WHERE r.checked_in_at IS NOT NULL)::int,
    count(*) FILTER (WHERE r.status = 'waitlist')::int
  FROM public.event_registrations r
  WHERE public.current_employee_id() IS NOT NULL OR public.has_role(auth.uid(),'admin')
  GROUP BY r.event_id;
$$;
REVOKE EXECUTE ON FUNCTION public.employee_event_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.employee_event_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.checkin_ticket(_code text)
 RETURNS TABLE(result text, full_name text, event_title text, checked_in_at timestamp with time zone)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r record; c text;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.current_employee_id() IS NOT NULL) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  c := upper(trim(coalesce(_code,'')));
  IF c ~ 'TKT-[A-Z0-9]+' THEN c := substring(c from 'TKT-[A-Z0-9]+'); END IF;
  SELECT er.id, er.full_name, er.status, er.checked_in_at, e.title INTO r
  FROM public.event_registrations er JOIN public.events e ON e.id = er.event_id
  WHERE er.ticket_code = c;
  IF NOT FOUND THEN RETURN QUERY SELECT 'not_found'::text, NULL::text, NULL::text, NULL::timestamptz; RETURN; END IF;
  IF r.status <> 'confirmed' THEN RETURN QUERY SELECT ('not_confirmed:'||r.status)::text, r.full_name, r.title, r.checked_in_at; RETURN; END IF;
  IF r.checked_in_at IS NOT NULL THEN RETURN QUERY SELECT 'already'::text, r.full_name, r.title, r.checked_in_at; RETURN; END IF;
  UPDATE public.event_registrations SET checked_in_at = now() WHERE id = r.id;
  RETURN QUERY SELECT 'ok'::text, r.full_name, r.title, now();
END $function$;