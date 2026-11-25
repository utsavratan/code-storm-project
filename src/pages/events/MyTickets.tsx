import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  MapPin,
  QrCode,
  RefreshCw,
  Ticket as TicketIcon,
  WalletCards,
  X,
} from "lucide-react";
import { load } from "@cashfreepayments/cashfree-js";
import QRCode from "qrcode";
import { Input } from "@/components/ui/input";
import { readSavedTickets, saveTickets, ticketCacheKey } from "@/lib/offlineTickets";

import MainLayout from "@/components/layout/MainLayout";
import SEO from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/events";
import { useToast } from "@/hooks/use-toast";

/* ===============================================================
   TYPES
================================================================ */

interface Row {
  id: string;
  ticket_code: string;
  status: string;
  checked_in_at: string | null;
  amount: number;
  paid_at: string | null;
  ticket_emailed_at: string | null;
  events: {
    title: string;
    slug: string;
    starts_at: string;
    venue: string | null;
    mode: string;
    price: number;
  } | null;
}

/* ===============================================================
   MAIN
================================================================ */

const MyTickets = () => {
  const { toast } = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [state, setState] = useState<"loading" | "signedout" | "ok">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const [qrTicket, setQrTicket] = useState<Row | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedView, setSavedView] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  /* =============================================================
     LOAD TICKETS
  ============================================================= */

  const loadTickets = async () => {
    setState("loading");
    let userId: string | null = null;
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        setRows([]);
        setAccountId(null);
        setState("signedout");
        return;
      }
      userId = sessionData.session.user.id;
      setAccountId(userId);
      if (!navigator.onLine) {
        const saved = readSavedTickets<Row>(localStorage, userId);
        setRows(saved?.rows || []);
        setSavedAt(saved?.savedAt || null);
        setSavedView(true);
        setState("ok");
        return;
      }

      const { data, error } = await supabase
        .from("event_registrations")
        .select(
          "id,ticket_code,status,checked_in_at,amount,paid_at,ticket_emailed_at,events(title,slug,starts_at,venue,mode,price)",
        )
        .eq("user_id", sessionData.session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const list = (data as unknown as Row[]) || [];
      setRows(list);
      setSavedView(false);
      try { setSavedAt(saveTickets(localStorage, userId, list)); } catch { setSavedAt(null); }
      setState("ok");
    } catch (error) {
      console.error("Failed to load tickets:", error);
      const saved = userId ? readSavedTickets<Row>(localStorage, userId) : null;
      if (saved) {
        setRows(saved.rows);
        setSavedAt(saved.savedAt);
        setSavedView(true);
        setState("ok");
        toast({ title: "Showing saved tickets", description: "We couldn't reach the server, so these are from your last visit." });
        return;
      }

      toast({
        title: "Couldn't load tickets",
        description: error instanceof Error ? error.message : "Please try again shortly.",
        variant: "destructive",
      });

      setRows([]);
      setState("ok");
    }
  };

  /* =============================================================
     INITIAL LOAD
  ============================================================= */

  useEffect(() => {
    void loadTickets();
    const connected = () => { setOnline(true); void loadTickets(); };
    const disconnected = () => { setOnline(false); setSavedView(true); };
    window.addEventListener("online", connected);
    window.addEventListener("offline", disconnected);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { setRows([]); setQrTicket(null); setAccountId(null); setState("signedout"); }
    });
    return () => { window.removeEventListener("online", connected); window.removeEventListener("offline", disconnected); data.subscription.unsubscribe(); };
  }, []);

  /* =============================================================
     ESCAPE KEY FOR QR MODAL
  ============================================================= */

  useEffect(() => {
    if (!qrTicket) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQrTicket(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [qrTicket]);

  /* =============================================================
     LOCK BODY WHEN MODAL IS OPEN
  ============================================================= */

  useEffect(() => {
    if (!qrTicket) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [qrTicket]);

  /* =============================================================
     EDGE FUNCTION
  ============================================================= */

  const callTicket = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("event-ticket", {
      body,
    });

    if (error) {
      let message = "Request failed. Please try again.";

      try {
        const context = (error as { context?: Response }).context;

        if (context) {
          const responseData = await context.json();

          if (responseData?.error) {
            message = responseData.error;
          }
        }
      } catch {
        // Keep fallback message.
      }

      throw new Error(message);
    }

    return data as {
      ok?: boolean;
      payment_session_id?: string;
      status?: string;
    };
  };

  /* =============================================================
     PAYMENT
  ============================================================= */

  const pay = async (code: string) => {
    if (!navigator.onLine || savedView) {
      toast({ title: "Connect and refresh before paying", description: "Payments need an up-to-date online registration." });
      return;
    }
    setBusy(`pay:${code}`);

    try {
      const response = await callTicket({
        action: "pay",
        ticket_code: code,
      });

      if (!response.payment_session_id) {
        throw new Error("Payment session was not created.");
      }

      const cashfree = await load({
        mode: "production",
      });

      if (!cashfree) {
        throw new Error("Payment system could not be initialized. Please try again.");
      }

      await cashfree.checkout({
        paymentSessionId: response.payment_session_id,
        redirectTarget: "_self",
      });
    } catch (error) {
      toast({
        title: "Couldn't start payment",
        description: error instanceof Error ? error.message : "Please try again shortly.",
        variant: "destructive",
      });

      setBusy(null);
    }
  };

  /* =============================================================
     COUNTS
  ============================================================= */

  const confirmedCount = rows.filter((row) => row.status === "confirmed").length;

  const upcomingCount = rows.filter((row) => {
    if (!row.events?.starts_at) return false;

    return new Date(row.events.starts_at).getTime() > Date.now();
  }).length;

  /* =============================================================
     PAGE
  ============================================================= */

  return (
    <MainLayout>
      <SEO
        title="My Tickets | THRYLOS Events"
        description="Manage your THRYLOS INDIA event registrations, payments and tickets."
        path="/events/my-tickets"
      />

      <main className="min-h-[70vh] overflow-x-hidden bg-background">
        {/* =====================================================
            PREMIUM HERO
        ===================================================== */}

        <section className="relative isolate overflow-hidden border-b border-white/[0.06] bg-background">
          {/* Main smooth blue illumination */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: `
                radial-gradient(
                  ellipse 72% 95% at 52% 16%,
                  hsl(var(--primary) / 0.17) 0%,
                  hsl(var(--primary) / 0.09) 28%,
                  hsl(var(--primary) / 0.035) 52%,
                  transparent 76%
                )
              `,
            }}
          />

          {/* Soft secondary atmosphere */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-100px] -z-10 h-[300px] w-[65%] -translate-x-1/2 rounded-full bg-primary/[0.045] blur-[100px]"
          />

          <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              {/* HERO CONTENT */}
              <div className="min-w-0 max-w-3xl">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-primary shadow-[0_0_30px_hsl(var(--primary)/0.06)] sm:text-[11px]">
                  <TicketIcon className="h-3.5 w-3.5" />
                  THRYLOS Events
                </div>

                {/* Title */}
                <h1 className="mt-5 text-[clamp(2.7rem,7vw,5rem)] font-black leading-[0.95] tracking-[-0.045em] text-foreground">
                  My tickets
                </h1>

                {/* Description */}
                <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                  Manage your registrations, complete pending payments and access your confirmed event tickets.
                </p>

                {/* Statistics */}
                {state === "ok" && rows.length > 0 && (
                  <div className="mt-7 flex flex-wrap gap-2.5">
                    <SummaryPill
                      icon={<TicketIcon className="h-3.5 w-3.5" />}
                      value={rows.length}
                      label={rows.length === 1 ? "Registration" : "Registrations"}
                    />

                    <SummaryPill
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      value={confirmedCount}
                      label="Confirmed"
                    />

                    <SummaryPill icon={<Calendar className="h-3.5 w-3.5" />} value={upcomingCount} label="Upcoming" />
                  </div>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => void loadTickets()}
                  disabled={state === "loading" || !!busy}
                  className="h-11 rounded-md px-4"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${state === "loading" ? "animate-spin" : ""}`} />
                  Refresh
                </Button>

                <Button asChild className="h-11 rounded-xl px-5 font-semibold">
                  <Link to="/events">
                    Browse events
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            TICKET CONTENT
        ===================================================== */}

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          {state === "ok" && (
            <div className="mb-6 space-y-4">
              <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 text-sm">
                <div>
                  <p className="font-semibold text-foreground">{savedView || !online ? "Saved tickets · offline copy" : savedAt ? "Tickets saved on this device" : "Tickets not saved on this device"}</p>
                  <p className="text-muted-foreground">{savedAt ? `Last synced ${new Date(savedAt).toLocaleString("en-IN")}` : "Connect and refresh to save your tickets."}{savedView ? " · Status may have changed; registration and payment need internet." : ""}</p>
                </div>
                {savedAt && <Button variant="ghost" onClick={() => {
                  if (!accountId) return;
                  localStorage.removeItem(ticketCacheKey(accountId));
                  setSavedAt(null);
                  if (savedView) { setRows([]); setQrTicket(null); }
                  toast({ title: "Saved copy removed from this device" });
                }}>Remove saved copy</Button>}
              </div>
              <Input aria-label="Search tickets" placeholder="Search event or venue" value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="flex flex-wrap gap-2" aria-label="Filter tickets">
                {["all", "confirmed", "pending_payment"].map((value) => <Button key={value} variant={filter === value ? "secondary" : "ghost"} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === "all" ? "All tickets" : value === "confirmed" ? "Confirmed" : "Payment pending"}</Button>)}
              </div>
              {rows.length > 0 && !rows.some((row) => (filter === "all" || row.status === filter) && `${row.events?.title || ""} ${row.events?.venue || ""}`.toLowerCase().includes(search.toLowerCase())) && <p className="text-muted-foreground">No matching tickets.</p>}
            </div>
          )}
          {/* LOADING */}
          {state === "loading" && <LoadingState />}

          {/* SIGNED OUT */}
          {state === "signedout" && <SignedOutState />}

          {/* EMPTY */}
          {state === "ok" && rows.length === 0 && <EmptyState />}

          {/* TICKETS */}
          {state === "ok" && rows.length > 0 && (
            <div className="space-y-5">
              {rows.filter((row) => (filter === "all" || row.status === filter) && `${row.events?.title || ""} ${row.events?.venue || ""}`.toLowerCase().includes(search.toLowerCase())).map((row, index) => {
                const pending = row.status === "pending_payment";

                const confirmed = row.status === "confirmed";

                const payBusy = busy === `pay:${row.ticket_code}`;

                const eventDate = row.events?.starts_at ? new Date(row.events.starts_at) : null;

                const month = eventDate
                  ? eventDate.toLocaleDateString("en-IN", {
                      month: "short",
                    })
                  : "";

                const day = eventDate ? String(eventDate.getDate()) : "";

                return (
                  <article
                    key={row.id}
                    className="group relative overflow-hidden rounded-3xl border border-border bg-card transition duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                    style={{
                      animationDelay: `${Math.min(index * 50, 250)}ms`,
                    }}
                  >
                    {/* STATUS STRIPE */}
                    <div
                      className={`absolute left-0 right-0 top-0 h-1 ${
                        confirmed ? "bg-emerald-500" : pending ? "bg-amber-500" : "bg-primary"
                      }`}
                    />

                    <div className="p-5 sm:p-6 lg:p-7">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                        {/* DATE BLOCK */}
                        <div className="shrink-0">
                          <div className="flex h-[78px] w-[78px] flex-col items-center justify-center rounded-2xl border border-border bg-muted/50">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                              {month || "—"}
                            </span>

                            <span className="mt-1 text-3xl font-black leading-none text-foreground">{day || "—"}</span>
                          </div>
                        </div>

                        {/* EVENT INFORMATION */}
                        <div className="min-w-0 flex-1">
                          {/* STATUS */}
                          <div className="flex flex-wrap items-center gap-2">
                            {confirmed && (
                              <StatusBadge
                                type="confirmed"
                                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                                text="Confirmed"
                              />
                            )}

                            {pending && (
                              <StatusBadge
                                type="pending"
                                icon={<CreditCard className="h-3.5 w-3.5" />}
                                text="Payment pending"
                              />
                            )}

                            {!confirmed && !pending && (
                              <StatusBadge
                                type="default"
                                icon={<TicketIcon className="h-3.5 w-3.5" />}
                                text={row.status.replace(/_/g, " ")}
                              />
                            )}

                            {row.checked_in_at && (
                              <StatusBadge
                                type="checked"
                                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                                text="Checked in"
                              />
                            )}
                          </div>

                          {/* EVENT TITLE */}
                          <Link to={`/events/${row.events?.slug || ""}`} className="block w-fit max-w-full">
                            <h2 className="mt-3 line-clamp-2 text-xl font-black leading-tight text-foreground transition group-hover:text-primary sm:text-2xl">
                              {row.events?.title || "Event"}
                            </h2>
                          </Link>

                          {/* EVENT META */}
                          <div className="mt-3 space-y-2">
                            {row.events?.starts_at && (
                              <InfoLine icon={<Calendar className="h-4 w-4" />} text={fmtDate(row.events.starts_at)} />
                            )}

                            <InfoLine
                              icon={<MapPin className="h-4 w-4" />}
                              text={
                                row.events?.mode === "online" ? "Online event" : row.events?.venue || "In-person event"
                              }
                            />
                          </div>

                          {/* TICKET ID */}
                          <div className="mt-5 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                              Ticket ID
                            </span>

                            <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-border bg-muted px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wider text-foreground">
                              {confirmed ? row.ticket_code : "••••••••"}
                            </span>
                            {pending && (
                              <span className="text-[10px] text-muted-foreground">Shown after payment</span>
                            )}
                          </div>
                        </div>

                        {/* ACTION AREA */}
                        <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[220px]">
                          {/* PAYMENT */}
                          {pending && (
                            <Button
                              onClick={() => void pay(row.ticket_code)}
                              disabled={!!busy || !online || savedView}
                              className="h-11 w-full rounded-xl font-bold"
                            >
                              {payBusy ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Opening payment...
                                </>
                              ) : (
                                <>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Pay ₹{Number(row.events?.price || row.amount || 0).toLocaleString("en-IN")}
                                </>
                              )}
                            </Button>
                          )}

                          {/* SHOW QR */}
                          {confirmed && (
                            <Button
                              onClick={() => setQrTicket(row)}
                              className="h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/10 transition hover:-translate-y-0.5 hover:shadow-primary/20"
                            >
                              <QrCode className="mr-2 h-4 w-4" />
                              Show QR
                            </Button>
                          )}

                          {/* VIEW EVENT */}
                          <Button variant="outline" asChild className="h-10 w-full rounded-md">
                            <Link to={`/events/${row.events?.slug || ""}`} className="flex items-center justify-center">
                              View event
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* FOOTER META */}
                      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                          {confirmed && (
                            <span className="flex items-center gap-1.5 text-emerald-500">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Ticket confirmed
                            </span>
                          )}

                          {pending && (
                            <span className="flex items-center gap-1.5 text-amber-500">
                              <WalletCards className="h-3.5 w-3.5" />
                              Payment required to confirm your seat
                            </span>
                          )}

                          {row.paid_at && <span>Paid {new Date(row.paid_at).toLocaleDateString("en-IN")}</span>}
                        </div>

                        {row.ticket_emailed_at && (
                          <span>Ticket emailed {new Date(row.ticket_emailed_at).toLocaleDateString("en-IN")}</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* =====================================================
          QR MODAL
      ===================================================== */}

      {qrTicket && <QRModal ticket={qrTicket} onClose={() => setQrTicket(null)} />}
    </MainLayout>
  );
};

/* ===============================================================
   RESPONSIVE QR MODAL
================================================================ */

interface QRModalProps {
  ticket: Row;
  onClose: () => void;
}

const QRModal = ({ ticket, onClose }: QRModalProps) => {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);
  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(ticket.ticket_code, { width: 800, margin: 2, errorCorrectionLevel: "H" })
      .then((url) => { if (active) setQrUrl(url); })
      .catch(() => { if (active) setQrError(true); });
    return () => { active = false; };
  }, [ticket.ticket_code]);

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        min-h-[100dvh]
        items-center
        justify-center
        overflow-y-auto
        bg-black/80
        p-2.5
        backdrop-blur-xl
        sm:p-4
      "
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Event ticket QR code"
    >
      <div
        className="
          relative
          flex
          max-h-[calc(100dvh-20px)]
          w-full
          max-w-[430px]
          flex-col
          overflow-hidden
          rounded-[24px]
          border
          border-white/10
          bg-card
          shadow-[0_30px_100px_rgba(0,0,0,0.65)]
          sm:max-h-[calc(100dvh-32px)]
          sm:rounded-[30px]
        "
        onClick={(event) => event.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="relative shrink-0 border-b border-border px-4 py-4 sm:px-6 sm:py-5">
          {/* Subtle modal glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-20 w-44 -translate-x-1/2 rounded-full bg-primary/[0.10] blur-3xl"
          />

          {/* CLOSE */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR"
            className="
              absolute
              right-3
              top-3
              z-20
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              border
              border-border
              bg-background/90
              text-muted-foreground
              backdrop-blur
              transition
              hover:border-primary/40
              hover:bg-primary/10
              hover:text-foreground
              sm:right-4
              sm:top-4
            "
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
              <QrCode className="h-5 w-5" />
            </div>

            <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.25em] text-primary sm:text-[10px]">
              THRYLOS INDIA
            </p>

            <h2 className="mt-1 text-lg font-black tracking-tight text-foreground sm:text-xl">Event ticket</h2>

            <p className="mx-auto mt-1 max-w-[260px] truncate text-xs text-muted-foreground sm:text-sm">
              {ticket.events?.title || "Event"}
            </p>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            px-4
            py-4
            sm:px-6
            sm:py-6
          "
        >
          {/* QR */}
          <div className="flex w-full justify-center">
            <div
              className="
                w-[min(78vw,310px)]
                rounded-[22px]
                border
                border-black/5
                bg-white
                p-2.5
                shadow-[0_15px_55px_rgba(0,0,0,0.22)]
                sm:w-[min(70vw,320px)]
                sm:rounded-[26px]
                sm:p-3.5
              "
            >
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-white sm:rounded-2xl">
                {qrUrl ? <img
                  src={qrUrl}
                  alt={`QR code for ticket ${ticket.ticket_code}`}
                  className="block h-full w-full object-contain"
                /> : <p className="p-6 text-center text-muted-foreground">{qrError ? "QR unavailable. Use the ticket ID below." : "Preparing QR…"}</p>}
              </div>
            </div>
          </div>

          {/* TICKET DETAILS */}
          <div className="mx-auto mt-4 w-full max-w-[320px] sm:mt-5">
            <div className="rounded-2xl border border-border bg-muted/40 p-3.5 sm:p-4">
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Ticket ID</p>

                <div className="mt-2 overflow-hidden rounded-xl border border-border bg-background px-3 py-2.5">
                  <p className="break-all font-mono text-[11px] font-bold tracking-[0.12em] text-foreground sm:text-xs sm:tracking-[0.16em]">
                    {ticket.ticket_code}
                  </p>
                </div>

                <p className="mt-3 text-[10px] leading-5 text-muted-foreground sm:text-xs">
                  Show this QR code at the event check-in desk.
                </p>
              </div>
            </div>

            {/* DATE */}
            {ticket.events?.starts_at && (
              <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px] text-muted-foreground sm:text-xs">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>{fmtDate(ticket.events.starts_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="shrink-0 border-t border-border bg-card px-4 py-3 sm:px-6 sm:py-3.5">
          {qrUrl && <Button asChild className="mb-2 h-10 w-full"><a href={qrUrl} download={`THRYLOS-${ticket.ticket_code}.png`}>Save QR image</a></Button>}
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="h-10 w-full rounded-xl font-semibold sm:h-11"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ===============================================================
   STATUS BADGE
================================================================ */

interface StatusBadgeProps {
  type: "confirmed" | "pending" | "checked" | "default";
  icon: JSX.Element;
  text: string;
}

const StatusBadge = ({ type, icon, text }: StatusBadgeProps) => {
  const styles = {
    confirmed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",

    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",

    checked: "bg-primary/10 text-primary border-primary/20",

    default: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[type]}`}
    >
      {icon}
      {text}
    </span>
  );
};

