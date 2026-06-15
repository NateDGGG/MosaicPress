"use client";

import { useEffect, useRef } from "react";

// A horizontal scroll row that gently auto-scrolls (carousel-style) ONLY when its
// content overflows — i.e. when there are enough items. It eases back and forth
// (ping-pong) so there's no jarring jump, pauses on hover/focus and right after
// the user scrolls manually, and stays still if the OS prefers reduced motion.
export default function AutoScroller({
  children,
  className = "",
  speed = 32, // pixels per second — slow but visibly moving
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  // speed = pixels per second (slow but visible)
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let paused = false;
    let dir = 1;
    let userUntil = 0;
    let last = performance.now();
    let raf = 0;
    // Track position as a float. Browsers round scrollLeft to an integer on
    // read, so reading it back each frame would swallow sub-pixel steps and the
    // row would never move — we accumulate here and only assign to scrollLeft.
    let pos = el.scrollLeft;

    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    const onUser = () => { userUntil = performance.now() + 2500; pos = el.scrollLeft; };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("focusin", pause);
    el.addEventListener("focusout", resume);
    el.addEventListener("wheel", onUser, { passive: true });
    el.addEventListener("touchstart", onUser, { passive: true });

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const max = el.scrollWidth - el.clientWidth;
      if (max > 8 && !paused && now >= userUntil) {
        pos += dir * speed * dt;
        if (pos >= max) { pos = max; dir = -1; }
        else if (pos <= 0) { pos = 0; dir = 1; }
        el.scrollLeft = pos;
      } else {
        // Keep our accumulator in sync while paused or during manual scroll.
        pos = el.scrollLeft;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("focusin", pause);
      el.removeEventListener("focusout", resume);
      el.removeEventListener("wheel", onUser);
      el.removeEventListener("touchstart", onUser);
    };
  }, [speed]);

  return <div ref={ref} className={className}>{children}</div>;
}
