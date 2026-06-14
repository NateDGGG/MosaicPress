import type { Metadata } from "next";
import { getSettings } from "../../lib/settings";
import BlockRenderer from "../../components/BlockRenderer";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: s.aboutTitle || "About" };
}

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">{s.aboutTitle || "About"}</h1>
      {s.aboutBody ? (
        <BlockRenderer body={s.aboutBody} />
      ) : (
        <p className="text-slate-500">This page hasn&rsquo;t been written yet.</p>
      )}
    </article>
  );
}
