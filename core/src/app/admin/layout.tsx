import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, hasRole } from "../../lib/auth";
import SignOutButton from "../../components/SignOutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = getSessionUser();
  if (!user) redirect("/login");
  const isOwner = hasRole(user, "owner");

  return (
    // The admin UI is always a light surface — pin its color-scheme to light so a
    // dark site theme (or a browser's auto-dark) doesn't render native controls
    // (inputs, file-upload buttons) dark and low-contrast.
    <div style={{ colorScheme: "light" }}>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <span className="font-semibold text-slate-800">Admin</span>
        <span className="text-slate-300">/</span>
        <Link href="/admin" className="text-sm text-slate-600 hover:text-brand">Content</Link>
        <Link href="/admin/presenters" className="text-sm text-slate-600 hover:text-brand">Presenters</Link>
        <Link href="/admin/topics" className="text-sm text-slate-600 hover:text-brand">Topics</Link>
        <Link href="/admin/collections" className="text-sm text-slate-600 hover:text-brand">Paths</Link>
        <Link href="/admin/media" className="text-sm text-slate-600 hover:text-brand">Media</Link>
        <Link href="/admin/health" className="text-sm text-slate-600 hover:text-brand">Health</Link>
        <Link href="/admin/orders" className="text-sm text-slate-600 hover:text-brand">Orders</Link>
        <Link href="/admin/messages" className="text-sm text-slate-600 hover:text-brand">Messages</Link>
        <Link href="/admin/subscribers" className="text-sm text-slate-600 hover:text-brand">Subscribers</Link>
        <Link href="/admin/bookings" className="text-sm text-slate-600 hover:text-brand">Bookings</Link>
        <Link href="/admin/testimonials" className="text-sm text-slate-600 hover:text-brand">Testimonials</Link>
        {isOwner && (
          <>
            <Link href="/admin/plans" className="text-sm text-slate-600 hover:text-brand">Plans</Link>
            <Link href="/admin/settings" className="text-sm text-slate-600 hover:text-brand">Settings</Link>
            <Link href="/admin/about" className="text-sm text-slate-600 hover:text-brand">About</Link>
            <Link href="/admin/users" className="text-sm text-slate-600 hover:text-brand">Users</Link>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-slate-400 sm:inline">
            {user.name || user.email} · {user.role}
          </span>
          <Link href="/admin/new" className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-blue-50">
            + New
          </Link>
          <Link href="/admin/new-blog" className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-blue-50">
            + Write blog
          </Link>
          <Link href="/admin/new-link" className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-blue-50">
            + Share link
          </Link>
          <Link href="/admin/new-from-link" className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
            + New from link
          </Link>
          <Link href="/admin/import-book" className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-blue-50">
            + Import book
          </Link>
          <Link href="/admin/bulk-import" className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-blue-50">
            + Bulk import
          </Link>
          <Link href="/admin/new-product" className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-blue-50">
            + Add product
          </Link>
          <SignOutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
