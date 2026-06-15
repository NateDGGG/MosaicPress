import { prisma } from "./db";

export interface ContactInput { name: string; email: string; subject?: string; message: string; source?: string; }

export async function createSubmission(data: ContactInput) {
  return prisma.formSubmission.create({
    data: {
      name: data.name.trim().slice(0, 200),
      email: data.email.trim().slice(0, 200),
      subject: data.subject?.trim().slice(0, 200) || null,
      message: data.message.trim().slice(0, 5000),
      source: data.source?.slice(0, 200) || null,
    },
  });
}

export async function listSubmissions() {
  return prisma.formSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
}

export async function unreadCount() {
  return prisma.formSubmission.count({ where: { read: false } });
}

export async function markRead(id: string, read: boolean) {
  return prisma.formSubmission.update({ where: { id }, data: { read } });
}

export async function deleteSubmission(id: string) {
  return prisma.formSubmission.delete({ where: { id } }).catch(() => null);
}
