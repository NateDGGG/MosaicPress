import { redirect } from "next/navigation";
import { getSessionUser, hasRole } from "../../../lib/auth";
import { listBookings } from "../../../lib/booking";
import BookingRow from "../../../components/BookingRow";

export const dynamic = "force-dynamic";
export default async function BookingsPage() {
  const me = getSessionUser();
  if (!hasRole(me, "editor")) redirect("/admin");
  const rows = await listBookings();
  const pending = rows.filter((b) => b.status === "new").length;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{rows.length} total · {pending} new</span>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">No booking requests yet. Enable booking under Settings → Booking.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => (
            <BookingRow key={b.id} b={{ id: b.id, name: b.name, email: b.email, service: b.service, preferredAt: b.preferredAt, message: b.message, status: b.status, createdAt: b.createdAt.toISOString() }} />
          ))}
        </div>
      )}
    </div>
  );
}
