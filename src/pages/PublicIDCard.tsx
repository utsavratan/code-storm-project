import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  IDCardStage,
  downloadIDCardPDF,
  idCardShareUrl,
  type IDCardEmployee,
} from "@/components/admin/DigitalIDCard";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft, Loader2, Download, Link2, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/seo/SEO";

const PublicIDCard = () => {
  const { code = "" } = useParams();
  const [emp, setEmp] = useState<IDCardEmployee | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_employee_card", { _code: code });
      if (cancelled) return;
      const row = Array.isArray(data) ? data[0] : null;
      if (error || !row || !row.is_active) {
        setState("notfound");
      } else {
        setEmp({
          id: row.id,
          full_name: row.full_name,
          email: row.email,
          phone: row.phone,
          designation: row.designation,
          department: row.department,
          joining_date: row.joining_date,
          photo_url: row.photo_url,
          employee_code: row.employee_code,
          date_of_birth: row.date_of_birth,
          nationality: row.nationality,
        });
        setState("ok");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const copyLink = async () => {
    if (!emp) return;
    await navigator.clipboard.writeText(idCardShareUrl(emp));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const download = async () => {
    if (!emp) return;
    setBusy(true);
    try {
      await downloadIDCardPDF(emp);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black text-white">
      <SEO
        title={emp ? `${emp.full_name} · Thrylos India ID` : "Employee ID · Thrylos India"}
        description="Verified Thrylos India employee digital ID card."
        path={`/id/${code}`}
      />
      {/* ambient bg */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#ff7a1a]/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#3b82f6]/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{ background: "radial-gradient(1000px 500px at 50% -10%, rgba(255,255,255,0.06), transparent 60%)" }}
        />
      </div>

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Thrylos India
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/5 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" /> Verified Credential
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-4 pb-20 pt-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 max-w-xl text-center"
        >
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#ffb37a]">Digital Employee ID</p>
          <h1 className="mt-3 bg-gradient-to-b from-white to-white/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Authentic. Verifiable. Thrylos.
          </h1>
          <p className="mt-2 text-sm text-white/50">
            This card is a live-issued credential. Tap the card to flip and scan the barcode or QR to re-verify anywhere.
          </p>
        </motion.div>

        {state === "loading" && (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading credential…
          </div>
        )}
        {state === "notfound" && (
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-red-400">Not Found</p>
            <h2 className="mt-2 text-lg font-semibold">This ID could not be verified</h2>
            <p className="mt-1 text-sm text-white/50">
              The code <span className="break-all font-mono text-white/80">{code}</span> is not currently associated
              with an active Thrylos India employee.
            </p>
          </div>
        )}
        {state === "ok" && emp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full max-w-[360px] flex-col items-center gap-6"
          >
            <IDCardStage employee={emp} />

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={download} disabled={busy} className="rounded-xl">
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                {busy ? "Preparing…" : "Download PDF"}
              </Button>
              <Button variant="secondary" onClick={copyLink} className="rounded-xl">
                {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Link2 className="mr-1.5 h-4 w-4" />}
                {copied ? "Link copied" : "Copy share link"}
              </Button>
              <Button variant="outline" asChild className="rounded-xl border-white/20 bg-transparent hover:bg-white/10">
                <a
                  href={`/verify?emp=${encodeURIComponent(emp.employee_code || emp.id)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <QrCode className="mr-1.5 h-4 w-4" /> Verify
                </a>
              </Button>
            </div>
          </motion.div>
        )}

        <footer className="mt-16 text-center text-[10px] uppercase tracking-[0.3em] text-white/30">
          © Thrylos India · UDYAM-DL-10-0112736
        </footer>
      </main>
    </div>
  );
};

export default PublicIDCard;
