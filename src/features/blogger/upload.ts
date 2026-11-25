import { supabase } from "@/integrations/supabase/client";

export interface UploadResult {
  url: string;
  sizeKB: number;
}

const MAX_BYTES = 1 * 1024 * 1024;

export const uploadBlogImage = async (file: File, prefix = "blog"): Promise<UploadResult> => {
  if (file.type !== "image/webp") {
    throw new Error("Only WEBP images are allowed. Convert via squoosh.app and try again.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`Max 1 MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)} MB.`);
  }
  const fileName = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error } = await supabase.storage
    .from("uploads")
    .upload(fileName, file, { upsert: false, contentType: "image/webp" });
  if (error) throw error;
  const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
  return { url: data.publicUrl, sizeKB: Math.round(file.size / 1024) };
};
