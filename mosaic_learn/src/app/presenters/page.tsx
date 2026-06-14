import Link from "next/link";
import { listPresenters } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function PresentersPage() {
  const presenters = await listPresenters();

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Presenters</h1>
      <p className="mb-8 text-slate-600">The voices behind the lessons.</p>

      {presenters.length === 0 ? (
        <p className="text-slate-500">No presenters yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {presenters.map((p) => (
            <Link key={p.id} href={`/presenters/${p.slug}`} className="group text-center">
              <div className="mx-auto mb-3 aspect-square w-32 overflow-hidden rounded-full bg-slate-100">
                {p.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                )}
              </div>
              <div className="font-semibold group-hover:text-brand">{p.name}</div>
              {p.title && <div className="text-sm text-slate-500">{p.title}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
