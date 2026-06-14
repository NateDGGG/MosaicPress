import Link from "next/link";
import { prisma } from "../lib/db";
import { itemInclude, listItems } from "../lib/items";
import { getSettings } from "../lib/settings";
import { listTags } from "../lib/taxonomy";
import Rail from "../components/Rail";
import Band from "../components/Band";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [all, settings, collections, tags] = await Promise.all([
    listItems({ publishedOnly: true }),
    getSettings(),
    prisma.collection.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        items: { orderBy: { position: "asc" }, include: { item: { include: itemInclude } } },
      },
    }),
    listTags(),
  ]);

  const featured = all.filter((i) => i.featured);
  const hero = featured[0] || all[0];
  const newest = all.slice(0, 12);

  return (
    <div>
      {/* Hero — full-bleed gradient section */}
      <Band tone="hero" flush className="py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
              {settings.siteName}
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{settings.tagline}</h1>
            <p className="mt-3 max-w-md text-white/80">
              Short, clear lessons on history, economics, science, and civics — watch, read,
              and explore by topic or presenter.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {hero && (
                <Link href={`/i/${hero.slug}`} className="rounded-lg bg-white px-5 py-2.5 font-semibold text-brand hover:bg-white/90">
                  {hero.type === "video" ? "▶ Watch the latest" : "Start exploring"}
                </Link>
              )}
              <Link href="/membership" className="rounded-lg border border-white/40 px-5 py-2.5 font-semibold text-white hover:bg-white/10">
                Become a member
              </Link>
            </div>
          </div>
          {hero?.coverImage && (
            <Link href={`/i/${hero.slug}`} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero.coverImage} alt="" className="aspect-video w-full rounded-2xl object-cover shadow-lg" />
            </Link>
          )}
        </div>
      </Band>

      {/* Browse by topic — its own theme-tinted band */}
      {tags.length > 0 && (
        <Band tone="topic" className="py-8">
          <h2 className="mb-3 text-xl font-bold">Browse by topic</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link
                key={t.id}
                href={`/topics/${t.slug}`}
                className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-white dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </Band>
      )}

      {/* Content area (page-bg section) */}
      <div className="pt-10">
        <Rail title="New releases" items={newest} />
        <Rail title="Featured" items={featured} />
        {collections.map((c) => (
          <Rail
            key={c.id}
            title={c.title}
            href={`/collections/${c.slug}`}
            items={c.items.map((ci) => ci.item).filter((it) => it.status === "published")}
          />
        ))}

        {all.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
            Nothing published yet. Head to the <Link href="/admin" className="text-brand underline">admin</Link> to add content.
          </p>
        )}
      </div>

      {/* Membership CTA — accent-tinted band section (like PragerU's signup strip) */}
      <Band tone="band" className="my-12 py-12 text-center">
        <h2 className="text-2xl font-bold">Create your free account and join the community</h2>
        <p className="mx-auto mt-2 max-w-xl opacity-80">
          Members unlock the full library and support new lessons.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/join" className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark">
            Join free
          </Link>
          <Link href="/membership" className="rounded-lg border border-current px-5 py-2.5 font-semibold hover:opacity-80">
            See membership
          </Link>
        </div>
      </Band>
    </div>
  );
}
