import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getItemBySlug, priceFormat, durationFormat } from "../../../lib/items";
import { actionLabel, type ItemType, type Source, TYPE_LABELS } from "../../../lib/types";
import AddToCartButton from "../../../components/AddToCartButton";
import BlockRenderer from "../../../components/BlockRenderer";
import { getSessionUser, isStaff } from "../../../lib/auth";
import { isActiveMember } from "../../../lib/membership";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const item = await getItemBySlug(params.slug);
  if (!item) return { title: "Not found" };
  // External pages point canonical at the source to avoid duplicate content.
  const canonical = item.source === "external" ? item.external?.canonicalUrl || item.external?.url : undefined;
  return {
    title: item.seoTitle || item.title,
    description: item.seoDesc || item.summary || undefined,
    alternates: canonical ? { canonical } : undefined,
  };
}

function Attribution({ url, name, favicon }: { url: string; name?: string | null; favicon?: string | null }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:border-brand hover:text-brand"
    >
      {favicon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={favicon} alt="" className="h-4 w-4 rounded-sm" />
      )}
      Source: {name || new URL(url).hostname} ↗
    </a>
  );
}

export default async function ItemPage({ params }: { params: { slug: string } }) {
  const item = await getItemBySlug(params.slug);
  if (!item) notFound();

  // Members-only gating: staff preview freely; active members get access;
  // everyone else sees a teaser + join/subscribe CTA.
  const viewer = getSessionUser();
  const locked =
    item.access === "members" && !isStaff(viewer) && !(await isActiveMember(viewer?.id));

  if (locked) {
    return (
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-slate-400 hover:text-brand">← Back</Link>
        <div className="mt-3 mb-2 flex items-center gap-2 text-sm">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">🔒 Members only</span>
        </div>
        <h1 className="mb-3 text-3xl font-bold leading-tight">{item.title}</h1>
        {item.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.coverImage} alt="" className="mb-6 aspect-video w-full rounded-xl object-cover" />
        )}
        {item.summary && <p className="prose-body text-slate-700">{item.summary}</p>}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-center">
          <h2 className="mb-1 text-lg font-semibold">This content is for members</h2>
          <p className="mb-4 text-slate-600">Become a member to read and watch everything.</p>
          <div className="flex justify-center gap-3">
            <Link href="/membership" className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark">
              See membership plans
            </Link>
            {!viewer && (
              <Link href="/login" className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </article>
    );
  }

  const type = item.type as ItemType;
  const source = item.source as Source;
  const ext = item.external;
  const action = actionLabel(type, source, ext?.sourceName);
  const price = priceFormat(item.productMeta?.priceCents, item.productMeta?.currency);

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/" className="text-slate-400 hover:text-brand">← Back</Link>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{TYPE_LABELS[type]}</span>
        <span className={`rounded-full px-2 py-0.5 font-medium ${source === "hosted" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          {source === "hosted" ? "Hosted" : `External · ${ext?.sourceName || ext?.sourceDomain}`}
        </span>
      </div>

      <h1 className="mb-2 text-3xl font-bold leading-tight">{item.title}</h1>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        {item.presenter ? (
          <Link href={`/presenters/${item.presenter.slug}`} className="font-medium text-brand hover:underline">
            {item.presenter.name}
          </Link>
        ) : (
          item.author && <span>By {item.author}</span>
        )}
        {item.tags.length > 0 && (
          <span className="flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <Link key={t.tagId} href={`/topics/${t.tag.slug}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs hover:text-brand">
                {t.tag.name}
              </Link>
            ))}
          </span>
        )}
      </div>

      {/* ---------- VIDEO ---------- */}
      {type === "video" && (
        <div className="mb-6">
          {source === "hosted" && item.videoMeta?.playerUrl ? (
            <video controls poster={item.coverImage || undefined} className="aspect-video w-full rounded-xl bg-black">
              <source src={item.videoMeta.playerUrl} />
            </video>
          ) : ext?.embedAllowed && ext.embedHtml ? (
            // Inline embed where the platform allows it.
            <div
              className="aspect-video w-full overflow-hidden rounded-xl bg-black [&>iframe]:h-full [&>iframe]:w-full"
              dangerouslySetInnerHTML={{ __html: ext.embedHtml }}
            />
          ) : (
            <a href={ext?.url} target="_blank" rel="noopener noreferrer nofollow" className="block">
              {item.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.coverImage} alt="" className="aspect-video w-full rounded-xl object-cover" />
              )}
            </a>
          )}
          {item.videoMeta?.duration && (
            <p className="mt-2 text-sm text-slate-500">Duration {durationFormat(item.videoMeta.duration)}</p>
          )}
        </div>
      )}

      {/* ---------- PRODUCT ---------- */}
      {type === "product" && (
        <div className="mb-6 flex flex-col gap-6 sm:flex-row">
          {item.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.coverImage} alt="" className="w-full rounded-xl object-cover sm:w-1/2" />
          )}
          <div className="flex flex-col">
            {price && <div className="mb-2 text-2xl font-bold">{price}</div>}
            {item.summary && <p className="mb-4 text-slate-600">{item.summary}</p>}
            {source === "hosted" ? (
              <AddToCartButton
                line={{
                  itemId: item.id,
                  title: item.title,
                  unitCents: item.productMeta?.priceCents || 0,
                  currency: item.productMeta?.currency || "USD",
                  coverImage: item.coverImage || undefined,
                }}
              />
            ) : (
              <a
                href={item.productMeta?.buyUrl || ext?.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-lg bg-brand px-5 py-2.5 text-center font-semibold text-white hover:bg-brand-dark"
              >
                {action} ↗
              </a>
            )}
            {source === "external" && item.productMeta?.priceCheckedAt && (
              <p className="mt-2 text-xs text-slate-400">
                Price last checked {new Date(item.productMeta.priceCheckedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ---------- ARTICLE / LINK cover ---------- */}
      {(type === "article" || type === "link") && item.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.coverImage} alt="" className="mb-6 aspect-video w-full rounded-xl object-cover" />
      )}

      {/* ---------- BODY ---------- */}
      {type === "article" && source === "hosted" && item.body ? (
        <BlockRenderer body={item.body} />
      ) : type === "article" && source === "external" ? (
        <div className="prose-body">
          {ext?.readerExcerpt && <p className="text-slate-700">{ext.readerExcerpt}</p>}
          {item.summary && !ext?.readerExcerpt && <p className="text-slate-700">{item.summary}</p>}
        </div>
      ) : (
        item.summary && <p className="prose-body text-slate-700">{item.summary}</p>
      )}

      {/* ---------- Source attribution + outbound action (external) ---------- */}
      {source === "external" && ext?.url && (
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
          <a
            href={ext.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
          >
            {action} ↗
          </a>
          <Attribution url={ext.url} name={ext.sourceName} favicon={ext.favicon} />
        </div>
      )}
    </article>
  );
}

