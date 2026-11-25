import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  ScanLine,
  Loader2,
  Building2,
  User,
  Calendar,
  IndianRupee,
  Hash,
  BadgeCheck,
  ArrowRight,
  Camera,
  X,
  FileText,
  Users,
  FolderOpen,
  CheckCircle2,
  XCircle,
  LockKeyhole,
  ChevronRight,
  Sparkles,
  Copy,
  Printer,
  RotateCcw,
  Clock,
  Fingerprint,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/seo/SEO";

type VerifyMode = "invoice" | "employee" | "document";

interface VerifiedInvoice {
  invoice_number: string;
  project_name: string;
  client_name: string | null;
  client_company: string | null;
  total_amount: number | null;
  status: string;
  invoice_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  reference_id: string | null;
}

interface VerifiedEmployee {
  employee_code: string;
  full_name: string;
  designation: string;
  department: string | null;
  employment_type: string;
  joining_date: string;
  end_date: string | null;
  is_active: boolean;
  photo_url: string | null;
}

interface VerifiedDocument {
  document_number: string;
  document_type: string;
  employee_name: string;
  created_at: string;
}

interface SlipField {
  icon: JSX.Element;
  label: string;
  value: string;
  mono?: boolean;
}

interface SlipContent {
  key: string;
  eyebrow: string;
  title: string;
  badge?: React.ReactNode;
  preContent?: React.ReactNode;
  fields: SlipField[];
  footerMode: VerifyMode;
  footerValue: string;
}

