CREATE TABLE public.internal_job_tokens (name text PRIMARY KEY, token text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.internal_job_tokens FROM anon, authenticated;
GRANT ALL ON public.internal_job_tokens TO service_role;
ALTER TABLE public.internal_job_tokens ENABLE ROW LEVEL SECURITY;
INSERT INTO public.internal_job_tokens(name, token) VALUES ('leetcode_cron', encode(extensions.gen_random_bytes(32),'hex'));

DO $$
DECLARE j record;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname LIKE 'leetcode-reminder-%' LOOP
    PERFORM cron.alter_job(j.jobid, command := $c$select net.http_post(url:='https://xywmgradzlzrhuxnbbag.supabase.co/functions/v1/leetcode-reminder', headers:=jsonb_build_object('Content-Type','application/json','x-cron-token',(select token from public.internal_job_tokens where name='leetcode_cron')), body:='{}'::jsonb);$c$);
  END LOOP;
END $$;