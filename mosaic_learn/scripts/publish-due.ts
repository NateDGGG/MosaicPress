// Cron entrypoint: `npm run publish:due`. Schedule frequently, e.g. every minute:
//   * * * * *  cd /path/to/app && npm run publish:due
import { publishDue } from "../src/lib/schedule";

publishDue()
  .then((r) => {
    console.log(`[publish-due] published ${r.published} item(s)`);
    r.titles.forEach((t) => console.log(`  ✓ ${t}`));
    process.exit(0);
  })
  .catch((e) => {
    console.error("[publish-due] failed:", e);
    process.exit(1);
  });
