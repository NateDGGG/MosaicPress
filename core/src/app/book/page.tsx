import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSettings } from "../../lib/settings";
import BookingForm from "../../components/BookingForm";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: s.bookingHeading || "Book" };
}
export default async function BookPage() {
  const s = await getSettings();
  if (!s.bookingEnabled) notFound();
  const embed = s.bookingMode === "embed" && /^https:\/\//i.test(s.bookingEmbedUrl);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-3xl font-bold">{s.bookingHeading || "Book a session"}</h1>
      {s.bookingBlurb && <p className="mb-6 text-slate-600">{s.bookingBlurb}</p>}
      {embed ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <iframe src={s.bookingEmbedUrl} title="Booking scheduler" className="h-[720px] w-full" loading="lazy" />
        </div>
      ) : (
        <BookingForm />
      )}
    </div>
  );
}
