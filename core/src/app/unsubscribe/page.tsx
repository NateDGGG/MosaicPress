import UnsubscribeForm from "../../components/UnsubscribeForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Unsubscribe" };
export default function UnsubscribePage({ searchParams }: { searchParams: { email?: string } }) {
  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-2 text-2xl font-bold">Unsubscribe</h1>
      <p className="mb-5 text-slate-600">Enter your email to stop receiving the newsletter.</p>
      <UnsubscribeForm initialEmail={searchParams.email || ""} />
    </div>
  );
}
