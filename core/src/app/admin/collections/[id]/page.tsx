import { notFound, redirect } from "next/navigation";
import { getSessionUser, hasRole } from "../../../../lib/auth";
import { getCollectionById } from "../../../../lib/collections";
import { listItems } from "../../../../lib/items";
import CollectionEditor from "../../../../components/CollectionEditor";

export const dynamic = "force-dynamic";

export default async function EditCollectionPage({ params }: { params: { id: string } }) {
  const me = getSessionUser();
  if (!hasRole(me, "editor")) redirect("/admin");

  const col = await getCollectionById(params.id);
  if (!col) notFound();

  const all = await listItems();
  const inPath = col.items.map((ci) => ({ id: ci.item.id, title: ci.item.title, type: ci.item.type, status: ci.item.status }));
  const inIds = new Set(inPath.map((i) => i.id));
  const available = all.filter((i) => !inIds.has(i.id)).map((i) => ({ id: i.id, title: i.title, type: i.type, status: i.status }));

  return (
    <CollectionEditor
      collection={{ id: col.id, slug: col.slug, title: col.title, description: col.description || "", coverImage: col.coverImage || "" }}
      items={inPath}
      available={available}
    />
  );
}
