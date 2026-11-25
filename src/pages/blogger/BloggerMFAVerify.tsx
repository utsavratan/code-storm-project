import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, LogOut, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PremiumOTP } from "@/components/auth/PremiumOTP";
import { mfaApi, setMfaToken, setDeviceToken } from "@/features/blogger/mfaClient";
import { useBloggerAuth, bloggerFullSignOut } from "@/features/blogger/useAuthGuard";

export const BloggerMFAVerify = () => {
  const auth = useBloggerAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [trust, setTrust] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!auth.ready) return;
    if (auth.stage === 'signed_out') navigate('/blogger-admin/login', { replace: true });
    else if (auth.stage === 'ready') navigate('/blogger-admin', { replace: true });
    else if (auth.stage === 'setup_required') navigate('/blogger-admin/mfa/setup', { replace: true });
  }, [auth.ready, auth.stage, navigate]);

  const submit = async (raw: string) => {
    setVerifying(true);
    try {
      const res = await mfaApi<{ mfa_token: string; device_token: string | null; recovery_used: boolean }>('verify', {
        code: raw, trust_device: trust,
      });
      setMfaToken(res.mfa_token);
      if (res.device_token) setDeviceToken(res.device_token);
      toast({ title: 'Verified', description: res.recovery_used ? 'Recovery code used — regenerate soon.' : undefined });
      await auth.refresh();
      navigate('/blogger-admin', { replace: true });
    } catch (e) {
      toast({ title: 'Invalid code', description: e instanceof Error ? e.message : '', variant: 'destructive' });
      setCode(''); setRecoveryCode('');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">THRYLOS INDIA · Blogger Admin</p>
            <h1 className="text-2xl font-bold mt-1">Two-factor verification</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {recoveryMode ? 'Enter a recovery code (XXXXX-XXXXX).' : 'Enter the 6-digit code from your authenticator app.'}
            </p>
          </div>
        </div>

        {!recoveryMode ? (
          <div className="space-y-5">
            <PremiumOTP value={code} onChange={setCode} onComplete={submit} verifying={verifying} />
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Checkbox checked={trust} onCheckedChange={(v) => setTrust(!!v)} />
              Trust this device for 30 days
            </label>
            <Button className="w-full" disabled={code.length !== 6 || verifying} onClick={() => submit(code)}>
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <Input
              autoFocus
              placeholder="XXXXX-XXXXX"
              value={recoveryCode}
              maxLength={11}
              onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
              className="font-mono text-center text-lg tracking-widest"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Checkbox checked={trust} onCheckedChange={(v) => setTrust(!!v)} />
              Trust this device for 30 days
            </label>
            <Button className="w-full" disabled={recoveryCode.length !== 11 || verifying} onClick={() => submit(recoveryCode)}>
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Use recovery code'}
            </Button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-border/60 flex items-center justify-between gap-3 text-xs">
          <button
            onClick={() => { setRecoveryMode((r) => !r); setCode(''); setRecoveryCode(''); }}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <KeyRound className="w-3.5 h-3.5" /> {recoveryMode ? 'Use authenticator instead' : 'Use a recovery code'}
          </button>
          <button
            onClick={() => { void bloggerFullSignOut().then(() => navigate('/blogger-admin/login', { replace: true })); }}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BloggerMFAVerify;
