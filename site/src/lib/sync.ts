import { prisma } from "./db";
import { assertSafeUrl, ingestUrl } from "./ingest";
import type { SyncStatus } from "./types";

// Background sync + link-health worker (design §4.5 "Keeping external content
// healthy"). Re-fetches metadata, flags dead/paywalled links, and detects
// price drift on external products. Runnable as a cron job (`npm run sync`),
// via the API (`POST /api/sync`), or from the admin Health page.

const HEALTH_TIMEOUT_MS = 8000;

async function checkHealth(url: URL): Promise<SyncStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "MosaicBot/0.1 (health-check)" },
    });
    if (res.status === 401 || res.status === 402 || res.status === 403) return "paywalled";
    if (!res.ok) return "broken";
    return "ok";
  } catch {
    return "broken";
  } finally {
    clearTimeout(timer);
  }
}

export interface SyncItemResult {
  itemId: string;
  title: string;
  status: SyncStatus;
  priceChanged?: { from: number | null; to: number | null };
}

export async function syncItem(itemId: string): Promise<SyncItemResult | null> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { external: true, productMeta: true },
  });
  if (!item || item.source !== "external" || !item.external?.url) return null;

  const rawUrl = item.external.url;
  let status: SyncStatus = "broken";
  let priceChanged: SyncItemResult["priceChanged"];

  try {
    const url = await assertSafeUrl(rawUrl);
    status = await checkHealth(url);

    if (status === "ok") {
      // Refresh metadata + detect price drift on products.
      const draft = await ingestUrl(rawUrl);
      await prisma.externalSource.update({
        where: { itemId },
        data: {
          sourceName: draft.external.sourceName ?? item.external.sourceName,
          favicon: draft.external.favicon ?? item.external.favicon,
          embedHtml: draft.external.embedHtml ?? item.external.embedHtml,
          embedAllowed: draft.external.embedAllowed,
          adapter: draft.external.adapter,
        },
      });

      if (item.type === "product" && draft.product?.priceCents != null) {
        const from = item.productMeta?.priceCents ?? null;
        const to = draft.product.priceCents;
        if (from !== to) priceChanged = { from, to };
        await prisma.productMeta.update({
          where: { itemId },
          data: { priceCents: to, priceCheckedAt: new Date() },
        });
      }
    }
  } catch {
    status = "broken";
  }

  await prisma.externalSource.update({
    where: { itemId },
    data: { syncStatus: status, lastSyncedAt: new Date() },
  });

  return { itemId, title: item.title, status, priceChanged };
}

export interface SyncSummary {
  total: number;
  ok: number;
  broken: number;
  paywalled: number;
  priceChanges: number;
  results: SyncItemResult[];
}

export async function syncAll(): Promise<SyncSummary> {
  const externals = await prisma.item.findMany({
    where: { source: "external" },
    select: { id: true },
  });

  const results: SyncItemResult[] = [];
  for (const { id } of externals) {
    const r = await syncItem(id);
    if (r) results.push(r);
  }

  return {
    total: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    broken: results.filter((r) => r.status === "broken").length,
    paywalled: results.filter((r) => r.status === "paywalled").length,
    priceChanges: results.filter((r) => r.priceChanged).length,
    results,
  };
}
