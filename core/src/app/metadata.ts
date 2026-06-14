import type { Metadata } from "next";
import { getSettings } from "../lib/settings";

// Shared metadata generator; projects re-export this from their root layout.
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: { default: s.siteName, template: `%s · ${s.siteName}` }, description: s.tagline };
}
