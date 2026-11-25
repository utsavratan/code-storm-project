import { memo } from "react";
import { motion } from "framer-motion";
import { Cloud, CloudOff, Check, Loader2, AlertTriangle, Save, RefreshCcw } from "lucide-react";
import type { AutosaveStatus } from "../types";

interface Props {
  status: AutosaveStatus;
  words: number;
  minutes: number;
  line: number;
  col: number;
  minWords: number;
  onRetry?: () => void;
  lastError?: string | null;
}

const StatusPill = ({ status }: { status: AutosaveStatus }) => {
  const map: Record<AutosaveStatus, { icon: JSX.Element; label: string; tone: string }> = {
    idle:    { icon: <Save className="w-3 h-3" />, label: "Ready", tone: "text-muted-foreground" },
    saving:  { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Saving…", tone: "text-amber-400" },
    saved:   { icon: <Check className="w-3 h-3" />, label: "Saved", tone: "text-emerald-400" },
    local:   { icon: <Cloud className="w-3 h-3" />, label: "Draft cached locally", tone: "text-sky-400" },
    offline: { icon: <CloudOff className="w-3 h-3" />, label: "Offline — draft is safe locally", tone: "text-amber-400" },
    error:   { icon: <AlertTriangle className="w-3 h-3" />, label: "Save error", tone: "text-destructive" },
  };
  const s = map[status];
  return (
    <motion.span layout className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.tone}`}>
      {s.icon}{s.label}
    </motion.span>
  );
};

const StatusBarInner = ({ status, words, minutes, line, col, minWords, onRetry, lastError }: Props) => {
  const need = Math.max(0, minWords - words);
  const showRetry = (status === "error" || status === "offline") && !!onRetry;

  return (
    <div className="border-t border-border/60 bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-2 flex items-center justify-between text-xs gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <StatusPill status={status} />
        {showRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold hover:bg-primary/20 transition"
            title={lastError || undefined}
          >
            <RefreshCcw className="w-3 h-3" /> Save now
          </button>
        )}
        {status === "error" && lastError && (
          <span className="hidden md:inline text-[11px] text-destructive/80 truncate max-w-[280px]" title={lastError}>
            {lastError}
          </span>
        )}
        <span className="text-muted-foreground hidden sm:inline">
          Ln {line}, Col {col}
        </span>
      </div>
      <div className="flex items-center gap-4 text-muted-foreground shrink-0">
        <span>{words.toLocaleString()} words</span>
        <span className="hidden sm:inline">{minutes} min read</span>
        <span className={need > 0 ? "text-amber-400" : "text-emerald-400"}>
          {need > 0 ? `${need} words to publish` : "Ready to publish"}
        </span>
      </div>
    </div>
  );
};

export const StatusBar = memo(StatusBarInner);
