import { redirect } from "next/navigation";
import { getSessionUser, hasRole } from "../../../lib/auth";
import { listSubmissions } from "../../../lib/contact";
import MessageRow from "../../../components/MessageRow";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const me = getSessionUser();
  if (!hasRole(me, "editor")) redirect("/admin");
  const subs = await listSubmissions();
  const unread = subs.filter((s) => !s.read).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{subs.length} total · {unread} unread</span>
      </div>
      {subs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No messages yet. Enable the contact form under Settings → Contact form.
        </p>
      ) : (
        <div className="space-y-3">
          {subs.map((s) => (
            <MessageRow key={s.id} m={{ id: s.id, name: s.name, email: s.email, subject: s.subject, message: s.message, read: s.read, createdAt: s.createdAt.toISOString() }} />
          ))}
        </div>
      )}
    </div>
  );
}
