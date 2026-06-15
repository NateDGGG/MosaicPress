import crypto from "node:crypto";
import { prisma } from "@mosaic/core/lib/db";

// Minimal seed for a fresh site: one owner account, sensible default settings,
// and a default "General" topic. Idempotent (safe to re-run) — it creates no
// demo content, so the creator starts from a clean slate.

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const siteName = "Healthfreedomu";

  await prisma.setting.upsert({
    where: { key: "site" },
    update: {},
    create: {
      key: "site",
      value: JSON.stringify({
        siteName,
        tagline: "Your tagline goes here.",
        themeId: "classic",
        primaryColor: "#1e3a8a",
        accentColor: "#dc2626",
        theme: "light",
        currency: "USD",
        footerText: `© ${new Date().getFullYear()} ${siteName}`,
      }),
    },
  });

  const ownerEmail = (process.env.SEED_OWNER_EMAIL || "owner@example.com").toLowerCase();
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || "changeme123";
  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: { email: ownerEmail, name: "Site Owner", role: "owner", passwordHash: hashPassword(ownerPassword) },
  });

  await prisma.tag.upsert({
    where: { slug: "general" },
    update: {},
    create: { slug: "general", name: "General", isDefault: true },
  });

  console.log(`\nReady. Owner login: ${ownerEmail} / ${ownerPassword}`);
  console.log("Sign in at /login, then add content from the admin dashboard.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
