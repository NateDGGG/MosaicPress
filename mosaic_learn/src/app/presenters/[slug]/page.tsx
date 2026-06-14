import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPresenterBySlug, presenterItems } from "@/lib/taxonomy";
import ItemCard from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPresenterBySlug(params.slug);
  return { title: p?.name || "Presenter", description: p?.bio || undefined };
}

export default async function PresenterPage({ params }: { params: { slug: string } }) {
  const presenter = await getPresenterBySlug(params.slug);
  if (!presenter) notFound();
  const items = await presenterItems(presenter.id, { publishedOnly: true });

  return (
    <div>
      <Link href="/presenters" className="text-sm text-slate-400 hover:text-brand">← All presenters</Link>

      <header className="my-6 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <div className="aspect-square w-28 shrink-0 overflow-hidden rounded-full bg-slate-100">
          {presenter.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={presenter.photo} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{presenter.name}</h1>
          {presenter.title && <p className="text-brand">{presenter.title}</p>}
          {presenter.bio && <p className="mt-2 max-w-2xl text-slate-600">{presenter.bio}</p>}
        </div>
      </header>

      <h2 className="mb-4 text-lg font-bold">{items.length} {items.length === 1 ? "lesson" : "lessons"}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
