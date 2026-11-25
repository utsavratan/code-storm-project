import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardTools from "@/components/dashboard/DashboardTools";
import { motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, RefreshCw, LayoutDashboard, Fingerprint, CalendarDays, Ticket, IdCard, FileText, Wallet, LogOut, Camera, MapPin, Loader2, Download, CheckCircle2, Clock, ArrowUpRight, ArrowRight, AlertCircle, LifeBuoy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import QrScanner from "@/components/QrScanner";
import { IDCardStage, downloadIDCardPDF, type IDCardEmployee } from "@/components/admin/DigitalIDCard";
import { generateHRDocument, documentTypeLabel, type HRDocumentType } from "@/utils/generateHRDocuments";
import { fmtDate } from "@/lib/events";

type Tab = "overview" | "attendance" | "leave" | "events" | "id" | "documents" | "pay";
const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "attendance", label: "Attendance", icon: Fingerprint },
  { id: "leave", label: "Leave", icon: CalendarDays },
  { id: "events", label: "Events & check-in", icon: Ticket },
  { id: "id", label: "ID card", icon: IdCard },
  { id: "documents", label: "Documents & letters", icon: FileText },
  { id: "pay", label: "Salary slips", icon: Wallet },
];
const PAY_TYPES = ["payslip", "salary_slip", "stipend_slip"];

/* eslint-disable @typescript-eslint/no-explicit-any */
type Emp = IDCardEmployee & Record<string, any>;

