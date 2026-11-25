import { bloggerApi } from "@/lib/bloggerAuth";
import type { BlogPost, EditorSnapshot } from "./types";

export const fetchPosts = async (): Promise<BlogPost[]> => {
  const res = await bloggerApi("select");
  return Array.isArray(res) ? (res as BlogPost[]) : [];
};

const toPayload = (s: EditorSnapshot) => ({
  title: s.title,
  slug: s.slug || slugify(s.title),
  content: s.content,
  excerpt: s.excerpt || null,
  cover_image_url: s.cover_image_url || null,
  author_name: s.author_name || "THRYLOS Team",
  author_image_url: s.author_image_url || null,
  is_published: s.is_published,
  published_at: s.is_published ? new Date().toISOString() : null,
  category: s.category || "General",
  subtopic: s.subtopic || null,
  highlights: s.highlights,
  links: s.links,
  seo_title: s.seo_title || null,
  meta_description: s.meta_description || null,
  canonical_url: s.canonical_url || null,
  read_time_label: s.read_time_label || null,
});

export const createPost = async (s: EditorSnapshot): Promise<BlogPost> => {
  return (await bloggerApi("insert", { data: toPayload(s) })) as BlogPost;
};

export const updatePost = async (id: string, s: EditorSnapshot): Promise<BlogPost> => {
  return (await bloggerApi("update", { id, data: toPayload(s) })) as BlogPost;
};

export const deletePost = async (id: string) => {
  await bloggerApi("delete", { id });
};

export const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
