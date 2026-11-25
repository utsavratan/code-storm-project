import { memo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, ImageIcon, Loader2, X } from "lucide-react";
import { uploadBlogImage } from "../../upload";
import { useToast } from "@/hooks/use-toast";

interface Props {
  url: string;
  onChange: (url: string) => void;
}

const CoverPanelInner = ({ url, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const { toast } = useToast();

  const handle = async (file: File) => {
    setBusy(true);
    try {
      const { url: publicUrl, sizeKB } = await uploadBlogImage(file, "blog/cover");
      onChange(publicUrl);
      toast({ title: "Cover uploaded", description: `${sizeKB} KB` });
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div
        data-allow-drop="true"
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault(); setDrag(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handle(file);
        }}
        className={`relative aspect-video rounded-xl border-2 border-dashed transition-colors overflow-hidden ${
          drag ? "border-primary bg-primary/5" : "border-border/60 bg-muted/20"
        }`}
      >
        {url ? (
          <>
            <img src={url} alt="Cover" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 rounded-full bg-background/90 border border-border p-1.5 hover:bg-background"
              aria-label="Remove cover"
            ><X className="w-4 h-4" /></button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              {busy ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <UploadCloud className="w-5 h-5 text-primary" />}
            </div>
            <p className="text-sm font-medium">Drop your WEBP cover here</p>
            <p className="text-xs text-muted-foreground">or click below · max 1 MB</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button" variant="secondary" size="sm" className="gap-2 flex-1"
          onClick={() => inputRef.current?.click()} disabled={busy}
        >
          <ImageIcon className="w-4 h-4" /> {url ? "Replace" : "Upload"}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handle(f);
          e.target.value = "";
        }}
      />
      <p className="text-[11px] text-muted-foreground">Only .webp images are accepted (convert via squoosh.app).</p>
    </div>
  );
};

export const CoverPanel = memo(CoverPanelInner);
