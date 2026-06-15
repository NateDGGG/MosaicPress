import crypto from "node:crypto";
import { ingestUrl } from "@mosaic/core/lib/ingest";

import { prisma } from "@mosaic/core/lib/db";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// SVG helpers (offline-safe placeholder imagery).
const cover = (label: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='50%' font-family='system-ui' font-size='40' fill='white' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`
  );
const avatar = (initials: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='52%' font-family='system-ui' font-size='80' fill='white' text-anchor='middle' dominant-baseline='middle'>${initials}</text></svg>`
  );

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "item";
}
async function uniqueSlug(base: string) {
  const root = slugify(base);
  let slug = root, n = 1;
  while (await prisma.item.findUnique({ where: { slug } })) { n++; slug = `${root}-${n}`; }
  return slug;
}

async function main() {
  // Clean slate
  await prisma.itemTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.collectionItem.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.linkMeta.deleteMany();
  await prisma.productMeta.deleteMany();
  await prisma.videoMeta.deleteMany();
  await prisma.externalSource.deleteMany();
  await prisma.item.deleteMany();
  await prisma.presenter.deleteMany();
  await prisma.user.deleteMany();
  await prisma.media.deleteMany();

  // Branding
  await prisma.setting.upsert({
    where: { key: "site" },
    update: {},
    create: {
      key: "site",
      value: JSON.stringify({
        siteName: "Mosaic Learn",
        tagline: "Five-minute ideas that explain the world.",
        themeId: "classic",
        primaryColor: "#1e3a8a",
        accentColor: "#dc2626",
        theme: "light",
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        currency: "USD",
        footerText: "Mosaic Learn — a demo built on Mosaic.",
      }),
    },
  });

  // Users
  const ownerEmail = process.env.SEED_OWNER_EMAIL || "owner@example.com";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || "changeme123";
  await prisma.user.createMany({
    data: [
      { email: ownerEmail.toLowerCase(), name: "Site Owner", role: "owner", passwordHash: hashPassword(ownerPassword) },
      { email: "editor@example.com", name: "Editor", role: "editor", passwordHash: hashPassword("editor123") },
    ],
  });

  // Membership plans (support the channel)
  await prisma.plan.createMany({
    data: [
      { name: "Supporter", description: "Support the mission + members-only lessons", priceCents: 500, currency: "USD", interval: "month", sortOrder: 0 },
      { name: "Supporter (Annual)", description: "Two months free", priceCents: 5000, currency: "USD", interval: "year", sortOrder: 1 },
    ],
  });

  // Presenters
  const presenters = await Promise.all([
    prisma.presenter.create({ data: { slug: "elena-marsh", name: "Dr. Elena Marsh", title: "Historian", sortOrder: 0, photo: avatar("EM", "#1e3a8a"), bio: "Historian focused on the ancient and early-modern world, making big eras understandable in minutes." } }),
    prisma.presenter.create({ data: { slug: "marcus-bell", name: "Marcus Bell", title: "Economist", sortOrder: 1, photo: avatar("MB", "#b45309"), bio: "Economist who explains markets, money, and trade without the jargon." } }),
    prisma.presenter.create({ data: { slug: "priya-rao", name: "Dr. Priya Rao", title: "Physicist", sortOrder: 2, photo: avatar("PR", "#0f766e"), bio: "Physicist and science communicator on how we know what we know." } }),
    prisma.presenter.create({ data: { slug: "james-okafor", name: "James Okafor", title: "Civics & Law", sortOrder: 3, photo: avatar("JO", "#7c3aed"), bio: "Writer on government, law, and the institutions that hold societies together." } }),
  ]);
  const P = Object.fromEntries(presenters.map((p) => [p.slug, p.id])) as Record<string, string>;

  // Topics (+ a default "General" topic for unassigned content)
  const topicNames = ["History", "Economics", "Science", "Civics", "Philosophy"];
  const topics = await Promise.all(topicNames.map((name) => prisma.tag.create({ data: { slug: slugify(name), name } })));
  const general = await prisma.tag.create({ data: { slug: "general", name: "General", isDefault: true } });
  const T = Object.fromEntries(topics.map((t) => [t.name, t.id])) as Record<string, string>;

  // Series (collections)
  const series = await Promise.all([
    prisma.collection.create({ data: { slug: "history-in-five", title: "History in Five", description: "The big eras, briefly.", coverImage: cover("History in Five", "#1e3a8a") } }),
    prisma.collection.create({ data: { slug: "economics-101", title: "Economics 101", description: "How markets and money work.", coverImage: cover("Economics 101", "#b45309") } }),
    prisma.collection.create({ data: { slug: "how-science-works", title: "How Science Works", description: "Method, evidence, discovery.", coverImage: cover("How Science Works", "#0f766e") } }),
    prisma.collection.create({ data: { slug: "foundations-of-civics", title: "Foundations of Civics", description: "The ideas behind good government.", coverImage: cover("Foundations of Civics", "#7c3aed") } }),
  ]);
  const S = Object.fromEntries(series.map((c) => [c.slug, c.id])) as Record<string, string>;
  const seriesPos: Record<string, number> = {};

  // ---- Real ingestion: pull live metadata from reputable, neutral sources ----
  type Entry = {
    url: string; fallbackTitle: string; fallbackSummary: string; coverBg: string;
    presenter: string; topics: string[]; series?: string; featured?: boolean; members?: boolean;
  };
  const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
  const entries: Entry[] = [
    // --- Real educational videos (verified, embeddable) — the headliners ---
    { url: yt("Yocja_N5s1I"), fallbackTitle: "The Agricultural Revolution (Crash Course)", fallbackSummary: "How farming changed human history.", coverBg: "#1e3a8a", presenter: "elena-marsh", topics: ["History"], series: "history-in-five", featured: true },
    { url: yt("3ez10ADR_gM"), fallbackTitle: "Intro to Economics (Crash Course)", fallbackSummary: "What economics is really about.", coverBg: "#b45309", presenter: "marcus-bell", topics: ["Economics"], series: "economics-101", featured: true },
    { url: yt("bHIhgxav9LY"), fallbackTitle: "The Biggest Misconception About Electricity", fallbackSummary: "Veritasium on how electricity actually works.", coverBg: "#0f766e", presenter: "priya-rao", topics: ["Science"], series: "how-science-works", featured: true },
    { url: yt("bO7FQsCcbD8"), fallbackTitle: "The Constitution, the Articles, and Federalism", fallbackSummary: "Crash Course on how the U.S. system came together.", coverBg: "#7c3aed", presenter: "james-okafor", topics: ["Civics", "History"], series: "foundations-of-civics", featured: true },
    { url: yt("zQGOcOUBi6s"), fallbackTitle: "The Immune System Explained", fallbackSummary: "Kurzgesagt on how your body fights infection.", coverBg: "#0f766e", presenter: "priya-rao", topics: ["Science"], series: "how-science-works" },
    { url: yt("aircAruvnKk"), fallbackTitle: "But What Is a Neural Network?", fallbackSummary: "3Blue1Brown's visual intro to deep learning.", coverBg: "#0f766e", presenter: "priya-rao", topics: ["Science"], series: "how-science-works" },
    { url: yt("1RWOpQXTltA"), fallbackTitle: "Plato's Allegory of the Cave", fallbackSummary: "A TED-Ed animation of Plato's famous thought experiment.", coverBg: "#334155", presenter: "elena-marsh", topics: ["Philosophy"] },
    { url: yt("kBdfcR-8hEY"), fallbackTitle: "Justice: The Moral Side of Murder", fallbackSummary: "Michael Sandel's celebrated Harvard lecture on moral reasoning.", coverBg: "#7c3aed", presenter: "james-okafor", topics: ["Philosophy", "Civics"], series: "foundations-of-civics" },

    // --- A few articles (ingested) for breadth ---
    { url: "https://en.wikipedia.org/wiki/Industrial_Revolution", fallbackTitle: "The Industrial Revolution", fallbackSummary: "The shift that remade work, cities, and growth.", coverBg: "#1e3a8a", presenter: "elena-marsh", topics: ["History", "Economics"], series: "history-in-five" },
    { url: "https://en.wikipedia.org/wiki/Comparative_advantage", fallbackTitle: "Comparative Advantage", fallbackSummary: "Why trade can make everyone better off.", coverBg: "#b45309", presenter: "marcus-bell", topics: ["Economics"], series: "economics-101" },
    { url: "https://en.wikipedia.org/wiki/Separation_of_powers", fallbackTitle: "Separation of Powers", fallbackSummary: "Why governments split authority three ways.", coverBg: "#7c3aed", presenter: "james-okafor", topics: ["Civics"], series: "foundations-of-civics" },

    // --- Members-only sample ---
    { url: "https://en.wikipedia.org/wiki/Stoicism", fallbackTitle: "An Introduction to Stoicism", fallbackSummary: "An ancient philosophy for a steadier life. (Members only)", coverBg: "#334155", presenter: "elena-marsh", topics: ["Philosophy"], members: true },
  ];

  let order = 0;
  const now = Date.now();
  for (const e of entries) {
    order++;
    let draft: any = null;
    try {
      draft = await ingestUrl(e.url);
    } catch {
      draft = null;
    }
    // Strip the trailing " - Wikipedia" site suffix for clean lesson titles.
    const cleaned = draft?.title ? draft.title.replace(/\s[-–—|]\s*Wikipedia\s*$/i, "").trim() : "";
    const title = cleaned && cleaned.length <= 80 ? cleaned : e.fallbackTitle;
    const summary = draft?.summary || e.fallbackSummary;
    const coverImage = draft?.coverImage || cover(e.fallbackTitle, e.coverBg);
    const ext = draft?.external || {};
    const slug = await uniqueSlug(title);

    await prisma.item.create({
      data: {
        slug,
        type: (draft?.type as string) || "article",
        source: "external",
        title,
        summary,
        coverImage,
        status: "published",
        access: e.members ? "members" : "public",
        featured: !!e.featured,
        publishedAt: new Date(now - order * 36e5),
        presenterId: P[e.presenter],
        external: {
          create: {
            url: e.url,
            canonicalUrl: ext.canonicalUrl || e.url,
            sourceName: ext.sourceName || "Wikipedia",
            sourceDomain: ext.sourceDomain || "wikipedia.org",
            favicon: ext.favicon || "https://www.google.com/s2/favicons?domain=wikipedia.org&sz=64",
            embedHtml: ext.embedHtml || null,
            embedAllowed: !!ext.embedAllowed,
            adapter: ext.adapter || "opengraph",
            readerExcerpt: summary,
            syncStatus: "ok",
          },
        },
        tags: { create: e.topics.map((name) => ({ tagId: T[name] })) },
        collections: e.series ? { create: { collectionId: S[e.series], position: (seriesPos[e.series] = (seriesPos[e.series] || 0) + 1) } } : undefined,
      },
    });
    console.log(`  + ${title}  (${draft ? "ingested" : "fallback"})`);
  }

  // ---- A hosted welcome video (sample clip) + a hosted article ----
  await prisma.item.create({
    data: {
      slug: "welcome-to-mosaic-learn", type: "video", source: "hosted",
      title: "Welcome to Mosaic Learn", summary: "A quick hello and how to get the most from these lessons.",
      coverImage: cover("Welcome", "#1e3a8a"), status: "published", featured: true,
      publishedAt: new Date(now), presenterId: P["marcus-bell"],
      videoMeta: { create: { playerUrl: "https://www.w3schools.com/html/mov_bbb.mp4", duration: 60 } },
    },
  });

  await prisma.item.create({
    data: {
      slug: "why-five-minute-lessons-work", type: "article", source: "hosted",
      title: "Why Five-Minute Lessons Work", summary: "The science of short-form learning.",
      coverImage: cover("Five-Minute Lessons", "#0f766e"), status: "published",
      publishedAt: new Date(now - 30 * 60000), presenterId: P["priya-rao"],
      body: JSON.stringify([
        { type: "paragraph", text: "Attention is a limited resource. Short, focused lessons respect it." },
        { type: "heading", level: 2, text: "Why brevity helps" },
        { type: "list", ordered: false, items: ["One idea per lesson", "A clear beginning and end", "Room to revisit later"] },
        { type: "quote", text: "If you can't explain it simply, you don't understand it well enough." },
      ]),
      tags: { create: [{ tagId: T["Science"] }] },
    },
  });

  // ----- Sample shop: hosted (checkout) + external (affiliate) products -----
  const shop = await prisma.collection.create({
    data: { slug: "shop", title: "Shop", description: "Support Mosaic Learn.", coverImage: cover("Shop", "#0f766e") },
  });
  let shopPos = 0;
  const addShopItem = (id: string) => prisma.collectionItem.create({ data: { collectionId: shop.id, itemId: id, position: shopPos++ } });

  const mug = await prisma.item.create({
    data: {
      slug: "mosaic-learn-mug", type: "product", source: "hosted",
      title: "Mosaic Learn Mug", summary: "Start your morning with a lesson.",
      coverImage: cover("Mug · $15", "#1e3a8a"), status: "published", publishedAt: new Date(now - 5 * 36e5),
      productMeta: { create: { priceCents: 1500, currency: "USD", kind: "physical", inventory: 50 } },
    },
  });
  const guide = await prisma.item.create({
    data: {
      slug: "civics-study-guide", type: "product", source: "hosted",
      title: "Civics Study Guide (PDF)", summary: "A printable companion to the Foundations of Civics series.",
      coverImage: cover("Study Guide · $9", "#7c3aed"), status: "published", publishedAt: new Date(now - 6 * 36e5),
      productMeta: { create: { priceCents: 900, currency: "USD", kind: "digital", fileUrl: "/downloads/civics-guide.pdf" } },
    },
  });
  // External / affiliate products (buyUrl can be an affiliate link; or set an Amazon tag in Settings)
  const extProduct = async (slug: string, title: string, summary: string, bg: string, buyUrl: string, priceCents: number) => {
    const it = await prisma.item.create({
      data: {
        slug, type: "product", source: "external", title, summary,
        coverImage: cover(title, bg), status: "published", publishedAt: new Date(now - 7 * 36e5),
        external: { create: { url: buyUrl, sourceName: "Amazon", sourceDomain: "amazon.com", favicon: "https://www.google.com/s2/favicons?domain=amazon.com&sz=64", embedAllowed: false, adapter: "manual" } },
        productMeta: { create: { priceCents, currency: "USD", kind: "physical", buyUrl, priceCheckedAt: new Date() } },
      },
    });
    return it;
  };
  const atlas = await extProduct("recommended-world-atlas", "Recommended: World Atlas", "A great companion for History in Five.", "#b45309", "https://www.amazon.com/dp/0241629330", 3499);
  const notebook = await extProduct("recommended-pocket-notebook", "Recommended: Pocket Notebook", "For taking notes on the go.", "#475569", "https://www.amazon.com/dp/B07CVL9TWY", 1299);
  for (const it of [mug, guide, atlas, notebook]) await addShopItem(it.id);

  // Any item without a topic falls under the default ("General").
  const untagged = await prisma.item.findMany({ where: { tags: { none: {} } }, select: { id: true } });
  if (untagged.length > 0) {
    await prisma.itemTag.createMany({ data: untagged.map((i) => ({ itemId: i.id, tagId: general.id })) });
  }

  const itemCount = await prisma.item.count();
  console.log(`\nSeeded ${itemCount} lessons, ${presenters.length} presenters, ${topics.length + 1} topics (incl. default), ${series.length} series.`);
  console.log(`Owner login: ${ownerEmail} / ${ownerPassword}  ·  editor@example.com / editor123`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
