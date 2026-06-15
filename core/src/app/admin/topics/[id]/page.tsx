import { notFound, redirect } from "next/navigation";
import { getSessionUser, hasRole } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { tagItems } from "../../../../lib/taxonomy";
import TopicEditor from "../../../../components/TopicEditor";

export const dynamic = "force-dynamic";

export default async function EditTopicPage({ params }: { params: { id: string } }) {
  const me = getSessionUser();
  if (!hasRole(me, "editor")) redirect("/admin");

  const tag = await prisma.tag.findUnique({ where: { id: params.id } });
  if (!tag) notFound();

  const items = await tagItems(tag.id, { sortMode: tag.sortMode });
  const list = items.map((i) => ({ id: i.id, title: i.title, type: i.type, status: i.status }));

  return (
    <TopicEditor
      tag={{ id: tag.id, name: tag.name, slug: tag.slug, intro: tag.intro || "", sortMode: tag.sortMode }}
      items={list}
    />
  );
}
