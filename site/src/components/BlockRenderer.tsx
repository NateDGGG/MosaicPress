import { parseBlocks, embedSrc, type Block } from "@/lib/blocks";
import { sanitizeRichText } from "@/lib/sanitize";

// Server-safe renderer for article block bodies.
export default function BlockRenderer({ body }: { body: string }) {
  const blocks = parseBlocks(body);
  if (blocks.length === 0) return null;
  return <div className="prose-body">{blocks.map((b, i) => <BlockView key={i} block={b} />)}</div>;
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return block.level === 3 ? (
        <h3 className="mt-6 mb-2 text-lg font-semibold">{block.text}</h3>
      ) : (
        <h2>{block.text}</h2>
      );
    case "paragraph":
      return <p dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.text) }} />;
    case "quote":
      return (
        <blockquote
          className="my-4 border-l-4 border-brand pl-4 italic text-slate-600"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.text) }}
        />
      );
    case "list":
      return block.ordered ? (
        <ol className="my-4 list-decimal pl-6">{block.items.map((it, i) => <li key={i} className="mb-1">{it}</li>)}</ol>
      ) : (
        <ul className="my-4 list-disc pl-6">{block.items.map((it, i) => <li key={i} className="mb-1">{it}</li>)}</ul>
      );
    case "image":
      return (
        <figure className="my-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt || ""} className="w-full rounded-xl" />
          {block.caption && <figcaption className="mt-1 text-center text-sm text-slate-500">{block.caption}</figcaption>}
        </figure>
      );
    case "embed": {
      const src = embedSrc(block.url);
      return src ? (
        <div className="my-5 aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe src={src} className="h-full w-full" allowFullScreen title="embed" />
        </div>
      ) : (
        <p className="my-4">
          <a href={block.url} target="_blank" rel="noopener noreferrer" className="text-brand underline">
            {block.url}
          </a>
        </p>
      );
    }
    case "code":
      return (
        <pre className="my-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
          <code>{block.text}</code>
        </pre>
      );
    case "divider":
      return <hr className="my-8 border-slate-200" />;
    default:
      return null;
  }
}
