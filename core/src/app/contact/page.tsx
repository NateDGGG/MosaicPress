import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSettings } from "../../lib/settings";
import ContactForm from "../../components/ContactForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: s.contactHeading || "Contact" };
}

export default async function ContactPage() {
  const s = await getSettings();
  if (!s.contactEnabled) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-3xl font-bold">{s.contactHeading || "Get in touch"}</h1>
      {s.contactBlurb && <p className="mb-6 text-slate-600">{s.contactBlurb}</p>}
      <ContactForm />
    </div>
  );
}
