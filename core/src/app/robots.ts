import type { MetadataRoute } from "next";
import { getSettings } from "../lib/settings";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const s = await getSettings();
  if (!s.seoIndexable) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${base}/sitemap.xml` };
}
