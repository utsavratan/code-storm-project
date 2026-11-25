import { memo, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command as CmdIcon } from "lucide-react";

export interface PaletteAction {
  id: string;
  label: string;
  shortcut?: string;
  run: () => void;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  actions: PaletteAction[];
}

const CommandPaletteInner = ({ open, onOpenChange, actions }: Props) => {
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => { if (open) { setQuery(""); setIdx(0); } }, [open]);

  const filtered = actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-lg gap-0 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <CmdIcon className="w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIdx(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(filtered.length - 1, i + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
              if (e.key === "Enter") {
                e.preventDefault();
                const a = filtered[idx]; if (a) { a.run(); onOpenChange(false); }
              }
            }}
            placeholder="Type a command…"
            className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">No commands match.</li>
          )}
          {filtered.map((a, i) => (
            <li key={a.id}>
              <button
                type="button"
                onMouseEnter={() => setIdx(i)}
                onClick={() => { a.run(); onOpenChange(false); }}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${
                  i === idx ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span>{a.label}</span>
                {a.shortcut && <span className="text-[11px] text-muted-foreground">{a.shortcut}</span>}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export const CommandPalette = memo(CommandPaletteInner);
