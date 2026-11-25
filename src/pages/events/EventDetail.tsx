import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Mail,
  CreditCard,
  MapPin,
  Globe,
  Users,
  Share2,
  CalendarPlus,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogIn,
  RefreshCw,
} from "lucide-react";
import QRCode from "qrcode";
import { load } from "@cashfreepayments/cashfree-js";
import MainLayout from "@/components/layout/MainLayout";
import SEO from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EventItem, fmtDate, isPast, downloadIcs } from "@/lib/events";
import { canShowTicket, isPaymentReturn, shouldRetryConfirmation, selectSavedRegistration, type EventTicketState } from "@/lib/eventTicketState";

const useCountdown = (iso?: string) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!iso) return null;
  const d = Math.max(0, new Date(iso).getTime() - now);
  return {
    days: Math.floor(d / 86400000),
    hours: Math.floor(d / 3600000) % 24,
    mins: Math.floor(d / 60000) % 60,
    secs: Math.floor(d / 1000) % 60,
  };
};

const EventDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ev, setEv] = useState<EventItem | null>(null);
  const [taken, setTaken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", organisation: "", notes: "" });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<EventTicketState | null>(null);
  const [params] = useSearchParams();
  const [verifying, setVerifying] = useState(() => isPaymentReturn(params));
  const [ticketLoading, setTicketLoading] = useState(true);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [emailBusy, setEmailBusy] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const cd = useCountdown(ev?.starts_at);

  useEffect(() => {
    let active = true;
    setQr(null);
    if (canShowTicket(ticket) && ticket) {
      void QRCode.toDataURL(ticket.code, { width: 600, margin: 2, errorCorrectionLevel: "H" })
        .then((image) => { if (active) setQr(image); }).catch(() => { if (active) setQr(null); });
    }
    return () => { active = false; };
  }, [ticket?.code, ticket?.status]);

  const goSignIn = () => {
    sessionStorage.setItem("post_oauth_redirect", `/events/${ev?.slug || slug}${isPaymentReturn(params) ? `?${params.toString()}` : ""}`);
    navigate("/auth");
  };

  useEffect(() => {
    let active = true;
    setTicketLoading(true);
    setTicketError(null);
    setTicket(null);
    (async () => {
      try {
      const { data, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug || "")
        .maybeSingle();
      const e = data as unknown as EventItem | null;
      if (!active) return;
      if (eventError) throw new Error("Couldn't load this event. Please try again.");
      setEv(e);
      if (e) {
        const { data: n } = await supabase.rpc("event_seats_taken", { _event_id: e.id });
        setTaken(Number(n) || 0);
      }
      const { data: s } = await supabase.auth.getSession();
      if (!active) return;
      setLoading(false);
      setUser(s.session?.user || null);
      if (s.session) {
        const email = s.session.user.email || "";
        setForm((f) => ({ ...f, email: f.email || email }));
        if (e) {
          const { data: savedRows, error } = await supabase.from("event_registrations")
            .select("ticket_code,status,ticket_emailed_at,email")
            .eq("event_id", e.id).eq("user_id", s.session.user.id).order("created_at", { ascending: false });
          if (!active) return;
          if (error) throw new Error("Couldn't check your registration. Please retry before registering.");
          const saved = selectSavedRegistration(savedRows || [], isPaymentReturn(params) ? params.get("ticket") : null);
          if (isPaymentReturn(params) && (!saved || saved.ticket_code !== params.get("ticket"))) {
            throw new Error("This payment return doesn't match a registration on your account. Open My tickets to check.");
          }
          if (saved) {
            let status = saved.status;
            if (isPaymentReturn(params) || (refreshKey > 0 && status === "pending_payment")) {
              setVerifying(true);
              for (let attempt = 0; attempt < 4; attempt++) {
                const result = await callTicket({ action: "verify", ticket_code: saved.ticket_code });
                if (!active) return;
                status = result.status || status;
                if (!shouldRetryConfirmation(status, result.order_status) || attempt === 3) break;
                await new Promise((resolve) => window.setTimeout(resolve, 2000));
                if (!active) return;
              }
            }
            setForm((f) => ({ ...f, email: saved.email }));
            setTicket({ code: saved.ticket_code, status, emailed: Boolean(saved.ticket_emailed_at) });
          }
        }
      }
      } catch (error) {
        if (active) setTicketError(error instanceof Error ? error.message : "Please try again.");
      } finally {
        if (active) { setLoading(false); setTicketLoading(false); setVerifying(false); }
      }
    })();
    return () => { active = false; };
    // Refresh re-reads only this account's saved registration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, params, refreshKey]);

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ev) return;
    if (!user) {
      sessionStorage.setItem("post_oauth_redirect", `/events/${ev.slug}`);
      navigate("/auth");
      return;
    }
    if (!consent) {
      toast({ title: "Please accept the privacy policy", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("register_for_event", {
      _event_id: ev.id,
      _full_name: form.full_name,
      _email: form.email,
      _phone: form.phone,
      _organisation: form.organisation,
      _notes: form.notes,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't register", description: error.message.replace(/^.*?: /, ""), variant: "destructive" });
      return;
    }
    const row = data?.[0];
    if (!row?.ticket_code || !row.status) {
      toast({ title: "Couldn't register", description: "Please try again.", variant: "destructive" });
      return;
    }
    setTicket({ code: row.ticket_code, status: row.status });
    setTaken((t) => t + (row.status === "waitlist" ? 0 : 1));
    if (row.status === "confirmed") emailTicket(row.ticket_code);
    if (row.status === "pending_payment") pay(row.ticket_code);
  };

  const callTicket = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("event-ticket", { body });
    if (error)
      throw new Error(
        (await (error as { context?: Response }).context?.json?.().catch(() => null))?.error || "Request failed",
      );
    return data;
  };
  const emailTicket = async (code: string) => {
    setEmailBusy(true);
    try {
      const d = await callTicket({ action: "email", ticket_code: code });
      setTicket((t) => t?.code === code ? { ...t, emailed: !!d?.ok } : t);
      if (!d?.ok) throw new Error("Please try again shortly.");
      toast({ title: "Ticket email sent" });
    } catch {
      setTicket((t) => t?.code === code ? { ...t, emailed: false } : t);
      toast({ title: "Couldn't send your ticket email", description: "Your confirmed QR remains available here.", variant: "destructive" });
    } finally {
      setEmailBusy(false);
    }
  };
  const pay = async (code: string) => {
    if (!navigator.onLine) {
      toast({ title: "Connect to the internet before paying", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const d = await callTicket({ action: "pay", ticket_code: code });
      const cf = await load({ mode: "production" });
      if (!cf || !d?.payment_session_id) throw new Error("Payment is unavailable right now. Please try again.");
      await cf.checkout({ paymentSessionId: d.payment_session_id, redirectTarget: "_self" });
    } catch (e) {
      toast({ title: "Couldn't start payment", description: (e as Error).message, variant: "destructive" });
    }
    setBusy(false);
  };

  const share = async () => {
    const url = `https://thrylosindia.in/events/${ev?.slug}`;
    if (navigator.share) await navigator.share({ title: ev?.title, url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    }
  };

  if (loading)
    return (
      <MainLayout>
        <p className="text-center py-32 text-muted-foreground">Loading…</p>
      </MainLayout>
    );
  if (!ev)
    return (
      <MainLayout>
        <div className="text-center py-32">
          <p className="text-muted-foreground">Event not found.</p>
          <Link to="/events" className="text-primary underline">
            All events
          </Link>
        </div>
      </MainLayout>
    );

  const past = isPast(ev);
  const left = ev.capacity ? Math.max(0, ev.capacity - taken) : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    description: ev.tagline || ev.description?.slice(0, 200),
    startDate: ev.starts_at,
    endDate: ev.ends_at || ev.starts_at,
    eventAttendanceMode:
      ev.mode === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : ev.mode === "hybrid"
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
    location:
      ev.mode === "online"
        ? { "@type": "VirtualLocation", url: `https://thrylosindia.in/events/${ev.slug}` }
        : { "@type": "Place", name: ev.venue, address: ev.venue },
    image: ev.cover_url ? [ev.cover_url] : undefined,
    organizer: { "@type": "Organization", name: "THRYLOS INDIA", url: "https://thrylosindia.in" },
    offers: {
      "@type": "Offer",
      price: Number(ev.price),
      priceCurrency: "INR",
      url: `https://thrylosindia.in/events/${ev.slug}`,
      availability: left === 0 ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  return (
    <MainLayout>
      <SEO
        title={`${ev.title} | THRYLOS Events`}
        description={ev.tagline || `Register for ${ev.title} by THRYLOS INDIA.`}
        path={`/events/${ev.slug}`}
        image={ev.cover_url || undefined}
        jsonLd={jsonLd}
      />
      <div className="relative">
        <div className="absolute inset-0 h-[420px] overflow-hidden -z-0">
          {ev.cover_url && (
            <img src={ev.cover_url} alt="" aria-hidden className="w-full h-full object-cover opacity-25 blur-sm" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-20">
          <Link
            to="/events"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> All events
          </Link>
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 mt-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-xs uppercase tracking-widest text-primary">
                {ev.category} · {ev.mode}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mt-2">{ev.title}</h1>
              {ev.tagline && <p className="text-lg text-muted-foreground mt-3">{ev.tagline}</p>}
              <div className="flex flex-wrap gap-4 mt-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {fmtDate(ev.starts_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  {ev.mode === "online" ? (
                    <Globe className="w-4 h-4 text-primary" />
                  ) : (
                    <MapPin className="w-4 h-4 text-primary" />
                  )}
                  {ev.mode === "online" ? (
                    "Online (link shared with registered attendees)"
                  ) : (
                    <a
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.venue || "")}`}
                    >
                      {ev.venue}
                    </a>
                  )}
                </span>
                {left !== null && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    {left} seats left
                  </span>
                )}
              </div>
              {!past && cd && (
                <div className="grid grid-cols-4 gap-3 mt-8 max-w-md" aria-label="Countdown">
                  {Object.entries(cd).map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-card border border-border p-3 text-center">
                      <div className="text-2xl font-bold text-foreground tabular-nums">
                        {String(v).padStart(2, "0")}
                      </div>
                      <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-6">
                <Button variant="outline"
                  onClick={() => downloadIcs(ev)}
                >
                  <CalendarPlus className="w-4 h-4" />
                  Add to calendar
                </Button>
                <Button variant="outline"
                  onClick={share}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
              {ev.description && (
                <div className="mt-10">
                  <h2 className="text-xl font-semibold text-foreground mb-3">About this event</h2>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{ev.description}</p>
                </div>
              )}
              {ev.agenda?.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Agenda</h2>
                  <ol className="border-l border-primary/40 pl-5 space-y-5">
                    {ev.agenda.map((a, i) => (
                      <li key={i}>
                        <span className="text-xs text-primary">{a.time}</span>
                        <p className="font-medium text-foreground">{a.title}</p>
                        {a.detail && <p className="text-sm text-muted-foreground">{a.detail}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {ev.speakers?.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Speakers</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {ev.speakers.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                        {s.photo ? (
                          <img src={s.photo} alt={s.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                            {s.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ev.faqs?.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-semibold text-foreground mb-4">FAQs</h2>
                  {ev.faqs.map((f, i) => (
                    <details key={i} className="mb-2 rounded-xl bg-card border border-border p-4">
                      <summary className="cursor-pointer font-medium text-foreground">{f.q}</summary>
                      <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
                    </details>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:sticky lg:top-24 h-fit rounded-2xl border border-primary/30 bg-card/80 backdrop-blur p-6"
            >
              {ticketLoading || verifying ? (
                <div className="text-center py-10" role="status" aria-live="polite">
                  <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
                  <h2 className="text-lg font-bold text-foreground mt-4">{isPaymentReturn(params) ? "Confirming your payment…" : "Checking your registration…"}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Please don't close this page. Your ticket will appear here.</p>
                </div>
              ) : ticketError ? (
                <div className="space-y-4" role="alert">
                  <h2 className="text-lg font-semibold">Registration check unavailable</h2>
                  <p className="text-sm text-muted-foreground">{ticketError}</p>
                  <Button variant="outline" onClick={() => setRefreshKey((key) => key + 1)} className="w-full"><RefreshCw className="w-4 h-4" /> Retry</Button>
                  <Button asChild variant="outline" className="w-full"><Link to="/events/my-tickets">My tickets</Link></Button>
                </div>
              ) : ticket ? (
                <div className="text-center">
                  <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
                  <h2 className="text-xl font-bold text-foreground mt-2">
                    {ticket.status === "confirmed"
                      ? "You're in!"
                      : ticket.status === "waitlist"
                        ? "You're on the waitlist"
                        : ticket.status === "pending_payment" ? "Payment not confirmed" : "Registration cancelled"}
                  </h2>
                  {ticket.status === "pending_payment" && (
                    <>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pay ₹{ev.price} to complete your registration. Your ticket and invoice will be emailed after payment is confirmed.
                      </p>
                      <Button
                        disabled={busy}
                        onClick={() => pay(ticket.code)}
                        className="mt-4 w-full h-12"
                      >
                        <CreditCard className="w-4 h-4" />
                        {busy ? "Opening payment…" : `Pay ₹${ev.price}`}
                      </Button>
                    </>
                  )}
                  {canShowTicket(ticket) && qr && (
                    <div className="mt-4 rounded-xl bg-foreground p-3 inline-block">
                      <img src={qr} alt={`QR ticket for ${ev.title}`} className="w-48 h-48" />
                    </div>
                  )}
                  {canShowTicket(ticket) && qr && (
                    <a href={qr} download={`ticket-${ticket.code}.png`} className="block mt-2 text-sm text-primary underline">
                      Save QR
                    </a>
                  )}
                  {ticket.status === "confirmed" && (
                    <div className="mt-4 rounded-xl border border-border bg-background/60 p-4 text-sm text-muted-foreground flex gap-3 text-left">
                      <Mail className="w-5 h-5 text-primary shrink-0" />
                      <span>
                        {ticket.emailed
                          ? `Your ticket email was sent to ${form.email || "your email"}. Show this QR at the entrance.`
                          : "Your ticket is confirmed. You can email a copy below."}
                      </span>
                    </div>
                  )}
                  {ticket.status === "waitlist" && (
                    <p className="text-sm text-muted-foreground mt-1">We'll email you if a seat opens up.</p>
                  )}
                  {ticket.status === "confirmed" && (
                    <Button disabled={emailBusy} variant="outline" onClick={() => emailTicket(ticket.code)} className="mt-4 w-full">
                      {emailBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Email my ticket
                    </Button>
                  )}
                  {ticket.status === "pending_payment" && (
                    <Button variant="outline" onClick={() => setRefreshKey((key) => key + 1)} className="mt-3 w-full"><RefreshCw className="w-4 h-4" /> Check payment status</Button>
                  )}
                  {ticket.status === "confirmed" ? (
                    <p className="font-mono text-xs text-muted-foreground mt-3">Ref {ticket.code}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-3">Your ticket ID stays hidden until payment is complete.</p>
                  )}
                  <Link to="/events/my-tickets" className="block mt-4 text-sm underline text-muted-foreground">
                    View my tickets
                  </Link>
                </div>
              ) : past ? (
                <p className="text-muted-foreground text-center">This event has ended.</p>
              ) : !ev.registration_open ? (
                <p className="text-muted-foreground text-center">Registration is closed.</p>
              ) : !user ? (
                <div className="text-center">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-lg font-bold text-foreground">Register</h2>
                    <span className="text-2xl font-bold text-primary">
                      {Number(ev.price) > 0 ? `₹${ev.price}` : "Free"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Sign in to register. Your ticket is saved to your account and emailed to you.
                  </p>
                  <Button onClick={goSignIn} className="mt-5 w-full h-12">
                    <LogIn className="w-4 h-4" /> Sign in to register
                  </Button>
                </div>
              ) : (
                <form onSubmit={register} className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-lg font-bold text-foreground">Register</h2>
                    <span className="text-2xl font-bold text-primary">
                      {Number(ev.price) > 0 ? `₹${ev.price}` : "Free"}
                    </span>
                  </div>
                  {left === 0 && <p className="text-xs text-primary">Event is full — you'll join the waitlist.</p>}
                  {!user && <p className="text-xs text-muted-foreground">You'll be asked to sign in first.</p>}
                  {(
                    [
                      ["full_name", "Full name", true],
                      ["email", "Email", true],
                      ["phone", "Phone", Number(ev.price) > 0],
                      ["organisation", "College / company", false],
                    ] as const
                  ).map(([k, l, req]) => (
                    <label key={k} className="block text-sm">
                      <span className="text-muted-foreground">
                        {l}
                        {req && " *"}
                      </span>
                      <input
                        required={req}
                        type={k === "email" ? "email" : k === "phone" ? "tel" : "text"}
                        maxLength={k === "phone" ? 20 : 120}
                        value={form[k]}
                        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                      />
                    </label>
                  ))}
                  <label className="block text-sm">
                    <span className="text-muted-foreground">Anything we should know?</span>
                    <textarea
                      maxLength={1000}
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                    />
                  </label>
                  <label className="flex gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
                    <span>
                      I agree to the{" "}
                      <Link to="/privacy-policy" className="underline">
                        Privacy Policy
                      </Link>{" "}
                      and allow THRYLOS INDIA to contact me about this event.
                    </span>
                  </label>
                  <Button type="submit"
                    disabled={busy}
                    className="w-full h-12"
                  >
                    {busy ? "Registering…" : user ? Number(ev.price) > 0 ? `Continue to payment · ₹${ev.price}` : "Register for free" : "Sign in to register"}
                  </Button>
                </form>
              )}
            </motion.aside>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EventDetail;
