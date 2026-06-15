type T = { id: string; name: string; role: string | null; quote: string; avatar: string | null; rating: number | null };

export default function Testimonials({ items, title }: { items: T[]; title?: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-bold">{title || "What people say"}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <figure key={t.id} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {t.rating ? <div className="mb-2 text-amber-500" aria-label={`${t.rating} out of 5`}>{"★".repeat(Math.max(1, Math.min(5, t.rating)))}<span className="text-slate-300">{"★".repeat(5 - Math.max(1, Math.min(5, t.rating)))}</span></div> : null}
            <blockquote className="flex-1 text-slate-700">&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              {t.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">{t.name.slice(0, 1).toUpperCase()}</span>
              )}
              <div>
                <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                {t.role && <div className="text-xs text-slate-500">{t.role}</div>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
