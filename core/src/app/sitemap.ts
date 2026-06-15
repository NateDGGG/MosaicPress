import type { MetadataRoute } from "next";
import { prisma } from "../lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const [items, tags, cols] = await Promise.all([
    prisma.item.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }),
    prisma.tag.findMany({ select: { slug: true } }),
    prisma.collection.findMany({ select: { slug: true } }),
  ]);
  const staticPaths = ["", "/topics", "/presenters", "/collections", "/blog", "/links", "/shop", "/about", "/search"];
  return [
    ...staticPaths.map((p) => ({ url: base + (p || "/"), changeFrequency: "weekly" as const })),
    ...items.map((i) => ({ url: `${base}/i/${i.slug}`, lastModified: i.updatedAt })),
    ...tags.map((t) => ({ url: `${base}/topics/${t.slug}` })),
    ...cols.map((c) => ({ url: `${base}/collections/${c.slug}` })),
  ];
}
