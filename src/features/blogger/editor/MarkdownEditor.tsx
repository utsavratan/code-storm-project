import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { applyCommand, continueList, type MdCommand } from "../markdown";
import { uploadBlogImage } from "../upload";
import { useToast } from "@/hooks/use-toast";

export interface MarkdownEditorHandle {
  focus: () => void;
  applyCommand: (cmd: MdCommand, opts?: { url?: string; label?: string }) => void;
  insertImageFromFile: (file: File) => Promise<void>;
  openImagePicker: () => void;
  setCaret: (pos: number) => void;
}

interface Props {
  value: string;
  onChange: (next: string) => void;
  onSaveShortcut?: () => void;
  onTogglePreview?: () => void;
  onOpenPalette?: () => void;
  onCursor?: (line: number, col: number) => void;
}

const MarkdownEditorImpl = forwardRef<MarkdownEditorHandle, Props>(
  ({ value, onChange, onSaveShortcut, onTogglePreview, onOpenPalette, onCursor }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const setCaret = useCallback((pos: number) => {
      const el = textareaRef.current;
      if (!el) return;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    }, []);

    const applyAt = useCallback(
      (cmd: MdCommand, opts?: { url?: string; label?: string }) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const res = applyCommand(cmd, el.value, start, end, opts);
        onChange(res.content);
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(res.selectionStart, res.selectionEnd);
        });
      },
      [onChange],
    );

    const insertImageFromFile = useCallback(
      async (file: File) => {
        try {
          const { url } = await uploadBlogImage(file, "blog/inline");
          applyAt("image", { url, label: file.name.replace(/\.[^.]+$/, "") });
          toast({ title: "Image inserted" });
        } catch (e) {
          toast({ title: "Upload failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
        }
      },
      [applyAt, toast],
    );

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      applyCommand: applyAt,
      insertImageFromFile,
      openImagePicker: () => fileRef.current?.click(),
      setCaret,
    }), [applyAt, insertImageFromFile, setCaret]);

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();

      if (mod && k === "s") { e.preventDefault(); onSaveShortcut?.(); return; }
      if (mod && e.shiftKey && k === "p") { e.preventDefault(); onOpenPalette?.(); return; }
      if (mod && k === "/") { e.preventDefault(); onTogglePreview?.(); return; }
      if (mod && k === "b") { e.preventDefault(); applyAt("bold"); return; }
      if (mod && k === "i") { e.preventDefault(); applyAt("italic"); return; }
      if (mod && k === "k") {
        e.preventDefault();
        const url = window.prompt("Link URL", "https://");
        if (url) applyAt("link", { url });
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const next = el.value.slice(0, start) + "  " + el.value.slice(end);
        onChange(next);
        requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        const res = continueList(el.value, el.selectionStart);
        if (res) {
          e.preventDefault();
          onChange(res.content);
          requestAnimationFrame(() => el.setSelectionRange(res.selectionStart, res.selectionEnd));
        }
      }
    };

    const onSelect = () => {
      const el = textareaRef.current;
      if (!el || !onCursor) return;
      const pos = el.selectionStart;
      const before = el.value.slice(0, pos);
      const line = before.split("\n").length;
      const col = pos - (before.lastIndexOf("\n") + 1) + 1;
      onCursor(line, col);
    };

    // Hard block copy / cut / paste / drag-drop text. Only allow image files via the picker.
    useEffect(() => {
      const el = textareaRef.current;
      if (!el) return;
      const block = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        toast({
          title: "Copy & paste disabled",
          description: "For content integrity, please type your article directly.",
          variant: "destructive",
        });
      };
      const silent = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
      el.addEventListener("paste", block);
      el.addEventListener("copy", block);
      el.addEventListener("cut", block);
      el.addEventListener("drop", silent);
      el.addEventListener("dragover", silent);
      return () => {
        el.removeEventListener("paste", block);
        el.removeEventListener("copy", block);
        el.removeEventListener("cut", block);
        el.removeEventListener("drop", silent);
        el.removeEventListener("dragover", silent);
      };
    }, [toast]);

    return (
      <div
        className="relative h-full"
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={async (e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith("image/")) await insertImageFromFile(file);
        }}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onSelect={onSelect}
          onClick={onSelect}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          autoComplete="off"
          autoCorrect="off"
          spellCheck
          placeholder="Start writing your story…"
          className="h-full min-h-[70dvh] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-6 sm:px-10 lg:px-16 py-8 text-[17px] leading-[1.85] font-serif tracking-[-0.005em] max-w-none select-none"
          style={{ fontFamily: "'Iowan Old Style', 'Palatino Linotype', Georgia, serif", WebkitUserSelect: "none", userSelect: "text" }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/webp,image/png,image/jpeg"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void insertImageFromFile(f);
            e.target.value = "";
          }}
        />
      </div>
    );

  },
);
MarkdownEditorImpl.displayName = "MarkdownEditor";

// Memo: only rerender when content actually changes; callbacks are stable via useCallback in parent.
export const MarkdownEditor = memo(MarkdownEditorImpl);
