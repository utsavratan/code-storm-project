import { memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublishPanel } from "./panels/PublishPanel";
import { SeoPanel } from "./panels/SeoPanel";
import { CoverPanel } from "./panels/CoverPanel";
import { MetaPanel } from "./panels/MetaPanel";
import type { BlogLink } from "../types";

interface Props {
  title: string;
  slug: string; onSlugChange: (v: string) => void;
  seoTitle: string; onSeoTitleChange: (v: string) => void;
  metaDescription: string; onMetaDescriptionChange: (v: string) => void;
  canonical: string; onCanonicalChange: (v: string) => void;

  isPublished: boolean; onPublishedChange: (v: boolean) => void;
  category: string; onCategoryChange: (v: string) => void;
  subtopic: string; onSubtopicChange: (v: string) => void;
  authorName: string; onAuthorNameChange: (v: string) => void;
  authorImage: string; onAuthorImageChange: (v: string) => void;
  excerpt: string; onExcerptChange: (v: string) => void;
  highlights: string[]; onHighlightsChange: (v: string[]) => void;

  cover: string; onCoverChange: (v: string) => void;

  readTimeLabel: string; onReadTimeChange: (v: string) => void;
  autoReadMinutes: number;
  links: BlogLink[]; onLinksChange: (v: BlogLink[]) => void;
}

const PublishingSidebarInner = (p: Props) => {
  return (
    <div className="h-full overflow-y-auto border-l border-border/60 bg-background/60">
      <Tabs defaultValue="publish" className="w-full">
        <TabsList className="w-full rounded-none border-b border-border/60 bg-transparent px-2 h-11">
          <TabsTrigger value="publish" className="flex-1">Publish</TabsTrigger>
          <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
          <TabsTrigger value="cover" className="flex-1">Cover</TabsTrigger>
          <TabsTrigger value="meta" className="flex-1">Meta</TabsTrigger>
        </TabsList>

        <div className="p-4 sm:p-5">
          <TabsContent value="publish" className="mt-0">
            <PublishPanel
              isPublished={p.isPublished} onPublishedChange={p.onPublishedChange}
              category={p.category} onCategoryChange={p.onCategoryChange}
              subtopic={p.subtopic} onSubtopicChange={p.onSubtopicChange}
              authorName={p.authorName} onAuthorNameChange={p.onAuthorNameChange}
              authorImage={p.authorImage} onAuthorImageChange={p.onAuthorImageChange}
              excerpt={p.excerpt} onExcerptChange={p.onExcerptChange}
              highlights={p.highlights} onHighlightsChange={p.onHighlightsChange}
            />
          </TabsContent>
          <TabsContent value="seo" className="mt-0">
            <SeoPanel
              title={p.title}
              slug={p.slug} onSlugChange={p.onSlugChange}
              seoTitle={p.seoTitle} onSeoTitleChange={p.onSeoTitleChange}
              metaDescription={p.metaDescription} onMetaDescriptionChange={p.onMetaDescriptionChange}
              canonical={p.canonical} onCanonicalChange={p.onCanonicalChange}
            />
          </TabsContent>
          <TabsContent value="cover" className="mt-0">
            <CoverPanel url={p.cover} onChange={p.onCoverChange} />
          </TabsContent>
          <TabsContent value="meta" className="mt-0">
            <MetaPanel
              readTimeLabel={p.readTimeLabel} onReadTimeChange={p.onReadTimeChange}
              autoReadMinutes={p.autoReadMinutes}
              links={p.links} onLinksChange={p.onLinksChange}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export const PublishingSidebar = memo(PublishingSidebarInner);
