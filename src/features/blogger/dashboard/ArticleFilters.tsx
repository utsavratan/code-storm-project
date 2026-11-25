import { memo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ArticleFilterState {
  query: string;
  status: "all" | "published" | "draft";
  category: string;
  sort: "recent" | "oldest" | "title";
}

interface Props {
  filters: ArticleFilterState;
  onChange: (next: ArticleFilterState) => void;
  categories: string[];
}

const ArticleFiltersInner = ({ filters, onChange, categories }: Props) => {
  const set = <K extends keyof ArticleFilterState>(k: K, v: ArticleFilterState[K]) =>
    onChange({ ...filters, [k]: v });

  return (
    <div className="rounded-xl border border-border bg-card/50 backdrop-blur p-3 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => set("query", e.target.value)}
          placeholder="Search title, excerpt, slug…"
          className="pl-9"
          aria-label="Search articles"
        />
      </div>
      <Select value={filters.status} onValueChange={(v) => set("status", v as ArticleFilterState["status"])}>
        <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="draft">Drafts</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.category} onValueChange={(v) => set("category", v)}>
        <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.sort} onValueChange={(v) => set("sort", v as ArticleFilterState["sort"])}>
        <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most recent</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
          <SelectItem value="title">Title (A–Z)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export const ArticleFilters = memo(ArticleFiltersInner);
