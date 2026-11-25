import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SEO from '@/components/seo/SEO';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const call = async (action: string, token: string, extra: Record<string, unknown> = {}) => {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/handle-unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token, ...extra }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
};

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('Missing unsubscribe link.'); return; }
    (async () => {
      try {
        const j = await call('get', token);
        setEmail(j.subscriber?.email || null);
        await call('unsubscribe', token);
        setStatus('done');
      } catch (e) {
        setErrorMsg((e as Error).message);
        setStatus('error');
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <SEO path="/unsubscribe" title="Unsubscribe — THRYLOS INDIA" description="Manage or cancel your THRYLOS INDIA email subscription." />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="glass-card">
          <CardContent className="p-8 text-center space-y-5">
            {status === 'loading' && (
              <>
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 mx-auto flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
                <h1 className="text-xl font-bold">Processing your request…</h1>
                <p className="text-sm text-muted-foreground">Just a moment while we update your preferences.</p>
              </>
            )}
            {status === 'done' && (
              <>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h1 className="text-2xl font-bold">You've been unsubscribed</h1>
                <p className="text-sm text-muted-foreground">
                  {email ? <><b className="text-foreground">{email}</b> will no longer receive marketing emails from us.</> : 'You will no longer receive marketing emails from us.'}
                </p>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-left text-xs text-muted-foreground">
                  Changed your mind or only want specific types of emails? Manage granular preferences instead.
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link to={`/newsletter-preferences?token=${token}`} className="flex-1">
                    <Button variant="outline" className="w-full">Manage preferences</Button>
                  </Link>
                  <Link to="/" className="flex-1">
                    <Button className="w-full">Back to thrylosindia.in</Button>
                  </Link>
                </div>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="w-14 h-14 rounded-full bg-destructive/15 border border-destructive/30 mx-auto flex items-center justify-center">
                  <Mail className="w-7 h-7 text-destructive" />
                </div>
                <h1 className="text-xl font-bold">Unable to unsubscribe</h1>
                <p className="text-sm text-muted-foreground">{errorMsg || 'This link is invalid or expired.'}</p>
                <Link to="/contact"><Button variant="outline" className="w-full">Contact support</Button></Link>
              </>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-[11px] text-muted-foreground mt-4">© {new Date().getFullYear()} THRYLOS INDIA · thrylosindia.in</p>
      </motion.div>
    </div>
  );
};

export default Unsubscribe;
