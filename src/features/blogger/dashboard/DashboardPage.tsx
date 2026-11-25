import { memo, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2, LogOut, Plus, Newspaper, ExternalLink, Edit, Trash2, Eye, EyeOff,
  LayoutDashboard, CheckCircle2, Clock3, CalendarDays, PenLine, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useBloggerAuth, bloggerSignOut } from "../useAuthGuard";
import { fetchPosts, deletePost } from "../api";
import { bloggerApi } from "@/lib/bloggerAuth";
import type { BlogPost } from "../types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const StatCard = ({
  icon, label, value, helper, tone = "default", compact = false,
}: {
  icon: React.ReactNode; label: string; value: React.ReactNode; helper: string;
  tone?: "default" | "success" | "warning"; compact?: boolean;
}) => {
  const toneClass =
    tone === "success" ? "border-emerald-500/20 bg-emerald-500/[0.045] text-emerald-500"
    : tone === "warning" ? "border-amber-500/20 bg-amber-500/[0.045] text-amber-500"
    : "border-primary/15 bg-primary/[0.035] text-primary";
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className={`${compact ? "text-xl" : "text-2xl"} mt-2 font-black tracking-tight text-foreground`}>{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${toneClass}`}>{icon}</div>
      </div>
      <p className="mt-2 line-clamp-1 text-[10px] text-muted-foreground">{helper}</p>
    </div>
  );
};

const DashboardPageInner = () => {
  const auth = useBloggerAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const ready = auth.stage === "ready";

  useEffect(() => {
    if (!auth.ready) return;
    if (auth.stage === "signed_out") navigate("/blogger-admin/login", { replace: true });
    else if (auth.stage === "setup_required") navigate("/blogger-admin/mfa/setup", { replace: true });
    else if (auth.stage === "verify_required") navigate("/blogger-admin/mfa/verify", { replace: true });
  }, [auth.ready, auth.stage, navigate]);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blogger-posts"],
    queryFn: fetchPosts,
    enabled: ready,
  });
  const list: BlogPost[] = Array.isArray(posts) ? posts : [];

  const { publishedCount, draftCount, latestPost, latestEditPost } = useMemo(() => {
    const published = list.filter((p) => p.is_published).length;
    const latest = [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    const latestEdit = [...list].sort(
      (a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime()
    )[0];
    return {
      publishedCount: published,
      draftCount: list.length - published,
      latestPost: latest,
      latestEditPost: latestEdit,
    };
  }, [list]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deletePost(id);
      toast({ title: "Post deleted" });
      qc.invalidateQueries({ queryKey: ["blogger-posts"] });
    } catch (e) {
      toast({ title: "Delete failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      await bloggerApi("update", {
        id: post.id,
        data: {
          is_published: !post.is_published,
          published_at: !post.is_published ? new Date().toISOString() : null,
        },
      });
      toast({ title: post.is_published ? "Unpublished" : "Published" });
      qc.invalidateQueries({ queryKey: ["blogger-posts"] });
    } catch (e) {
      toast({ title: "Action failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    await bloggerSignOut();
    toast({ title: "Signed out" });
    navigate("/blogger-admin/login", { replace: true });
  };

  if (!auth.ready || !ready) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.09] blur-3xl" />
        <div className="absolute right-0 top-[30%] h-[380px] w-[380px] translate-x-1/2 rounded-full bg-primary/[0.05] blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
              <Newspaper className="h-[18px] w-[18px]" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight sm:text-base">Thrylos Publishing Studio</h1>
              <p className="mt-0.5 hidden text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground sm:block">
                Editorial & Content Operations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1.5 text-[10px] font-bold text-emerald-500 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {auth.email}
            </div>
            <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <LayoutDashboard className="h-3.5 w-3.5" /> Content dashboard
            </div>
            <h2 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Publishing workspace</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage articles, drafts, publishing status and editorial metadata from one focused workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-xl px-4"
              onClick={() => window.open("/blogger-admin/new", "_blank", "noopener")}
            >
              <ExternalLink className="mr-2 h-4 w-4" /> Open in new tab
            </Button>
            <Button
              className="h-11 rounded-xl px-5 font-bold shadow-lg shadow-primary/10"
              onClick={() => navigate("/blogger-admin/new")}
            >
              <Plus className="mr-2 h-4 w-4" /> New article
            </Button>
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Newspaper className="h-4 w-4" />} label="Total articles" value={list.length} helper="All editorial records" />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Published" value={publishedCount} helper="Currently public" tone="success" />
          <StatCard icon={<Clock3 className="h-4 w-4" />} label="Drafts" value={draftCount} helper="Awaiting publication" tone="warning" />
          <StatCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Last edit"
            value={latestEditPost
              ? new Date(latestEditPost.updated_at ?? latestEditPost.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
              : "—"}
            helper={latestEditPost ? latestEditPost.title : "No edits yet"}
            compact
          />
        </section>

        <section className="mt-7 overflow-hidden rounded-[24px] border border-border/60 bg-card/65 shadow-[0_25px_70px_-50px_rgba(0,0,0,0.5)] backdrop-blur">
          <div className="flex flex-col gap-4 border-b border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">Content library</p>
              <h3 className="mt-1 text-lg font-black tracking-tight">Articles & drafts</h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="rounded-full border border-border bg-background/60 px-2.5 py-1">{list.length} records</span>
              <span className="rounded-full border border-border bg-background/60 px-2.5 py-1">{publishedCount} live</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading articles…</p>
            </div>
          ) : list.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <PenLine className="h-6 w-6" />
              </div>
              <h4 className="mt-4 font-black">Your editorial library is empty</h4>
              <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                Create the first article and it will appear here with its publishing status and management controls.
              </p>
              <Button className="mt-5 h-10 rounded-xl" onClick={() => navigate("/blogger-admin/new")}>
                <Plus className="mr-2 h-4 w-4" /> Create first article
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {list.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.025, 0.2) }}
                  className={`group p-4 transition-colors hover:bg-muted/[0.12] sm:p-5 ${!post.is_published ? "bg-muted/[0.04]" : ""}`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted/30 md:h-[92px] md:w-[148px]">
                      {post.cover_image_url ? (
                        <img src={post.cover_image_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Newspaper className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                      )}
                      <span className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[9px] font-bold backdrop-blur ${post.is_published ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-500" : "border-amber-500/30 bg-amber-500/15 text-amber-500"}`}>
                        {post.is_published ? "LIVE" : "DRAFT"}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.category && (
                          <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                            {post.category}
                          </Badge>
                        )}
                        {post.subtopic && <span className="text-[10px] text-muted-foreground">{post.subtopic}</span>}
                      </div>
                      <h4 className="mt-2 line-clamp-1 text-base font-black tracking-tight transition-colors group-hover:text-primary">
                        {post.title || "Untitled"}
                      </h4>
                      <p className="mt-1 line-clamp-2 max-w-3xl text-xs leading-5 text-muted-foreground">
                        {post.excerpt || post.content.substring(0, 170)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                        <span>{post.author_name}</span>
                        <span>•</span>
                        <span>
                          {new Date(post.updated_at ?? post.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </span>
                        {post.read_time_label && (<><span>•</span><span>{post.read_time_label}</span></>)}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 border-t border-border/50 pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                      <Button
                        size="sm"
                        variant={post.is_published ? "outline" : "default"}
                        className="h-9 rounded-lg px-3 text-[11px] font-semibold"
                        onClick={() => togglePublish(post)}
                      >
                        {post.is_published ? (<><EyeOff className="mr-1.5 h-3.5 w-3.5" /> Unpublish</>) : (<><Eye className="mr-1.5 h-3.5 w-3.5" /> Publish</>)}
                      </Button>
                      {post.is_published && (
                        <Button
                          size="icon" variant="ghost" className="h-9 w-9 rounded-lg"
                          title="View live"
                          onClick={() => window.open(`/blog/${post.slug}`, "_blank", "noopener")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon" variant="ghost" className="h-9 w-9 rounded-lg"
                        title="Edit article"
                        onClick={() => navigate(`/blogger-admin/edit/${post.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Delete"
                        onClick={() => handleDelete(post.id, post.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 py-7 text-[10px] text-muted-foreground sm:flex-row">
          <p>Thrylos India · Publishing Studio</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" /> Restricted editorial environment
          </p>
        </footer>
      </main>
    </div>
  );
};

export const DashboardPage = memo(DashboardPageInner);
