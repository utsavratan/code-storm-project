import { memo, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

interface Props {
  slug: string;
  onSlugChange: (v: string) => void;
  seoTitle: string;
  onSeoTitleChange: (v: string) => void;
  metaDescription: string;
  onMetaDescriptionChange: (v: string) => void;
  canonical: string;
  onCanonicalChange: (v: string) => void;
  title: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const SeoPanelInner = ({
  slug, onSlugChange, seoTitle, onSeoTitleChange,
  metaDescription, onMetaDescriptionChange, canonical, onCanonicalChange, title,
}: Props) => {
  const effectiveTitle = seoTitle || title;
  const titleLen = effectiveTitle.length;
  const descLen = metaDescription.length;

  const score = useMemo(() => {
    let s = 0;
    if (titleLen >= 30 && titleLen <= 60) s += 30; else if (titleLen > 0) s += 12;
    if (descLen >= 120 && descLen <= 160) s += 30; else if (descLen > 0) s += 12;
    if (slug && slug.length <= 60) s += 20;
    if (canonical.startsWith("http")) s += 10;
    if (title) s += 10;
    return clamp(s, 0, 100);
  }, [titleLen, descLen, slug, canonical, title]);

  const scoreTone = score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-destructive";

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">SEO score</Label>
          <span className={`text-xl font-bold ${scoreTone}`}>{score}<span className="text-xs text-muted-foreground">/100</span></span>
        </div>
        <Progress value={score} className="h-2" />
      </div>

      <Field label={`SEO title · ${titleLen}/60`} tone={titleLen > 60 ? "warn" : titleLen >= 30 ? "ok" : "muted"}>
        <Input value={seoTitle} onChange={(e) => onSeoTitleChange(e.target.value)} placeholder={title || "Overrides article title in search"} />
      </Field>

      <Field label={`Meta description · ${descLen}/160`} tone={descLen > 160 ? "warn" : descLen >= 120 ? "ok" : "muted"}>
        <Textarea rows={3} value={metaDescription} onChange={(e) => onMetaDescriptionChange(e.target.value)} placeholder="Summary shown under the title in Google results" />
      </Field>

      <Field label="URL slug">
        <Input value={slug} onChange={(e) => onSlugChange(e.target.value)} placeholder="my-article-slug" />
        <p className="text-[11px] text-muted-foreground truncate">thrylosindia.in/blog/<span className="text-foreground">{slug || "…"}</span></p>
      </Field>

      <Field label="Canonical URL">
        <Input value={canonical} onChange={(e) => onCanonicalChange(e.target.value)} placeholder="https://thrylosindia.in/blog/…" />
      </Field>

      <div className="rounded-lg border border-border/60 p-4 space-y-1.5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Google preview</p>
        <p className="text-[15px] text-sky-400 truncate">{effectiveTitle || "Article title"}</p>
        <p className="text-xs text-emerald-400 truncate">
          thrylosindia.in › blog › {slug || "slug"}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {metaDescription || "Meta description will appear here…"}
        </p>
      </div>
    </div>
  );
};

const Field = ({ label, tone = "muted", children }: { label: string; tone?: "muted" | "ok" | "warn"; children: React.ReactNode }) => {
  const t = tone === "ok" ? "text-emerald-400" : tone === "warn" ? "text-amber-400" : "text-muted-foreground";
  return (
    <div className="space-y-1.5">
      <Label className={`text-xs uppercase tracking-wider ${t}`}>{label}</Label>
      {children}
    </div>
  );
};

export const SeoPanel = memo(SeoPanelInner);
