"use client";

import { useState } from "react";
import Link from "next/link";

// Interactive "Browse by topic": a header, a row of topic tabs, and the content
// grid for the selected topic. The default topic is selected first; clicking a
// tab swaps the grid (panels are pre-rendered on the server and toggled here).
export default function TopicBrowser({
  title,
  tabs,
  panels,
  initial = 0,
}: {
  title: string;
  tabs: { name: string; slug: string; seeAll: boolean }[];
  panels: React.ReactNode[];
  initial?: number;
}) {
  const [i, setI] = useState(initial >= 0 && initial < panels.length ? initial : 0);
  if (panels.length === 0) return null;
  const cur = tabs[i];
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {cur?.seeAll && (
          <Link href={`/topics/${cur.slug}`} className="shrink-0 text-sm font-medium text-brand hover:underline">
            See all →
          </Link>
        )}
      </div>
      {tabs.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((t, idx) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => setI(idx)}
              aria-pressed={idx === i}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                idx === i
                  ? "bg-brand text-white"
                  : "border border-current text-current opacity-70 hover:opacity-100"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
      {panels.map((panel, idx) => (
        <div key={idx} className={idx === i ? "" : "hidden"}>
          {panel}
        </div>
      ))}
    </section>
  );
}
