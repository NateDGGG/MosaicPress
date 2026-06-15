# Codelab 4 — A small-business online shop

**Goal:** sell a handful of products (or services) online — cart, checkout,
inventory, and orders — plus the trust pieces a small business needs (about,
contact, reviews).

**You'll use:** **commerce** (cart/checkout/shipping/inventory/orders),
**product** items, the **About** and **contact** pages, **testimonials**, and an
optional **newsletter**.

**You'll skip:** membership and lesson-progress tracking. (Add **booking** instead
of products if you sell time/appointments.)

**Time:** ~35 minutes.

---

## Step 0 — Create your site

```bash
npm run create-project -- my-shop --name "Fern & Clay"
cd projects/my-shop
./start.sh
```

Sign in at `/login`.

---

## Step 1 — Branding (Admin → Settings → Appearance)

Set your **Site name** and **Tagline** ("Hand-thrown ceramics, made to use."),
pick a **Style preset**, upload a **logo**, and add a **hero** image of your
product. Set the **header button** to **"Shop"** → `/shop`.

---

## Step 2 — Turn on commerce (Admin → Settings → Capabilities → Commerce)

1. Check **"I sell products on this site."** This enables the cart, checkout,
   shipping step, stock indicators and order pages.
2. Check **Track inventory** and set a **low-stock threshold** (e.g. 3) so the
   storefront shows "Only N left" / "Sold out."
3. Check **Email customers when their order ships** if you fulfill physically.
4. Set your **Default currency** (e.g. USD).

**✅ Checkpoint:** a **Cart** appears in the nav and a `/shop` page exists.

---

## Step 3 — Add products (Admin → + Add product)

For each product:

- **Title**, **summary**, **cover image** (Upload).
- **Price** and **kind**: **physical** (collects shipping, tracks inventory) or
  **digital** (delivered as a signed download link after purchase).
- For physical goods, set **inventory** count.
- **Publish.**

Selling something you don't fulfill yourself? Create an **external/affiliate**
product whose button links out to where it's sold.

**✅ Checkpoint:** products show price and stock; physical ones add a shipping step
at checkout.

---

## Step 4 — Test the full purchase (no keys needed)

On the storefront: open a product → **Add to cart** → **Cart** → enter an email →
**Checkout**. With no Stripe keys configured, checkout runs in safe **stub mode**
and completes instantly. Check **Admin → Orders** — the order is recorded and (for
physical goods) ready to mark fulfilled; a receipt is "sent" in your dev log.

**✅ Checkpoint:** an order appears in **Admin → Orders**; digital items produce a
working download link.

---

## Step 5 — Add the trust pieces

- **About** (Admin → About) — your story, materials, shipping/returns info.
- **Contact form** (Capabilities) — enable it with your notify email so customers
  can reach you; messages land in **Admin → Messages**.
- **Testimonials** (Capabilities) — add customer reviews for social proof.
- **Newsletter** (Capabilities, optional) — announce restocks and sales.

---

## Step 6 — Home page that sells (Admin → Settings → Home page)

Order sections, e.g.:

1. **Hero** featuring a flagship product (Hero showcases → a specific item) with a
   "Shop now" button → `/shop`.
2. A **Products** rail (type: product) or **Featured**.
3. **Testimonials**.
4. **Newsletter signup**.

The dedicated `/shop` page lists everything for sale.

---

## Step 7 — Go live (real payments + SEO)

- **Payments:** add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env` to
  take real money; the webhook endpoint is `/api/webhooks/stripe`. Until then,
  stub mode lets you demo the whole flow.
- **Email:** add SMTP keys so receipts and ship notifications actually send.
- **SEO & analytics:** set a meta description and a social image (a hero product
  shot), keep indexing on, add analytics.
- Set `APP_URL` to your domain and change the owner credentials in `.env`.

**✅ Checkpoint:** with Stripe keys, a real card completes checkout and the order
is fulfilled with a receipt.

---

## Recommended settings at a glance

| Capability | Setting | Why |
|---|---|---|
| Commerce | **On** | The whole point — cart/checkout/orders |
| Track inventory | **On** (physical) | Show stock, prevent overselling |
| Contact form | **On** | Customers need to reach you |
| Testimonials | **On** | Reviews build buying confidence |
| Newsletter | Optional | Restock/sale announcements |
| Booking | Alternative | Use instead of products if you sell appointments |
| Membership / Progress | Off | Not relevant to a shop |

**Where this lives (for the curious):** the commerce flow is `CODEBASE_GUIDE.md`
§11 (cart → checkout → fulfill → receipt) and §13 (digital downloads/email);
prices are always recomputed server-side.