const EmployeeDashboard = () => {
  const nav = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<"loading" | "signedout" | "none" | "error" | "ok">("loading");
  const [tab, setTab] = useState<Tab>("overview");
  const [emp, setEmp] = useState<Emp | null>(null);
  const [att, setAtt] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [documentSearch, setDocumentSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [accountId, setAccountId] = useState("");
  const reducedMotion = useReducedMotion();

  const load = useCallback(async () => {
    try {
      setLoadError("");
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session.session) { setEmp(null); setState("signedout"); return; }
      setAccountId(session.session.user.id);
      const { data: e, error: employeeError } = await supabase.from("employees").select("*").eq("is_active", true).ilike("email", session.session.user.email || "").maybeSingle();
      if (employeeError) throw employeeError;
      if (!e) { setEmp(null); setState("none"); return; }
      setEmp(e as Emp);
      const [a, l, d, ev, st] = await Promise.all([
        supabase.from("employee_attendance").select("*").eq("employee_id", e.id).order("work_date", { ascending: false }).limit(60),
        supabase.from("leave_requests").select("*").eq("employee_id", e.id).order("created_at", { ascending: false }),
        supabase.from("hr_documents").select("*").eq("employee_id", e.id).order("created_at", { ascending: false }),
        supabase.from("events").select("id,title,slug,starts_at,ends_at,venue,mode,capacity,is_published").order("starts_at", { ascending: false }),
        supabase.rpc("employee_event_stats"),
      ]);
      // Failed sections retain their last successful records, never masquerade as empty.
      if (!a.error) setAtt(a.data || []);
      if (!l.error) setLeaves(l.data || []);
      if (!d.error) setDocs(d.data || []);
      if (!ev.error) setEvents(ev.data || []);
      if (!st.error) setStats(Object.fromEntries(((st.data as any[]) || []).map(r => [r.event_id, r])));
      const failed = [a.error && "attendance", l.error && "leave", d.error && "documents", ev.error && "events", st.error && "event counts"].filter(Boolean);
      if (failed.length) setLoadError(`Couldn’t refresh ${failed.join(", ")}. Displayed records may be out of date.`);
      else setLastSynced(new Date());
      setState("ok");
    } catch {
      setLoadError("Your workspace couldn’t load. Please check your connection and try again.");
      setState(previous => previous === "ok" ? "ok" : "error");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const todayRow = att.find((r) => r.work_date === today);
  const nextEvent = events.filter(e => e.is_published && new Date(e.starts_at).getTime() > Date.now()).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))[0];
  const payDocs = docs.filter((d) => PAY_TYPES.includes(d.document_type));
  const otherDocs = docs.filter((d) => !PAY_TYPES.includes(d.document_type));
  const matchingDocs = (rows: any[]) => rows.filter(d => [d.document_number, d.metadata?.period, documentTypeLabel[d.document_type as HRDocumentType] || d.document_type]
    .some(value => String(value || "").toLowerCase().includes(documentSearch.trim().toLowerCase())));

  const download = async (d: any) => {
    if (!emp) return;
    const m = d.metadata || {};
    try {
      await generateHRDocument(d.document_type as HRDocumentType, {
        employee: { ...emp } as any, documentNumber: d.document_number, issueDate: d.created_at?.slice(0, 10),
        periodLabel: m.period, paymentDate: m.payment_date || undefined, paymentReference: m.payment_reference,
        payrollReference: d.payroll_reference || undefined, payrollTransactionId: d.payroll_transaction_id || undefined,
        earnings: m.extras?.length ? m.extras.map((x: any) => ({ label: x.label, amount: Number(x.amount) || 0 })) : undefined,
        deductions: m.deductions?.length ? m.deductions.map((x: any) => ({ label: x.label, amount: Number(x.amount) || 0 })) : undefined,
        completionRemarks: m.remarks, reportingTo: m.reporting_to, location: m.location,
      } as any);
    } catch { toast({ title: "Couldn't create the PDF", variant: "destructive" }); }
  };

  if (state !== "ok" || !emp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Helmet><title>Employee Portal | THRYLOS INDIA</title><meta name="robots" content="noindex,nofollow" /></Helmet>
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center">
          <img src="/thrylosindia.png" alt="THRYLOS INDIA" className="w-14 h-14 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Employee Portal</h1>
          {state === "loading" && <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />}
          {state === "signedout" && <><p className="text-muted-foreground mb-6">Sign in with your work email to continue.</p>
            <Button onClick={() => { sessionStorage.setItem("post_oauth_redirect", "/employee"); nav("/auth"); }}>Sign in</Button></>}
          {state === "error" && <><p role="alert" className="text-muted-foreground mb-6">{loadError}</p><Button onClick={load}><RefreshCw />Try again</Button></>}
          {state === "none" && <><p className="text-muted-foreground mb-6">This account isn't linked to an active employee record. Ask your coordinator to add your email.</p>
            <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => nav("/"))}>Sign out</Button></>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <Helmet><title>Employee Portal | THRYLOS INDIA</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <aside className="lg:w-60 lg:h-screen lg:sticky lg:top-0 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card/40 p-4 lg:p-5 flex flex-col">
        <Link to="/" className="flex items-center gap-3 mb-5"><img src="/thrylosindia.png" alt="" className="w-9 h-9" /><div><span className="font-semibold text-foreground">THRYLOS INDIA</span><p className="text-xs text-muted-foreground">Employee workspace</p></div></Link>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0" aria-label="Employee sections">
          {TABS.map(t => <Button variant="ghost" key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined} className={`justify-start shrink-0 rounded-md px-3 h-11 ${tab === t.id ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}><t.icon />{t.label}</Button>)}
        </nav>
        <div className="hidden lg:block mt-auto pt-8 border-t border-border space-y-2">
          <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground"><Link to="/contact"><LifeBuoy />Get support</Link></Button>
          <Button variant="ghost" onClick={() => supabase.auth.signOut().then(() => nav("/"))} className="w-full justify-start text-muted-foreground"><LogOut />Sign out</Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl">
        <header className="flex flex-wrap items-center gap-3 border-b border-border pb-6 mb-6">
          <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground mb-2">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" })}</p><h1 className="text-2xl sm:text-3xl font-semibold text-foreground">{TABS.find(t => t.id === tab)?.label}</h1></div>
          <Button variant="outline" size="sm" disabled={refreshing} onClick={async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }}><RefreshCw className={refreshing ? "animate-spin" : ""} />Refresh</Button>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Sign out" onClick={() => supabase.auth.signOut().then(() => nav("/"))}><LogOut /></Button>
        </header>
        {loadError && <div role="alert" className="flex items-start gap-3 mb-6 border border-destructive/40 bg-destructive/10 rounded-md p-4 text-sm"><AlertCircle className="w-5 h-5 shrink-0 text-destructive" /><p>{loadError}</p></div>}

        {tab === "overview" && <div className="space-y-8">
          <section className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center border-b border-border pb-8">
            <div className="flex gap-4 items-center">
              {emp.photo_url ? <img src={emp.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" /> : <div className="w-14 h-14 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">{emp.full_name.slice(0, 1)}</div>}
              <div className="min-w-0"><p className="text-sm text-primary mb-1">Your working day</p><h2 className="text-2xl sm:text-3xl font-semibold break-words">Hello, {emp.full_name.split(" ")[0]}.</h2><p className="text-sm text-muted-foreground mt-2 break-words">{emp.designation}{emp.department ? ` · ${emp.department}` : ""}{emp.employee_code ? ` · ${emp.employee_code}` : ""}</p></div>
            </div>
            <div className="md:text-right"><p className="text-sm flex gap-2 items-center md:justify-end"><span className="h-2 w-2 bg-primary rounded-full" />{todayRow?.check_out_at ? "Day complete" : todayRow?.check_in_at ? "Checked in" : "Not checked in yet"}</p><p className="mt-2 text-xs text-muted-foreground">{lastSynced ? `Updated ${lastSynced.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Waiting for refresh"}</p></div>
          </section>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { id: "attendance" as Tab, icon: Fingerprint, title: todayRow?.check_out_at ? "Attendance history" : todayRow?.check_in_at ? "Check out" : "Start your day", text: "Face & location attendance" },
              { id: "leave" as Tab, icon: CalendarDays, title: "Request leave", text: `${leaves.filter(l => l.status === "pending").length} pending requests` },
              { id: "documents" as Tab, icon: FileText, title: "Your documents", text: `${otherDocs.length} letters & documents` },
              { id: "id" as Tab, icon: IdCard, title: "Employee ID", text: emp.employee_code || "Your digital identity" },
            ].map(action => <motion.div key={action.id} whileHover={reducedMotion ? undefined : { y: -3 }}><Button variant="ghost" onClick={() => setTab(action.id)} className="w-full h-full min-h-32 rounded-lg border border-border bg-card/50 p-4 flex-col items-start text-left whitespace-normal"><div className="flex justify-between w-full mb-3"><action.icon className="text-primary" /><ArrowUpRight className="text-muted-foreground" /></div><span className="font-semibold">{action.title}</span><span className="text-xs text-muted-foreground">{action.text}</span></Button></motion.div>)}
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <Card title="Recent activity">
              {leaves.length === 0 && docs.length === 0 && <p className="text-sm text-muted-foreground">Your leave requests and issued documents will appear here.</p>}
              {[
                ...leaves.slice(0, 3).map(l => ({ id: l.id, at: l.created_at, title: `${l.leave_type.replace(/_/g, " ")} leave`, detail: `${l.from_date} — ${l.to_date} · ${l.status}`, target: "leave" as Tab, icon: CalendarDays })),
                ...docs.slice(0, 3).map(d => ({ id: d.id, at: d.created_at, title: documentTypeLabel[d.document_type as HRDocumentType] || d.document_type, detail: d.document_number, target: PAY_TYPES.includes(d.document_type) ? "pay" as Tab : "documents" as Tab, icon: FileText })),
              ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 4).map(item => <Button key={item.id} variant="ghost" onClick={() => setTab(item.target)} className="h-auto w-full justify-start whitespace-normal rounded-none border-b border-border py-4 px-0"><item.icon className="text-primary" /><span className="min-w-0 flex-1 text-left"><span className="block capitalize text-sm">{item.title}</span><span className="block text-xs text-muted-foreground break-words mt-1">{item.detail}</span></span><ArrowRight /></Button>)}
            </Card>
            <div className="space-y-6"><Card title="Latest salary slip">{payDocs[0] ? <DocRow d={payDocs[0]} onDownload={download} /> : <p className="text-sm text-muted-foreground">No salary slips issued yet.</p>}</Card><Card title="Next event">{nextEvent ? <><p className="font-medium">{nextEvent.title}</p><p className="mt-2 text-sm text-muted-foreground">{fmtDate(nextEvent.starts_at)} · {nextEvent.venue || nextEvent.mode}</p><Button variant="outline" size="sm" className="mt-4" onClick={() => setTab("events")}><Ticket />Open events</Button></> : <p className="text-sm text-muted-foreground">No upcoming published events.</p>}</Card></div>
          </div>
          <DashboardTools role="employee" accountId={accountId} />
        </div>}

        {tab === "attendance" && <Attendance emp={emp} todayRow={todayRow} rows={att} onDone={load} />}

        {tab === "leave" && <Leave emp={emp} rows={leaves} onDone={load} />}

        {tab === "events" && (
          <div className="space-y-6">
            <CheckIn />
            <Card title="All events (view only)">
              {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
              <div className="divide-y divide-border">
                {events.map((e) => { const s = stats[e.id] || {}; return (
                  <div key={e.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div><p className="font-medium text-foreground">{e.title} {!e.is_published && <span className="text-xs text-muted-foreground">(draft)</span>}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(e.starts_at)} · {e.venue || e.mode}</p></div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{s.registered || 0}{e.capacity ? `/${e.capacity}` : ""} registered</span><span>{s.checked_in || 0} checked in</span><span>{s.waitlist || 0} waitlist</span>
                    </div>
                  </div>); })}
              </div>
            </Card>
          </div>
        )}

        {tab === "id" && (
          <Card title="Your digital ID card">
            <div className="flex flex-col items-center gap-4">
              <IDCardStage employee={emp} />
              <Button onClick={() => downloadIDCardPDF(emp)}><Download className="w-4 h-4 mr-2" />Download PDF</Button>
            </div>
          </Card>
        )}

        {(tab === "documents" || tab === "pay") && (
          <Card title={tab === "pay" ? "Salary & stipend slips" : "Documents & letters"}>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" aria-label="Search documents" placeholder="Search by number, type or period" value={documentSearch} onChange={e => setDocumentSearch(e.target.value)} />
            </div>
            {matchingDocs(tab === "pay" ? payDocs : otherDocs).map(d => <DocRow key={d.id} d={d} onDownload={download} />)}
            {matchingDocs(tab === "pay" ? payDocs : otherDocs).length === 0 && <p className="text-sm text-muted-foreground">{documentSearch ? "No matching documents." : "No documents yet."}</p>}
          </Card>
        )}
      </main>
    </div>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="min-w-0"><h2 className="font-semibold text-lg text-foreground border-b border-border pb-3 mb-4">{title}</h2>{children}</section>
);
const DocRow = ({ d, onDownload }: { d: any; onDownload: (d: any) => void }) => (
  <div className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
    <div className="min-w-0"><p className="text-sm font-medium text-foreground truncate">{documentTypeLabel[d.document_type as HRDocumentType] || d.document_type}{d.metadata?.period ? ` · ${d.metadata.period}` : ""}</p>
      <p className="text-xs text-muted-foreground font-mono break-words">{d.document_number} · {new Date(d.created_at).toLocaleDateString("en-IN")}</p></div>
    <Button size="sm" variant="outline" onClick={() => onDownload(d)}><Download className="w-4 h-4" /><span className="sr-only">Download</span></Button>
  </div>
);

const fmtTime = (t?: string | null) => (t ? new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—");

const Attendance = ({ emp, todayRow, rows, onDone }: { emp: Emp; todayRow: any; rows: any[]; onDone: () => void }) => {
  const { toast } = useToast();
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [face, setFace] = useState<boolean | null>(null);
  const [consent, setConsent] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const faceFile = useRef<HTMLInputElement>(null);
  const enroll = async (file: File | undefined) => {
    if (!file || enrolling || !consent) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3_000_000) {
      toast({ title: "Choose a JPG, PNG or WebP under 3 MB", variant: "destructive" }); return;
    }
    setEnrolling(true);
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error("Photo could not be read"));
        reader.onerror = () => reject(new Error("Photo could not be read"));
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("employee-attendance", { body: { action: "enroll_face", image, consent } });
      if (error) throw new Error((await error.context?.json?.().catch(() => null))?.error || "Could not save your face photo");
      if (!data?.ok) throw new Error("Could not save your face photo");
      toast({ title: "Face photo saved" }); onDone();
    } catch (error) {
      toast({ title: "Photo not saved", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    } finally { setEnrolling(false); if (faceFile.current) faceFile.current.value = ""; }
  };
  const posRef = useRef<Promise<GeolocationPosition | null> | null>(null);
  // Live face detection (browsers with FaceDetector) — auto-scans once a face is centred.
  useEffect(() => {
    const FD = (window as any).FaceDetector;
    if (!stream || !FD) return;
    const det = new FD({ fastMode: true, maxDetectedFaces: 2 });
    let stop = false, hits = 0;
    const tick = async () => {
      if (stop || !video.current || video.current.readyState < 2) { if (!stop) setTimeout(tick, 250); return; }
      try {
        const f = await det.detect(video.current);
        const ok = f.length === 1; setFace(ok); hits = ok ? hits + 1 : 0;
        if (hits >= 3 && !busyRef.current) { stop = true; submitRef.current?.(); return; }
      } catch { /* ignore */ }
      setTimeout(tick, 200);
    };
    tick();
    return () => { stop = true; };
  }, [stream]);
  const busyRef = useRef(false);
  const submitRef = useRef<(() => void) | null>(null);
  const action = todayRow?.check_in_at && !todayRow?.check_out_at ? "check_out" : todayRow?.check_out_at ? null : "check_in";

  const activeStream = useRef<MediaStream | null>(null);
  const mounted = useRef(true);
  const [starting, setStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; activeStream.current?.getTracks().forEach(t => t.stop()); };
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!stream || !element) return;
    element.srcObject = stream;
    element.play().catch(() => {
      if (mounted.current) toast({ title: "Camera couldn't start", description: "Close the camera and try again.", variant: "destructive" });
    });
    return () => { element.srcObject = null; stream.getTracks().forEach(t => t.stop()); };
  }, [stream, toast]);
  const closeCamera = () => {
    activeStream.current?.getTracks().forEach(t => t.stop());
    activeStream.current = null; setStream(null); setCameraReady(false); setFace(null);
  };
  const start = async () => {
    if (starting || stream) return;
    setStarting(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      if (!mounted.current) { s.getTracks().forEach(t => t.stop()); return; }
      activeStream.current = s; setStream(s); setCameraReady(false);
      posRef.current = getPos().catch(() => null); // fetch location in parallel for a faster scan
      setFace(null);
    } catch { toast({ title: "Camera not available", description: "Allow camera access to mark attendance.", variant: "destructive" }); }
    finally { if (mounted.current) setStarting(false); }
  };
  const getPos = () => new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 15000 }));
  const submit = async () => {
    if (!video.current || !action || busyRef.current || video.current.readyState < 2 || video.current.videoWidth === 0) return;
    busyRef.current = true; setBusy(true); setMsg("Getting your location…");
    try {
      // Keep the camera's real aspect ratio (portrait on phones) so the face isn't stretched.
      const vw = video.current.videoWidth || 640, vh = video.current.videoHeight || 480;
      const sc = Math.min(1, 720 / Math.max(vw, vh));
      const c = document.createElement("canvas"); c.width = Math.round(vw * sc); c.height = Math.round(vh * sc);
      const context = c.getContext("2d");
      if (!context) throw new Error("Camera capture failed. Close the camera and try again.");
      context.drawImage(video.current, 0, 0, c.width, c.height);
      const pos = (await (posRef.current || getPos()).catch(() => null)) || (await getPos().catch(() => { throw new Error("Location is required. Allow location access."); }));
      setMsg("Checking your face…");
      const { data, error } = await supabase.functions.invoke("employee-attendance", { body: {
        action, lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, selfie: c.toDataURL("image/jpeg", 0.8) } });
      if (error) throw new Error((await (error as any).context?.json?.().catch(() => null))?.error || "Couldn't mark attendance");
      toast({ title: action === "check_in" ? "Checked in" : "Checked out", description: `At ${fmtTime(data.at)}${data.distance_m != null ? ` · ${data.distance_m} m from office` : ""}` });
      closeCamera(); onDone();
    } catch (e) { toast({ title: "Not marked", description: (e as Error).message, variant: "destructive" }); }
    busyRef.current = false; setBusy(false); setMsg("");
  };
  submitRef.current = submit;

  return (
    <div className="space-y-6">
      <Card title="Mark attendance">
        {!emp.attendance_face_path && <div className="mb-5 space-y-3 border-b border-border pb-5">
          <h3 className="font-medium">Your attendance face photo</h3>
          <p className="text-sm text-muted-foreground">Add a clear, front-facing photo of yourself. It stays private and is compared with your camera photo at check-in. Only your coordinator can replace it.</p>
          <div className="flex items-start gap-2"><Checkbox id="face-consent" checked={consent} onCheckedChange={value => setConsent(value === true)} disabled={enrolling} /><Label htmlFor="face-consent" className="text-sm leading-5">I agree to my photo being stored and used for attendance identity checks.</Label></div>
          <input ref={faceFile} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={event => void enroll(event.target.files?.[0])} />
          <Button onClick={() => faceFile.current?.click()} disabled={!consent || enrolling}>{enrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}{enrolling ? "Saving photo…" : "Add face photo"}</Button>
        </div>}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="aspect-[4/3] rounded-xl bg-muted overflow-hidden relative flex items-center justify-center">
            {stream ? <video ref={video} playsInline muted onLoadedData={() => setCameraReady(true)} className="w-full h-full object-cover -scale-x-100" /> : <Camera className="w-10 h-10 text-muted-foreground" />}
            {stream && <div className={`absolute inset-[18%] border-2 rounded-[50%] pointer-events-none transition-colors ${face ? "border-primary" : "border-muted-foreground/60"}`} />}
            {stream && face !== null && <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded-full bg-background/80 text-foreground">{face ? "Face detected — scanning…" : "Centre your face in the oval"}</span>}
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" />In: {fmtTime(todayRow?.check_in_at)} · Out: {fmtTime(todayRow?.check_out_at)}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" />Your location and a face photo are checked each time.</p>
            {!action ? <p className="flex items-center gap-2 text-sm text-foreground"><CheckCircle2 className="w-4 h-4 text-primary" />Done for today.</p>
              : !stream ? <Button onClick={start} disabled={starting || !emp.attendance_face_path}><Camera className="w-4 h-4 mr-2" />{starting ? "Opening camera…" : "Open camera"}</Button>
              : <div className="flex flex-wrap gap-2"><Button onClick={submit} disabled={busy || !cameraReady}>{busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Fingerprint className="w-4 h-4 mr-2" />}{busy ? msg : action === "check_in" ? "Scan face & check in" : "Scan face & check out"}</Button><Button variant="outline" disabled={busy} onClick={closeCamera}>Close camera</Button></div>}
          </div>
        </div>
      </Card>
      <Card title="History">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-2">Date</th><th>In</th><th>Out</th><th>Status</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id} className="border-t border-border"><td className="py-2">{r.work_date}</td><td>{fmtTime(r.check_in_at)}</td><td>{fmtTime(r.check_out_at)}</td><td className="capitalize">{r.status}</td></tr>)}</tbody></table>
          {!rows.length && <p className="text-sm text-muted-foreground">No attendance yet.</p>}</div>
      </Card>
    </div>
  );
};

