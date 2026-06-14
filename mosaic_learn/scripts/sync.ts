// Cron entrypoint: `npm run sync`. Schedule e.g. hourly:
//   0 * * * *  cd /path/to/app && npm run sync
import { syncAll } from "../src/lib/sync";

syncAll()
  .then((s) => {
    console.log(
      `[sync] ${s.total} external items — ok:${s.ok} broken:${s.broken} paywalled:${s.paywalled} priceChanges:${s.priceChanges}`
    );
    for (const r of s.results) {
      const note = r.priceChanged ? ` (price ${r.priceChanged.from} → ${r.priceChanged.to})` : "";
      console.log(`  ${r.status.padEnd(9)} ${r.title}${note}`);
    }
    process.exit(0);
  })
  .catch((e) => {
    console.error("[sync] failed:", e);
    process.exit(1);
  });
