import SEO from "@/components/seo/SEO";
import { useState } from "react";
import { Mail, Phone, Send, ArrowUpRight, MapPin, MessageSquare, Briefcase, LifeBuoy, Users, ArrowRight, ShieldCheck, Copy, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import studioImage from "@/assets/about-studio.jpg";

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  const selectEnquiry = (subject: string) => {
    setSent(false);
    setFormData(current => ({ ...current, subject }));
    document.getElementById("enquiry")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    document.getElementById("contact-name")?.focus({ preventScroll: true });
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast({ title: "Email address copied" });
    } catch {
      toast({ title: "Couldn’t copy the address", description: "You can open the email link instead.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("contact_messages").insert([formData]);
      if (error) throw error;
      // Fire-and-forget auto-reply
      supabase.functions
        .invoke("contact-autoreply", {
          body: { email: formData.email, name: formData.name, subject: formData.subject },
        })
        .catch((err) => console.warn("autoreply failed", err));
      toast({ title: t("message_sent"), description: t("message_sent_desc") });
      setSent(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error: any) {
      toast({ title: t("error"), description: error.message || "Failed to send message.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <SEO
        path="/contact"
        title="Contact THRYLOS INDIA — Get in Touch"
        description="Contact THRYLOS INDIA in New Delhi for software projects, partnerships, event enquiries and support. Share your requirements, explore project guidance or contact our team directly."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "THRYLOS INDIA",
          url: "https://thrylosindia.in/contact",
          image: "https://thrylosindia.in/thrylosindia.png",
          email: "support@thrylosindia.in",
          telephone: "+91-9871831555",
          address: { "@type": "PostalAddress", addressCountry: "IN" },
          priceRange: "$$",
        }}
      />

      <section className="relative overflow-hidden border-b border-border">
        <img src={studioImage} alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-40" />
        <div className="about-hero-overlay absolute inset-0" />
        <div className="container relative z-10 mx-auto px-4 py-14 sm:py-20">
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl space-y-5">
            <p className="text-sm text-primary">New Delhi, India · Let’s talk</p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">Contact<br /><span className="text-primary">THRYLOS INDIA.</span></h1>
            <p className="max-w-xl text-base leading-7 text-foreground/80">A new idea, a project in progress, or a question that needs a real conversation. You’re in the right place.</p>
            <div className="flex flex-wrap gap-3 pt-2"><Button asChild><a href="#enquiry">Send an enquiry<ArrowUpRight /></a></Button><Button asChild variant="outline"><a href="tel:+919871831555"><Phone />Call the team</a></Button></div>
          </motion.div>
        </div>
      </section>
      <section className="border-b border-border">
        <div className="container mx-auto px-4 grid md:grid-cols-3">
          {[
            { title: "Projects & support", value: "support@thrylosindia.in", href: "mailto:support@thrylosindia.in", icon: Mail },
            { title: "Founder & partnerships", value: "founder@thrylosindia.in", href: "mailto:founder@thrylosindia.in", icon: Users },
            { title: "Talk to the team", value: "+91 9871831555", href: "tel:+919871831555", icon: Phone },
          ].map(({ title, value, href, icon: Icon }) => <div key={title} className="flex items-center gap-3 py-6 md:px-5 md:first:pl-0 border-b md:border-b-0 md:border-r last:border-0 border-border"><Icon className="h-5 w-5 text-primary shrink-0" /><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground mb-1">{title}</p><a href={href} className="text-sm font-medium break-all hover:text-primary">{value}</a></div>{href.startsWith("mailto:") && <Button variant="ghost" size="icon" aria-label={`Copy ${value}`} title={`Copy ${value}`} onClick={() => copyEmail(value)}><Copy /></Button>}</div>)}
        </div>
      </section>

      <section id="enquiry" className="scroll-mt-24 py-12 sm:py-20">
        <div className="container mx-auto px-4 grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-sm text-primary mb-3">The conversation starts here</p>
            <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">What’s on<br />your mind?</h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">Share your goals and what you need help with. For an existing project or event, include its reference so we can find the right details.</p>
            <div className="mt-8 divide-y divide-border">
              {[
                { icon: Briefcase, title: "New project", text: "Websites, apps & digital products", subject: "Project enquiry" },
                { icon: LifeBuoy, title: "Project support", text: "Help with your existing work", subject: "Project support" },
                { icon: Ticket, title: "Events & tickets", text: "Registrations & payment questions", subject: "Event or ticket enquiry" },
                { icon: Users, title: "Partnerships", text: "Community & collaboration", subject: "Partnership enquiry" },
              ].map(({ icon: Icon, title, text, subject }) => <Button key={title} type="button" variant="ghost" onClick={() => selectEnquiry(subject)} aria-pressed={formData.subject === subject} className={`group h-auto w-full rounded-none py-5 px-2 justify-start whitespace-normal text-left ${formData.subject === subject ? "bg-primary/10 text-primary" : ""}`}><Icon className="text-primary" /><span className="flex-1 min-w-0"><span className="block font-medium">{title}</span><span className="block text-xs text-muted-foreground mt-1">{text}</span></span><ArrowRight className="text-primary" /></Button>)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6"><MapPin className="w-4 h-4 text-primary" />Based in New Delhi, India</div>
          </div>
          <div className="min-w-0 lg:border-l lg:border-border lg:pl-12">
            {sent ? <div role="status" className="py-14 space-y-5"><ShieldCheck className="h-10 w-10 text-primary" /><h2 className="text-3xl font-semibold">Your message is with us.</h2><p className="text-muted-foreground leading-7">Thank you for getting in touch. Our team will reply using the email address you provided.</p><Button onClick={() => setSent(false)}>Send another enquiry<ArrowRight /></Button></div> : <>
              <div className="flex items-center gap-3 mb-7"><MessageSquare className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Send your message</h2></div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label htmlFor="contact-name" className="mb-2 block text-sm font-medium">{t("name")}</label><Input id="contact-name" autoComplete="name" className="h-12 bg-card/50" placeholder={t("your_name")} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div><label htmlFor="contact-email" className="mb-2 block text-sm font-medium">{t("email")}</label><Input id="contact-email" autoComplete="email" type="email" className="h-12 bg-card/50" placeholder={t("your_email")} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label htmlFor="contact-phone" className="mb-2 block text-sm font-medium">{t("phone")}</label><Input id="contact-phone" type="tel" autoComplete="tel" className="h-12 bg-card/50" placeholder={t("phone_placeholder")} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div><label htmlFor="contact-subject" className="mb-2 block text-sm font-medium">{t("subject")}</label><Input id="contact-subject" className="h-12 bg-card/50" placeholder={t("project_inquiry")} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} /></div>
              </div>
              <div><label htmlFor="contact-message" className="mb-2 block text-sm font-medium">{t("message")}</label><Textarea id="contact-message" className="bg-card/50 leading-7" placeholder={t("tell_us_project")} rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required /></div>
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" required className="mt-0.5 accent-primary" aria-label="Consent to data processing" />
                <span>I agree that THRYLOS INDIA may use these details only to reply to my enquiry, as described in the <Link to="/privacy-policy" className="underline hover:text-primary">Privacy Policy</Link>.</span>
              </label>
              <Button type="submit" className="h-12 w-full justify-between" disabled={loading}>{loading ? t("sending") : <>{t("send_message")} <Send className="ml-2 h-4 w-4" /></>}</Button>
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Never send passwords, codes or card details.</p>
            </form>
            </>}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/30 py-8">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-6"><div><p className="text-sm text-primary mb-1">Already working with us?</p><h2 className="text-xl font-semibold">Keep everything connected.</h2></div><div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/dashboard"><Briefcase />Your workspace</Link></Button><Button asChild variant="outline"><Link to="/events/my-tickets"><Ticket />My tickets</Link></Button><Button asChild variant="outline"><Link to="/verify"><ShieldCheck />Verify a document</Link></Button></div></div>
      </section>

      {/* Brief tips + FAQ */}
      <section className="border-y border-border py-12 sm:py-20">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="mb-4 text-sm text-primary">A useful starting point</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Bring the idea. And a little context.</h2>
            <ol className="mt-8 space-y-6">
              {[
                { title: 'Your goal & audience', text: 'What are you building, who will use it, and what should become easier for them?' },
                { title: 'The starting point', text: 'Your existing website or product link, key requirements and references.' },
                { title: 'Priorities & timing', text: 'Preferred timing, budget range and must-have features — fine if still taking shape.' },
              ].map(item => <li key={item.title} className="flex gap-4"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" /><div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-sm leading-7 text-muted-foreground">{item.text}</p></div></li>)}
            </ol>
          </div>
          <div className="min-w-0">
            <p className="mb-4 text-sm text-primary">Before we talk</p>
            <h2 className="mb-4 text-3xl font-semibold sm:text-4xl">A few good questions.</h2>
            <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="start"><AccordionTrigger>What should I include in a project enquiry?</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">Your goals, key requirements, preferred timeline and budget help us understand the project. If you have an existing product, include its link and what you’d like to change.</AccordionContent></AccordionItem>
          <AccordionItem value="manager"><AccordionTrigger>Can I choose a project manager?</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">Yes. Explore the available project managers and choose one as part of your project request.<Link to="/choose-manager" className="ml-2 text-primary underline">Explore managers</Link></AccordionContent></AccordionItem>
          <AccordionItem value="support"><AccordionTrigger>Where do I ask about an existing project?</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">Contact your project manager through your dashboard, or email support@thrylosindia.in with your project reference. Never include passwords or payment credentials.</AccordionContent></AccordionItem>
          <AccordionItem value="pricing"><AccordionTrigger>Where can I see service pricing and inclusions?</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">The service catalogue lists the saved descriptions, included features and pricing for each available service. Discuss your particular requirements with your project manager.<Link to="/services" className="ml-2 text-primary underline">See services</Link></AccordionContent></AccordionItem>
          <AccordionItem value="events"><AccordionTrigger>Who do I contact about an event or ticket?</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">Open the event page for its registration details, or check My Tickets using the account you registered with. For help, send support your event name and saved registration reference. Do not share payment credentials.<Link to="/events/my-tickets" className="ml-2 text-primary underline">My Tickets</Link></AccordionContent></AccordionItem>
          <AccordionItem value="partnership"><AccordionTrigger>Can I get in touch about a collaboration?</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">Yes. Describe your organisation, the idea and what you’d like to explore in the enquiry form, or email founder@thrylosindia.in.</AccordionContent></AccordionItem>
          <AccordionItem value="privacy"><AccordionTrigger>What information should I avoid sending?</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">Never include passwords, authenticator codes, card details or private identity documents. Start with a summary of your question and relevant project references.</AccordionContent></AccordionItem>
        </Accordion>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-12 sm:py-16">
        <div className="container mx-auto px-4 grid gap-10 md:grid-cols-2 md:divide-x md:divide-border">
          <div><p className="text-sm text-primary mb-3">Careers at THRYLOS</p><h2 className="text-2xl font-semibold">Bring your craft to the team.</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Explore opportunities on our dedicated careers website.</p><Button asChild variant="link" className="px-0 mt-4"><Link to="/careers">Explore Careers<ArrowUpRight /></Link></Button></div>
          <div className="md:pl-10"><p className="text-sm text-primary mb-3">Get to know our work</p><h2 className="text-2xl font-semibold">See what we build.</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Explore our projects and find the service that fits your next idea.</p><div className="flex flex-wrap gap-6 mt-4"><Button asChild variant="link" className="px-0"><Link to="/portfolio">Our portfolio<ArrowUpRight /></Link></Button><Button asChild variant="link" className="px-0"><Link to="/services">Our services<ArrowUpRight /></Link></Button></div></div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Contact;
