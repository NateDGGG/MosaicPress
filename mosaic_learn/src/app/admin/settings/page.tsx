import { redirect } from "next/navigation";
import { getSessionUser, hasRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import SettingsForm from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = getSessionUser();
  if (!hasRole(me, "owner")) redirect("/admin");
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Settings</h1>
      <p className="mb-5 text-sm text-slate-500">
        Configure your site&rsquo;s name, look, and commerce defaults. Changes apply site-wide.
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
