#!/usr/bin/env node
// Scaffold a brand-new, empty Mosaic project that a creator can start working in.
//
//   node core/scripts/create-project.mjs <slug> [--name "Display Name"]
//   npm run create-project -- <slug> --name "Display Name"
//
// It creates projects/<slug>/ as a thin app that re-exports @mosaic/core. The
// route tree, Prisma schema and global CSS are generated from core by the
// project's own `npm run sync` (run for you by ./start.sh). The new project
// gets its own SQLite database, its own .env (with a freshly generated session
// secret) and a one-command ./start.sh that sets everything up and runs it.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// ---- args ----
const argv = process.argv.slice(2);
let slug = "";
let displayName = "";
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--name" || a === "-n") displayName = argv[++i] || "";
  else if (a.startsWith("--name=")) displayName = a.slice(7);
  else if (!a.startsWith("-") && !slug) slug = a;
}

if (!slug) {
  console.error("Usage: node core/scripts/create-project.mjs <slug> [--name \"Display Name\"]");
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error(`Invalid project slug "${slug}". Use lowercase letters, numbers and hyphens, e.g. "my-site".`);
  process.exit(1);
}
if (!displayName) {
  displayName = slug.replace(/-+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---- paths ----
const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const coreRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(coreRoot, "..");
const projectDir = path.join(repoRoot, "projects", slug);

if (fs.existsSync(projectDir)) {
  console.error(`A project already exists at projects/${slug}. Choose a different slug or delete it first.`);
  process.exit(1);
}

const pkgName = `@mosaic/project-${slug}`;
const sessionSecret = crypto.randomBytes(32).toString("hex");

// ---- file templates ----
const files = {
  "package.json": JSON.stringify(
    {
      name: pkgName,
      version: "0.1.0",
      private: true,
      prisma: { schema: "schema.prisma", seed: "tsx prisma/seed.ts" },
      scripts: {
        sync: "node ../../core/scripts/sync-routes.mjs .",
        dev: "node ../../core/scripts/serve.mjs dev",
        build: "next build",
        start: "node ../../core/scripts/serve.mjs start",
        "db:generate": "prisma generate",
        "db:push": "prisma db push --skip-generate --accept-data-loss",
        "db:seed": "prisma db seed",
        setup: "npm run sync && npm run db:generate && npm run db:push && npm run db:seed",
      },
      dependencies: {
        "@mosaic/core": "*",
        next: "14.2.35",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
      },
      devDependencies: {
        "@types/node": "^20.14.0",
        "@types/react": "^18.3.3",
        "@types/react-dom": "^18.3.0",
        autoprefixer: "^10.4.19",
        postcss: "^8.4.40",
        prisma: "^5.18.0",
        tailwindcss: "^3.4.7",
        tsx: "^4.16.2",
        typescript: "^5.5.4",
      },
    },
    null,
    2
  ) + "\n",

  "next.config.mjs": `/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@mosaic/core"],
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};
export default nextConfig;
`,

  "postcss.config.mjs": `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
`,

  "tailwind.config.ts": `import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "../../core/src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "rgb(var(--brand) / <alpha-value>)", dark: "rgb(var(--brand-dark) / <alpha-value>)" },
        accent: { DEFAULT: "rgb(var(--accent) / <alpha-value>)" },
      },
    },
  },
  plugins: [],
};
export default config;
`,

  "tsconfig.json": JSON.stringify(
    {
      compilerOptions: {
        target: "ES2021",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        baseUrl: ".",
        paths: { "@/*": ["./src/*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2
  ) + "\n",

  "next-env.d.ts": `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.
`,

  ".env": `DATABASE_PROVIDER="sqlite"
DATABASE_URL="file:./data/dev.db"
APP_URL="http://localhost:3000"
SESSION_SECRET="${sessionSecret}"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
SMTP_HOST=""
EMAIL_FROM="${displayName} <no-reply@example.com>"
MEDIA_BACKEND="local"
SEED_OWNER_EMAIL="owner@example.com"
SEED_OWNER_PASSWORD="changeme123"
`,

  ".gitignore": `/node_modules
/.next
/data
/public/uploads/*
!/public/uploads/.gitkeep
next-env.d.ts
# Route stubs, schema and globals are generated from core by \`npm run sync\`.
/schema.prisma
/src/app/globals.css
`,

  "src/app/layout.tsx": `import "./globals.css";
import RootChrome from "@mosaic/core/components/RootChrome";

export { generateMetadata } from "@mosaic/core/app/metadata";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootChrome>{children}</RootChrome>;
}
`,

  // Placeholder; sync-routes overwrites this with core's globals.css (it only
  // skips files containing "MOSAIC:OVERRIDE", which this does not).
  "src/app/globals.css": `/* Replaced by core's globals.css on \`npm run sync\`. */
`,

  "public/uploads/.gitkeep": "",

  "prisma/seed.ts": `import crypto from "node:crypto";
import { prisma } from "@mosaic/core/lib/db";

// Minimal seed for a fresh site: one owner account, sensible default settings,
// and a default "General" topic. Idempotent (safe to re-run) — it creates no
// demo content, so the creator starts from a clean slate.

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return \`\${salt}:\${hash}\`;
}

async function main() {
  const siteName = ${JSON.stringify(displayName)};

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
        footerText: \`© \${new Date().getFullYear()} \${siteName}\`,
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

  console.log(\`\\nReady. Owner login: \${ownerEmail} / \${ownerPassword}\`);
  console.log("Sign in at /login, then add content from the admin dashboard.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
`,

  "start.sh": `#!/usr/bin/env bash
# One command to set up and run this project from a clean checkout.
# Idempotent: re-run any time. Pass a port with: PORT=3001 ./start.sh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$PROJECT_DIR/../.." && pwd)"
cd "$PROJECT_DIR"

# 1) Install workspace dependencies (hoisted to the repo root) the first time,
#    or whenever this project hasn't been linked into node_modules yet.
if [ ! -e "$REPO_ROOT/node_modules/${pkgName}" ]; then
  echo "==> Installing dependencies (first run)…"
  (cd "$REPO_ROOT" && npm install)
fi

# 2) Generate the route tree, Prisma schema and global CSS from core.
echo "==> Syncing routes from core…"
npm run sync

# 3) Prisma client + database file.
echo "==> Preparing the database…"
npm run db:generate
npm run db:push

# 4) Seed an owner + defaults only if the database has no users yet.
NEED_SEED="$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(c=>{process.stdout.write(c===0?'yes':'no');return p.\\$disconnect();}).catch(()=>process.stdout.write('yes'));")"
if [ "$NEED_SEED" = "yes" ]; then
  echo "==> Seeding owner + defaults…"
  npm run db:seed
else
  echo "==> Database already has data; skipping seed."
fi

# 5) Start the dev server (public on PORT, admin on PORT+1).
echo ""
echo "==> Starting ${displayName}"
echo "    Public: http://localhost:\${PORT:-3000}   ·   Admin: http://localhost:\$(( \${PORT:-3000} + 1 ))/admin"
npm run dev
`,

  "README.md": `# ${displayName}

A site built on **Mosaic**. This is a thin project that shares the Mosaic core
(\`../../core\`); its pages, API routes, database schema and base styles are
generated from core by \`npm run sync\`.

## Quick start

\`\`\`bash
cd projects/${slug}
./start.sh
\`\`\`

That installs dependencies (first run), generates the routes/schema from core,
creates the database, seeds an owner account, and starts two servers:

- **Public site** — http://localhost:3000
- **Admin** — http://localhost:3001/admin (the public port + 1)

Sign in to the admin with the default owner account
**\`owner@example.com\` / \`changeme123\`** — change these in \`.env\` before first
run for anything real. (Set a different public port with \`PORT=8080 ./start.sh\`;
the admin then runs on 8081.)

Prefer npm scripts? \`npm run setup && npm run dev\` does the same (minus the
dependency install, which you run once with \`npm install\` at the repo root).

## What's mine to edit

- \`.env\` — site URL, session secret, seed owner, Stripe/SMTP keys.
- \`prisma/seed.ts\` — starter data for a fresh database.
- \`src/app/layout.tsx\` — the root layout (kept; not overwritten by sync).
- Any generated route can be customized: copy it from core into the same path
  here and add a \`// MOSAIC:OVERRIDE\` comment so \`sync\` leaves it alone.

Everything else (routes, \`schema.prisma\`, \`src/app/globals.css\`) is regenerated
by \`npm run sync\` — don't hand-edit those unless you mark them as overrides.
`,
};

// ---- write ----
for (const [rel, contents] of Object.entries(files)) {
  const abs = path.join(projectDir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contents);
}
fs.chmodSync(path.join(projectDir, "start.sh"), 0o755);

console.log(`\nCreated projects/${slug}  (${pkgName})`);
console.log(`Site name: ${displayName}`);
console.log(`\nNext:`);
console.log(`  cd projects/${slug}`);
console.log(`  ./start.sh\n`);
console.log(`(Edit projects/${slug}/.env first to set your owner login and APP_URL.)`);
