// Prints the number of users (used by the Docker entrypoint to decide whether
// to seed). Prints 0 if the table doesn't exist yet.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const n = await prisma.user.count();
  process.stdout.write(String(n));
} catch {
  process.stdout.write("0");
} finally {
  await prisma.$disconnect();
}
