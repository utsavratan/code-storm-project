import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBloggerAuth } from "../useAuthGuard";
import { fetchPosts, createPost, updatePost, slugify } from "../api";
import { readDraft, clearDraft, useAutosave } from "../useAutosave";
import { countProseWords, readingMinutes } from "../markdown";
import type { BlogPost, EditorSnapshot } from "../types";
import { emptySnapshot } from "../types";
import { EditorHeader } from "./EditorHeader";
import { EditorToolbar } from "./EditorToolbar";
import { TitleInput } from "./TitleInput";
import { MarkdownEditor, type MarkdownEditorHandle } from "./MarkdownEditor";
import { PreviewPanel } from "./PreviewPanel";
import { StatusBar } from "./StatusBar";
import { PublishingSidebar } from "./PublishingSidebar";
import { CommandPalette, type PaletteAction } from "./CommandPalette";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

const MIN_WORDS = 1200;

const EditorPageInner = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = useBloggerAuth();

  // --- separate state slices — sidebar edits do NOT rerender editor content ---
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [cover, setCover] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorImage, setAuthorImage] = useState("");
  const [category, setCategory] = useState("General");
  const [subtopic, setSubtopic] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [links, setLinks] = useState<EditorSnapshot["links"]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonical, setCanonical] = useState("");
  const [readTimeLabel, setReadTimeLabel] = useState("");

  const [currentId, setCurrentId] = useState<string | undefined>(id);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"write" | "split" | "preview">("split");
  const [palette, setPalette] = useState(false);
  const [line, setLine] = useState(1);
  const [col, setCol] = useState(1);

  const editorRef = useRef<MarkdownEditorHandle>(null);
  const initialLoadedRef = useRef(false);
  const userTouchedSlug = useRef(false);

  const applySnapshot = useCallback((s: EditorSnapshot) => {
    setTitle(s.title); setSlug(s.slug); setContent(s.content); setExcerpt(s.excerpt);
    setCover(s.cover_image_url); setAuthorName(s.author_name); setAuthorImage(s.author_image_url);
    setCategory(s.category); setSubtopic(s.subtopic); setIsPublished(s.is_published);
    setHighlights(s.highlights); setLinks(s.links);
    setSeoTitle(s.seo_title); setMetaDescription(s.meta_description); setCanonical(s.canonical_url);
    setReadTimeLabel(s.read_time_label);
  }, []);

  const ready = auth.stage === 'ready';

  // Redirect to appropriate auth step when not ready
  useEffect(() => {
    if (!auth.ready) return;
    if (auth.stage === 'signed_out') navigate('/blogger-admin/login', { replace: true });
    else if (auth.stage === 'setup_required') navigate('/blogger-admin/mfa/setup', { replace: true });
    else if (auth.stage === 'verify_required') navigate('/blogger-admin/mfa/verify', { replace: true });
  }, [auth.ready, auth.stage, navigate]);

  // Author identity ALWAYS comes from the signed-in Google account.
  // We hard-override on every load and on auth state change so nothing can
  // persist a stale/edited name or picture into the snapshot.
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const sync = (user: { email?: string | null; user_metadata?: Record<string, unknown> } | null) => {
      if (!alive || !user) return;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const name = (meta.full_name as string) || (meta.name as string) || user.email || "";
      const picture = (meta.avatar_url as string) || (meta.picture as string) || "";
      if (name) setAuthorName(name);
      if (picture) setAuthorImage(picture);
    };
    void supabase.auth.getUser().then(({ data: { user } }) => sync(user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => sync(session?.user ?? null));
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [ready]);

  // Load existing post or local draft (with restore for both /new and /edit/:id)
  useEffect(() => {
    if (!ready || initialLoadedRef.current) return;
    let alive = true;
    const load = async () => {
      if (id) {
        setLoading(true);
        try {
          const posts = await fetchPosts();
          const p = posts.find((x) => x.id === id);
          if (!alive) return;
          if (!p) { toast({ title: "Post not found", variant: "destructive" }); navigate("/blogger-admin"); return; }
          const remoteSnap = postToSnapshot(p);
          const draft = readDraft(id);
          // If a local autosaved draft exists AND its content differs from what's on the server,
          // prefer the draft (it's newer than the last successful publish) and notify the user.
          if (draft && draft.savedAt > 0 && draft.snapshot.content !== remoteSnap.content) {
            applySnapshot(draft.snapshot);
            toast({
              title: "Restored local draft",
              description: `Recovered from ${new Date(draft.savedAt).toLocaleString()}. Save to publish changes.`,
            });
          } else {
            applySnapshot(remoteSnap);
          }
        } catch (e) {
          toast({ title: "Load failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
        } finally { if (alive) setLoading(false); }
      } else {
        const draft = readDraft(undefined);
        if (draft) {
          applySnapshot(draft.snapshot);
          if (draft.savedAt > 0 && (draft.snapshot.title || draft.snapshot.content)) {
            toast({
              title: "Restored unsaved draft",
              description: `Picked up where you left off (${new Date(draft.savedAt).toLocaleString()}).`,
            });
          }
        }
      }
      initialLoadedRef.current = true;
    };
    void load();
    return () => { alive = false; };
  }, [ready, id, applySnapshot, toast, navigate]);


  // Auto-derive slug from title until user edits slug directly
  useEffect(() => {
    if (!userTouchedSlug.current && !currentId) setSlug(slugify(title));
  }, [title, currentId]);

  const snapshot: EditorSnapshot = useMemo(() => ({
    title, slug, content, excerpt, cover_image_url: cover, author_name: authorName,
    author_image_url: authorImage, is_published: isPublished, category, subtopic,
    highlights, links, seo_title: seoTitle, meta_description: metaDescription,
    canonical_url: canonical, read_time_label: readTimeLabel,
  }), [title, slug, content, excerpt, cover, authorName, authorImage, isPublished,
       category, subtopic, highlights, links, seoTitle, metaDescription, canonical, readTimeLabel]);

  const deferredSnapshot = useDeferredValue(snapshot);
  const { status, setStatus, saveNow, lastError } = useAutosave({
    id: currentId,
    snapshot: deferredSnapshot,
    enabled: ready && initialLoadedRef.current,
    onRemoteCreated: (newId) => {
      setCurrentId(newId);
      clearDraft(undefined);
      // silently swap URL — no full navigation
      window.history.replaceState(null, "", `/blogger-admin/edit/${newId}`);
    },
    onRemoteError: (msg) => toast({ title: "Autosave failed", description: msg, variant: "destructive" }),
  });

  const words = useMemo(() => countProseWords(content), [content]);
  const minutes = readingMinutes(words);
  const canPublish = words >= MIN_WORDS && !!title.trim();

  const handleManualSave = useCallback(async () => {
    if (!title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (words < MIN_WORDS) {
      toast({
        title: `Need ${MIN_WORDS - words} more words`,
        description: "Draft is cached locally; publish requires 1,200 words minimum.",
      });
      return;
    }
    setSaving(true);
    try {
      if (currentId) {
        await updatePost(currentId, snapshot);
      } else {
        const created = await createPost(snapshot);
        setCurrentId(created.id);
        clearDraft(undefined);
        window.history.replaceState(null, "", `/blogger-admin/edit/${created.id}`);
      }
      setStatus("saved");
      toast({ title: "Saved" });
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setSaving(false); }
  }, [title, words, currentId, snapshot, toast, setStatus]);

  const togglePublish = useCallback(async () => {
    if (!isPublished && !canPublish) {
      toast({ title: "Not ready to publish", description: `Need ${MIN_WORDS - words} more words.`, variant: "destructive" });
      return;
    }
    const next = !isPublished;
    setIsPublished(next);
    // Persist immediately with new value
    setSaving(true);
    try {
      const nextSnap = { ...snapshot, is_published: next };
      if (currentId) await updatePost(currentId, nextSnap);
      else {
        const created = await createPost(nextSnap);
        setCurrentId(created.id);
        window.history.replaceState(null, "", `/blogger-admin/edit/${created.id}`);
      }
      toast({ title: next ? "Published" : "Unpublished" });
      setStatus("saved");
    } catch (e) {
      setIsPublished(!next);
      toast({ title: "Publish failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setSaving(false); }
  }, [isPublished, canPublish, snapshot, currentId, toast, setStatus, words]);

  // Global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); void handleManualSave(); }
      else if (mod && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); setPalette(true); }
      else if (mod && e.key === "/") { e.preventDefault(); setPreviewMode((m) => m === "split" ? "write" : "split"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleManualSave]);

  const paletteActions: PaletteAction[] = useMemo(() => [
    { id: "save", label: "Save changes", shortcut: "Ctrl+S", run: () => void handleManualSave() },
    { id: "toggle-preview", label: "Toggle preview", shortcut: "Ctrl+/", run: () => setPreviewMode((m) => m === "split" ? "write" : "split") },
    { id: "preview-only", label: "Preview only", run: () => setPreviewMode("preview") },
    { id: "write-only", label: "Write only", run: () => setPreviewMode("write") },
    { id: "publish", label: isPublished ? "Unpublish article" : "Publish article", run: () => void togglePublish() },
    { id: "back", label: "Back to dashboard", run: () => navigate("/blogger-admin") },
    { id: "image", label: "Insert image", run: () => editorRef.current?.openImagePicker() },
    { id: "copy-slug", label: "Copy slug", run: () => navigator.clipboard.writeText(slug).then(() => toast({ title: "Slug copied" })) },
  ], [handleManualSave, isPublished, togglePublish, navigate, slug, toast]);

  // Stable callbacks so MarkdownEditor (React.memo) doesn't rerender when sidebar state changes.
  const handleContentChange = useCallback((next: string) => setContent(next), []);
  const handleSaveShortcut = useCallback(() => void handleManualSave(), [handleManualSave]);
  const handleTogglePreview = useCallback(() => setPreviewMode((m) => (m === "split" ? "write" : "split")), []);
  const handleOpenPalette = useCallback(() => setPalette(true), []);
  const handleCursor = useCallback((l: number, c: number) => { setLine(l); setCol(c); }, []);
  const handleSlugChange = useCallback((v: string) => { userTouchedSlug.current = true; setSlug(v); }, []);
  const applyCommandFromToolbar = useCallback(
    (cmd: Parameters<NonNullable<MarkdownEditorHandle["applyCommand"]>>[0], opts?: { url?: string; label?: string }) =>
      editorRef.current?.applyCommand(cmd, opts),
    [],
  );
  const openImagePicker = useCallback(() => editorRef.current?.openImagePicker(), []);

  if (!auth.ready || !ready || loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }


  const sidebar = (
    <PublishingSidebar
      title={title}
      slug={slug} onSlugChange={handleSlugChange}
      seoTitle={seoTitle} onSeoTitleChange={setSeoTitle}
      metaDescription={metaDescription} onMetaDescriptionChange={setMetaDescription}
      canonical={canonical} onCanonicalChange={setCanonical}
      isPublished={isPublished} onPublishedChange={setIsPublished}
      category={category} onCategoryChange={setCategory}
      subtopic={subtopic} onSubtopicChange={setSubtopic}
      authorName={authorName} onAuthorNameChange={setAuthorName}
      authorImage={authorImage} onAuthorImageChange={setAuthorImage}
      excerpt={excerpt} onExcerptChange={setExcerpt}
      highlights={highlights} onHighlightsChange={setHighlights}
      cover={cover} onCoverChange={setCover}
      readTimeLabel={readTimeLabel} onReadTimeChange={setReadTimeLabel}
      autoReadMinutes={minutes}
      links={links} onLinksChange={setLinks}
    />
  );

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <EditorHeader
        isEditing={!!currentId}
        isPublished={isPublished}
        saving={saving}
        status={status}
        canPublish={canPublish}
        previewMode={previewMode}
        onPreviewMode={setPreviewMode}
        onSave={() => void handleManualSave()}
        onPublishToggle={() => void togglePublish()}
        onOpenPalette={() => setPalette(true)}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] min-h-0">
        <div className="flex flex-col min-h-0 border-r border-border/60">
          <EditorToolbar
            onCommand={applyCommandFromToolbar}
            onInsertImage={openImagePicker}
          />
          <div className="flex-1 min-h-0 grid" style={{
            gridTemplateColumns: previewMode === "split" ? "minmax(0,1fr) minmax(0,1fr)" : "minmax(0,1fr)",
          }}>
            {previewMode !== "preview" && (
              <div className="flex flex-col min-h-0 overflow-y-auto">
                <div className="px-6 sm:px-10 lg:px-16 pt-8">
                  <TitleInput value={title} onChange={setTitle} />
                </div>
                <div className="flex-1 min-h-0">
                  <MarkdownEditor
                    ref={editorRef}
                    value={content}
                    onChange={handleContentChange}
                    onSaveShortcut={handleSaveShortcut}
                    onTogglePreview={handleTogglePreview}
                    onOpenPalette={handleOpenPalette}
                    onCursor={handleCursor}
                  />
                </div>
              </div>
            )}
            {previewMode !== "write" && (
              <div className="min-h-0 border-l border-border/60 hidden md:block">
                <PreviewPanel content={content} title={title} cover={cover} />
              </div>
            )}
          </div>
        </div>

        <aside className="hidden lg:block h-full min-h-0">{sidebar}</aside>

        <div className="lg:hidden fixed bottom-20 right-4 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full shadow-xl gap-2">
                <Settings2 className="w-4 h-4" /> Settings
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-0">
              {sidebar}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <StatusBar
        status={status}
        words={words}
        minutes={minutes}
        line={line}
        col={col}
        minWords={MIN_WORDS}
        onRetry={() => void saveNow()}
        lastError={lastError}
      />
      <CommandPalette open={palette} onOpenChange={setPalette} actions={paletteActions} />
    </div>
  );
};

const postToSnapshot = (p: BlogPost): EditorSnapshot => ({
  ...emptySnapshot,
  title: p.title ?? "",
  slug: p.slug ?? "",
  content: p.content ?? "",
  excerpt: p.excerpt ?? "",
  cover_image_url: p.cover_image_url ?? "",
  author_name: p.author_name ?? "THRYLOS Team",
  author_image_url: p.author_image_url ?? "",
  is_published: !!p.is_published,
  category: p.category ?? "General",
  subtopic: p.subtopic ?? "",
  highlights: Array.isArray(p.highlights) ? p.highlights : [],
  links: Array.isArray(p.links) ? p.links : [],
  seo_title: p.seo_title ?? "",
  meta_description: p.meta_description ?? "",
  canonical_url: p.canonical_url ?? "",
  read_time_label: p.read_time_label ?? "",
});

export const EditorPage = memo(EditorPageInner);
