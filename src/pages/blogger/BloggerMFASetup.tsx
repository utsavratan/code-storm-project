import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { ShieldCheck, Copy, Download, Loader2, Check, KeyRound, ArrowRight, Smartphone, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PremiumOTP } from "@/components/auth/PremiumOTP";
import { mfaApi, setMfaToken } from "@/features/blogger/mfaClient";
import { useBloggerAuth } from "@/features/blogger/useAuthGuard";

type Step = "loading" | "show-qr" | "show-recovery" | "verify" | "done";

/** Break base32 into 4-char groups for readable display: "ABCD EFGH IJKL ..." */
const formatKey = (s: string) => s.replace(/(.{4})/g, "$1 ").trim();

export const BloggerMFASetup = () => {
  const auth = useBloggerAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("loading");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!auth.ready) return;
    if (auth.stage === "signed_out") navigate("/blogger-admin/login", { replace: true });
    else if (auth.stage === "ready") navigate("/blogger-admin", { replace: true });
    else if (auth.stage === "verify_required") navigate("/blogger-admin/mfa/verify", { replace: true });
  }, [auth.ready, auth.stage, navigate]);

  useEffect(() => {
    if (auth.stage !== "setup_required" || step !== "loading") return;
    let alive = true;
    (async () => {
      try {
        const res = await mfaApi<{ otpauth_url: string; secret_base32: string; recovery_codes: string[] }>("setup-init");
        if (!alive) return;
        setOtpauthUrl(res.otpauth_url);
        setSecret(res.secret_base32);
        setRecoveryCodes(res.recovery_codes);
        // High-contrast scannable QR: black modules on white background inside a white card.
        const dataUrl = await QRCode.toDataURL(res.otpauth_url, {
          width: 288,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        if (!alive) return;
        setQrDataUrl(dataUrl);
        setStep("show-qr");
      } catch (e) {
        toast({ title: "Setup failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
      }
    })();
    return () => { alive = false; };
  }, [auth.stage, step, toast]);

  const handleVerify = async (fullCode: string) => {
    setVerifying(true);
    try {
      const res = await mfaApi<{ ok: boolean; mfa_token: string }>("setup-verify", { code: fullCode });
      setMfaToken(res.mfa_token);
      setStep("done");
      toast({ title: "Two-factor enabled" });
      await auth.refresh();
      setTimeout(() => navigate("/blogger-admin", { replace: true }), 800);
    } catch (e) {
      toast({ title: "Invalid code", description: e instanceof Error ? e.message : "", variant: "destructive" });
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 1600);
  };
  const copyRecovery = async () => {
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopiedRecovery(true);
    setTimeout(() => setCopiedRecovery(false), 1600);
  };
  const downloadRecovery = () => {
    const body = `THRYLOS INDIA — Blogger Admin recovery codes
Account: ${auth.email}
Generated: ${new Date().toISOString()}

${recoveryCodes.join("\n")}

Each code works exactly once. Store them in a password manager or a safe place.`;
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "thrylos-blogger-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const stepIndex = useMemo(() => ({ loading: 0, "show-qr": 1, "show-recovery": 2, verify: 3, done: 3 }[step]), [step]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,hsl(var(--primary)/0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,hsl(190_100%_50%/0.08),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(hsl(var(--primary))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary))_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl rounded-3xl border border-border/60 bg-card/70 backdrop-blur-2xl shadow-2xl shadow-primary/5 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
              <KeyRound className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.24em] text-primary/80 font-semibold">THRYLOS INDIA · Blogger Admin</p>
              <h1 className="text-xl sm:text-2xl font-bold mt-0.5 truncate">Set up two-factor security</h1>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">Signed in as {auth.email}</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="mt-6 flex items-center gap-2">
            {["Scan", "Save codes", "Verify"].map((label, i) => {
              const active = stepIndex - 1 >= i;
              const current = stepIndex - 1 === i;
              return (
                <div key={label} className="flex-1 flex items-center gap-2">
                  <div
                    className={`h-1.5 flex-1 rounded-full transition-colors ${active ? "bg-primary" : "bg-border/70"} ${current ? "shadow-[0_0_12px_hsl(var(--primary)/0.6)]" : ""}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>1 · Scan QR</span>
            <span className="text-center">2 · Save codes</span>
            <span className="text-right">3 · Verify</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-10">
          <AnimatePresence mode="wait">
            {step === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm">Generating your secure setup key…</p>
              </motion.div>
            )}

            {step === "show-qr" && (
              <motion.div key="qr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-7">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Smartphone, title: "Install an app", desc: "Google Authenticator, Authy or Microsoft Authenticator." },
                    { icon: KeyRound, title: "Scan or paste key", desc: "Point your phone at the QR, or paste the setup key." },
                    { icon: Lock, title: "Enter 6-digit code", desc: "Confirm the code to enable two-factor." },
                  ].map((it) => (
                    <div key={it.title} className="rounded-xl border border-border/50 bg-background/40 p-3">
                      <it.icon className="w-4 h-4 text-primary mb-1.5" />
                      <p className="text-xs font-semibold">{it.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{it.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-[288px_1fr] gap-6 items-start">
                  {/* QR — solid white card, high-contrast black modules, always visible */}
                  <div className="mx-auto">
                    <div className="rounded-2xl bg-white p-4 shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.3)] border-2 border-primary/30">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Two-factor QR code"
                          width={256}
                          height={256}
                          className="block w-64 h-64"
                        />
                      ) : (
                        <div className="w-64 h-64 grid place-items-center bg-white">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-center text-muted-foreground mt-2">Issuer · THRYLOS INDIA</p>
                  </div>

                  {/* Setup key — full width block that shows the whole key at once */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Setup key</label>
                      <button
                        type="button"
                        onClick={copySecret}
                        className="text-xs inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium"
                      >
                        {copiedSecret ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                      </button>
                    </div>
                    <div className="rounded-xl border-2 border-dashed border-primary/30 bg-background/60 p-4">
                      <p
                        className="font-mono text-base sm:text-lg leading-relaxed tracking-[0.15em] text-foreground break-all whitespace-normal select-all"
                        aria-label="TOTP setup key"
                      >
                        {formatKey(secret)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Can't scan? Open your authenticator app, choose <span className="text-foreground font-medium">Enter setup key manually</span>,
                      paste the key above, and select <span className="text-foreground font-medium">Time-based</span>.
                    </p>
                    <div className="hidden">{otpauthUrl}</div>
                  </div>
                </div>

                <Button size="lg" className="w-full gap-2 rounded-xl" onClick={() => setStep("show-recovery")}>
                  I've added the account · Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {step === "show-recovery" && (
              <motion.div key="recovery" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-5">
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <p className="font-semibold mb-1">Save these 10 recovery codes now.</p>
                  <p className="text-amber-100/80 text-xs leading-relaxed">
                    They will not be shown again. Use one if you lose access to your authenticator. Each code works exactly once.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-background/60 rounded-xl p-4 border border-border/60">
                  {recoveryCodes.map((c, i) => (
                    <div key={c} className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs w-4 text-right">{i + 1}.</span>
                      <span className="tracking-widest select-all">{c}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={copyRecovery}>
                    {copiedRecovery ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copiedRecovery ? "Copied" : "Copy all"}
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" onClick={downloadRecovery}>
                    <Download className="w-4 h-4" /> Download .txt
                  </Button>
                </div>
                <Button size="lg" className="w-full gap-2 rounded-xl" onClick={() => setStep("verify")}>
                  I saved my codes <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {step === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-6 py-4">
                <div className="text-center space-y-1.5">
                  <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app to enable two-factor.</p>
                </div>
                <PremiumOTP value={code} onChange={setCode} onComplete={handleVerify} verifying={verifying} />
                <Button size="lg" className="w-full rounded-xl" disabled={code.length !== 6 || verifying} onClick={() => handleVerify(code)}>
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enable two-factor"}
                </Button>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="py-10 flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_40px_hsl(160_84%_39%/0.4)]">
                  <ShieldCheck className="w-8 h-8 text-emerald-300" />
                </div>
                <p className="font-semibold text-lg">Two-factor enabled</p>
                <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default BloggerMFASetup;
