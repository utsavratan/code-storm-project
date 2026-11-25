import SEO from "@/components/seo/SEO";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Clock, Tag, Rss, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion, useReducedMotion } from "framer-motion";
import journalWorkbench from "@/assets/journal-workbench.jpg";

interface BlogLink {
  label: string;
  url: string;
}
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
  published_at: string | null;
  created_at: string;
  category?: string | null;
  subtopic?: string | null;
  highlights?: string[] | null;
  links?: BlogLink[] | null;
  read_time_label?: string | null;
}

const readTime = (content: string) => Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/* ---------- Skeleton pieces (shown while posts load) ---------- */

const FeaturedSkeleton = () => (
  <div className="mb-14 rounded-lg border border-border bg-card overflow-hidden animate-pulse">
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-0">
      <div className="aspect-[16/10] lg:aspect-auto bg-muted/40" />
      <div className="p-6 sm:p-10 flex flex-col justify-center gap-4">
        <div className="h-5 w-24 rounded-full bg-muted/40" />
        <div className="h-8 w-4/5 rounded bg-muted/40" />
        <div className="h-8 w-3/5 rounded bg-muted/40" />
        <div className="h-4 w-full rounded bg-muted/30" />
        <div className="h-4 w-2/3 rounded bg-muted/30" />
      </div>
    </div>
  </div>
);

const CardSkeleton = () => (
  <div className="rounded-lg border border-border bg-card overflow-hidden animate-pulse">
    <div className="aspect-video bg-muted/40" />
    <div className="p-5 space-y-3">
      <div className="h-3 w-1/2 rounded bg-muted/30" />
      <div className="h-5 w-full rounded bg-muted/40" />
      <div className="h-5 w-2/3 rounded bg-muted/40" />
      <div className="h-3 w-full rounded bg-muted/30" />
    </div>
  </div>
);

