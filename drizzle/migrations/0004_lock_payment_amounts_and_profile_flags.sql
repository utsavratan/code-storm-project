DROP POLICY IF EXISTS "Users can insert own payments" ON public.payment_requests;

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  NEW.is_banned := OLD.is_banned;
  NEW.is_verified := OLD.is_verified;
  NEW.verification_type := OLD.verification_type;
  NEW.account_id := OLD.account_id;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_profile_privileged_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_profile_privileged_fields ON public.profiles;
CREATE TRIGGER guard_profile_privileged_fields BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_fields();