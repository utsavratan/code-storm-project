CREATE TABLE public.employee_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  work_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata')::date),
  check_in_at timestamptz,
  check_out_at timestamptz,
  in_lat double precision, in_lng double precision, in_accuracy double precision, in_distance_m double precision,
  out_lat double precision, out_lng double precision, out_distance_m double precision,
  face_confidence numeric,
  selfie_path text,
  status text NOT NULL DEFAULT 'present',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, work_date)
);
GRANT SELECT ON public.employee_attendance TO authenticated;
GRANT ALL ON public.employee_attendance TO service_role;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees view own attendance" ON public.employee_attendance FOR SELECT TO authenticated
  USING (employee_id = public.current_employee_id() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.attendance_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  office_name text NOT NULL DEFAULT 'Office',
  office_lat double precision,
  office_lng double precision,
  radius_m integer NOT NULL DEFAULT 200,
  require_geofence boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.attendance_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
GRANT SELECT, UPDATE ON public.attendance_settings TO authenticated;
GRANT ALL ON public.attendance_settings TO service_role;
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read attendance settings" ON public.attendance_settings FOR SELECT TO authenticated
  USING (public.current_employee_id() IS NOT NULL OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update attendance settings" ON public.attendance_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));