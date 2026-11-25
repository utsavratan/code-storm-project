import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, Clock, ExternalLink, Share2, Sparkles, Tag, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import SEO from '@/components/seo/SEO';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RichContent } from '@/components/blog/RichContent';

interface BlogLink { label: string; url: string }
interface BlogPost {
  id: string; title: string; slug: string; content: string;
  excerpt: string | null; cover_image_url: string | null;
  author_name: string; published_at: string | null; created_at: string;
  category?: string | null; subtopic?: string | null;
  highlights?: string[] | null; links?: BlogLink[] | null;
  seo_title?: string | null; meta_description?: string | null;
  canonical_url?: string | null; author_image_url?: string | null;
  read_time_label?: string | null;
}

const readTime = (content: string) => Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

const AuthorAvatar = ({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) => {
  const [failed, setFailed] = useState(false);
  // Normalize Google profile URLs: strip size suffix (=s96-c) so we can request a crisp size,
  // and force https. Falls back to initials on load error / missing src.
  const normalized = (() => {
    if (!src) return "";
    let u = src.trim();
    if (u.startsWith("//")) u = "https:" + u;
    if (/googleusercontent\.com\//.test(u)) u = u.replace(/=s\d+(-c)?$/i, "") + `=s${size * 2}-c`;
    return u;
  })();
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const style = { width: size, height: size } as const;
  if (!normalized || failed) {
    return (
      <span
        aria-label={name}
        style={style}
        className="inline-flex items-center justify-center rounded-full bg-primary/15 text-primary font-semibold ring-1 ring-border/60"
      >
        {initial}
      </span>
    );
  }
  return (
    <img
      src={normalized}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
      style={style}
      className="rounded-full object-cover ring-1 ring-border/60 bg-muted"
    />
  );
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setNotFound(false);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setPost(data as unknown as BlogPost);
      window.scrollTo({ top: 0 });

      // Fetch related (same category, exclude self, 3 max)
      const { data: rel } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .neq('slug', slug)
        .order('published_at', { ascending: false })
        .limit(3);
      if (!cancelled) setRelated((rel as unknown as BlogPost[]) || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const sharePost = async () => {
    if (!post) return;
    const url = `${window.location.origin}/blog/${post.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, text: post.excerpt || '', url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied ✅' });
    }
  };

  if (loading) {
    return <MainLayout><div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></MainLayout>;
  }
  if (notFound || !post) {
    return (
      <MainLayout>
        <SEO path={`/blog/${slug}`} title="Post not found — THRYLOS Blog" description="This blog post could not be found." />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold mb-3">Post not found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been unpublished.</p>
          <Button onClick={() => navigate('/blog')}><ArrowLeft className="w-4 h-4 mr-2" />Back to blog</Button>
        </div>
      </MainLayout>
    );
  }

  const links = Array.isArray(post.links) ? post.links : [];
  const highlights = Array.isArray(post.highlights) ? post.highlights : [];
  const dateISO = new Date(post.published_at || post.created_at).toISOString();
  const dateStr = new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const canonicalPath = `/blog/${post.slug}`;
  const absUrl = `https://thrylosindia.in${canonicalPath}`;
  const seoTitle = post.seo_title || post.title;
  const seoDesc = post.meta_description || post.excerpt || `${post.title} — THRYLOS INDIA blog.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: seoDesc,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: dateISO,
    dateModified: dateISO,
    author: { '@type': 'Person', name: post.author_name },
    publisher: {
      '@type': 'Organization',
      name: 'THRYLOS INDIA',
      logo: { '@type': 'ImageObject', url: 'https://thrylosindia.in/thrylosindia.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absUrl },
    articleSection: post.category || undefined,
    keywords: [post.category, post.subtopic].filter(Boolean).join(', '),
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thrylosindia.in/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://thrylosindia.in/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: absUrl },
    ],
  };

  return (
    <MainLayout>
      <SEO
        path={canonicalPath}
        title={seoTitle}
        description={seoDesc.slice(0, 160)}
        image={post.cover_image_url || undefined}
        type="article"
        jsonLd={[jsonLd, breadcrumb]}
      />
      <article className="relative">
        {/* Hero */}
        <div className="relative">
          {post.cover_image_url ? (
            <div className="relative h-[42vh] sm:h-[60vh] overflow-hidden">
              <motion.img
                initial={{ scale: 1.08, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2 }}
                src={post.cover_image_url}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background" />
            </div>
          ) : (
            <div className="h-24" />
          )}
          <div className="container mx-auto px-4 -mt-24 sm:-mt-40 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
              <Button variant="ghost" size="sm" onClick={() => navigate('/blog')} className="mb-5 -ml-3">
                <ArrowLeft className="w-4 h-4 mr-2" />Back to Blog
              </Button>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {post.category && <Badge className="bg-primary/15 border-primary/30 text-primary"><Tag className="w-3 h-3 mr-1" />{post.category}</Badge>}
                {post.subtopic && <Badge variant="outline">{post.subtopic}</Badge>}
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-tight mb-5 tracking-tight">{post.title}</h1>
              {post.excerpt && <p className="text-lg sm:text-xl text-foreground/75 leading-relaxed mb-6">{post.excerpt}</p>}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t border-border/60 pt-5">
                <span className="flex items-center gap-2">
                  <AuthorAvatar name={post.author_name} src={post.author_image_url} size={28} />
                  <span className="text-foreground/90 font-medium">{post.author_name}</span>
                </span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{dateStr}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{post.read_time_label || `${readTime(post.content)} min read`}</span>
                <Button variant="ghost" size="sm" onClick={sharePost} className="ml-auto h-8">
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />Share
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-4 py-10 sm:py-16">
          <div className="grid lg:grid-cols-[1fr_320px] gap-10 max-w-6xl mx-auto">
            <div className="min-w-0">
              {highlights.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent p-6 mb-10">
                  <h3 className="flex items-center gap-2 font-semibold mb-4 text-base"><Sparkles className="w-4 h-4 text-primary" />Highlights</h3>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {highlights.map((h, i) => (
                      <li key={i} className="flex gap-2 text-sm"><span className="mt-1 text-primary font-bold">→</span><span className="text-foreground/85">{h}</span></li>
                    ))}
                  </ul>
                </motion.div>
              )}

              <RichContent content={post.content} />

              {links.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 pt-8 border-t border-border">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg"><ExternalLink className="w-4 h-4" />Resources & Links</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {links.map((l, i) => (
                      <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-3 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all">
                        <span className="text-sm font-medium truncate">{l.label}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 self-start space-y-6">
              <Card className="glass-card">
                <CardContent className="p-5">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">About the author</h4>
                  <div className="flex items-center gap-3">
                    <AuthorAvatar name={post.author_name} src={post.author_image_url} size={48} />
                    <div className="min-w-0">
                      <p className="font-semibold text-base truncate">{post.author_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">THRYLOS INDIA · Editorial</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/60 text-xs text-muted-foreground space-y-1">
                    <p>Published {dateStr}</p>
                    <p>{post.read_time_label || `${readTime(post.content)} min read`}</p>
                  </div>
                </CardContent>
              </Card>

              {related.length > 0 && (
                <Card className="glass-card">
                  <CardContent className="p-5">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Continue reading</h4>
                    <div className="space-y-3">
                      {related.map(p => (
                        <Link key={p.id} to={`/blog/${p.slug}`} className="block group">
                          <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{p.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{p.read_time_label || `${readTime(p.content)} min read`}</p>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </article>
    </MainLayout>
  );
};

export default BlogPostPage;
