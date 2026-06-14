// A full-bleed horizontal section that breaks out of the centered container so
// each "band" can carry its own theme-derived background color.
export default function Band({
  tone = "band",
  className = "",
  flush = false,
  children,
}: {
  tone?: "hero" | "band" | "topic" | "plain";
  className?: string;
  flush?: boolean; // sit flush under the header (cancel main's top padding)
  children: React.ReactNode;
}) {
  const style: React.CSSProperties =
    tone === "hero"
      ? { background: "linear-gradient(135deg, rgb(var(--hero-from)), rgb(var(--hero-to)))", color: "#fff" }
      : tone === "band"
      ? { background: "rgb(var(--band-bg))", color: "rgb(var(--band-fg))" }
      : tone === "topic"
      ? { background: "rgb(var(--topic-bg))", color: "rgb(var(--topic-fg))" }
      : {};

  return (
    <section style={style} className={`w-screen ml-[calc(50%-50vw)] ${flush ? "-mt-8" : ""}`}>
      <div className={`mx-auto max-w-6xl px-4 ${className}`}>{children}</div>
    </section>
  );
}
