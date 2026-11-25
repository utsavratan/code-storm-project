import { memo } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useState } from "react";

interface Props {
  isPublished: boolean;
  onPublishedChange: (v: boolean) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  subtopic: string;
  onSubtopicChange: (v: string) => void;
  authorName: string;
  onAuthorNameChange: (v: string) => void;
  authorImage: string;
  onAuthorImageChange: (v: string) => void;
  excerpt: string;
  onExcerptChange: (v: string) => void;
  highlights: string[];
  onHighlightsChange: (v: string[]) => void;
}

const PublishPanelInner = ({
  isPublished, onPublishedChange, category, onCategoryChange, subtopic, onSubtopicChange,
  authorName, onAuthorNameChange, authorImage, onAuthorImageChange,
  excerpt, onExcerptChange, highlights, onHighlightsChange,
}: Props) => {
  const [hi, setHi] = useState("");
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
        <div>
          <p className="text-sm font-medium">Published</p>
          <p className="text-xs text-muted-foreground">Visible on /blog when enabled</p>
        </div>
        <Switch checked={isPublished} onCheckedChange={onPublishedChange} />
      </div>

      <Field label="Category">
        <Input value={category} onChange={(e) => onCategoryChange(e.target.value)} placeholder="General" />
      </Field>
      <Field label="Subtopic">
        <Input value={subtopic} onChange={(e) => onSubtopicChange(e.target.value)} placeholder="Optional" />
      </Field>

      <Field label="Excerpt" hint="Shown on cards and previews">
        <Textarea value={excerpt} onChange={(e) => onExcerptChange(e.target.value)} rows={3} placeholder="One or two sentence summary…" />
      </Field>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Author</Label>
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-3">
          {authorImage ? (
            <img src={authorImage} alt={authorName || "Author"} className="w-10 h-10 rounded-full object-cover ring-1 ring-border/60" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
              {(authorName || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{authorName || "Signed-in author"}</p>
            <p className="text-[11px] text-muted-foreground">From your Google account</p>
          </div>
        </div>
        {/* Kept for API compatibility — values come from Google, no manual entry */}
        <input type="hidden" value={authorName} readOnly onChange={() => onAuthorNameChange(authorName)} />
        <input type="hidden" value={authorImage} readOnly onChange={() => onAuthorImageChange(authorImage)} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Highlights</Label>
        <div className="flex gap-2">
          <Input value={hi} onChange={(e) => setHi(e.target.value)} placeholder="Add key takeaway" />
          <Button
            type="button" size="icon" variant="secondary"
            onClick={() => { if (hi.trim()) { onHighlightsChange([...highlights, hi.trim()]); setHi(""); } }}
            aria-label="Add highlight"
          ><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {highlights.map((h, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pl-2 pr-1">
              {h}
              <button
                type="button"
                className="rounded hover:bg-background/50 p-0.5"
                onClick={() => onHighlightsChange(highlights.filter((_, j) => j !== i))}
                aria-label={`Remove ${h}`}
              ><X className="w-3 h-3" /></button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

export const PublishPanel = memo(PublishPanelInner);
