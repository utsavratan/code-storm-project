CREATE OR REPLACE FUNCTION public.get_employee_card(_code text)
 RETURNS TABLE(id uuid, full_name text, email text, phone text, designation text, department text, joining_date date, photo_url text, employee_code text, is_active boolean, date_of_birth date, nationality text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT e.id, e.full_name,
    CASE WHEN public.has_role(auth.uid(),'admin') OR public.current_employee_id() = e.id THEN e.email END,
    CASE WHEN public.has_role(auth.uid(),'admin') OR public.current_employee_id() = e.id THEN e.phone END,
    e.designation, e.department, e.joining_date, e.photo_url, e.employee_code, e.is_active,
    CASE WHEN public.has_role(auth.uid(),'admin') OR public.current_employee_id() = e.id THEN e.date_of_birth END,
    e.nationality
  FROM public.employees e
  WHERE _code IS NOT NULL AND btrim(_code) <> '' AND e.is_active = true
    AND (upper(btrim(coalesce(e.employee_code,''))) = upper(btrim(_code)) OR e.id::text = btrim(_code))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.verify_employee(_code text)
 RETURNS TABLE(employee_code text, full_name text, designation text, department text, employment_type text, joining_date date, end_date date, is_active boolean, photo_url text, date_of_birth date, nationality text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT e.employee_code, e.full_name, e.designation, e.department, e.employment_type,
         e.joining_date, e.end_date, e.is_active, e.photo_url,
         CASE WHEN public.has_role(auth.uid(),'admin') OR public.current_employee_id() = e.id THEN e.date_of_birth END,
         e.nationality
  FROM public.employees e
  WHERE _code IS NOT NULL AND length(btrim(_code)) BETWEEN 3 AND 80
    AND (e.is_active = true OR e.end_date IS NOT NULL)
    AND (upper(btrim(coalesce(e.employee_code,''))) = upper(btrim(_code)) OR e.id::text = btrim(_code))
  LIMIT 1;
$$;