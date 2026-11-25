import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Eye, Command, Globe2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AutosaveStatus } from "../types";

interface Props {
  isEditing: boolean;
  isPublished: boolean;
  saving: boolean;
  status: AutosaveStatus;
  canPublish: boolean;
  previewMode: "write" | "split" | "preview";
  onPreviewMode: (m: "write" | "split" | "preview") => void;
  onSave: () => void;
  onPublishToggle: () => void;
  onOpenPalette: () => void;
}

const EditorHeaderInner = ({
  isEditing, isPublished, saving, status, canPublish, previewMode,
  onPreviewMode, onSave, onPublishToggle, onOpenPalette,
}: Props) => {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild size="icon" variant="ghost" aria-label="Back">
            <Link to="/blogger-admin"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="min-w-0 hidden sm:block">
            <p className="text-xs text-muted-foreground">
              {isEditing ? "Editing article" : "New article"}
            </p>
            <p className="text-sm font-medium truncate">
              {status === "saving" ? "Saving…" : status === "saved" ? "All changes saved" : status === "local" ? "Draft cached locally" : status === "error" ? "Autosave error" : "Draft"}
            </p>
          </div>
          <Badge variant={isPublished ? "default" : "secondary"} className="ml-1 hidden md:inline-flex">
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden md:flex items-center rounded-lg border border-border/60 p-0.5">
            {(["write", "split", "preview"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onPreviewMode(m)}
                aria-pressed={previewMode === m}
                className={`px-2.5 py-1 text-xs rounded-md capitalize transition-colors ${
                  previewMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >{m}</button>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={onOpenPalette} className="hidden sm:inline-flex gap-1.5">
            <Command className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Palette</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={onSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button
            size="sm"
            onClick={onPublishToggle}
            disabled={saving || !canPublish}
            className="gap-1.5"
          >
            <Globe2 className="w-3.5 h-3.5" />
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export const EditorHeader = memo(EditorHeaderInner);
