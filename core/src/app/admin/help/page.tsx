import { HELP_SECTIONS } from "../../../lib/help";

export const dynamic = "force-dynamic";
export const metadata = { title: "Help" };

// In-app help. Each section has an `id` anchor so tooltips and section help links
// can deep-link here (opened in a popup window from the admin).
export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-1 py-2">
      <h1 className="mb-1 text-2xl font-bold">Help</h1>
      <p className="mb-6 text-sm text-slate-500">
        Plain-language guidance for the admin settings. Jump to a topic below, or
        click <span className="font-medium">Learn more</span> in any setting&rsquo;s tooltip.
      </p>

      {/* Linkable table of contents */}
      <nav aria-label="Help contents" className="mb-8 rounded-xl border border-slate-200 bg-white p-4">
        <ul className="grid gap-1 sm:grid-cols-2">
          {HELP_SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-sm text-brand hover:underline">{s.title}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-8">
        {HELP_SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="mb-2 text-lg font-bold text-slate-900">{s.title}</h2>
            <div
              className="prose-body text-[15px] text-slate-700 [&_a]:text-brand [&_a]:underline [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: s.html }}
            />
            <a href="#top" className="mt-2 inline-block text-xs text-slate-400 hover:text-brand">↑ back to top</a>
          </section>
        ))}
      </div>
    </div>
  );
}
