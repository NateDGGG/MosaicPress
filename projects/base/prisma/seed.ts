import crypto from "node:crypto";

import { prisma } from "@mosaic/core/lib/db";

// Inline scrypt hash (mirrors src/lib/auth.ts) so the seed doesn't import
// Next-only modules.
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const SVG = (label: string, bg: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>
       <rect width='100%' height='100%' fill='${bg}'/>
       <text x='50%' y='50%' font-family='system-ui' font-size='44' fill='white'
         text-anchor='middle' dominant-baseline='middle'>${label}</text>
     </svg>`
  );

async function main() {
  // Clean slate (dev convenience).
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
  await prisma.user.deleteMany();
  await prisma.media.deleteMany();

  // Default settings row.
  await prisma.setting.upsert({
    where: { key: "site" },
    update: {},
    create: {
      key: "site",
      value: JSON.stringify({
        siteName: "Mosaic",
        tagline: "Your content and the web's best — in one format.",
        primaryColor: "#1d4ed8",
        accentColor: "#0f766e",
        theme: "light",
        currency: "USD",
        footerText: "Mosaic · a self-hostable, all-in-one multimedia CMS.",
      }),
    },
  });

  // Membership plans.
  await prisma.plan.createMany({
    data: [
      { name: "Supporter", description: "Monthly support + members-only content", priceCents: 500, currency: "USD", interval: "month", sortOrder: 0 },
      { name: "Supporter (Annual)", description: "Two months free", priceCents: 5000, currency: "USD", interval: "year", sortOrder: 1 },
    ],
  });

  // Users: owner (from env), plus demo editor & contributor.
  const ownerEmail = process.env.SEED_OWNER_EMAIL || "owner@example.com";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || "changeme123";
  await prisma.user.createMany({
    data: [
      { email: ownerEmail.toLowerCase(), name: "Site Owner", role: "owner", passwordHash: hashPassword(ownerPassword) },
      { email: "editor@example.com", name: "Editor", role: "editor", passwordHash: hashPassword("editor123") },
      { email: "writer@example.com", name: "Contributor", role: "contributor", passwordHash: hashPassword("writer123") },
    ],
  });

  const now = new Date();

  // ----- HOSTED items -----
  const hostedArticle = await prisma.item.create({
    data: {
      slug: "the-basics", type: "article", source: "hosted",
      title: "The Basics: A Hosted Article", featured: true,
      summary: "Written right here in the editor — full native reading experience.",
      coverImage: SVG("Hosted Article", "#1d4ed8"),
      author: "Site Owner", status: "published", publishedAt: now,
      body: JSON.stringify([
        { type: "paragraph", text: "This article lives in Mosaic and renders in our own reading layout, built with the block editor." },
        { type: "heading", level: 2, text: "Why hosted content matters" },
        { type: "paragraph", text: "You own it, it loads instantly, and it can be edited in place." },
        { type: "quote", text: "Your content and the web's best — in one format." },
        { type: "heading", level: 3, text: "What the editor supports" },
        { type: "list", ordered: false, items: ["Headings, paragraphs, quotes", "Images and embeds", "Lists, code, dividers"] },
        { type: "divider" },
        { type: "paragraph", text: "Mix any of these blocks to build a rich article." },
      ]),
    },
  });

  const hostedVideo = await prisma.item.create({
    data: {
      slug: "welcome-hosted-video", type: "video", source: "hosted",
      title: "Welcome (Hosted Video)",
      summary: "A self-hosted clip playing in our own player frame.",
      coverImage: SVG("Hosted Video", "#0f766e"),
      author: "Site Owner", status: "published", publishedAt: now,
      videoMeta: { create: { playerUrl: "https://www.w3schools.com/html/mov_bbb.mp4", duration: 305 } },
    },
  });

  const hostedProduct = await prisma.item.create({
    data: {
      slug: "starter-workbook", type: "product", source: "hosted",
      title: "Starter Workbook",
      summary: "Sold through our own checkout. Digital download.",
      coverImage: SVG("$19 Workbook", "#9333ea"),
      status: "published", publishedAt: now,
      productMeta: { create: { priceCents: 1900, currency: "USD", kind: "digital", fileUrl: "/downloads/workbook.pdf" } },
    },
  });

  // ----- EXTERNAL items (pre-cached metadata so the demo works offline) -----
  const extVideo = await prisma.item.create({
    data: {
      slug: "deep-dive-external-video", type: "video", source: "external",
      title: "Deep Dive (External Video)",
      summary: "A YouTube video — same card & watch page, plays inline.",
      coverImage: SVG("YouTube Video", "#dc2626"),
      author: "Creator", status: "published", publishedAt: now,
      external: { create: {
        url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        sourceName: "YouTube", sourceDomain: "youtube.com",
        favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64",
        embedAllowed: true,
        embedHtml: '<iframe width="560" height="315" src="https://www.youtube.com/embed/aqz-KE-bpKQ" title="YouTube" frameborder="0" allowfullscreen></iframe>',
        adapter: "oembed", syncStatus: "ok",
      } },
      videoMeta: { create: { duration: 634 } },
    },
  });

  const extArticle = await prisma.item.create({
    data: {
      slug: "industry-overview-external", type: "article", source: "external",
      title: "Industry Overview (External Article)",
      summary: "An article on another site — rendered in our chrome, links out.",
      coverImage: SVG("External Article", "#475569"),
      author: "Guest Author", status: "published", publishedAt: now, access: "members",
      external: { create: {
        url: "https://en.wikipedia.org/wiki/Content_management_system",
        canonicalUrl: "https://en.wikipedia.org/wiki/Content_management_system",
        sourceName: "Wikipedia", sourceDomain: "wikipedia.org",
        favicon: "https://www.google.com/s2/favicons?domain=wikipedia.org&sz=64",
        readerExcerpt: "A content management system (CMS) is computer software used to manage the creation and modification of digital content...",
        embedAllowed: false, adapter: "opengraph", syncStatus: "ok",
      } },
    },
  });

  const extProduct = await prisma.item.create({
    data: {
      slug: "recommended-gear-external", type: "product", source: "external",
      title: "Recommended Gear (External Product)",
      summary: "An affiliate listing — same product card, buys on the source.",
      coverImage: SVG("Buy on Amazon", "#ea580c"),
      status: "published", publishedAt: now,
      external: { create: {
        url: "https://www.amazon.com/dp/B08N5WRWNW",
        sourceName: "Amazon", sourceDomain: "amazon.com",
        favicon: "https://www.google.com/s2/favicons?domain=amazon.com&sz=64",
        embedAllowed: false, adapter: "scrape", syncStatus: "ok",
      } },
      productMeta: { create: { priceCents: 4999, currency: "USD", kind: "physical", buyUrl: "https://www.amazon.com/dp/B08N5WRWNW", priceCheckedAt: now } },
    },
  });

  const extLink = await prisma.item.create({
    data: {
      slug: "further-reading-link", type: "link", source: "external",
      title: "Further Reading",
      summary: "A curated resource that isn't cleanly an article/video/product.",
      coverImage: SVG("Resource Link", "#0891b2"),
      status: "published", publishedAt: now,
      external: { create: {
        url: "https://developer.mozilla.org/",
        sourceName: "MDN", sourceDomain: "developer.mozilla.org",
        favicon: "https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=64",
        embedAllowed: false, adapter: "opengraph", syncStatus: "ok",
      } },
      linkMeta: { create: { url: "https://developer.mozilla.org/", note: "The best web docs, free." } },
    },
  });

  // ----- A collection that blends hosted & external, all four types -----
  const collection = await prisma.collection.create({
    data: {
      slug: "getting-started", title: "Getting Started",
      description: "Hosted and external content, side-by-side in one format.",
      coverImage: SVG("Getting Started", "#1e3a8a"),
    },
  });

  const order = [hostedVideo, extVideo, hostedArticle, extArticle, hostedProduct, extProduct, extLink];
  await prisma.collectionItem.createMany({
    data: order.map((it, i) => ({ collectionId: collection.id, itemId: it.id, position: i })),
  });

  // Topics, with a default ("General") for unassigned content.
  const general = await prisma.tag.create({ data: { slug: "general", name: "General", isDefault: true } });
  const guides = await prisma.tag.create({ data: { slug: "guides", name: "Guides" } });
  const news = await prisma.tag.create({ data: { slug: "news", name: "News" } });
  await prisma.itemTag.createMany({
    data: [
      { itemId: hostedArticle.id, tagId: guides.id },
      { itemId: extArticle.id, tagId: news.id },
    ],
  });
  // Anything still without a topic falls under the default.
  const untagged = await prisma.item.findMany({ where: { tags: { none: {} } }, select: { id: true } });
  await prisma.itemTag.createMany({ data: untagged.map((i) => ({ itemId: i.id, tagId: general.id })) });

  console.log(`Seeded ${order.length} items in 1 collection, 3 topics (incl. default).`);
  console.log(`Owner login: ${ownerEmail} / ${ownerPassword}`);
  console.log("Also: editor@example.com / editor123, writer@example.com / writer123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