const Leave = ({ emp, rows, onDone }: { emp: Emp; rows: any[]; onDone: () => void }) => {
  const { toast } = useToast();
  const [f, setF] = useState({ leave_type: "casual", from_date: "", to_date: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const days = useMemo(() => (f.from_date && f.to_date ? Math.max(0, (Date.parse(f.to_date) - Date.parse(f.from_date)) / 864e5 + 1) : 0), [f]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!days) { toast({ title: "Check the dates", variant: "destructive" }); return; }
    setBusy(true);
    const { error } = await supabase.from("leave_requests").insert({ employee_id: emp.id, employee_name: emp.full_name, leave_type: f.leave_type, from_date: f.from_date, to_date: f.to_date, reason: f.reason.slice(0, 1000) || null, status: "pending" });
    setBusy(false);
    if (error) { toast({ title: "Couldn't apply", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Leave requested" }); setF({ leave_type: "casual", from_date: "", to_date: "", reason: "" }); onDone();
  };
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card title="Apply for leave">
        <form onSubmit={submit} className="space-y-3">
          <div><Label htmlFor="lt">Type</Label>
            <select id="lt" value={f.leave_type} onChange={(e) => setF({ ...f, leave_type: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              {["casual", "sick", "earned", "unpaid", "work_from_home"].map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="fd">From</Label><Input id="fd" type="date" required value={f.from_date} onChange={(e) => setF({ ...f, from_date: e.target.value })} /></div>
            <div><Label htmlFor="td">To</Label><Input id="td" type="date" required min={f.from_date} value={f.to_date} onChange={(e) => setF({ ...f, to_date: e.target.value })} /></div>
          </div>
          <div><Label htmlFor="rs">Reason</Label><Textarea id="rs" maxLength={1000} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
          <Button type="submit" disabled={busy}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Submit{days ? ` (${days} day${days > 1 ? "s" : ""})` : ""}</Button>
        </form>
      </Card>
      <Card title="My requests">
        {rows.map((l) => <div key={l.id} className="flex flex-wrap items-start gap-2 justify-between py-3 border-b border-border last:border-0 text-sm">
          <span className="capitalize text-foreground">{l.leave_type.replace(/_/g, " ")} · {l.from_date} → {l.to_date}</span>
          <span className={`capitalize text-xs px-2 py-0.5 rounded-full ${l.status === "approved" ? "bg-primary/15 text-primary" : l.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{l.status}</span></div>)}
        {!rows.length && <p className="text-sm text-muted-foreground">No leave requests yet.</p>}
      </Card>
    </div>
  );
};

const CheckIn = () => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [last, setLast] = useState<any>(null);
  const check = async (c: string) => {
    const { data, error } = await supabase.rpc("checkin_ticket", { _code: c });
    if (error) { toast({ title: "Check-in failed", description: error.message, variant: "destructive" }); return; }
    const r = (data as any[])?.[0]; setLast(r); setCode("");
    const ok = r?.result === "ok";
    toast({ title: ok ? `Checked in: ${r.full_name}` : r?.result === "already" ? "Already checked in" : r?.result === "not_found" ? "Ticket not found" : "Ticket not confirmed", variant: ok ? undefined : "destructive" });
  };
  return (
    <Card title="Ticket check-in">
      <div className="flex flex-wrap gap-2">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="TKT-XXXXXX" className="max-w-xs font-mono" onKeyDown={(e) => e.key === "Enter" && code && check(code)} />
        <Button onClick={() => code && check(code)}>Check in</Button>
        <QrScanner onScan={check} />
      </div>
      {last && <p className="text-sm text-muted-foreground mt-3">Last: {last.full_name || "—"} · {last.event_title || ""} · {last.result}</p>}
    </Card>
  );
};

export default EmployeeDashboard;
