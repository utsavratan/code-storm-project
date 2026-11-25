export const countProseWords = (raw: string): number => {
  if (!raw) return 0;
  let s = raw;
  s = s.replace(/```[\s\S]*?```/g, " ");
  s = s.replace(/`[^`]*`/g, " ");
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  s = s.replace(/<\/?[a-zA-Z][^>]*>/g, " ");
  s = s.replace(/^[ \t]*#{1,6}\s+/gm, "");
  s = s.replace(/^[ \t]*>+\s?/gm, "");
  s = s.replace(/^[ \t]*[-*+•]\s+/gm, "");
  s = s.replace(/^[ \t]*\d+\.\s+/gm, "");
  s = s.replace(/:::\w+/g, " ").replace(/:::/g, " ");
  s = s.replace(/[*_~`>#|]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s ? s.split(" ").length : 0;
};

export const readingMinutes = (words: number) => Math.max(1, Math.round(words / 220));

export type MdCommand =
  | "bold" | "italic" | "h1" | "h2" | "h3" | "ul" | "ol"
  | "quote" | "code" | "codeblock" | "hr" | "link"
  | "callout-key" | "callout-tip" | "callout-conclusion" | "image";

export interface WrapResult {
  content: string;
  selectionStart: number;
  selectionEnd: number;
}

const wrap = (
  content: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder = "",
): WrapResult => {
  const selected = content.slice(start, end) || placeholder;
  const next = content.slice(0, start) + before + selected + after + content.slice(end);
  return {
    content: next,
    selectionStart: start + before.length,
    selectionEnd: start + before.length + selected.length,
  };
};

const prefixLines = (content: string, start: number, end: number, prefix: string): WrapResult => {
  const lineStart = content.lastIndexOf("\n", start - 1) + 1;
  const region = content.slice(lineStart, end);
  const replaced = region
    .split("\n")
    .map((l) => (l.startsWith(prefix) ? l : prefix + l))
    .join("\n");
  const next = content.slice(0, lineStart) + replaced + content.slice(end);
  const delta = replaced.length - region.length;
  return { content: next, selectionStart: start + prefix.length, selectionEnd: end + delta };
};

const insertBlock = (content: string, start: number, end: number, block: string): WrapResult => {
  const needsLead = start > 0 && content[start - 1] !== "\n" ? "\n\n" : "";
  const next = content.slice(0, start) + needsLead + block + "\n" + content.slice(end);
  const pos = start + needsLead.length + block.length + 1;
  return { content: next, selectionStart: pos, selectionEnd: pos };
};

export const applyCommand = (
  cmd: MdCommand,
  content: string,
  start: number,
  end: number,
  opts?: { url?: string; label?: string },
): WrapResult => {
  switch (cmd) {
    case "bold": return wrap(content, start, end, "**", "**", "bold text");
    case "italic": return wrap(content, start, end, "*", "*", "italic text");
    case "h1": return prefixLines(content, start, end, "# ");
    case "h2": return prefixLines(content, start, end, "## ");
    case "h3": return prefixLines(content, start, end, "### ");
    case "ul": return prefixLines(content, start, end, "- ");
    case "ol": return prefixLines(content, start, end, "1. ");
    case "quote": return prefixLines(content, start, end, "> ");
    case "code": return wrap(content, start, end, "`", "`", "code");
    case "codeblock": return insertBlock(content, start, end, "```\ncode here\n```");
    case "hr": return insertBlock(content, start, end, "---");
    case "link": {
      const label = content.slice(start, end) || opts?.label || "link text";
      const url = opts?.url || "https://";
      return wrap(content, start, end, "", "", "").content !== content
        ? wrap(content, start, end, `[`, `](${url})`, label)
        : wrap(content, start, end, `[`, `](${url})`, label);
    }
    case "image": {
      const url = opts?.url || "https://";
      const alt = opts?.label || "image";
      return insertBlock(content, start, end, `![${alt}](${url})`);
    }
    case "callout-key": return insertBlock(content, start, end, ":::key\nKey point here\n:::");
    case "callout-tip": return insertBlock(content, start, end, ":::tip\nHelpful tip here\n:::");
    case "callout-conclusion": return insertBlock(content, start, end, ":::conclusion\nWrap-up here\n:::");
  }
};

export const continueList = (content: string, caret: number): WrapResult | null => {
  const lineStart = content.lastIndexOf("\n", caret - 1) + 1;
  const line = content.slice(lineStart, caret);
  const bullet = line.match(/^(\s*)([-*+])\s+(.*)$/);
  const numbered = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
  if (bullet) {
    if (!bullet[3]) {
      // empty bullet: exit list
      const next = content.slice(0, lineStart) + content.slice(caret);
      return { content: next, selectionStart: lineStart, selectionEnd: lineStart };
    }
    const insert = `\n${bullet[1]}${bullet[2]} `;
    const next = content.slice(0, caret) + insert + content.slice(caret);
    return { content: next, selectionStart: caret + insert.length, selectionEnd: caret + insert.length };
  }
  if (numbered) {
    if (!numbered[3]) {
      const next = content.slice(0, lineStart) + content.slice(caret);
      return { content: next, selectionStart: lineStart, selectionEnd: lineStart };
    }
    const insert = `\n${numbered[1]}${Number(numbered[2]) + 1}. `;
    const next = content.slice(0, caret) + insert + content.slice(caret);
    return { content: next, selectionStart: caret + insert.length, selectionEnd: caret + insert.length };
  }
  return null;
};
