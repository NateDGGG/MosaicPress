import Link from "next/link";
import { prisma } from "../lib/db";
import { itemInclude, listItems } from "../lib/items";
import { renderCommentaryHtml } from "../lib/blog";
import NewsletterSignup from "../components/NewsletterSignup";
import Testimonials from "../components/Testimonials";
import FieldFilters from "../components/FieldFilters";
import { filterableFields } from "../lib/fields";
import { parseAttributes } from "../lib/fields";
import { listTestimonials } from "../lib/testimonials";
import { getSettings, type HomeSection } from "../lib/settings";
import { homeTags, listTags } from "../lib/taxonomy";
import { isItemType, type ItemType } from "../lib/types";
import Rail from "../components/Rail";
import TopicBrowser from "../components/TopicBrowser";
import Band from "../components/Band";
import ItemCard from "../components/ItemCard";
import FilterSidebar from "../components/FilterSidebar";

export const dynamic = "force-dynamic";

const TYPE_PLURAL: Record<ItemType, string> = {
  article: "Articles", blog: "Blog", video: "Videos", product: "Shop", link: "Links", book: "Books",
};

export default async function HomePage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const [all, settings, collections, homeTagList, allTags] = await Promise.all([
    listItems({ publishedOnly: true }),
    getSettings(),
    prisma.collection.findMany({
      orderBy: { createdAt: "asc" },
      include: { items: { orderBy: { position: "asc" }, include: { item: { include: itemInclude } } } },
    }),
    homeTags(),
    listTags(),
  ]);
  const testimonials = await listTestimonials({ featuredOnly: true });

  const activeType = isItemType(searchParams.type) ? (searchParams.type as ItemType) : undefined;
  const activeTopic = searchParams.topic;
  const filtering = !!(activeType || activeTopic);

  const featured = all.filter((i) => i.featured);
  const editorsNotes = all.filter((i) => i.featuredNote && i.commentary);
  const hasPlans = (await prisma.plan.count()) > 0;
  const hero =
    settings.heroSource === "none"
      ? null
      : settings.heroSource === "item"
      ? (all.find((i) => i.slug === settings.heroItemSlug) || null)
      : (featured[0] || all[0] || null);
  const newest = all.slice(0, 12);

  let filtered = all;
  if (activeType) filtered = filtered.filter((i) => i.type === activeType);
  if (activeTopic) filtered = filtered.filter((i) => i.tags.some((t) => t.tag.slug === activeTopic));
  // Custom-field filters (f_<key>=value), applied within the filtered view.
  const fFields = filterableFields(settings.customFields, activeType || "");
  const activeFieldFilters: Record<string, string> = {};
  for (const f of fFields) {
    const v = searchParams[`f_${f.key}`];
    if (v) { activeFieldFilters[f.key] = v; filtered = filtered.filter((i) => String(parseAttributes(i.attributes)[f.key] ?? "") === v); }
  }
  // Current query params (for the filter component to preserve type/topic + filters).
  const currentParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) if (typeof v === "string" && v) currentParams[k] = v;

  const cm = settings.homeCommentary;
  const grid = (items: typeof all) => (
    <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => <ItemCard key={item.id} item={item} commentaryMode={cm} commentaryChars={settings.commentaryExcerptChars} />)}
    </div>
  );

  // Per-section asset-type filter: "only" a type, or "except" a type.
  const typeFiltered = (items: typeof all, sec: HomeSection) => {
    if (!sec.filterMode || !sec.filterType) return items;
    return sec.filterMode === "only"
      ? items.filter((i) => i.type === sec.filterType)
      : items.filter((i) => i.type !== sec.filterType);
  };

  // Render one configured home section. Order + visibility come from settings.
  const renderSection = (sec: HomeSection): React.ReactNode => {
    if (!sec.enabled) return null;
    switch (sec.kind) {
      case "new": {
        const base = typeFiltered(all, sec);
        const items = base.slice(0, sec.limit || 12);
        return <Rail key={sec.id} title={sec.title || "New releases"} items={items} commentaryMode={sec.commentary || cm} autoScroll />;
      }
      case "featured": {
        const base = typeFiltered(featured, sec);
        return <Rail key={sec.id} title={sec.title || "Featured"} items={sec.limit ? base.slice(0, sec.limit) : base} commentaryMode={sec.commentary || cm} />;
      }
      case "collections":
        return (
          <div key={sec.id}>
            {collections.map((c) => (
              <Rail key={c.id} title={c.title} href={`/collections/${c.slug}`}
                items={c.items.map((ci) => ci.item).filter((it) => it.status === "published")} commentaryMode={sec.commentary || cm} />
            ))}
          </div>
        );
      case "type": {
        const t = sec.itemType;
        if (!isItemType(t)) return null;
        const ofType = all.filter((i) => i.type === t);
        const shown = sec.limit ? ofType.slice(0, sec.limit) : ofType;
        const href = t === "blog" ? "/blog" : t === "link" ? "/links" : `/?type=${t}`;
        // Books auto-scroll like New releases (cover-forward shelves read well in motion).
        return <Rail key={sec.id} title={sec.title || TYPE_PLURAL[t]} href={href} items={shown} commentaryMode={sec.commentary || cm} autoScroll={t === "book"} />;
      }
      case "topics": {
        // Only topics flagged "show on home" (Admin → Topics) appear as tabs.
        // If the default ("catch-all") topic is among them, it's selected first.
        const topicsToShow = homeTagList;
        if (topicsToShow.length === 0) return null;
        const perTopic = sec.limit && sec.limit > 0 ? sec.limit : 8;
        // Tiled grid: columns are configurable (default 4). Static class strings
        // so Tailwind keeps them; always responsive (1 col → 2 → N).
        const colsClass: Record<number, string> = {
          1: "grid-cols-1",
          2: "grid-cols-1 sm:grid-cols-2",
          3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
          6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-6",
        };
        const cols = sec.cols && colsClass[sec.cols] ? sec.cols : 4;
        const tcm = sec.commentary || cm;
        // Build a panel (grid) per topic; the default topic is the catch-all.
        const withItems = topicsToShow
          .map((t) => ({ t, items: typeFiltered(t.isDefault ? all : all.filter((i) => i.tags.some((tg) => tg.tag.slug === t.slug)), sec) }))
          .filter((x) => x.items.length > 0);
        if (withItems.length === 0) return null;
        const tabs = withItems.map((x) => ({ name: x.t.name, slug: x.t.slug, seeAll: x.items.length > perTopic }));
        const panels = withItems.map((x) => (
          <div className={`grid items-start gap-5 ${colsClass[cols]}`}>
            {x.items.slice(0, perTopic).map((item) => (
              <ItemCard key={item.id} item={item} commentaryMode={tcm} commentaryChars={settings.commentaryExcerptChars} />
            ))}
          </div>
        ));
        const initial = Math.max(0, withItems.findIndex((x) => x.t.isDefault));
        return (
          <TopicBrowser key={sec.id} title={sec.title || "Browse by topic"} tabs={tabs} panels={panels} initial={initial} />
        );
      }
      case "text":
        return (sec.title || sec.body) ? (
          <section key={sec.id} className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
            {sec.title && <h2 className="mb-2 text-xl font-bold">{sec.title}</h2>}
            {sec.body && <div className="prose-body whitespace-pre-line text-slate-700">{sec.body}</div>}
          </section>
        ) : null;
      case "feature":
        return (sec.title || sec.body || sec.image || sec.footer) ? (
          <section key={sec.id} className="mb-12 text-center">
            {sec.title && <h2 className="text-3xl font-bold sm:text-4xl">{sec.title}</h2>}
            {sec.body && <p className="mx-auto mt-4 max-w-2xl whitespace-pre-line opacity-80">{sec.body}</p>}
            {sec.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sec.image} alt={sec.title || ""} className="mx-auto mt-8 w-full max-w-4xl rounded-2xl object-cover shadow-sm" />
            )}
            {sec.footer && <p className="mx-auto mt-6 max-w-2xl text-sm opacity-70">{sec.footer}</p>}
          </section>
        ) : null;
      case "testimonials":
        return testimonials.length > 0 ? (
          <Testimonials key={sec.id} items={testimonials} title={sec.title} />
        ) : null;
      case "newsletter":
        return settings.newsletterEnabled ? (
          <section key={sec.id} className="mb-10">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-1 text-xl font-bold">{sec.title || settings.newsletterHeading}</h2>
              {settings.newsletterBlurb && <p className="mb-4 text-slate-600">{settings.newsletterBlurb}</p>}
              <div className="max-w-xl">
                <NewsletterSignup askName={settings.newsletterAskName} source="home" />
              </div>
            </div>
          </section>
        ) : null;
      case "editorsNotes":
        return editorsNotes.length > 0 ? (
          <section key={sec.id} className="mb-10">
            <h2 className="mb-4 text-xl font-bold">{sec.title || "From the editor"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {editorsNotes.map((it) => (
                <Link key={it.id} href={`/i/${it.slug}`}
                  className="block rounded-xl border-l-4 border-brand bg-brand/5 p-4 transition hover:bg-brand/10">
                  <div className="mb-1 font-semibold text-slate-900">{it.title}</div>
                  <div className="prose-body line-clamp-4 text-sm" dangerouslySetInnerHTML={{ __html: renderCommentaryHtml(it.commentary) }} />
                  <span className="mt-2 inline-block text-sm font-medium text-brand">Read →</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null;
      default:
        return null;
    }
  };

  // The main content region (everything below the hero, inside the sidebar column if shown).
  let main: React.ReactNode;
  if (filtering) {
    const label = activeTopic
      ? allTags.find((t) => t.slug === activeTopic)?.name || "Topic"
      : TYPE_PLURAL[activeType as ItemType];
    main = (
      <div>
        <h2 className="mb-4 text-xl font-bold">{label} <span className="text-sm font-normal text-slate-400">({filtered.length})</span></h2>
        {fFields.length > 0 && <FieldFilters fields={fFields} current={currentParams} />}
        {filtered.length ? grid(filtered) : <p className="text-slate-500">Nothing here yet.</p>}
      </div>
    );
  } else {
    // Vary section backgrounds for visual rhythm: cycle page bg → tint A → tint B.
    // Full-bleed stripes only when there's no sidebar (which constrains width).
    const alternate = settings.alternateSections && !settings.showSidebar;
    const tones = ["rgb(var(--page-bg))", "rgb(var(--sec-a))", "rgb(var(--sec-b))"];
    let bandIdx = -1;
    const sectionNodes = settings.homeSections.map((sec) => {
      const node = renderSection(sec);
      if (!node) return null;
      if (!alternate) return node;
      bandIdx++;
      const bg = tones[bandIdx % tones.length];
      // page-bg tone needs no stripe (it equals the page); render in flow.
      if (bandIdx % tones.length === 0) return <div key={sec.id} className="pt-10">{node}</div>;
      return (
        <div key={sec.id} className="w-screen ml-[calc(50%-50vw)]" style={{ background: bg }}>
          <div className="mx-auto max-w-6xl px-4 pt-10 pb-2">{node}</div>
        </div>
      );
    });
    main = (
      <div>
        {alternate ? sectionNodes : settings.homeSections.map(renderSection)}
        {all.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
            Nothing published yet. Head to the <Link href="/admin" className="text-brand underline">admin</Link> to add content.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Hero — gradient, full image, or split, per settings */}
      {(() => {
        const imageHero = settings.heroLayout === "image" && settings.heroImage;
        const sideImage = settings.heroLayout === "split" ? (settings.heroImage || hero?.coverImage) : hero?.coverImage;
        const primaryHref = settings.heroCtaHref || (hero ? `/i/${hero.slug}` : "");
        const primaryLabel = settings.heroCtaLabel || (hero ? (hero.type === "video" ? "▶ Watch the latest" : "Start exploring") : "");
        const ctas = (
          <div className="mt-6 flex flex-wrap gap-3">
            {settings.heroShowPrimaryCta && primaryHref && (
              <Link href={primaryHref} className="rounded-lg bg-white px-5 py-2.5 font-semibold text-brand hover:bg-white/90">
                {primaryLabel || "Explore"}
              </Link>
            )}
            {settings.heroCta2Label && !((settings.heroCta2Href || "/membership") === "/membership" && !hasPlans) && (
              <Link href={settings.heroCta2Href || "/membership"} className="rounded-lg border border-white/40 px-5 py-2.5 font-semibold text-white hover:bg-white/10">
                {settings.heroCta2Label}
              </Link>
            )}
          </div>
        );
        const copy = (
          <div>
            {settings.heroEmphasis === "tagline" ? (
              <>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">{settings.siteName}</p>
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{settings.tagline}</h1>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{settings.siteName}</h1>
                {settings.tagline && <p className="mt-3 max-w-xl text-lg font-medium text-white/90 sm:text-2xl">{settings.tagline}</p>}
              </>
            )}
            {settings.heroSubtitle && <p className="mt-3 max-w-md text-white/75">{settings.heroSubtitle}</p>}
            {ctas}
          </div>
        );
        // Hero vertical size. Taller options reveal more of a full-bleed image.
        const heroPadImg = { standard: "py-16 sm:py-24", tall: "py-24 sm:py-36", xl: "py-36 sm:py-52" }[settings.heroHeight] || "py-16 sm:py-24";
        const heroPadGrad = { standard: "py-12 sm:py-16", tall: "py-20 sm:py-28", xl: "py-28 sm:py-44" }[settings.heroHeight] || "py-12 sm:py-16";
        if (imageHero) {
          return (
            <Band bgImage={settings.heroImage} overlay={settings.heroOverlay} flush className={heroPadImg}>
              <div className="max-w-2xl">{copy}</div>
            </Band>
          );
        }
        return (
          <Band tone="hero" flush className={heroPadGrad}>
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
              {copy}
              {sideImage && (
                hero ? (
                  <Link href={`/i/${hero.slug}`} className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sideImage} alt="" className="aspect-video w-full rounded-2xl object-cover shadow-lg" />
                  </Link>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sideImage} alt="" className="aspect-video w-full rounded-2xl object-cover shadow-lg" />
                )
              )}
            </div>
          </Band>
        );
      })()}

      <div className="pt-10">
        {settings.showSidebar ? (
          <div className="flex gap-8">
            <FilterSidebar tags={allTags} activeType={activeType} activeTopic={activeTopic} />
            <div className="min-w-0 flex-1">{main}</div>
          </div>
        ) : (
          main
        )}
      </div>

      {!filtering && settings.showAccountNav && (
        <Band tone="band" className="my-12 py-12 text-center">
          <h2 className="text-2xl font-bold">Create your free account and join the community</h2>
          <p className="mx-auto mt-2 max-w-xl opacity-80">Members unlock the full library and support new lessons.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/join" className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark">Join free</Link>
            <Link href="/membership" className="rounded-lg border border-current px-5 py-2.5 font-semibold hover:opacity-80">See membership</Link>
          </div>
        </Band>
      )}
    </div>
  );
}
