import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Link2 } from "lucide-react";
import type { BlogLink } from "../../types";

interface Props {
  readTimeLabel: string;
  onReadTimeChange: (v: string) => void;
  autoReadMinutes: number;
  links: BlogLink[];
  onLinksChange: (v: BlogLink[]) => void;
}

const MetaPanelInner = ({ readTimeLabel, onReadTimeChange, autoReadMinutes, links, onLinksChange }: Props) => {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Read time label</Label>
        <Input
          value={readTimeLabel}
          onChange={(e) => onReadTimeChange(e.target.value)}
          placeholder={`Auto: ${autoReadMinutes} min read`}
        />
        <p className="text-[11px] text-muted-foreground">Leave blank to use the auto-calculated value.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Reference links</Label>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          <Button
            type="button" size="icon" variant="secondary"
            onClick={() => {
              if (label.trim() && url.trim()) {
                onLinksChange([...links, { label: label.trim(), url: url.trim() }]);
                setLabel(""); setUrl("");
              }
            }}
            aria-label="Add link"
          ><Plus className="w-4 h-4" /></Button>
        </div>
        <ul className="space-y-1.5">
          {links.map((l, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate font-medium">{l.label}</span>
                <Badge variant="secondary" className="text-[10px] truncate">{l.url}</Badge>
              </div>
              <button
                type="button" className="rounded hover:bg-muted p-1"
                onClick={() => onLinksChange(links.filter((_, j) => j !== i))}
                aria-label="Remove link"
              ><X className="w-3.5 h-3.5" /></button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const MetaPanel = memo(MetaPanelInner);
