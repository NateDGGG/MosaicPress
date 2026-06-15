import { prisma } from "./db";

export interface TestimonialInput { name: string; role?: string; quote: string; avatar?: string; rating?: number | null; featured?: boolean; }

export async function listTestimonials(opts?: { featuredOnly?: boolean }) {
  return prisma.testimonial.findMany({
    where: opts?.featuredOnly ? { featured: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}
export async function createTestimonial(d: TestimonialInput) {
  return prisma.testimonial.create({ data: {
    name: d.name.trim(), role: d.role?.trim() || null, quote: d.quote.trim(),
    avatar: d.avatar?.trim() || null, rating: d.rating ?? null, featured: d.featured ?? true,
  } });
}
export async function updateTestimonial(id: string, d: Partial<TestimonialInput>) {
  const data: Record<string, unknown> = {};
  for (const k of ["name", "role", "quote", "avatar"] as const) if (k in d) data[k] = (d as any)[k];
  if ("rating" in d) data.rating = d.rating ?? null;
  if ("featured" in d) data.featured = !!d.featured;
  return prisma.testimonial.update({ where: { id }, data });
}
export async function deleteTestimonial(id: string) {
  return prisma.testimonial.delete({ where: { id } }).catch(() => null);
}
export async function reorderTestimonials(ids: string[]) {
  await Promise.all(ids.map((id, i) => prisma.testimonial.update({ where: { id }, data: { sortOrder: i } }).catch(() => null)));
}
