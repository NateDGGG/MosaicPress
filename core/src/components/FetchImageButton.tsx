"use client";

import { useEffect, useRef, useState } from "react";

// Fetches a preview image (og:image, etc.) from a URL and hands it back.
// When the site's "auto-fetch" setting is on, it also runs automatically
// (debounced) once a valid URL is entered and no image is set yet.
export default function FetchImageButton({
  url, onImage, currentImage, className,
}: {
  url?: string | null;
  onImage: (src: string) => void;
  currentImage?: string | null;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [auto, setAuto] = useState(false);
  const lastTried = useRef("");

  useEffect(() => {
    let alive = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (alive) setAuto(!!d?.settings?.autoFetchImage); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  async function run(silent: boolean) {
    if (!url) { if (!silent) setMsg("Add a URL first."); return; }
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/link-preview", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }),
      });
      const d = await res.json();
      if (res.ok && d.preview?.image) { onImage(d.preview.image); setMsg(""); }
      else if (!silent) setMsg(d.preview ? "No image found on that page." : (d.error || "Couldn't read that URL."));
    } catch {
      if (!silent) setMsg("Couldn't read that URL.");
    }
    setBusy(false);
  }

  // Auto-fetch: enabled + valid URL + no image yet + not already tried this URL.
  useEffect(() => {
    if (!auto || !url || currentImage) return;
    if (!/^https?:\/\/\S+\.\S+/.test(url)) return;
    if (lastTried.current === url) return;
    const t = setTimeout(() => { lastTried.current = url; run(true); }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, url, currentImage]);

  return (
    <>
      <button
        type="button" onClick={() => run(false)} disabled={busy || !url}
        className={className || "whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"}
        title={url ? "Fetch a preview image from the URL" : "Enter a URL first"}
      >
        {busy ? "Fetching…" : "Fetch from link"}
      </button>
      {msg && <span className="text-xs text-amber-600">{msg}</span>}
    </>
  );
}
