import { renderBlogHtml } from "../lib/blog";

// Server component: renders a stored blog body (markdown or HTML) as safe HTML.
export default function BlogRenderer({ body }: { body?: string | null }) {
  const html = renderBlogHtml(body);
  if (!html) return null;
  return <div className="prose-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
