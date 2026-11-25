ALTER TABLE public.reviews ALTER COLUMN is_approved SET DEFAULT false;
CREATE OR REPLACE FUNCTION public.guard_review_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  NEW.is_approved := false;
  NEW.is_featured := false;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_review_approval ON public.reviews;
CREATE TRIGGER guard_review_approval BEFORE INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.guard_review_approval();