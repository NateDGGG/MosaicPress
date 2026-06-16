// In-app help content for the admin. Each section has a stable `id` used as the
// anchor on the /admin/help page and as the `helpId` on tooltips / section help
// links. Bodies are trusted, author-written HTML (no user input) rendered on the
// help page. Keep entries short, plain-language, and task-oriented.

export interface HelpSection {
  id: string;
  title: string;
  html: string;
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    html: `
      <p>Your site is built from <strong>content</strong> (items you add) and
      <strong>settings</strong> (how it looks and what features are on).</p>
      <ol>
        <li>Set your <a href="#identity">name &amp; tagline</a> and pick a
        <a href="#style-preset">style preset</a>.</li>
        <li>Add content from the admin dashboard (write a post, or paste a link).</li>
        <li>Arrange the <a href="#home">home page</a> and turn on only the
        <a href="#capabilities">capabilities</a> you need.</li>
      </ol>
      <p>Every setting has a <strong>?</strong> tooltip; click <em>Learn more</em>
      in any tooltip to jump here.</p>`,
  },
  {
    id: "style-preset",
    title: "Style presets",
    html: `<p>One-click looks that set colors, fonts, and corner style together.
      Start here to get a coherent, professional design instantly. You can
      fine-tune anything afterwards under <em>Advanced appearance</em>.</p>`,
  },
  {
    id: "identity",
    title: "Site identity",
    html: `<p>The core text that tells visitors who you are.</p>
      <ul>
        <li><strong>Site name</strong> — your brand/title; shown in the header and browser tab.</li>
        <li><strong>Tagline</strong> — a short line summarizing what you offer; used in the hero and as the default search description.</li>
        <li><strong>Footer text</strong> — a bottom-of-page line such as a copyright.</li>
      </ul>`,
  },
  {
    id: "footer",
    title: "Footer builder",
    html: `<p>Add columns of links and a row of social links to the footer. Enter
      one link per line as <code>Label | https://url</code> (use <code>/path</code>
      for internal pages). Helps visitors navigate and signals a complete site.</p>`,
  },
  {
    id: "hero",
    title: "Hero banner",
    html: `<p>The large banner at the top of the home page — your biggest
      attention-grabber.</p>
      <ul>
        <li><strong>Layout</strong> — colored gradient, gradient + your image, or a full background photo.</li>
        <li><strong>Height</strong> — taller options reveal more of a full-bleed image so it isn't cropped.</li>
        <li><strong>Emphasis</strong> — make your site name the big heading, or your tagline.</li>
        <li><strong>Buttons</strong> — an optional primary and secondary call-to-action; clear a label to hide that button.</li>
      </ul>`,
  },
  {
    id: "branding",
    title: "Logo & header",
    html: `<p>Your logo and the top navigation bar, present on every page.</p>
      <ul>
        <li><strong>Logo</strong> — upload to replace the text site-name; choose its <strong>size</strong>, and turn on <em>Keep the logo on a white background</em> if a dark/colored logo blends into the header (also keeps it consistent in dark mode).</li>
        <li><strong>Favicon</strong> — the little browser-tab icon.</li>
        <li><strong>Header button</strong> — a prominent action for logged-out visitors (e.g. Join, Donate); clear the label to remove it.</li>
        <li><strong>Sign in / account button</strong> — turn off if you don't use logins or memberships.</li>
      </ul>`,
  },
  {
    id: "theme",
    title: "Theme, colors & typography",
    html: `<p>Pick a packaged theme, then fine-tune. Choose your <strong>primary</strong>
      and <strong>accent</strong> colors (a contrast warning appears if text would be
      hard to read), light or dark mode, and a heading/body <strong>font</strong>
      pairing with a text-size scale.</p>`,
  },
  {
    id: "section-colors",
    title: "Section colors & alternating bands",
    html: `<p>Optionally set explicit colors for the header, hero, call-to-action
      band, and footer; leave blank to derive them from your theme. The
      <strong>Alternate section background colors</strong> option (on the Home tab)
      gives stacked home sections cycling tints so they don't all look the same.</p>`,
  },
  {
    id: "cards",
    title: "Card style",
    html: `<p>How the repeated content cards look: image <strong>ratio</strong>
      (16:9 / 4:3 / square) and <strong>shadow</strong> depth. Because cards appear
      everywhere, small changes read across the whole site.</p>`,
  },
  {
    id: "home",
    title: "Home page sections",
    html: `<p>Compose the home page from stackable sections in any order: content
      rails (New releases, Featured, by type), <a href="#topics">Browse by topic</a>,
      collections, a <a href="#feature">“What is” block</a>, custom text, an
      Editor's-notes band, newsletter signup, and testimonials. Drag to reorder,
      toggle to show/hide, and set a preview count where available.</p>`,
  },
  {
    id: "topics",
    title: "Browse by topic",
    html: `<p>Shows your content grouped by topic, as a tabbed, tiled grid. Only
      topics you flag <strong>“show on home”</strong> (Admin → Topics) appear as
      tabs; if the default topic is among them it's selected first. Set
      <strong>Max per topic</strong> (a “See all” link appears when there's more)
      and the number of <strong>columns</strong> in the tile grid (default 4).</p>`,
  },
  {
    id: "content",
    title: "Commentary on cards",
    html: `<p>Your per-item <em>“From the editor”</em> notes can appear on home-page
      cards. Choose <strong>Hidden</strong> (cleanest), <strong>Excerpt</strong> (a
      short note that entices clicks), or <strong>Full</strong>. For a bolder voice,
      add an Editor's-notes section and flag items with “Feature this commentary”.</p>`,
  },
  {
    id: "feature",
    title: "“What is” / feature block",
    html: `<p>A centered home section with a <strong>title</strong>, a paragraph of
      <strong>text</strong>, an <strong>image</strong>, and an optional
      <strong>footer</strong> line — great for a "What is …?" introduction. Add it
      from the home-page section list and drag it where you want.</p>`,
  },
  {
    id: "progress",
    title: "Lesson progress & resume",
    html: `<p>Turns the site into a self-paced course player: it remembers how far a
      visitor has gotten so they can pick up where they left off (a <em>Resume</em>
      button on a path and <em>Complete &amp; continue</em> on a lesson).</p>
      <ul>
        <li><strong>Signed-in only</strong> — progress saved for logged-in visitors.</li>
        <li><strong>Everyone (no login)</strong> — saved on the visitor's device; merges into an account if they later sign in.</li>
        <li><strong>Off</strong> — hide progress, completion, and resume everywhere.</li>
      </ul>`,
  },
  {
    id: "commerce",
    title: "Commerce (selling)",
    html: `<p>Optional. Turn on <em>“I sell products”</em> to enable the cart,
      checkout, shipping step, stock indicators, and order pages. Add products from
      the admin (physical or digital), set a currency, and optionally an Amazon
      affiliate tag (auto-appended to Amazon links — works even with the cart off).
      Leave commerce off to run as a catalog/affiliate site.</p>`,
  },
  {
    id: "contact",
    title: "Contact form",
    html: `<p>Adds a public Contact page and nav link so visitors can reach you —
      the simplest way to capture inquiries. Messages appear under
      <strong>Admin → Messages</strong>, and are emailed to you if SMTP is set.</p>`,
  },
  {
    id: "newsletter",
    title: "Newsletter",
    html: `<p>An email signup so you can build an audience and bring visitors back.
      Add a “Newsletter signup” home section; subscribers appear under
      <strong>Admin → Subscribers</strong> and export as CSV for your email tool.</p>`,
  },
  {
    id: "booking",
    title: "Booking",
    html: `<p>Let visitors request or schedule time with you. Use the built-in
      request form (requests appear under <strong>Admin → Bookings</strong>) or
      embed an external scheduler like Calendly/Cal.com.</p>`,
  },
  {
    id: "custom-fields",
    title: "Custom fields",
    html: `<p>Define your own structured fields (e.g. prep time, difficulty, ISBN,
      price) that appear on items as a Details table. Mark a field
      <strong>filterable</strong> to power browse filters, and map it to a
      <strong>schema.org</strong> property to enrich search rich-results.</p>`,
  },
  {
    id: "seo",
    title: "SEO & analytics",
    html: `<p>How your site appears in Google and on social shares, plus visitor
      analytics.</p>
      <ul>
        <li><strong>Meta description</strong> &amp; <strong>social share image</strong> — used when a page has none of its own.</li>
        <li><strong>Allow indexing</strong> — turn off while a site is unfinished.</li>
        <li><strong>Analytics snippet</strong> — paste GA / Plausible / Fathom; it runs on every page.</li>
      </ul>
      <p>A sitemap is served at <code>/sitemap.xml</code> and robots at <code>/robots.txt</code>.</p>`,
  },
];

export const HELP_IDS = new Set(HELP_SECTIONS.map((s) => s.id));