const Blog = () => {
  const reducedMotion = useReducedMotion();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeSubtopic, setActiveSubtopic] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [showTopics, setShowTopics] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchPosts = async () => {
      try {
        setError(null);
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("is_published", true)
          .order("published_at", { ascending: false });
        if (error) throw error;
        if (!mounted) return;
        setPosts((data as unknown as BlogPost[]) || []);
      } catch (err: any) {
        console.error("Failed to fetch posts", err);
        if (!mounted) return;
        setError(err?.message || "Failed to load posts");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPosts();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [posts]);

  const subtopics = useMemo(() => {
    const set = new Set<string>();
    posts
      .filter((p) => activeCategory === "All" || p.category === activeCategory)
      .forEach((p) => {
        if (p.subtopic) set.add(p.subtopic);
      });
    return ["All", ...Array.from(set)];
  }, [posts, activeCategory]);

  const filteredPosts = useMemo(
    () =>
      posts
        .filter((p) => activeCategory === "All" || p.category === activeCategory)
        .filter((p) => activeSubtopic === "All" || p.subtopic === activeSubtopic)
        .filter((p) => {
          if (!query.trim()) return true;
          const q = query.trim().toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            (p.excerpt ?? "").toLowerCase().includes(q) ||
            (p.category ?? "").toLowerCase().includes(q) ||
            (p.subtopic ?? "").toLowerCase().includes(q) ||
            p.author_name.toLowerCase().includes(q)
          );
        }),
    [posts, activeCategory, activeSubtopic, query],
  );

  const featured = query.trim() ? undefined : filteredPosts[0];
  const rest = featured ? filteredPosts.slice(1) : filteredPosts;


  const blogSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "THRYLOS INDIA Blog",
      url: "https://thrylosindia.in/blog",
      description:
        "Articles on web, mobile, AI, cloud, cybersecurity and digital strategy from the THRYLOS INDIA team.",
      blogPost: posts.slice(0, 10).map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: `https://thrylosindia.in/blog/${p.slug}`,
        datePublished: new Date(p.published_at || p.created_at).toISOString(),
        author: { "@type": "Person", name: p.author_name },
        ...(p.cover_image_url ? { image: p.cover_image_url } : {}),
      })),
    }),
    [posts],
  );

  return (
    <MainLayout>
      <SEO
        path="/blog"
        title="THRYLOS INDIA Blog — Tech, Product & Business"
        description="Articles on web, mobile, AI, cloud, cybersecurity and digital strategy from the THRYLOS INDIA team."
        jsonLd={blogSchema}
      />

      <section className="relative isolate overflow-hidden border-b border-border">
        <img src={journalWorkbench} alt="An open laptop and engineering tools on a workbench" width={1920} height={1024} className="absolute inset-0 -z-20 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 -z-10 bg-background/70" />
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-6 text-sm text-primary">THRYLOS INDIA / The journal</p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-6xl">THRYLOS Journal</h1>
            <p className="mt-5 text-xl font-medium sm:text-2xl">Technology. With perspective.</p>
            <div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">Ideas, engineering and the decisions behind digital products. Writing from the THRYLOS INDIA team.</p>
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input aria-label="Search articles" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search the journal" className="h-12 border-border bg-card pl-11 pr-12" />
                {query && <Button variant="ghost" size="icon" aria-label="Clear search" className="absolute right-1 top-1 h-10 w-10" onClick={() => setQuery("")}><X /></Button>}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto min-w-0 px-4 py-10 sm:py-14" aria-label="Journal articles">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6"><p className="text-sm font-medium text-muted-foreground">Engineering / Product / Digital strategy</p><Button asChild variant="ghost" size="sm"><a href="#journal-subscribe">Stay in the loop<ArrowRight className="h-4 w-4" /></a></Button></div>
        {categories.length > 1 && <div className="mb-5 flex flex-wrap gap-2" aria-label="Article categories">
          {categories.map(cat => <Button key={cat} variant="ghost" size="sm" aria-pressed={activeCategory === cat} onClick={() => { setActiveCategory(cat); setActiveSubtopic("All"); }} className={`h-auto min-h-9 max-w-full whitespace-normal break-words text-left ${activeCategory === cat ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>{cat}</Button>)}
        </div>}
        {subtopics.length > 1 && <div className="mb-8"><Button variant="ghost" size="sm" aria-expanded={showTopics} aria-controls="journal-topics" onClick={() => setShowTopics(value => !value)}><Tag />{showTopics ? "Hide topics" : activeSubtopic === "All" ? "Browse topics" : "Change topic"}</Button>{showTopics && <div id="journal-topics" className="mt-3 flex max-h-60 flex-wrap gap-2 overflow-y-auto border-y border-border py-4" aria-label="Article topics">{subtopics.map(sub => <Button variant="ghost" size="sm" key={sub} aria-pressed={activeSubtopic === sub} onClick={() => {setActiveSubtopic(sub);setShowTopics(false);}} className={`h-auto min-h-9 max-w-full whitespace-normal break-words text-left ${activeSubtopic === sub ? "bg-muted text-foreground" : "text-muted-foreground"}`}>{sub === "All" ? "All topics" : sub}</Button>)}</div>}</div>}
        {loading ? <><FeaturedSkeleton /><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2].map(i => <CardSkeleton key={i} />)}</div></> : error ? <div className="py-16 text-center"><p className="text-muted-foreground">Articles couldn’t be loaded.</p><Button className="mt-6" onClick={() => window.location.reload()}>Try again</Button></div> : filteredPosts.length === 0 ? <div className="py-20 text-center"><Rss className="mx-auto mb-5 h-8 w-8 text-primary" /><h2 className="text-2xl font-semibold">{posts.length ? "No matching articles" : "The next perspective is on its way."}</h2><p className="mt-3 text-muted-foreground">{posts.length ? "Try another topic or search." : "New writing will appear here when published."}</p>{posts.length > 0 && <Button variant="ghost" className="mt-5" onClick={() => {setQuery("");setActiveCategory("All");setActiveSubtopic("All");}}>Reset filters<X /></Button>}</div> : <>
          {featured && <article className="mb-14 border-b border-border pb-12">
            <Link to={`/blog/${featured.slug}`} className="group grid items-center gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted">
                {featured.cover_image_url ? <img src={featured.cover_image_url} alt={featured.title} className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Tag className="h-16 w-16 text-primary" /></div>}
                <span className="absolute left-4 top-4 rounded-md bg-background px-3 py-2 text-xs text-foreground">Latest perspective</span>
              </div>
              <div className="min-w-0"><p className="mb-4 text-sm text-primary">{featured.category || "From the journal"}</p><h2 className="break-words text-3xl font-semibold leading-tight group-hover:text-primary sm:text-4xl">{featured.title}</h2><p className="mt-5 line-clamp-3 text-base leading-8 text-muted-foreground">{featured.excerpt || featured.content.substring(0,220)}</p><p className="mt-6 text-xs leading-6 text-muted-foreground">{featured.author_name} · {formatDate(featured.published_at || featured.created_at)} · {featured.read_time_label || `${readTime(featured.content)} min read`}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">Read the story<ArrowUpRight className="h-4 w-4" /></span></div>
            </Link>
          </article>}
          {rest.length > 0 && <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl font-semibold">{query || activeCategory !== "All" ? "Selected reading" : "More from the journal"}</h2><p className="text-sm text-muted-foreground" aria-live="polite">{filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}</p></div>}
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{rest.map((post,i) => <motion.article key={post.id} initial={reducedMotion ? false : {opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:Math.min(i*.04,.2)}} className="min-w-0 overflow-hidden border-b border-border pb-6">
            <Link to={`/blog/${post.slug}`} className="group flex h-full flex-col focus-visible:outline focus-visible:outline-primary">
              <div className="aspect-video overflow-hidden bg-muted">{post.cover_image_url ? <img src={post.cover_image_url} alt={post.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Tag className="h-10 w-10 text-primary" /></div>}</div>
              <div className="flex flex-1 flex-col pt-6"><div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">{post.category && <Badge variant="secondary" className="max-w-full whitespace-normal break-words">{post.category}</Badge>}<span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time_label || `${readTime(post.content)} min`}</span></div><h3 className="break-words text-xl font-semibold leading-snug group-hover:text-primary">{post.title}</h3><p className="mb-6 mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">{post.excerpt || post.content.substring(0,160)}</p><div className="mt-auto flex items-center justify-between gap-3 pt-4"><p className="text-xs text-muted-foreground">{post.author_name}<br />{formatDate(post.published_at || post.created_at)}</p><ArrowUpRight className="h-5 w-5 shrink-0 text-primary" /></div></div>
            </Link>
          </motion.article>)}</div>
        </>}
      </section>
      <section className="border-y border-border bg-card py-16 sm:py-24"><div className="container mx-auto px-4"><p className="mb-4 text-sm text-primary">From thinking to building</p><h2 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">Have an idea of your own?</h2><p className="mt-5 max-w-xl leading-8 text-muted-foreground">Let’s talk about the product you have in mind and what it needs to do.</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild><Link to="/contact">Start a conversation<ArrowUpRight /></Link></Button><Button asChild variant="outline"><Link to="/services">Explore services<ArrowRight /></Link></Button></div></div></section>
      <section id="journal-subscribe" className="scroll-mt-24 py-16 sm:py-24"><div className="container mx-auto px-4"><NewsletterSubscribe source="blog" title="A fresh perspective, in your inbox." description="Engineering insights, product thinking and updates from THRYLOS INDIA." /></div></section>
    </MainLayout>
  );
};

export default Blog;
