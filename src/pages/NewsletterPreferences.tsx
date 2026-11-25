import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, Save, Home, CheckCircle2, Newspaper, Megaphone, BellRing, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/seo/SEO';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const call = async (action: string, token: string, extra: Record<string, unknown> = {}) => {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/handle-unsubscribe`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token, ...extra }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
};

type Prefs = { newsletter: boolean; marketing: boolean; announcement: boolean };
const defaultPrefs: Prefs = { newsletter: true, marketing: true, announcement: true };

const NewsletterPreferences = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError('Missing preferences link. Open this page from the link in one of your THRYLOS INDIA emails.'); setLoading(false); return; }
    (async () => {
      try {
        const j = await call('get', token);
        setEmail(j.subscriber?.email || null);
        setIsActive(!!j.subscriber?.is_active);
        setPrefs({ ...defaultPrefs, ...(j.subscriber?.preferences || {}) });
      } catch (e) { setError((e as Error).message); }
      setLoading(false);
    })();
  }, [token]);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await call('update', token, { preferences: prefs, is_active: isActive });
      setSaved(true);
      toast({ title: 'Preferences saved' });
    } catch (e) {
      toast({ title: 'Save failed', description: (e as Error).message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const unsubscribeAll = async () => {
    setSaving(true);
    try {
      await call('unsubscribe', token);
      setIsActive(false);
      setPrefs({ newsletter: false, marketing: false, announcement: false });
      toast({ title: 'You have been unsubscribed from all emails' });
    } catch (e) {
      toast({ title: 'Unsubscribe failed', description: (e as Error).message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const Row = ({ icon: Icon, title, desc, k, accent }: { icon: any; title: string; desc: string; k: keyof Prefs; accent: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/60 bg-card/40 hover:bg-card/60 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <Switch checked={prefs[k]} onCheckedChange={(v) => setPrefs(p => ({ ...p, [k]: v }))} disabled={!isActive} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <SEO path="/newsletter-preferences" title="Email preferences — THRYLOS INDIA" description="Choose which THRYLOS INDIA emails you want to receive." />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
        <div className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/30 via-blue-500/15 to-primary/30 blur-2xl opacity-40 pointer-events-none" />
          <Card className="relative glass-card border-primary/20">
            <CardContent className="p-6 sm:p-9 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 mx-auto flex items-center justify-center">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Email preferences</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Fine-tune what THRYLOS INDIA sends to your inbox.</p>
                </div>
                {email && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-primary/10 border border-primary/30 text-primary font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {email}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="py-14 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm p-4 text-center">{error}</div>
              ) : (
                <>
                  <div className={`flex items-center gap-4 p-4 rounded-2xl border ${isActive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/60 bg-muted/20'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">All THRYLOS INDIA emails</p>
                      <p className="text-xs text-muted-foreground">Master switch for every marketing / newsletter email.</p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-1">What you'd like to receive</p>
                    <Row icon={Newspaper} title="Weekly newsletter" desc="Product launches, engineering deep-dives and case studies." k="newsletter" accent="bg-primary/10 text-primary" />
                    <Row icon={Megaphone} title="Marketing offers" desc="Exclusive discounts, promotions and partner deals." k="marketing" accent="bg-orange-500/10 text-orange-400" />
                    <Row icon={BellRing} title="Announcements" desc="Important service, policy or platform updates." k="announcement" accent="bg-blue-500/10 text-blue-400" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 pt-2">
                    <Button onClick={save} disabled={saving} size="lg" className="w-full">
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Save preferences
                    </Button>
                    <Button onClick={unsubscribeAll} disabled={saving || !isActive} variant="outline" size="lg" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      Unsubscribe from all
                    </Button>
                  </div>
                  {saved && <p className="text-center text-xs text-emerald-400">Preferences updated</p>}
                </>
              )}

              <div className="pt-2 border-t border-border/40">
                <Link to="/"><Button variant="ghost" className="w-full text-xs">Back to thrylosindia.in</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default NewsletterPreferences;
