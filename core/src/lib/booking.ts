import { prisma } from "./db";

const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export interface BookingInput { name: string; email: string; service?: string; preferredAt?: string; message?: string; }

export async function createBooking(d: BookingInput) {
  const email = d.email.trim();
  if (!d.name.trim() || !email) throw new Error("Name and email are required.");
  if (!emailOk(email)) throw new Error("Please enter a valid email.");
  return prisma.bookingRequest.create({ data: {
    name: d.name.trim().slice(0, 200), email: email.slice(0, 200),
    service: d.service?.trim().slice(0, 200) || null,
    preferredAt: d.preferredAt?.trim().slice(0, 200) || null,
    message: d.message?.trim().slice(0, 3000) || null,
  } });
}
export async function listBookings() {
  return prisma.bookingRequest.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
}
export async function setBookingStatus(id: string, status: string) {
  if (!["new", "confirmed", "declined"].includes(status)) throw new Error("Bad status.");
  return prisma.bookingRequest.update({ where: { id }, data: { status } });
}
export async function deleteBooking(id: string) {
  return prisma.bookingRequest.delete({ where: { id } }).catch(() => null);
}
