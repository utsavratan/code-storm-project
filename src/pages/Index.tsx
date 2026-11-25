import SEO from "@/components/seo/SEO";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, Loader2, MapPin, RefreshCw, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import WriteReview from "@/components/WriteReview";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import FAQ from "@/components/home/FAQ";
import PortfolioShowcase from "@/components/home/PortfolioShowcase";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, useInView } from "framer-motion";
import { type ServiceCardData } from "@/components/ServiceCard";
import ServicesShowcase from "@/components/ServicesShowcase";
import { supabase } from "@/integrations/supabase/client";
import { EventItem, fmtDate, isPast } from "@/lib/events";
import handPhone from "@/assets/thhands.webp";

const Index = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });
  const { t } = useLanguage();

  const [indianTime, setIndianTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let time = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      time = time.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
      setIndianTime(time);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [services, setServices] = useState<ServiceCardData[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .eq("registration_open", true)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(3);
      setEvents(((data as unknown as EventItem[]) || []).filter((e) => !isPast(e)));
    })();
  }, []);

  const loadServices = async () => {
    setServicesLoading(true);
    setServicesError(false);
    const { data, error } = await supabase.from("services").select("id,title,description,icon,features,price_range")
      .eq("is_active", true).order("order_index", { ascending: true });
    if (error) setServicesError(true);
    else setServices((data || []).map(service => ({ ...service, features: service.features || [], price_range: service.price_range || "" })));
    setServicesLoading(false);
  };
  useEffect(() => { void loadServices(); }, []);

  const handleFeatureClick = (serviceId: string) => {
    navigate(user ? `/dashboard?service=${encodeURIComponent(serviceId)}` : "/auth");
  };

  return (
    <MainLayout>
      <SEO
        path="/"
        title="THRYLOS INDIA — Web, Mobile & Digital Solutions"
        description="THRYLOS INDIA builds web, mobile, cloud, AI and cybersecurity solutions for modern businesses."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              q: "How long does a typical project take?",
              a: "Project timelines vary based on complexity. A simple website takes 2-4 weeks, while full-stack applications may take 2-3 months. We provide detailed timelines during consultation.",
            },
            {
              q: "What technologies do you use?",
              a: "We use modern stacks including React, Next.js, React Native, Node.js, Python, AWS, and more. We choose the best technology for each project's unique requirements.",
            },
            {
              q: "Do you offer post-launch support?",
              a: "Yes! We offer comprehensive maintenance and support packages. Every project includes 30 days of free bug-fix support after launch.",
            },
            {
              q: "How do payments work?",
              a: "We typically work with milestone-based payments. 30% upfront, 40% at midpoint, and 30% on delivery. We accept UPI, bank transfers, and online payments.",
            },
            {
              q: "Can I see progress during development?",
              a: "Absolutely! You get access to a dedicated dashboard where you can track progress, communicate with your project manager, and review deliverables in real-time.",
            },
          ].map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />

      {/* HERO SECTION */}
      <section
        ref={sectionRef}
        className="relative min-h-screen sm:min-h-[90vh] flex flex-col items-center justify-between sm:justify-center overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/20 blur-3xl rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-blue-600/10 blur-3xl rounded-full" />
        </div>

        {/* Particles */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {[...Array(40)].map((_, i) => {
            const size = 1 + Math.floor(Math.random() * 8);
            const left = Math.random() * 100;
            const delay = Math.random() * 1.2;
            const duration = 1.2 + Math.random() * 1.6;
            const opacity = 0.4 + Math.random() * 0.6;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}%`,
                  bottom: `${-10 - Math.random() * 20}%`,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(173,216,230,0.9))",
                  opacity,
                  filter: "blur(0.6px)",
                }}
                animate={{ translateY: [-10, -1200] }}
                transition={{ duration, delay, repeat: Infinity, ease: "linear", repeatType: "loop" }}
              />
            );
          })}
        </div>

        {/* Mobile: stacked layout | Desktop: overlapping layout */}
        {/* BEYOND TECH title - top on mobile */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -40 }}
          transition={{ duration: 1 }}
          className="relative z-20 pt-8 sm:pt-0 sm:absolute sm:top-[10%] sm:left-0 sm:px-6"
        >
          <h1 className="text-center sm:text-left">
            <span className="block sm:hidden text-[2.8rem] font-black text-white leading-none tracking-tight">
              BEYOND TECH
            </span>
            <span className="hidden sm:block text-[6rem] md:text-[10rem] lg:text-[14rem] font-black text-white leading-none tracking-tight">
              BEYOND
              <span className="sr-only"> TECH</span>
            </span>
          </h1>
        </motion.div>

        {/* Phone - full width on mobile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-30 flex-1 sm:flex-none flex items-center justify-center"
        >
          <div className="relative">
            <div className="absolute top-[2.6%] sm:top-[3.5%] left-[61%] -translate-x-1/2 z-40">
              <span className="text-white text-[5px] sm:text-[8px] font-medium">{indianTime}</span>
            </div>
            <img
              src={handPhone}
              alt="Smartphone displaying THRYLOS INDIA digital solutions"
              fetchPriority="high"
              width={448}
              height={896}
              className="w-80 sm:w-72 md:w-96 lg:w-[28rem] h-auto object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            />
          </div>
        </motion.div>

        {/* TECH - desktop only */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
          transition={{ duration: 1 }}
          className="hidden sm:block absolute bottom-[8%] right-0 px-6"
        >
          <div
            aria-hidden="true"
            className="text-[6rem] md:text-[10rem] lg:text-[14rem] font-black text-white leading-none tracking-tight text-right"
          >
            TECH
          </div>
        </motion.div>

        {/* Get Started button - mobile only */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative z-20 pb-10 sm:hidden w-full px-6"
        >
          <Link to="/auth" className="block">
            <Button size="lg" className="w-full text-base font-semibold rounded-xl h-14">
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ABOUT THRYLOS INDIA */}
      <section className="relative py-16 sm:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/10 blur-[180px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/5 blur-[120px] rounded-full" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 space-y-5">
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs sm:text-sm font-semibold tracking-wider uppercase text-primary">
                India's Trusted Technology Company
              </span>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                About <span className="gradient-text">THRYLOS INDIA</span>
              </h2>

              <p className="max-w-4xl mx-auto text-base sm:text-lg text-muted-foreground leading-8">
                <strong>THRYLOS INDIA</strong> is a leading technology company specializing in
                <strong> Website Development</strong>,<strong> Web Application Development</strong>,
                <strong> Custom Software Development</strong>,<strong> Mobile App Development</strong>,
                <strong> AI Solutions</strong>,<strong> Cloud Computing</strong>,<strong> UI/UX Design</strong>,
                <strong> Business Automation</strong>,<strong> SaaS Platforms</strong>,
                <strong> Enterprise Software</strong>,<strong> Digital Transformation</strong> and
                <strong> IT Consulting</strong>. We design, develop and scale secure, high-performance digital products
                for startups, businesses, enterprises and organizations across India and globally.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="glass-card rounded-3xl border border-primary/20 p-8 hover:border-primary/40 transition-all duration-500">
                <div className="mb-6 flex items-center gap-3">
                  <img src="/internet.png" alt="Thrylos" className="w-10 h-10 sm:w-10 sm:h-10 object-contain" />

                  <div>
                    <h3 className="text-2xl font-bold">Website Development Experts</h3>

                    <p className="text-sm text-primary">Custom • Modern • SEO Optimized</p>
                  </div>
                </div>

                <p className="text-muted-foreground leading-8">
                  THRYLOS INDIA develops modern websites, corporate websites, portfolio websites, business websites,
                  ecommerce platforms, landing pages, booking systems, educational portals, healthcare platforms, ERP
                  solutions, CRM systems, dashboards, admin panels and complete web applications using the latest
                  technologies with responsive design, lightning-fast performance, enterprise security, accessibility
                  and SEO best practices.
                </p>
              </div>

              <div className="glass-card rounded-3xl border border-primary/20 p-8 hover:border-primary/40 transition-all duration-500">
                <div className="mb-6 flex items-center gap-3">
                  <img src="/rocket.png" alt="Thrylos" className="w-10 h-10 sm:w-10 sm:h-10 object-contain" />

                  <div>
                    <h3 className="text-2xl font-bold">Why Businesses Choose Us</h3>

                    <p className="text-sm text-primary">Innovation • Performance • Reliability</p>
                  </div>
                </div>

                <p className="text-muted-foreground leading-8">
                  Our focus is to build scalable digital experiences that help businesses grow online. Every project is
                  engineered with clean architecture, Core Web Vitals optimization, technical SEO, schema
                  implementation, responsive UI, secure authentication, cloud infrastructure, analytics,
                  conversion-focused design and long-term scalability to maximize online visibility and business growth.
                </p>
              </div>
            </div>

            <div className="mt-10 glass-card rounded-3xl border border-primary/20 p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">What THRYLOS INDIA Delivers</h3>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  "Website Development",
                  "Custom Web Applications",
                  "Mobile App Development",
                  "Software Development",
                  "AI Integration",
                  "Cloud Solutions",
                  "Business Automation",
                  "UI/UX Design",
                  "SEO Ready Websites",
                  "ERP & CRM Systems",
                  "E-Commerce Platforms",
                  "Maintenance & Support",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-primary/10 bg-background/50 px-4 py-4 text-center font-medium hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 max-w-5xl mx-auto text-center">
              <p className="text-base sm:text-lg text-muted-foreground leading-8">
                From startup MVPs to enterprise software, THRYLOS INDIA delivers reliable, scalable and future-ready
                digital solutions. Our mission is to empower businesses with world-class technology, exceptional user
                experiences and innovative software engineered for long-term growth, security and performance.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link to="/services">
                <Button size="lg" className="rounded-full px-8">
                  Explore Services
                </Button>
              </Link>

              <Link to="/portfolio">
                <Button variant="outline" size="lg" className="rounded-full px-8">
                  View Portfolio
                </Button>
              </Link>

              <Link to="/contact">
                <Button variant="outline" size="lg" className="rounded-full px-8">
                  Get Free Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-12 sm:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-col justify-between gap-6 sm:mb-14 lg:flex-row lg:items-end">
            <div><p className="mb-4 text-sm text-primary">What we build</p><h2 className="text-3xl font-semibold sm:text-5xl">{t("our_services")}</h2></div>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">{t("services_desc")}</p>
          </div>

          {servicesError ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <p className="text-muted-foreground">Services couldn't be loaded. Please try again.</p>
              <Button variant="outline" onClick={loadServices}><RefreshCw className="h-4 w-4" />Retry</Button>
            </div>
          ) : servicesLoading ? (
            <div className="flex justify-center py-12" role="status" aria-label="Loading services"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : services.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">No services available at the moment.</p>
          ) : (
            <ServicesShowcase services={services} onSelect={handleFeatureClick} />
          )}
          <div className="mt-8 flex justify-center">
            <Button variant="outline" asChild><Link to="/services">All services<ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS — visitor funnel */}
      {events.length > 0 && (
        <section className="py-12 sm:py-24 border-y border-border bg-card/30">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-8 sm:mb-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Ticket className="h-3.5 w-3.5" /> Upcoming events
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-4">
                Join us <span className="gradient-text">live</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mt-3">
                Explore the event, register your details and complete secure payment. Confirmed tickets arrive by email.
              </p>
            </div>
            <div className={events.length === 1 ? "max-w-5xl mx-auto" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto"}>
              {events.map((ev, i) => (
                <motion.article
                  key={ev.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.08, 0.3) }}
                  className={`group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/60 ${events.length === 1 ? "grid md:grid-cols-2" : "flex flex-col"}`}
                >
                  {ev.cover_url && (
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted md:aspect-auto">
                      <img src={ev.cover_url} alt={ev.title} loading="lazy" className="h-full w-full object-contain" />
                      <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
                        {ev.category}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
                    <h3 className="text-2xl font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">{ev.title}</h3>
                    {ev.tagline && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{ev.tagline}</p>}
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{fmtDate(ev.starts_at)}</p>
                      <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{ev.mode === "online" ? "Online" : ev.venue}</p>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                      <span className="text-lg font-bold text-primary">{Number(ev.price) > 0 ? `₹${Number(ev.price).toLocaleString("en-IN")}` : "Free"}</span>
                      <Button asChild size="sm" className="group/btn">
                        <Link to={`/events/${ev.slug}`}>
                          View & register<ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Button variant="outline" asChild><Link to="/events">All events<ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>
      )}

      {/* STATS */}
      <section className="py-12 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {[
              { value: "10+", label: t("projects_completed") },
              { value: "5+", label: t("happy_clients") },
              { value: "2+", label: t("years_experience") },
              { value: "24/7", label: t("support") },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-1 sm:mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm md:text-base text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <PortfolioShowcase />
      <WhyChooseUs />

      {/* REVIEWS CAROUSEL */}
      <ReviewsCarousel />

      {/* FAQ */}
      <FAQ />

      {/* CTA */}
      <section className="py-12 sm:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              Ready to <span className="gradient-text">{t("start_project")}</span>?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Let's discuss how THRYLOS INDIA can help transform your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link to="/contact">
                <Button size="lg" className="w-full sm:w-auto">
                  {t("contact_us")}
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  {t("view_our_work")}
                </Button>
              </Link>
              <WriteReview />
            </div>
            <p className="text-xs text-muted-foreground pt-4">
              <Link to="/privacy-policy" className="hover:text-primary transition-colors underline">
                Privacy Policy
              </Link>
              {" · "}
              <Link to="/terms-and-conditions" className="hover:text-primary transition-colors underline">
                Terms & Conditions
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-24" aria-labelledby="how-title">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">How it works</p>
          <h2 id="how-title" className="text-3xl sm:text-4xl font-bold mb-10">From idea to launch, in four clear steps.</h2>
          <ol className="divide-y divide-border border-y border-border">
            {[
              ["Tell us what you need", "Share your goal, budget and timeline in a short project request."],
              ["Choose your project manager", "Pick the manager whose experience fits your project."],
              ["Pay securely online", "Approve the quote and pay through secure online checkout with an instant invoice."],
              ["Track and launch", "Follow milestones from your dashboard until your project goes live."],
            ].map(([t, d]) => (
              <li key={t} className="py-5 sm:flex sm:items-baseline sm:gap-8">
                <h3 className="font-semibold sm:w-72 shrink-0">{t}</h3>
                <p className="text-muted-foreground text-sm mt-1 sm:mt-0">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild><Link to="/get-started">Start a project <ArrowRight /></Link></Button>
            <Button asChild variant="outline"><Link to="/choose-manager">Meet the managers</Link></Button>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 bg-card/30 border-y border-border/40" aria-labelledby="trust-title">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl sm:flex sm:items-center sm:justify-between gap-10">
          <div className="max-w-xl">
            <h2 id="trust-title" className="text-2xl sm:text-3xl font-bold mb-3">Every document, verifiable.</h2>
            <p className="text-muted-foreground">Invoices, employee IDs and letters from THRYLOS INDIA carry a code you can check instantly on our public verification page.</p>
          </div>
          <div className="mt-6 sm:mt-0 flex flex-wrap gap-3 shrink-0">
            <Button asChild><Link to="/verify">Verify a document</Link></Button>
            <Button asChild variant="outline"><Link to="/events">Browse events</Link></Button>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6">
          <NewsletterSubscribe
            source="home"
            title="Get the THRYLOS INDIA newsletter"
            description="Product launches, engineering deep-dives, and case studies from our team — straight to your inbox."
          />
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
