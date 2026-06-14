"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button onClick={signOut} className="rounded-md px-2 py-1.5 text-sm text-slate-500 hover:text-red-600">
      Sign out
    </button>
  );
}
