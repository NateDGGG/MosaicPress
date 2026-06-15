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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => <ItemCard key={item.id} item={item} commentaryMode={cm} commentaryChars={settings.commentaryExcerptChars} />)}
    </div>
  );

  // Render one configured home section. Order + visibility come from settings.
  const renderSection = (sec: HomeSection): React.ReactNode => {
    if (!sec.enabled) return null;
    switch (sec.kind) {
      case "new":
        return <Rail key={sec.id} title={sec.title || "New releases"} items={sec.limit ? newest.slice(0, sec.limit) : newest} commentaryMode={sec.commentary || cm} />;
      case "featured":
        return <Rail key={sec.id} title={sec.title || "Featured"} items={sec.limit ? featured.slice(0, sec.limit) : featured} commentaryMode={sec.commentary || cm} />;
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
        return <Rail key={sec.id} title={sec.title || TYPE_PLURAL[t]} href={href} items={shown} commentaryMode={sec.commentary || cm} />;
      }
      case "topics":
        return homeTagList.length > 0 ? (
          <section key={sec.id} className="mb-10">
            <h2 className="mb-3 text-xl font-bold">{sec.title || "Browse by topic"}</h2>
            <div className="flex flex-wrap gap-2">
              {homeTagList.map((t) => (
                <Link key={t.id} href={`/topics/${t.slug}`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand">
                  {t.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null;
      case "text":
        return (sec.title || sec.body) ? (
          <section key={sec.id} className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
            {sec.title && <h2 className="mb-2 text-xl font-bold">{sec.title}</h2>}
            {sec.body && <div className="prose-body whitespace-pre-line text-slate-700">{sec.body}</div>}
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
    main = (
      <div>
        {settings.homeSections.map(renderSection)}
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
            {primaryHref && (
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
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">{settings.siteName}</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{settings.tagline}</h1>
            {settings.heroSubtitle && <p className="mt-3 max-w-md text-white/80">{settings.heroSubtitle}</p>}
            {ctas}
          </div>
        );
        if (imageHero) {
          return (
            <Band bgImage={settings.heroImage} overlay={settings.heroOverlay} flush className="py-16 sm:py-24">
              <div className="max-w-2xl">{copy}</div>
            </Band>
          );
        }
        return (
          <Band tone="hero" flush className="py-12 sm:py-16">
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

      {!filtering && (
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
