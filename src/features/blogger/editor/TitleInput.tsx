import { memo, useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

const TitleInputInner = ({ value, onChange, placeholder = "Untitled" }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      autoComplete="off"
      placeholder={placeholder}
      rows={1}
      aria-label="Article title"
      className="w-full resize-none overflow-hidden bg-transparent border-0 outline-none text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight placeholder:text-muted-foreground/40 focus:ring-0"
    />
  );
};

export const TitleInput = memo(TitleInputInner);
