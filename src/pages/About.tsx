import SEO from '@/components/seo/SEO';
import { useEffect, useState } from 'react';
import { ArrowRight, MapPin, Mail, ArrowUpRight, Code2, Cloud, Shield } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import NewsletterSubscribe from '@/components/NewsletterSubscribe';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import engineeringImage from '@/assets/about-engineering.jpg';
import studioImage from '@/assets/about-studio.jpg';

interface TeamMember { id: string; name: string; role: string; bio: string | null; image_url: string | null; }

const About = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('team_members').select('id, name, role, bio, image_url').eq('is_active', true).order('order_index', { ascending: true });
      if (data) setTeam(data);
    })();
  }, []);

  const fadeUp = (delay = 0) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <MainLayout>
      <SEO
        path="/about"
        title="About THRYLOS INDIA — Full-Stack Software Development Studio"
        description="THRYLOS INDIA is an Indian software studio building web, mobile, AI, cloud and cybersecurity products end-to-end. Meet our team, mission and how we work."
        type="website"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About THRYLOS INDIA",
            url: "https://thrylosindia.in/about",
            description:
              "About THRYLOS INDIA — a full-stack software development studio in India delivering web, mobile, AI, cloud and cybersecurity solutions for startups and enterprises.",
            inLanguage: "en-IN",
            isPartOf: { "@type": "WebSite", name: "THRYLOS INDIA", url: "https://thrylosindia.in" },
            about: {
              "@type": "Organization",
              name: "THRYLOS INDIA",
              url: "https://thrylosindia.in",
              logo: "https://thrylosindia.in/brand/thrylos-logo.png",
              foundingLocation: { "@type": "Place", name: "New Delhi, India" },
              slogan: "The digital backbone of modern India.",
              knowsAbout: [
                "Web development", "Mobile app development", "Artificial intelligence",
                "Cloud engineering", "DevOps", "Cybersecurity", "UI/UX design",
                "Product engineering", "SaaS development", "Ecommerce development",
              ],
              sameAs: [
                "https://www.linkedin.com/company/thrylosindia",
                "https://twitter.com/thrylosindia",
                "https://www.instagram.com/thrylosindia",
              ],
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://thrylosindia.in/" },
              { "@type": "ListItem", position: 2, name: "About", item: "https://thrylosindia.in/about" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "THRYLOS INDIA",
            url: "https://thrylosindia.in",
            logo: "https://thrylosindia.in/brand/thrylos-logo.png",
            description:
              "Full-stack software development company in India — web, mobile, AI, cloud and cybersecurity services for startups and enterprises.",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: "support@thrylosindia.in",
              availableLanguage: ["English", "Hindi"],
            },
          },
        ]}
      />

      <section className="relative overflow-hidden border-b border-border">
        <img src={engineeringImage} alt="Precision computing components and blue circuit traces" width={1920} height={1024} className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="about-hero-overlay absolute inset-0" />
        <div className="container relative mx-auto px-4 py-16 sm:py-20 lg:py-24">
          <motion.p {...fadeUp()} className="mb-5 text-sm text-primary">Independent thinking. Connected technology.</motion.p>
          <motion.h1 {...fadeUp(.08)} className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">THRYLOS INDIA<span className="mt-4 block text-2xl font-normal leading-snug sm:text-3xl">Ideas become products.<br />Products move businesses forward.</span></motion.h1>
          <motion.p {...fadeUp(.16)} className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">A technology studio based in New Delhi. We bring design, software and project management together to build your next digital product.</motion.p>
          <motion.div {...fadeUp(.24)} className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild><Link to="/get-started">Start a project<ArrowUpRight /></Link></Button>
            <Button size="lg" asChild><Link to="/portfolio">Explore our work<ArrowRight /></Link></Button>
          </motion.div>
          <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />New Delhi, India</p>
        </div>
      </section>

      <section className="border-b border-border py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp()} className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-20">
            <div className="max-w-xl"><p className="mb-5 text-sm text-primary">Inside THRYLOS</p><h2 className="text-3xl font-semibold leading-tight sm:text-5xl">Small details.<br />Bigger possibilities.</h2></div>
            <div className="max-w-lg"><p className="text-lg leading-8 text-foreground">Good software begins with understanding the people behind it.</p><p className="mt-5 leading-8 text-muted-foreground">Based in New Delhi, THRYLOS INDIA brings product design, engineering and project management into one conversation. Whether you’re shaping an idea or improving an existing product, we start with the problem you want to solve.</p></div>
          </motion.div>
          <motion.figure {...fadeUp()} className="mt-12">
            <img src={studioImage} alt="Illustrative workspace showing product design and software interfaces" width={1536} height={1024} loading="lazy" className="aspect-[4/3] w-full rounded-2xl border border-border object-cover transition-transform duration-700 hover:scale-[1.01] sm:aspect-[21/9]" />
            <figcaption className="mt-4 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground"><span>Design, engineering and a shared direction.</span><span>Studio concept · illustrative image</span></figcaption>
          </motion.figure>
        </div>
      </section>

      <section className="bg-card py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp()} className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="mb-5 text-sm text-primary">What brings us together</p><h2 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl">The idea is yours.<br />The craft is connected.</h2></div><Button asChild variant="outline"><Link to="/services">Our expertise<ArrowUpRight /></Link></Button></motion.div>
          {[
            { icon: Code2, title: 'Products people use.', text: 'Websites, web applications and mobile experiences. We connect the interface people see with the engineering that makes it work.', detail: 'Web / Mobile / Product design' },
            { icon: Cloud, title: 'Systems that connect.', text: 'Cloud services, AI integrations and business automation bring your tools and workflows into a more connected product.', detail: 'Cloud / AI / Automation' },
            { icon: Shield, title: 'Foundations that matter.', text: 'Security and project oversight are part of the discussion, alongside your scope, priorities and milestones.', detail: 'Security / Planning / Project management' },
          ].map((item, i) => <motion.div key={item.title} {...fadeUp(i * .06)} className="group relative -mx-4 flex flex-col gap-6 overflow-hidden rounded-2xl border-t border-border px-4 py-9 transition-colors duration-500 hover:bg-primary/5 md:flex-row md:gap-10"><span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-primary transition-transform duration-500 group-hover:scale-y-100" /><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 shadow-[0_0_24px_-8px_hsl(var(--primary)/0.6)] transition-transform duration-500 motion-safe:group-hover:-rotate-6 motion-safe:group-hover:scale-110"><item.icon className="h-7 w-7 text-primary" strokeWidth={1.4} /></span><div className="md:w-2/5"><h3 className="text-2xl font-semibold sm:text-3xl">{item.title}</h3><p className="mt-4 text-xs uppercase tracking-widest text-primary">{item.detail}</p></div><p className="max-w-lg flex-1 leading-8 text-muted-foreground">{item.text}</p></motion.div>)}
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp()} className="flex flex-col gap-12 lg:flex-row lg:gap-20">
            <div className="lg:w-1/2"><p className="mb-5 text-sm text-primary">Working with us</p><h2 className="text-3xl font-semibold leading-tight sm:text-5xl">Less distance.<br />More understanding.</h2><p className="mt-7 max-w-lg text-lg leading-8 text-muted-foreground">Choose your project manager. Keep your goals, conversations and progress connected from the beginning.</p><Button asChild className="mt-8"><Link to="/choose-manager">Meet your project manager<ArrowUpRight /></Link></Button></div>
            <div className="min-w-0 flex-1 divide-y divide-border border-y border-border">
              {[
                { title: 'Begin with the real problem', text: 'Bring your audience, requirements and existing product. Discuss what needs to change before deciding how to build it.' },
                { title: 'Make the scope a shared decision', text: 'Talk through your budget, priorities and timeline with your project manager. The service you choose is the starting point for that conversation.' },
                { title: 'Keep progress in view', text: 'Follow milestones, project requests and payment records in your workspace, rather than losing the context between conversations.' },
                { title: 'Keep the details accountable', text: 'Use your saved project and payment references when you need support. Issued invoices can be checked through our verification page.' },
              ].map(item => <motion.div key={item.title} whileHover={reducedMotion ? undefined : { x: 8 }} className="group relative py-7 pl-6"><span aria-hidden="true" className="absolute left-0 top-9 h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))] transition-transform group-hover:scale-150" /><h3 className="text-xl font-semibold transition-colors group-hover:text-primary">{item.title}</h3><p className="mt-3 leading-7 text-muted-foreground">{item.text}</p></motion.div>)}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-card py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp()}><p className="mb-5 text-sm text-primary">From the studio, into the world</p><h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">Work to explore.<br />Ideas to take further.</h2><p className="mt-6 max-w-2xl leading-8 text-muted-foreground">See our saved projects, discover the thinking behind the work, and join the conversations happening around technology.</p></motion.div>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {[
              { to: '/portfolio', title: 'Work we’ve shipped', text: 'Project imagery, descriptions and the technologies behind the work.' },
              { to: '/blog', title: 'The THRYLOS journal', text: 'Engineering, digital strategy and product perspectives.' },
              { to: '/events', title: 'Events & community', text: 'Published events, registration details and upcoming conversations.' },
            ].map(item => <Link key={item.to} to={item.to} className="group flex items-center justify-between gap-5 py-7 transition-[padding] duration-300 hover:pl-3"><div><h3 className="text-2xl font-semibold transition-colors group-hover:text-primary">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></div><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/40 transition-all duration-300 group-hover:bg-primary/15 group-hover:shadow-[0_0_24px_-6px_hsl(var(--primary)/0.7)]"><ArrowUpRight className="h-5 w-5 text-primary transition-transform group-hover:rotate-45" /></span></Link>)}
          </div>
        </div>
      </section>

      {team.length > 0 && <section className="border-y border-border py-20 sm:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp()} className="mb-12"><p className="mb-5 text-sm text-primary">The people</p><h2 className="text-3xl font-semibold sm:text-5xl">Different perspectives.<br />Shared ownership.</h2></motion.div>
          {team.map((member, i) => <motion.div key={member.id} {...fadeUp(i * .05)} className="flex items-start gap-6 border-t border-border py-8">
            {member.image_url ? <img src={member.image_url} alt={member.name} loading="lazy" className="h-20 w-20 shrink-0 rounded-md object-cover sm:h-28 sm:w-28" /> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted text-2xl text-primary">{member.name[0]}</div>}
            <div><h3 className="text-xl font-semibold sm:text-2xl">{member.name}</h3><p className="mt-2 text-sm text-primary">{member.role}</p>{member.bio && <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{member.bio}</p>}</div>
          </motion.div>)}
        </div>
      </section>}

      <section className="bg-card py-20 sm:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp()}><p className="mb-5 text-sm text-primary">Let’s build something meaningful</p><h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">A new idea.<br />An open conversation.</h2><p className="mt-6 max-w-xl leading-8 text-muted-foreground">Tell us what you have in mind, whether you’re starting fresh or developing an existing product.</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/get-started">Start a project<ArrowUpRight /></Link></Button><Button asChild size="lg" variant="outline"><Link to="/contact">Talk to us<Mail /></Link></Button></div><a href="mailto:support@thrylosindia.in" className="mt-8 inline-block break-all text-sm text-muted-foreground hover:text-primary">support@thrylosindia.in</a></motion.div>
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <NewsletterSubscribe
            source="about"
            title="Get the THRYLOS INDIA newsletter"
            description="Product news, engineering insights and updates from THRYLOS INDIA."
          />
        </div>
      </section>
    </MainLayout>
  );
};

export default About;
