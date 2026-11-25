export interface BlogLink {
  label: string;
  url: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
  author_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at?: string | null;
  category: string | null;
  subtopic: string | null;
  highlights: string[] | null;
  links: BlogLink[] | null;
  seo_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  read_time_label: string | null;
  typed_words?: number | null;
}

export interface EditorSnapshot {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string;
  author_name: string;
  author_image_url: string;
  is_published: boolean;
  category: string;
  subtopic: string;
  highlights: string[];
  links: BlogLink[];
  seo_title: string;
  meta_description: string;
  canonical_url: string;
  read_time_label: string;
}

export const emptySnapshot: EditorSnapshot = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  cover_image_url: "",
  author_name: "THRYLOS Team",
  author_image_url: "",
  is_published: false,
  category: "General",
  subtopic: "",
  highlights: [],
  links: [],
  seo_title: "",
  meta_description: "",
  canonical_url: "",
  read_time_label: "",
};

export type AutosaveStatus = "idle" | "saving" | "saved" | "offline" | "error" | "local";
