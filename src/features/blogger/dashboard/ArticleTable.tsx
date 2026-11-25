import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Edit3, Trash2, Loader2, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BlogPost } from "../types";

interface Props {
  posts: BlogPost[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void | Promise<void>;
}

const ArticleTableInner = ({ posts, loading, onEdit, onDelete }: Props) => {
  const [confirm, setConfirm] = useState<BlogPost | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-12 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/30 p-12 text-center">
        <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium">No articles yet</p>
        <p className="text-sm text-muted-foreground">Click “New article” to start writing.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      <div className="hidden md:grid grid-cols-[80px_1fr_120px_140px_140px_120px] gap-3 px-4 py-3 border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
        <span>Cover</span><span>Title</span><span>Status</span><span>Category</span><span>Updated</span><span className="text-right">Actions</span>
      </div>
      <ul className="divide-y divide-border/60">
        {posts.map((p, i) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.02 }}
            className="grid grid-cols-[64px_1fr_auto] md:grid-cols-[80px_1fr_120px_140px_140px_120px] gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors"
          >
            <div className="w-16 md:w-20 aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {p.cover_image_url
                ? <img src={p.cover_image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                : <FileText className="w-4 h-4 text-muted-foreground" />}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{p.title || "Untitled"}</p>
              <p className="text-xs text-muted-foreground truncate">{p.excerpt ?? p.slug}</p>
            </div>
            <div className="hidden md:block">
              <Badge variant={p.is_published ? "default" : "secondary"} className="text-[10px]">
                {p.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
            <div className="hidden md:block text-sm text-muted-foreground truncate">{p.category ?? "—"}</div>
            <div className="hidden md:block text-xs text-muted-foreground">
              {new Date(p.updated_at ?? p.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center justify-end gap-1">
              {p.is_published && (
                <Button asChild size="icon" variant="ghost" aria-label="View live">
                  <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => onEdit(p.id)} aria-label="Edit">
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setConfirm(p)} aria-label="Delete">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </motion.li>
        ))}
      </ul>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this article?</AlertDialogTitle>
            <AlertDialogDescription>
              “{confirm?.title}” will be permanently removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => { if (confirm) await onDelete(confirm.id); setConfirm(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const ArticleTable = memo(ArticleTableInner);