const statusStyles: Record<string, { label: string; className: string; icon: JSX.Element }> = {
  paid: {
    label: "Paid",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: <BadgeCheck className="h-3.5 w-3.5" />,
  },
  sent: {
    label: "Sent",
    className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    icon: <ArrowRight className="h-3.5 w-3.5" />,
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: <Loader2 className="h-3.5 w-3.5" />,
  },
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
    icon: <Hash className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const modeMeta: Record<
  VerifyMode,
  {
    label: string;
    icon: JSX.Element;
    hint: string;
    placeholder: string;
    queryKey: string;
  }
> = {
  invoice: {
    label: "Invoice",
    icon: <FileText className="h-[18px] w-[18px]" strokeWidth={1.8} />,
    hint: "Verify invoices and receipts issued by THRYLOS INDIA.",
    placeholder: "INV-26-XXXX",
    queryKey: "inv",
  },

  employee: {
    label: "Employee",
    icon: <Users className="h-[18px] w-[18px]" strokeWidth={1.8} />,
    hint: "Verify an ID card and current employment status.",
    placeholder: "THR-EMP-1234",
    queryKey: "emp",
  },

  document: {
    label: "Document",
    icon: <FolderOpen className="h-[18px] w-[18px]" strokeWidth={1.8} />,
    hint: "Verify an offer, joining or completion letter.",
    placeholder: "OFR-26-XXXX",
    queryKey: "doc",
  },
};

const MODE_ORDER: VerifyMode[] = ["invoice", "employee", "document"];

// Cycled while a lookup is in flight — a terminal-style readout line, not a
// real progress indicator (the RPC doesn't expose granular progress).
const VERIFY_STEPS = [
  "connecting to verification registry",
  "matching reference number",
  "cross-checking authenticity",
  "finalizing result",
];

const RETRY_TIPS = [
  "Double-check every character of the reference — it's case-insensitive but typos aren't forgiven.",
  "Confirm the correct category is selected above (Invoice / Employee / Document).",
  "If it's printed on the record, try scanning the code instead of typing it.",
];

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

const formatTime = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

// ─── Motion tokens ─────────────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1] as const;

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const rowItem: Variants = {
  hidden: { opacity: 0, x: 10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
};

/** The slip unrolls downward from the console's mouth, like a receipt being
 *  printed — the signature motion for every result, success or error. */
const slipReveal: Variants = {
  hidden: { opacity: 0, scaleY: 0.08, y: -6 },
  show: { opacity: 1, scaleY: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
  exit: { opacity: 0, scaleY: 0.08, y: -4, transition: { duration: 0.22, ease: EASE } },
};

// ─── Small shared pieces ────────────────────────────────────────────────────

/** The perforated seam where a slip tears away from the console — two
 *  page-colored notches punched into a dashed line. */
const PerforatedSeam = () => (
  <div className="relative h-3">
    <span className="absolute -left-[10px] -top-[10px] h-5 w-5 rounded-full bg-background" />
    <span className="absolute -right-[10px] -top-[10px] h-5 w-5 rounded-full bg-background" />
    <div className="absolute inset-x-4 top-[5px] border-t-2 border-dashed border-border/50" />
  </div>
);

const CopyLinkButton = ({ mode, value }: { mode: VerifyMode; value: string }) => {
  const { toast } = useToast();
  const handleCopy = async () => {
    const key = modeMeta[mode].queryKey;
    const url = `${window.location.origin}${window.location.pathname}?${key}=${encodeURIComponent(value)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Verification link copied to clipboard." });
    } catch {
      toast({ title: "Couldn't copy", description: url, variant: "destructive" });
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 gap-1.5 rounded-lg text-[11px]">
      <Copy className="h-3.5 w-3.5" /> Copy link
    </Button>
  );
};

/** The big radar/reticle scanner — the page's one signature element. Mode
 *  tabs and the reference-code input are fused directly into it, so
 *  "choose what to verify" and "type the reference" read as a single
 *  action: aim the scanner, then read it out. */
const Reticle = ({
  mode,
  onModeChange,
  value,
  onValueChange,
  onSubmit,
  onScan,
  tone,
  loading,
  inputRef,
}: {
  mode: VerifyMode;
  onModeChange: (m: VerifyMode) => void;
  value: string;
  onValueChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onScan: () => void;
  tone: "idle" | "loading" | "success" | "error";
  loading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const meta = modeMeta[mode];

  const ringColor =
    tone === "success" ? "border-emerald-500/35" : tone === "error" ? "border-destructive/40" : "border-primary/20";
  const glow =
    tone === "success"
      ? "shadow-[0_0_90px_-20px_rgba(16,185,129,0.55)]"
      : tone === "error"
        ? "shadow-[0_0_90px_-20px_rgba(220,38,38,0.5)]"
        : "shadow-[0_0_90px_-20px_hsl(var(--primary)/0.5)]";
  const sweepColor =
    tone === "success" ? "rgba(16,185,129,0.4)" : tone === "error" ? "rgba(220,38,38,0.4)" : "hsl(var(--primary)/0.4)";

  return (
    <div className="flex flex-col items-center">
      {/* Premium verification mode selector */}
      <div className="relative mb-8 flex w-full justify-center">
        <div
          className="
      relative flex w-full max-w-[620px]
      items-center
      rounded-2xl
      border border-white/[0.08]
      bg-[#080a0f]/90
      p-1
      shadow-[0_18px_60px_-35px_rgba(0,0,0,0.9)]
      backdrop-blur-2xl
    "
        >
          {MODE_ORDER.map((m, index) => {
            const active = m === mode;

            return (
              <div key={m} className="relative flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => onModeChange(m)}
                  className={`
              group relative flex h-[58px] w-full
              items-center justify-center
              gap-2.5 rounded-xl
              px-3
              transition-all duration-300
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-primary/40
              ${active ? "text-primary" : "text-muted-foreground hover:bg-white/[0.025] hover:text-foreground"}
            `}
                >
                  {/* Active glass surface */}
                  {active && (
                    <motion.span
                      layoutId="verification-active-bg"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                      }}
                      className="
                  absolute inset-0
                  rounded-xl
                  border border-primary/20
                  bg-primary/[0.075]
                  shadow-[inset_0_0_25px_rgba(59,130,246,0.035)]
                "
                    />
                  )}

                  {/* Icon */}
                  <span
                    className={`
                relative z-10
                flex h-9 w-9 shrink-0
                items-center justify-center
                rounded-lg
                transition-all duration-300
                ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "bg-white/[0.025] text-muted-foreground/80 group-hover:bg-white/[0.045]"
                }
              `}
                  >
                    {modeMeta[m].icon}
                  </span>

                  {/* Label */}
                  <span
                    className={`
                relative z-10
                text-[12px]
                font-bold
                tracking-[0.01em]
                transition-all duration-300
                sm:text-[13px]
                ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
              `}
                  >
                    {modeMeta[m].label}
                  </span>

                  {/* Active indicator */}
                  {active && (
                    <motion.span
                      layoutId="verification-active-line"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                      }}
                      className="
                  absolute bottom-0 left-1/2
                  h-[2px] w-10
                  -translate-x-1/2
                  rounded-full
                  bg-primary
                  shadow-[0_0_12px_rgba(59,130,246,0.8)]
                "
                    />
                  )}
                </button>

                {/* Separator */}
                {index < MODE_ORDER.length - 1 && <span className="pointer-events-none h-6 w-px bg-white/[0.07]" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Radar dial */}
      <motion.div
        key={tone}
        initial={{ scale: 0.94 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="relative flex h-[230px] w-[230px] items-center justify-center sm:h-[260px] sm:w-[260px]"
      >
        {/* tick marks */}
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-2 w-[1.5px] origin-bottom bg-border/60"
            style={{ transform: `rotate(${i * 15}deg) translateY(-118px)` }}
          />
        ))}

        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-[6px] overflow-hidden rounded-full"
            style={{
              background: `conic-gradient(from 0deg, transparent 0%, ${sweepColor} 10%, transparent 26%)`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: loading ? 1.6 : 8, repeat: Infinity, ease: "linear" }}
          />
        )}

        {[0.72, 0.86, 1].map((s) => (
          <span key={s} className={`absolute rounded-full border ${ringColor}`} style={{ inset: `${(1 - s) * 50}%` }} />
        ))}

        {!prefersReducedMotion &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className={`absolute rounded-full border ${tone === "success" ? "border-emerald-500/30" : tone === "error" ? "border-destructive/30" : "border-primary/20"}`}
              style={{ inset: 0 }}
              animate={{ scale: [1, 1.42], opacity: [0.5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.85, ease: "easeOut" }}
            />
          ))}

        {/* Center glass disc — the input lives here */}
        <div
          className={`relative z-10 flex h-[140px] w-[140px] flex-col items-center justify-center gap-1.5 rounded-full border border-border/60 bg-card/90 backdrop-blur ${glow} sm:h-[158px] sm:w-[158px]`}
        >
          <AnimatePresence mode="wait">
            {tone === "success" ? (
              <motion.div
                key="ok"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 340, damping: 16 }}
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </motion.div>
            ) : tone === "error" ? (
              <motion.div
                key="bad"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 340, damping: 16 }}
              >
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </motion.div>
            ) : (
              <form key="input" onSubmit={onSubmit} className="flex w-full flex-col items-center gap-1 px-4">
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => onValueChange(e.target.value.toUpperCase())}
                  placeholder={meta.placeholder}
                  autoFocus
                  className="w-full bg-transparent text-center font-mono text-[13px] font-black tracking-[0.12em] text-foreground placeholder:text-muted-foreground/50 focus:outline-none sm:text-sm"
                />
                <span className="h-[2px] w-10 rounded-full bg-primary/30" />
                <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {meta.label} code
                </p>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="mt-7 flex w-full max-w-xs flex-col gap-2 sm:max-w-sm sm:flex-row">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
          <Button onClick={onSubmit} disabled={loading || !value.trim()} className="h-11 w-full rounded-xl font-bold">
            <AnimatePresence mode="wait" initial={false}>
              {loading ? (
                <motion.span
                  key="l"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning…
                </motion.span>
              ) : (
                <motion.span
                  key="i"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <BadgeCheck className="mr-2 h-4 w-4" /> Verify record
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button type="button" variant="outline" onClick={onScan} className="h-11 w-full rounded-xl sm:w-auto sm:px-4">
            <ScanLine className="mr-2 h-4 w-4 sm:mr-0" />
            <span className="sm:hidden">Scan code</span>
          </Button>
        </motion.div>
      </div>

      <p className="mt-4 max-w-xs text-center text-[11px] leading-5 text-muted-foreground">{meta.hint}</p>
    </div>
  );
};

/** One unified receipt-style printout for every successful verification —
 *  invoice, employee or document all render through this, so the payoff
 *  always looks and behaves the same way regardless of what was checked. */
const VerificationSlip = ({
  content,
  verifiedAt,
  onReset,
}: {
  content: SlipContent;
  verifiedAt: Date | null;
  onReset: () => void;
}) => (
  <motion.div
    key={content.key}
    variants={slipReveal}
    initial="hidden"
    animate="show"
    exit="exit"
    style={{ transformOrigin: "top center" }}
    className="relative overflow-hidden rounded-b-[24px] border border-t-0 border-emerald-500/25 bg-card/90 shadow-[0_35px_90px_-55px_rgba(16,185,129,0.5)] backdrop-blur-xl"
  >
    <PerforatedSeam />

    <div className="px-5 pb-5 pt-3 sm:px-8 sm:pb-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-500">
            {content.eyebrow}
          </p>
          <p className="mt-1.5 break-all font-mono text-lg font-black tracking-tight sm:text-xl">{content.title}</p>
        </div>
        {content.badge}
      </div>

      {content.preContent && <div className="mt-4">{content.preContent}</div>}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mt-4 rounded-2xl border border-border/40 bg-background/30 p-2.5 sm:p-3"
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {content.fields.map((f) => (
            <motion.div
              key={f.label}
              variants={rowItem}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="group relative min-w-0 overflow-hidden rounded-xl border border-border/50 bg-card/70 p-3.5 transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.035] hover:shadow-[0_8px_25px_-18px_hsl(var(--primary)/0.5)]"
            >
              {/* Subtle accent line */}
              <span className="absolute left-0 top-0 h-full w-[2px] bg-primary/25 transition-colors duration-200 group-hover:bg-primary/70" />

              {/* Label + icon */}
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.08] text-primary/80">
                  {f.icon}
                </span>

                <span className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {f.label}
                </span>
              </div>

              {/* Value */}
              <div
                className={`mt-2.5 min-w-0 pl-0.5 text-[13px] font-black leading-5 text-foreground ${
                  f.mono ? "break-all font-mono text-[11px] tracking-wide" : "break-words"
                }`}
              >
                {f.value}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="mt-5 flex flex-col gap-3 border-t border-dashed border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          {verifiedAt ? <>Verified today at {formatTime(verifiedAt)}</> : "Verified"} · THRYLOS INDIA Verification
          Authority
        </p>
        <div className="flex flex-wrap gap-2">
          <CopyLinkButton mode={content.footerMode} value={content.footerValue} />
          <Button variant="ghost" size="sm" onClick={onReset} className="h-8 gap-1.5 rounded-lg text-[11px]">
            <RotateCcw className="h-3.5 w-3.5" /> New scan
          </Button>
        </div>
      </div>
    </div>
  </motion.div>
);

const ErrorSlip = ({ message, onRetry, onReset }: { message: string; onRetry: () => void; onReset: () => void }) => (
  <motion.div
    key="error-slip"
    variants={slipReveal}
    initial="hidden"
    animate="show"
    exit="exit"
    style={{ transformOrigin: "top center" }}
    className="relative overflow-hidden rounded-b-[24px] border border-t-0 border-destructive/25 bg-card/90 shadow-[0_35px_90px_-55px_rgba(220,38,38,0.4)] backdrop-blur-xl"
  >
    <PerforatedSeam />
    <div className="px-5 pb-5 pt-3 sm:px-8 sm:pb-7">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-destructive">
        <ShieldAlert className="h-3 w-3" /> Record could not be verified
      </p>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{message}</p>

      <p className="mb-2.5 mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Try this before contacting support
      </p>
      <ul className="space-y-2">
        {RETRY_TIPS.map((tip) => (
          <li key={tip} className="flex items-start gap-2.5 text-[13px] leading-6 text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/60" />
            {tip}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-dashed border-border/50 pt-4">
        <Button size="sm" onClick={onRetry} className="h-8 gap-1.5 rounded-lg text-[11px]">
          <RotateCcw className="h-3.5 w-3.5" /> Try again
        </Button>
        <Button variant="outline" size="sm" asChild className="h-8 rounded-lg text-[11px]">
          <a href="mailto:hr@thrylosindia.in">Contact support</a>
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} className="h-8 gap-1.5 rounded-lg text-[11px]">
          New scan
        </Button>
      </div>
    </div>
  </motion.div>
);

const VerifyInvoice = () => {
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const initialMode: VerifyMode = params.get("emp") ? "employee" : params.get("doc") ? "document" : "invoice";
  const [mode, setMode] = useState<VerifyMode>(initialMode);
  const initialValue = params.get(modeMeta[initialMode].queryKey) || "";
  const [value, setValue] = useState(initialValue);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<VerifiedInvoice | null>(null);
  const [employeeData, setEmployeeData] = useState<VerifiedEmployee | null>(null);
  const [docData, setDocData] = useState<VerifiedDocument | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<Date | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const scannerDivId = "verify-barcode-scanner";
  const inputRef = useRef<HTMLInputElement>(null);

  const spotlightRef = useRef<HTMLDivElement>(null);
  const handleRootMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const el = spotlightRef.current;
    if (!el) return;
    el.style.setProperty("--sx", `${e.clientX}px`);
    el.style.setProperty("--sy", `${e.clientY}px`);
  };

  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => {
    if (!loading) {
      setStepIndex(0);
      return;
    }
    const t = setInterval(() => setStepIndex((i) => (i + 1) % VERIFY_STEPS.length), 750);
    return () => clearInterval(t);
  }, [loading]);

  const reset = () => {
    setInvoiceData(null);
    setEmployeeData(null);
    setDocData(null);
    setError(null);
    setVerifiedAt(null);
  };

  const lookup = async (raw: string, currentMode: VerifyMode) => {
    const target = raw.trim();
    if (!target) return;
    setLoading(true);
    reset();
    try {
      if (currentMode === "invoice") {
        const { data: rows, error: rpcError } = await supabase.rpc("verify_invoice", { _invoice_number: target });
        if (rpcError) throw rpcError;
        const row = Array.isArray(rows) ? rows[0] : rows;
        if (!row) setError(`No invoice found for "${target}".`);
        else {
          setInvoiceData(row as VerifiedInvoice);
          setVerifiedAt(new Date());
        }
      } else if (currentMode === "employee") {
        const { data: rows, error: rpcError } = await supabase.rpc("verify_employee", { _code: target });
        if (rpcError) throw rpcError;
        const row = Array.isArray(rows) ? rows[0] : rows;
        if (!row) setError(`No active employee found for code "${target}".`);
        else {
          setEmployeeData(row as VerifiedEmployee);
          setVerifiedAt(new Date());
        }
      } else {
        // Document lookups now go through a SECURITY DEFINER RPC, the same
        // pattern as verify_invoice / verify_employee, instead of a raw
        // `.from("hr_documents").select(...)` call. That raw call was
        // subject to Row Level Security — with no public SELECT policy on
        // hr_documents, anonymous visitors always got zero rows back, so
        // this mode reported "not verified" even for real documents.
        // Migration: create_verify_document_function.sql
        const { data: rows, error: rpcError } = await supabase.rpc("verify_hr_document", { _reference: target });
        if (rpcError) throw rpcError;
        const row = Array.isArray(rows) ? rows[0] : rows;
        if (!row) setError(`No HR document found for "${target}". Please check the reference.`);
        else {
          setDocData(row as VerifiedDocument);
          setVerifiedAt(new Date());
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (initialValue) void lookup(initialValue, initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchMode = (next: VerifyMode) => {
    setMode(next);
    setValue("");
    reset();
    setParams({});
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const key = modeMeta[mode].queryKey;
    setParams(value.trim() ? { [key]: value.trim() } : {});
    void lookup(value, mode);
  };

  const startOver = () => {
    reset();
    setValue("");
    setParams({});
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const openScanner = async () => {
    setScannerOpen(true);
    await new Promise((r) => setTimeout(r, 200));
    try {
      const mod = await import("html5-qrcode");
      const html5Qrcode = new mod.Html5Qrcode(scannerDivId, {
        // Explicitly enable the 1D symbologies we print (CODE128 on ID cards
        // and HR documents) alongside QR — without this some browsers only
        // attempt QR decoding and barcodes never resolve.
        formatsToSupport: [
          mod.Html5QrcodeSupportedFormats.QR_CODE,
          mod.Html5QrcodeSupportedFormats.CODE_128,
          mod.Html5QrcodeSupportedFormats.CODE_39,
          mod.Html5QrcodeSupportedFormats.CODE_93,
          mod.Html5QrcodeSupportedFormats.EAN_13,
          mod.Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });
      scannerRef.current = {
        stop: () =>
          html5Qrcode
            .stop()
            .then(() => html5Qrcode.clear())
            .catch(() => {}),
      };
      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 12,
          // A wide, shallow box suits linear barcodes; sized to the viewfinder
          // so nothing is cropped on narrow phones.
          qrbox: (w, h) => ({ width: Math.floor(Math.min(w * 0.92, 340)), height: Math.floor(Math.min(h * 0.6, 180)) }),
          aspectRatio: 1.35,
        },

        (decoded) => {
          let v = decoded.trim();
          let detectedMode: VerifyMode = mode;
          try {
            const url = new URL(v);
            const q = url.searchParams;
            const path = url.pathname.replace(/\/+$/, "");
            if (q.get("inv")) {
              v = q.get("inv")!;
              detectedMode = "invoice";
            } else if (q.get("emp")) {
              v = q.get("emp")!;
              detectedMode = "employee";
            } else if (q.get("doc")) {
              v = q.get("doc")!;
              detectedMode = "document";
            } else if (/\/id\/[^/]+$/.test(path)) {
              v = decodeURIComponent(path.split("/").pop()!);
              detectedMode = "employee";
            } else if (/\/verify\/[^/]+$/.test(path)) {
              v = decodeURIComponent(path.split("/").pop()!);
              detectedMode = "document";
            }
          } catch {
            // Not a URL — infer from the raw code prefix.
            if (/^THR-EMP-/i.test(v)) detectedMode = "employee";
            else if (/^(THR-|THRDOC)/i.test(v)) detectedMode = "document";
            else if (/^(INV|THRINV)/i.test(v)) detectedMode = "invoice";
          }

          setMode(detectedMode);
          setValue(v);
          setParams({ [modeMeta[detectedMode].queryKey]: v });
          void lookup(v, detectedMode);
          void scannerRef.current?.stop();
          setScannerOpen(false);
        },
        () => {
          /* ignore per-frame decode errors */
        },
      );
    } catch (e) {
      toast({
        title: "Camera unavailable",
        description: e instanceof Error ? e.message : "Please allow camera access or enter the ID manually.",
        variant: "destructive",
      });
      setScannerOpen(false);
    }
  };

  useEffect(() => {
    if (!scannerOpen && scannerRef.current) void scannerRef.current.stop();
  }, [scannerOpen]);

  const slipContent = useMemo<SlipContent | null>(() => {
    if (invoiceData) {
      const statusInfo = statusStyles[(invoiceData.status || "draft").toLowerCase()] || statusStyles.draft;
      return {
        key: "invoice",
        eyebrow: "Verified authentic invoice",
        title: invoiceData.invoice_number,
        badge: (
          <Badge
            variant="outline"
            className={`shrink-0 gap-1.5 rounded-full border px-2.5 py-1 text-[10px] ${statusInfo.className}`}
          >
            {statusInfo.icon} {statusInfo.label}
          </Badge>
        ),
        preContent: (
          <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <IndianRupee className="h-3 w-3 text-primary" /> Verified total
              </p>
              <p className="mt-1 truncate text-sm font-black">{invoiceData.project_name}</p>
            </div>
            <p className="shrink-0 text-xl font-black tracking-tight text-primary sm:text-2xl">
              {invoiceData.total_amount == null ? "Hidden for privacy" : formatCurrency(Number(invoiceData.total_amount))}
            </p>
          </div>
        ),
        fields: [
          { icon: <User className="h-3.5 w-3.5" />, label: "Client", value: invoiceData.client_name || "—" },
          { icon: <Building2 className="h-3.5 w-3.5" />, label: "Company", value: invoiceData.client_company || "—" },
          {
            icon: <Calendar className="h-3.5 w-3.5" />,
            label: "Invoice date",
            value: formatDate(invoiceData.invoice_date),
          },
          { icon: <Calendar className="h-3.5 w-3.5" />, label: "Due date", value: formatDate(invoiceData.due_date) },
          ...(invoiceData.reference_id
            ? [
                {
                  icon: <Hash className="h-3.5 w-3.5" />,
                  label: "Reference",
                  value: invoiceData.reference_id,
                  mono: true,
                },
              ]
            : []),
          ...(invoiceData.paid_at
            ? [
                {
                  icon: <BadgeCheck className="h-3.5 w-3.5" />,
                  label: "Paid on",
                  value: formatDate(invoiceData.paid_at),
                },
              ]
            : []),
        ],
        footerMode: "invoice",
        footerValue: invoiceData.invoice_number,
      };
    }
    if (employeeData) {
      return {
        key: "employee",
        eyebrow: "Verified THRYLOS INDIA team member",
        title: employeeData.employee_code,
        badge: (
          <Badge
            variant="outline"
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] ${
              employeeData.is_active
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                : "border-border text-muted-foreground"
            }`}
          >
            {employeeData.is_active ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
            {employeeData.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
        preContent: (
          <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-muted/[0.1] p-4">
            <div className="relative shrink-0">
              {employeeData.photo_url ? (
                <img
                  src={employeeData.photo_url}
                  alt={employeeData.full_name}
                  className="h-14 w-14 rounded-xl border border-border object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-xl font-black text-primary">
                  {employeeData.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              {employeeData.is_active && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-emerald-500 text-white">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black tracking-tight">{employeeData.full_name}</h2>
              <p className="text-xs font-medium text-muted-foreground">{employeeData.designation}</p>
            </div>
          </div>
        ),
        fields: [
          { icon: <Building2 className="h-3.5 w-3.5" />, label: "Department", value: employeeData.department || "—" },
          {
            icon: <User className="h-3.5 w-3.5" />,
            label: "Employment type",
            value:
              employeeData.employment_type === "intern"
                ? "Intern"
                : employeeData.employment_type === "contractor"
                  ? "Contractor"
                  : "Employee",
          },
          { icon: <Calendar className="h-3.5 w-3.5" />, label: "Joined", value: formatDate(employeeData.joining_date) },
          {
            icon: <Calendar className="h-3.5 w-3.5" />,
            label: "Valid till",
            value: employeeData.end_date ? formatDate(employeeData.end_date) : "On roll",
          },
        ],
        footerMode: "employee",
        footerValue: employeeData.employee_code,
      };
    }
    if (docData) {
      return {
        key: "document",
        eyebrow: "Verified HR document",
        title: docData.document_number,
        preContent: (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Issued to</p>
            <p className="mt-1 text-lg font-black tracking-tight">{docData.employee_name}</p>
          </div>
        ),
        fields: [
          {
            icon: <FileText className="h-3.5 w-3.5" />,
            label: "Document type",
            value: docData.document_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          },
          { icon: <Calendar className="h-3.5 w-3.5" />, label: "Issued on", value: formatDate(docData.created_at) },
        ],
        footerMode: "document",
        footerValue: docData.document_number,
      };
    }
    return null;
  }, [invoiceData, employeeData, docData]);

  const tone: "idle" | "loading" | "success" | "error" = loading
    ? "loading"
    : error
      ? "error"
      : slipContent
        ? "success"
        : "idle";

  return (
    <div
      onMouseMove={handleRootMouseMove}
      className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/20"
    >
      <SEO
        title="Verify Records — THRYLOS INDIA"
        description="Official THRYLOS INDIA verification portal for invoices, employee credentials and HR documents."
        path="/verify"
      />

      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,hsl(var(--primary)/0.14),transparent_30%),radial-gradient(circle_at_92%_40%,rgba(16,185,129,0.08),transparent_28%)]" />
        <div
          ref={spotlightRef}
          className="absolute inset-0 opacity-70 transition-opacity"
          style={{
            background:
              "radial-gradient(560px circle at var(--sx, 50%) var(--sy, 0%), hsl(var(--primary)/0.06), transparent 62%)",
          }}
        />
        {!prefersReducedMotion && (
          <>
            <motion.div
              className="absolute -left-24 top-10 h-[440px] w-[440px] rounded-full bg-primary/[0.09] blur-[120px]"
              animate={{ x: [0, 45, 0], y: [0, -30, 0] }}
              transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-[-12%] top-1/3 h-[400px] w-[400px] rounded-full bg-emerald-500/[0.08] blur-[130px]"
              animate={{ x: [0, -38, 0], y: [0, 28, 0] }}
              transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            {/* Slow horizontal scanlines — the terminal/kiosk texture the
                rest of the page's metaphor is built on. */}
            <motion.div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 3px)",
              }}
              animate={{ backgroundPositionY: ["0px", "120px"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
          </>
        )}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Floating pill header ── */}
      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="sticky top-3 z-30 mx-auto mt-3 w-[calc(100%-24px)] max-w-6xl px-0 sm:top-4"
      >
        <div className="flex h-[60px] items-center justify-between rounded-2xl border border-border/60 bg-background/75 px-4 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:px-5">
          <Link to="/" className="group flex items-center gap-2.5 sm:gap-3">
            <motion.div whileHover={{ rotate: [0, -8, 8, 0], scale: 1.06 }} transition={{ duration: 0.5 }}>
              <img src="/tbg.png" className="h-9 w-9 sm:h-[42px] sm:w-[42px]" alt="THRYLOS INDIA" />
            </motion.div>
            <div>
              <p className="text-xs font-black leading-none tracking-[-0.02em] sm:text-sm">THRYLOS INDIA</p>
              <p className="mt-1 hidden text-[8.5px] font-bold uppercase tracking-[0.2em] text-muted-foreground sm:block">
                Verification Authority
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.13em] text-emerald-500 sm:px-3 sm:text-[10px]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="hidden sm:inline">Verification online</span>
            <span className="sm:hidden">Live</span>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 md:pt-14">
        {/* ── Compact intro ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mx-auto max-w-xl text-center"
        >
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
            <Fingerprint className="h-3 w-3" /> Official record verification
          </p>
          <h1 className="mt-3 text-balance text-[30px] font-black leading-[1.08] tracking-[-0.03em] sm:text-[40px]">
            Aim the scanner at any THRYLOS INDIA reference.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Pick a record type, enter or scan the printed reference, and it's matched live against official records.
          </p>
        </motion.div>

        {/* ── Console ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55, ease: EASE }}
          className="mx-auto mt-9 w-full max-w-6xl"
        >
          <div className="relative overflow-hidden rounded-[30px] p-[1.5px]">
            {!prefersReducedMotion && (
              <motion.div
                className="absolute inset-[-60%]"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0%, hsl(var(--primary)/0.55) 12%, transparent 24%, transparent 76%, rgba(16,185,129,0.5) 88%, transparent 100%)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
              />
            )}
            <div
              className={`relative border border-border/40 bg-card/90 px-5 pb-8 pt-7 shadow-[0_30px_90px_-50px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:px-8 ${
                tone !== "idle" && tone !== "loading" ? "rounded-t-[29px]" : "rounded-[29px]"
              }`}
            >
              <Reticle
                mode={mode}
                onModeChange={switchMode}
                value={value}
                onValueChange={setValue}
                onSubmit={handleSubmit}
                onScan={() => void openScanner()}
                tone={tone}
                loading={loading}
                inputRef={inputRef}
              />
            </div>
          </div>

          {/* ── Result / status printout, sharing the console's width ── */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading-ticker"
                variants={slipReveal}
                initial="hidden"
                animate="show"
                exit="exit"
                style={{ transformOrigin: "top center" }}
                className="relative overflow-hidden rounded-b-[24px] border border-t-0 border-primary/20 bg-card/85 backdrop-blur-xl"
              >
                <PerforatedSeam />
                <div className="flex items-center gap-2 px-5 pb-5 pt-3 font-mono text-[11px] text-muted-foreground sm:px-8">
                  <span className="text-emerald-500">$</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={stepIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {VERIFY_STEPS[stepIndex]}
                    </motion.span>
                  </AnimatePresence>
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    className="inline-block h-3 w-1.5 bg-primary/70"
                  />
                </div>
                <div className="h-[3px] w-full overflow-hidden bg-muted/50">
                  <motion.div
                    className="h-full w-1/3 bg-gradient-to-r from-primary via-emerald-500 to-primary"
                    animate={{ x: ["-100%", "400%"] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            )}

            {!loading && error && (
              <ErrorSlip
                message={error}
                onRetry={() => {
                  setError(null);
                  inputRef.current?.focus();
                  inputRef.current?.select();
                }}
                onReset={startOver}
              />
            )}

            {!loading && !error && slipContent && (
              <VerificationSlip content={slipContent} verifiedAt={verifiedAt} onReset={startOver} />
            )}
          </AnimatePresence>

          {!loading && !error && !slipContent && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-center text-[10.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-primary" /> Matched against live records
              </span>
              <span className="flex items-center gap-1.5">
                <LockKeyhole className="h-3 w-3 text-primary" /> No login required
              </span>
            </div>
          )}
        </motion.section>

        {/* ── Assistance ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mx-auto mt-9 w-full max-w-6xl"
        >
          <div className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-card/45 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Fingerprint className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold">Need verification assistance?</p>
                <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                  If an issued record is not being recognized, contact the relevant THRYLOS INDIA team for assistance.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <motion.a
                whileHover={{ y: -2 }}
                href="mailto:hr@thrylosindia.in"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-2 font-medium transition-colors hover:border-primary/40 hover:text-primary"
              >
                HR Support
              </motion.a>
              <motion.a
                whileHover={{ y: -2 }}
                href="mailto:invoice@thrylosindia.in"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-2 font-medium transition-colors hover:border-primary/40 hover:text-primary"
              >
                Invoice Support
              </motion.a>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-5 text-[11px] text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} THRYLOS INDIA · Official Verification Portal</p>
            <Link
              to="/"
              className="group inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-primary"
            >
              Return to THRYLOS INDIA{" "}
              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.section>
      </main>

      {/* ── Scanner ── */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="overflow-hidden rounded-[24px] border-border/60 bg-background/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-lg">
          <DialogHeader className="border-b border-border/60 px-5 py-4">
            <DialogTitle className="flex items-center gap-3">
              <motion.span
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
              >
                <ScanLine className="h-4 w-4" />
              </motion.span>
              <span>
                <span className="block text-base font-black">Scan verification code</span>
                <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                  QR code or compatible barcode
                </span>
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-5">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-black shadow-inner">
              <div id={scannerDivId} className="aspect-[4/3] w-full" />
              <div className="pointer-events-none absolute inset-4 rounded-xl border border-white/20">
                {!prefersReducedMotion &&
                  [
                    "left-0 top-0 border-l-2 border-t-2",
                    "right-0 top-0 border-r-2 border-t-2",
                    "bottom-0 left-0 border-b-2 border-l-2",
                    "bottom-0 right-0 border-b-2 border-r-2",
                  ].map((pos, i) => (
                    <motion.span
                      key={pos}
                      className={`absolute h-6 w-6 border-primary ${pos}`}
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                    />
                  ))}
              </div>
              <motion.div
                className="pointer-events-none absolute inset-x-4 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_2px_rgba(59,130,246,0.6)]"
                animate={{ top: ["8%", "92%", "8%"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-muted/30 p-3 text-[11px] leading-5 text-muted-foreground">
              <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              Keep the code inside the frame and hold the camera steady. Verification opens automatically after
              detection.
            </div>
            <Button variant="outline" className="h-11 w-full rounded-xl" onClick={() => setScannerOpen(false)}>
              <X className="mr-2 h-4 w-4" /> Close scanner
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
        @media print {
          header, .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default VerifyInvoice;
