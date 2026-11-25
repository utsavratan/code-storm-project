import { memo } from "react";
import { RichContent } from "@/components/blog/RichContent";

interface Props { content: string; title: string; cover?: string | null; }

const PreviewPanelInner = ({ content, title, cover }: Props) => {
  return (
    <div className="h-full overflow-y-auto bg-background/60">
      <article className="max-w-3xl mx-auto px-6 sm:px-10 py-10">
        {cover && (
          <img
            src={cover}
            alt=""
            className="w-full aspect-video object-cover rounded-2xl border border-border mb-8"
            loading="lazy"
          />
        )}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
          {title || <span className="text-muted-foreground">Untitled article</span>}
        </h1>
        {content.trim()
          ? <RichContent content={content} animated={false} />
          : <p className="text-muted-foreground italic">Preview updates as you write.</p>}
      </article>
    </div>
  );
};

export const PreviewPanel = memo(PreviewPanelInner);
