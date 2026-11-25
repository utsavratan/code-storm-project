import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, PenLine, Clock3 } from "lucide-react";
import type { BlogPost } from "../types";

interface Props { posts: BlogPost[]; }

const formatWhen = (d: Date | null) => {
  if (!d) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
};

const StatsGridInner = ({ posts }: Props) => {
  const stats = useMemo(() => {
    const published = posts.filter((p) => p.is_published).length;
    const drafts = posts.length - published;
    const totalWords = posts.reduce((s, p) => s + (p.typed_words ?? 0), 0);
    const latest = posts.reduce<Date | null>((acc, p) => {
      const d = new Date(p.updated_at ?? p.created_at);
      return !acc || d > acc ? d : acc;
    }, null);
    return { published, drafts, totalWords, latest };
  }, [posts]);

  const cards = [
    { label: "Published", value: stats.published, icon: CheckCircle2, tone: "text-emerald-400" },
    { label: "Drafts", value: stats.drafts, icon: PenLine, tone: "text-amber-400" },
    { label: "Total posts", value: posts.length, icon: FileText, tone: "text-primary" },
    { label: "Last edit", value: formatWhen(stats.latest), icon: Clock3, tone: "text-sky-400" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-border bg-card/60 backdrop-blur p-4 flex items-start justify-between"
        >
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
          <c.icon className={`w-5 h-5 ${c.tone}`} />
        </motion.div>
      ))}
    </div>
  );
};

export const StatsGrid = memo(StatsGridInner);
