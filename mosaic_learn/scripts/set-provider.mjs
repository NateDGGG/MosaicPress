// Rewrites the Prisma datasource `provider` to match DATABASE_PROVIDER.
// Prisma can't read the provider from an env var, so we patch the schema
// before `prisma generate` / `prisma db push`. Default: sqlite.
//
//   DATABASE_PROVIDER=postgresql node scripts/set-provider.mjs
import fs from "node:fs";
import path from "node:path";

const provider = (process.env.DATABASE_PROVIDER || "sqlite").trim();
const allowed = ["sqlite", "postgresql", "mysql"];
if (!allowed.includes(provider)) {
  console.error(`[set-provider] Unsupported DATABASE_PROVIDER "${provider}". Allowed: ${allowed.join(", ")}`);
  process.exit(1);
}

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");

const before = schema;
schema = schema.replace(
  /(datasource\s+db\s*\{[^}]*?provider\s*=\s*)"(sqlite|postgresql|mysql)"/,
  `$1"${provider}"`
);

if (schema === before) {
  console.log(`[set-provider] provider already "${provider}" (no change).`);
} else {
  fs.writeFileSync(schemaPath, schema);
  console.log(`[set-provider] provider set to "${provider}".`);
}
