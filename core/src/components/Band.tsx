// A full-bleed horizontal section that breaks out of the centered container so
// each "band" can carry its own theme-derived background color (like the
// stacked color sections on the PragerU homepage).
export default function Band({
  tone = "band",
  className = "",
  flush = false,
  bgImage,
  overlay = 45,
  children,
}: {
  tone?: "hero" | "band" | "topic" | "plain";
  className?: string;
  flush?: boolean; // sit flush under the header (cancel main's top padding)
  bgImage?: string; // optional full-bleed background image (hero)
  overlay?: number; // darken overlay % when bgImage is set
  children: React.ReactNode;
}) {
  if (bgImage) {
    const o = Math.max(0, Math.min(90, overlay)) / 100;
    return (
      <section className={`relative w-screen ml-[calc(50%-50vw)] ${flush ? "-mt-8" : ""}`} style={{ color: "#fff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bgImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(2,6,23,${o}), rgba(2,6,23,${Math.min(o + 0.18, 0.92)}))` }} />
        <div className={`relative mx-auto max-w-6xl px-4 ${className}`}>{children}</div>
      </section>
    );
  }

  const style: React.CSSProperties =
    tone === "hero"
      ? { background: "linear-gradient(135deg, rgb(var(--hero-from)), rgb(var(--hero-to)))", color: "#fff" }
      : tone === "band"
      ? { background: "rgb(var(--band-bg))", color: "rgb(var(--band-fg))" }
      : tone === "topic"
      ? { background: "rgb(var(--topic-bg))", color: "rgb(var(--topic-fg))" }
      : {};

  return (
    <section
      style={style}
      className={`w-screen ml-[calc(50%-50vw)] ${flush ? "-mt-8" : ""}`}
    >
      <div className={`mx-auto max-w-6xl px-4 ${className}`}>{children}</div>
    </section>
  );
}
