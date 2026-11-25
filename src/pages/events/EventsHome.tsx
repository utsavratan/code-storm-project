import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Globe2,
  MapPin,
  Search,
  Sparkles,
  Ticket,
  Users,
  X,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import SEO from "@/components/seo/SEO";
import { Button, buttonVariants } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { EventItem, fmtDate, isPast } from "@/lib/events";

const EventsHome = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("all");
  const [price, setPrice] = useState("all");

  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .order("starts_at", { ascending: true });

      if (!mounted) return;

      setEvents((data as unknown as EventItem[]) || []);
      setLoading(false);
    };

    loadEvents();

    return () => {
      mounted = false;
    };
  }, []);

  const upcomingEvents = useMemo(() => events.filter((event) => !isPast(event)), [events]);

  const pastEvents = useMemo(() => events.filter((event) => isPast(event)), [events]);

  const featured = useMemo(
    () => upcomingEvents.find((event) => event.is_featured) || upcomingEvents[0],
    [upcomingEvents],
  );

  const list = useMemo(() => {
    const source = tab === "past" ? pastEvents : upcomingEvents;

    return source.filter((event) => {
      const searchable = [event.title, event.category, event.tagline, event.venue]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q.trim() || searchable.includes(q.trim().toLowerCase());

      const matchesMode = mode === "all" || event.mode === mode;

      const eventPrice = Number(event.price || 0);

      const matchesPrice =
        price === "all" || (price === "free" && eventPrice === 0) || (price === "paid" && eventPrice > 0);

      return matchesSearch && matchesMode && matchesPrice;
    });
  }, [tab, upcomingEvents, pastEvents, q, mode, price]);

  const hasFilters = q.trim().length > 0 || mode !== "all" || price !== "all";

  const clearFilters = () => {
    setQ("");
    setMode("all");
    setPrice("all");
  };

  return (
    <MainLayout>
      <SEO
        title="Events | THRYLOS INDIA"
        description="Discover workshops, hackathons, meetups, tech sessions and experiences hosted by THRYLOS INDIA."
        path="/events"
      />

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-[-180px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute left-[8%] top-[35%] h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-[5%] bottom-[-50px] h-52 w-52 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-16 sm:py-20 lg:py-28">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="max-w-4xl"
            >
              <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Experiences that
                <span className="block text-primary">bring people together.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Discover hackathons, workshops, meetups, tech sessions and community experiences designed to help you
                learn, build and connect.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg"><a
                  href="#discover"
                >
                  Explore events
                  <ArrowRight className="h-4 w-4" />
                </a></Button>

                <Button asChild size="lg" variant="outline"><Link
                  to="/events/my-tickets"
                >
                  <Ticket className="h-4 w-4" />
                  My tickets
                </Link></Button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3"
            >
              <StatCard icon={<Calendar className="h-4 w-4" />} value={upcomingEvents.length} label="Upcoming events" />

              <StatCard icon={<CheckCircle2 className="h-4 w-4" />} value={pastEvents.length} label="Past events" />

              <StatCard
                icon={<Ticket className="h-4 w-4" />}
                value="Online"
                label="Easy registration"
                className="col-span-2 sm:col-span-1"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURED EVENT
      ========================================================= */}
      {featured && tab === "upcoming" && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Spotlight</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Featured event</h2>
              </div>
            </div>

            <Link
              to={`/events/${featured.slug}`}
              className="group relative grid overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-sm transition duration-500 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 md:grid-cols-[1.1fr_0.9fr]"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-muted md:aspect-auto md:min-h-[390px]">
                {featured.cover_url ? (
                  <img
                    src={featured.cover_url}
                    alt={featured.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <EventPlaceholder category={featured.category} large />
                )}
              </div>

              <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                    {featured.category}
                  </span>

                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {Number(featured.price || 0) > 0 ? `₹${featured.price}` : "Free"}
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {featured.title}
                </h2>

                {featured.tagline && <p className="mt-4 leading-7 text-muted-foreground">{featured.tagline}</p>}

                <div className="mt-7 space-y-3">
                  <EventMeta icon={<Calendar className="h-4 w-4" />} text={fmtDate(featured.starts_at)} />

                  <EventMeta
                    icon={featured.mode === "online" ? <Globe2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    text={featured.mode === "online" ? "Online event" : featured.venue || "In-person event"}
                  />
                </div>

                <span className={`${buttonVariants()} mt-8 w-fit`}>
                  View event
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        </section>
      )}

      {/* =========================================================
          DISCOVER / FILTERS
      ========================================================= */}
      <section id="discover" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Discover</p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Find your next event</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse events and choose the experience that fits you.
              </p>
            </div>

            {!loading && (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{list.length}</span>{" "}
                {list.length === 1 ? "event" : "events"}
              </p>
            )}
          </div>
        </div>

        {/* Filter shell */}
        <div className="rounded-2xl border border-border bg-card/70 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Tabs */}
            <div className="flex rounded-xl bg-muted/60 p-1">
              {(["upcoming", "past"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={tab === item}
                  onClick={() => setTab(item)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                    tab === item
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Search */}
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search events</span>

              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search events, categories or locations..."
                className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
              />

              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <select
                aria-label="Event mode"
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="all">All modes</option>
                <option value="online">Online</option>
                <option value="offline">In person</option>
                <option value="hybrid">Hybrid</option>
              </select>

              <select
                aria-label="Event price"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="all">Any price</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {hasFilters && (
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Filters are active</p>

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* =====================================================
            CONTENT
        ===================================================== */}
        <div className="mt-8">
          {loading ? (
            <EventSkeletonGrid />
          ) : list.length === 0 ? (
            <EmptyState tab={tab} hasFilters={hasFilters} onClear={clearFilters} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

/* ===============================================================
   EVENT CARD
================================================================ */

const EventCard = ({ event, index }: { event: EventItem; index: number }) => {
  const price = Number(event.price || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.25),
      }}
    >
      <Link
        to={`/events/${event.slug}`}
        className="group block overflow-hidden rounded-2xl border border-border bg-card transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
      >
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {event.cover_url ? (
            <img
              src={event.cover_url}
              alt={event.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <EventPlaceholder category={event.category} />
          )}

          {/* Date badge */}
          <div className="absolute left-4 top-4 overflow-hidden rounded-xl border border-white/20 bg-background/90 shadow-lg backdrop-blur">
            <div className="px-3 py-1 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {new Date(event.starts_at).toLocaleDateString("en-IN", {
                  month: "short",
                })}
              </p>

              <p className="text-xl font-black leading-5 text-foreground">{new Date(event.starts_at).getDate()}</p>
            </div>
          </div>

          {/* Price */}
          <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-background/90 px-3 py-1.5 text-xs font-bold text-foreground shadow-lg backdrop-blur">
            {price > 0 ? `₹${price}` : "Free"}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-xs font-bold uppercase tracking-wider text-primary">{event.category}</span>

            {event.is_featured && (
              <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"></span>
            )}
          </div>

          <h3 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-foreground transition group-hover:text-primary">
            {event.title}
          </h3>

          {event.tagline && (
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{event.tagline}</p>
          )}

          <div className="mt-5 space-y-2.5 border-t border-border pt-4">
            <EventMeta icon={<Calendar className="h-3.5 w-3.5" />} text={fmtDate(event.starts_at)} />

            <EventMeta
              icon={event.mode === "online" ? <Globe2 className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
              text={event.mode === "online" ? "Online" : event.venue || "In person"}
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">View details</span>

            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ===============================================================
   SMALL COMPONENTS
================================================================ */

const StatCard = ({
  icon,
  value,
  label,
  className = "",
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  className?: string;
}) => (
  <div className={`rounded-2xl border border-border bg-card/60 p-4 backdrop-blur ${className}`}>
    <div className="flex items-center gap-2 text-primary">
      {icon}
      <span className="text-xl font-black text-foreground">{value}</span>
    </div>

    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
  </div>
);

const EventMeta = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
    <span className="shrink-0 text-primary">{icon}</span>
    <span className="truncate">{text}</span>
  </div>
);

const EventPlaceholder = ({ category, large = false }: { category?: string; large?: boolean }) => (
  <div className="relative flex h-full min-h-[180px] w-full items-center justify-center overflow-hidden bg-muted">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.16),transparent_60%)]" />

    <div className="relative text-center">
      <Ticket className={`mx-auto text-primary/30 ${large ? "h-14 w-14" : "h-10 w-10"}`} />

      <p className={`mt-3 font-black uppercase tracking-[0.18em] text-primary/30 ${large ? "text-lg" : "text-xs"}`}>
        {category || "THRYLOS EVENT"}
      </p>
    </div>
  </div>
);

const EventSkeletonGrid = () => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-[16/9] animate-pulse bg-muted" />

        <div className="space-y-3 p-5">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-5 h-px bg-border" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({
  tab,
  hasFilters,
  onClear,
}: {
  tab: "upcoming" | "past";
  hasFilters: boolean;
  onClear: () => void;
}) => (
  <div className="rounded-3xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      {hasFilters ? <Search className="h-6 w-6" /> : <Calendar className="h-6 w-6" />}
    </div>

    <h3 className="mt-5 text-xl font-bold text-foreground">
      {hasFilters ? "No matching events" : tab === "upcoming" ? "No upcoming events" : "No past events"}
    </h3>

    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
      {hasFilters
        ? "Try changing your search or filters to find what you're looking for."
        : tab === "upcoming"
          ? "There are no upcoming events at the moment. Check back soon for new experiences."
          : "Past events will appear here once they have been completed."}
    </p>

    {hasFilters && (
      <button
        type="button"
        onClick={onClear}
        className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
      >
        Clear filters
      </button>
    )}
  </div>
);

export default EventsHome;
