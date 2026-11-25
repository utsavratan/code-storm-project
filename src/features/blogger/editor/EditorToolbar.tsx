import { memo } from "react";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Minus,
  Link2, Image as ImageIcon, Sparkles, Lightbulb, Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MdCommand } from "../markdown";

interface Props {
  onCommand: (cmd: MdCommand, opts?: { url?: string; label?: string }) => void;
  onInsertImage: () => void;
}

const buttons: { cmd: MdCommand; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { cmd: "h1", icon: Heading1, label: "Heading 1" },
  { cmd: "h2", icon: Heading2, label: "Heading 2" },
  { cmd: "h3", icon: Heading3, label: "Heading 3" },
  { cmd: "bold", icon: Bold, label: "Bold (Ctrl+B)" },
  { cmd: "italic", icon: Italic, label: "Italic (Ctrl+I)" },
  { cmd: "ul", icon: List, label: "Bulleted list" },
  { cmd: "ol", icon: ListOrdered, label: "Numbered list" },
  { cmd: "quote", icon: Quote, label: "Quote" },
  { cmd: "code", icon: Code, label: "Inline code" },
  { cmd: "hr", icon: Minus, label: "Divider" },
  { cmd: "callout-key", icon: Sparkles, label: "Key callout" },
  { cmd: "callout-tip", icon: Lightbulb, label: "Tip callout" },
  { cmd: "callout-conclusion", icon: Bookmark, label: "Conclusion callout" },
];

const EditorToolbarInner = ({ onCommand, onInsertImage }: Props) => {
  return (
    <div className="border-b border-border/60 bg-background/70 backdrop-blur-xl px-2 sm:px-4 py-2 flex items-center gap-0.5 overflow-x-auto">
      {buttons.map((b) => (
        <Tooltip key={b.cmd}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => onCommand(b.cmd)}
              aria-label={b.label}
            >
              <b.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">{b.label}</p></TooltipContent>
        </Tooltip>
      ))}
      <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => {
              const url = window.prompt("Link URL", "https://");
              if (url) onCommand("link", { url });
            }}
            aria-label="Insert link"
          >
            <Link2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p className="text-xs">Link (Ctrl+K)</p></TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 flex-shrink-0"
            onClick={onInsertImage}
            aria-label="Insert image"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p className="text-xs">Insert image (WEBP)</p></TooltipContent>
      </Tooltip>
    </div>
  );
};

export const EditorToolbar = memo(EditorToolbarInner);
