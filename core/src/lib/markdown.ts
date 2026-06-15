// Minimal, dependency-free Markdown → HTML. The output is always passed through
// sanitizeArticleHtml before rendering, so this focuses on structure, not safety.

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return s
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, a, u) => `<img src="${u}" alt="${a}">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, t, u) => `<a href="${u}">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/(^|[^a-zA-Z0-9])_([^_]+)_/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function renderMarkdown(md: string): string {
  if (!md) return "";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushPara = () => { if (para.length) { out.push(`<p>${inline(esc(para.join(" ")))}</p>`); para = []; } };
  const flushList = () => {
    if (list) { out.push(`<${list.type}>` + list.items.map((it) => `<li>${inline(esc(it))}</li>`).join("") + `</${list.type}>`); list = null; }
  };

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();

    if (/^```/.test(t)) {
      flushPara(); flushList();
      const buf: string[] = []; i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    if (t === "") { flushPara(); flushList(); i++; continue; }

    let m: RegExpMatchArray | null;
    if ((m = t.match(/^(#{1,4})\s+(.*)$/))) { flushPara(); flushList(); const lvl = Math.min(m[1].length, 4); out.push(`<h${lvl}>${inline(esc(m[2]))}</h${lvl}>`); i++; continue; }
    if (/^(---|\*\*\*|___)$/.test(t)) { flushPara(); flushList(); out.push("<hr>"); i++; continue; }
    if ((m = t.match(/^>\s?(.*)$/))) { flushPara(); flushList(); out.push(`<blockquote>${inline(esc(m[1]))}</blockquote>`); i++; continue; }
    if ((m = t.match(/^[-*+]\s+(.*)$/))) { flushPara(); if (!list || list.type !== "ul") { flushList(); list = { type: "ul", items: [] }; } list.items.push(m[1]); i++; continue; }
    if ((m = t.match(/^\d+\.\s+(.*)$/))) { flushPara(); if (!list || list.type !== "ol") { flushList(); list = { type: "ol", items: [] }; } list.items.push(m[1]); i++; continue; }

    flushList(); para.push(t); i++;
  }
  flushPara(); flushList();
  return out.join("\n");
}