/* ===============================================================
   INFORMATION LINE
================================================================ */

interface InfoLineProps {
  icon: JSX.Element;
  text: string;
}

const InfoLine = ({ icon, text }: InfoLineProps) => (
  <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
    <span className="shrink-0 text-primary">{icon}</span>

    <span className="truncate">{text}</span>
  </div>
);

/* ===============================================================
   SUMMARY PILL
================================================================ */

interface SummaryPillProps {
  icon: JSX.Element;
  value: string | number;
  label: string;
}

const SummaryPill = ({ icon, value, label }: SummaryPillProps) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs backdrop-blur-sm">
    <span className="text-primary">{icon}</span>

    <span className="font-black text-foreground">{value}</span>

    <span className="text-muted-foreground">{label}</span>
  </div>
);

/* ===============================================================
   LOADING STATE
================================================================ */

const LoadingState = () => (
  <div className="space-y-5">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="h-1 animate-pulse bg-muted" />

        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
          <div className="h-[78px] w-[78px] shrink-0 animate-pulse rounded-2xl bg-muted" />

          <div className="flex-1 space-y-3">
            <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />

            <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />

            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />

            <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
          </div>

          <div className="h-11 w-full animate-pulse rounded-xl bg-muted lg:w-[220px]" />
        </div>
      </div>
    ))}
  </div>
);

/* ===============================================================
   SIGNED OUT STATE
================================================================ */

const SignedOutState = () => (
  <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card px-6 py-14 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <TicketIcon className="h-7 w-7" />
    </div>

    <h2 className="mt-5 text-2xl font-black text-foreground">Sign in to view your tickets</h2>

    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
      Your event registrations and tickets are securely connected to your account.
    </p>

    <Button asChild className="mt-7 rounded-xl">
      <Link to="/auth" onClick={() => sessionStorage.setItem("post_oauth_redirect", "/events/my-tickets")}>
        Sign in
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  </div>
);

/* ===============================================================
   EMPTY STATE
================================================================ */

const EmptyState = () => (
  <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <TicketIcon className="h-7 w-7" />
    </div>

    <h2 className="mt-5 text-2xl font-black text-foreground">No tickets yet</h2>

    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
      You haven't registered for any THRYLOS events yet. Discover an event and reserve your place.
    </p>

    <Button asChild className="mt-7 rounded-xl">
      <Link to="/events">
        Browse events
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  </div>
);

export default MyTickets;
