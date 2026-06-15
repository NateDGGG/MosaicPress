import type { Metadata } from "next";
import { getSettings } from "../lib/settings";

// Shared site-wide metadata. Projects re-export this from their root layout.
// Per-page generateMetadata (title/description) override these defaults.
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const base = process.env.APP_URL || "";
  const description = s.seoDescription || s.tagline;
  const images = s.ogImage ? [s.ogImage] : s.heroImage ? [s.heroImage] : undefined;
  return {
    metadataBase: base ? new URL(base) : undefined,
    title: { default: s.siteName, template: `%s \u00B7 ${s.siteName}` },
    description,
    openGraph: { title: s.siteName, description, siteName: s.siteName, type: "website", images },
    twitter: { card: "summary_large_image", site: s.twitterHandle || undefined, images },
    robots: s.seoIndexable ? undefined : { index: false, follow: false },
  };
}
