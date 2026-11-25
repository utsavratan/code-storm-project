import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { CAROUSEL_INTERVAL_MS, nextIndex } from "@/lib/carouselQueue";

export function useShowcaseRotation(length: number) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [length]);
  useEffect(() => {
    if (paused || interacting || reducedMotion || !visible || length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((current) => nextIndex(length, current));
    }, CAROUSEL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [length, paused, interacting, reducedMotion, visible, active]);
  return { ref, active: length ? active % length : 0, setActive, paused: paused || Boolean(reducedMotion), setPaused, reducedMotion,
    interactionProps: {
      onMouseEnter: () => setInteracting(true), onMouseLeave: () => setInteracting(false),
      onFocusCapture: () => setInteracting(true),
      onBlurCapture: (event: React.FocusEvent<HTMLDivElement>) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); },
    } };
}