# Hosting Nexusply on Hostinger (via GitHub)

This guide explains how to deploy the Nexusply MVP on Hostinger using GitHub for easy updates and version control.

## Prerequisites

- A GitHub account and a new repository for this project.
- A Hostinger VPS or Node.js hosting plan with SSH access.
- Domain name pointed to your Hostinger server.
- A Supabase project (URL + anon key + service role key).
- A Stripe account (test and/or live API keys).

## Deployment Steps

### 1. Push Project to GitHub

Your code is now on GitHub. Whenever you make changes locally:

```bash
git add .
git commit -m "Your description"
git push origin main
```

### 2. Clone on Hostinger Server

Connect to your server via SSH and clone the repository:

```bash
# Connect to server
ssh -p 65002 u751309044@82.198.228.114

# Clone the repository
git clone https://github.com/solitaire1895/supplier-web.git ~/nexusply
cd ~/nexusply
```

### 3. Install Dependencies and Build

On the server, install the dependencies and generate the production build:

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory on the server and add your production values:

```bash
nano .env
```

Add the following (update with real values). These names must match exactly what the code reads.

**Supabase**
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key.
- `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase service role key (server-side only, used by the Stripe webhook to bypass RLS). **Keep this secret.**

**Stripe — API keys**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Your Stripe publishable key (`pk_live_...` or `pk_test_...`).
- `STRIPE_SECRET_KEY` — Your Stripe secret key (`sk_live_...` or `sk_test_...`). **Keep this secret.**
- `STRIPE_WEBHOOK_SECRET` — The signing secret for your Stripe webhook endpoint (`whsec_...`).

**Stripe — Price IDs (one per paid plan)**
- `NEXT_PUBLIC_STRIPE_PRICE_ID_EXPLORER` — Price ID for the **Explorer / Explorateur** plan.
- `NEXT_PUBLIC_STRIPE_PRICE_ID_IMPORTER` — Price ID for the **Importer / Importateur** plan.
- `NEXT_PUBLIC_STRIPE_PRICE_ID_PARTNER` — Price ID for the **Partner / Partenaire** plan.

Example `.env`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe API keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_PRICE_ID_EXPLORER=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ID_IMPORTER=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ID_PARTNER=price_xxx
```

> ⚠️ **Security:** Never commit your `.env` file. It is already covered by `.gitignore` (`.env*`). If a secret key is ever exposed, roll it immediately in the Stripe Dashboard.

> ℹ️ **Note:** Any variable prefixed with `NEXT_PUBLIC_` is bundled into the client at build time. After changing a `NEXT_PUBLIC_*` variable you must rebuild (`npm run build`), not just restart.

---

## Stripe Setup (Detailed)

Follow these steps to fully enable subscription billing. The app maps Stripe Price IDs to internal plans in `app/api/stripe/webhook/route.ts`, and the frontend sends the selected Price ID from `components/sections/pricing.tsx`.

### A. Get Your API Keys

1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com/).
2. Toggle **Test mode** (top-right) if you want to test before going live.
3. Go to **Developers → API keys**.
4. Copy the **Publishable key** → set as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
5. Reveal and copy the **Secret key** → set as `STRIPE_SECRET_KEY`.

### B. Create Products and Prices

The app uses three paid plans: `explorateur`, `importateur`, and `partenaire`. For each one:

1. Go to **Product catalog → + Add product**.
2. Enter the product name (e.g., "Explorer", "Importer", "Partner").
3. Under **Pricing**, choose **Recurring** and set the amount and billing period (e.g., monthly).
4. Click **Save product**.
5. On the product page, copy the **Price ID** (it looks like `price_1A2b3C...`).

Then map each Price ID to the matching env var:

| Plan         | Internal name  | Env var                                |
| ------------ | -------------- | -------------------------------------- |
| Explorer     | `explorateur`  | `NEXT_PUBLIC_STRIPE_PRICE_ID_EXPLORER` |
| Importer     | `importateur`  | `NEXT_PUBLIC_STRIPE_PRICE_ID_IMPORTER` |
| Partner      | `partenaire`   | `NEXT_PUBLIC_STRIPE_PRICE_ID_PARTNER`  |

### C. Set Up the Webhook

The webhook keeps your Supabase `profiles` table in sync with Stripe (subscription created, updated, canceled).

1. In the Stripe Dashboard, go to **Developers → Webhooks → + Add endpoint**.
2. **Endpoint URL:** `https://yourdomain.com/api/stripe/webhook`
3. **Events to send:** the webhook handler currently processes:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **Add endpoint**.
5. On the endpoint page, reveal the **Signing secret** (`whsec_...`) and set it as `STRIPE_WEBHOOK_SECRET` in your `.env`.

### D. Test Locally (Optional)

Forward webhooks to your local dev server using the Stripe CLI:

```bash
# Install the Stripe CLI, then log in
stripe login

# Forward events to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a temporary `whsec_...` secret — use it as `STRIPE_WEBHOOK_SECRET` while testing locally.

Trigger a test event:

```bash
stripe trigger checkout.session.completed
```

### E. Go Live

1. In the Stripe Dashboard, switch **Test mode** off.
2. Recreate your products/prices in **Live mode** (test-mode prices do not work in live mode).
3. Update `.env` with the **live** keys (`pk_live_...`, `sk_live_...`) and the **live** webhook signing secret, plus the **live** Price IDs.
4. Rebuild and restart the app (see "Updating the App" below).

---

### 5. Start the Application with PM2

Use **PM2** to keep your application running in the background:

```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the Next.js application
pm2 start npm --name "nexusply" -- start
```

### 6. Updating the App

Whenever you make changes locally:

1. **Locally:** `git push origin main`
2. **On Server:**
   ```bash
   cd ~/nexusply
   git pull origin main
   npm install
   npm run build
   pm2 restart nexusply
   ```

## Troubleshooting

- **Logs:** Check PM2 logs using `pm2 logs nexusply`.
- **Permissions:** If you get permission errors, ensure your SSH user has rights to the directory.
- **Port Conflict:** If port 3000 is taken, you can change it in `package.json` or by setting the `PORT` environment variable.
- **Stripe "not configured" error:** If an API route returns `{ "error": "Stripe is not configured" }`, your `STRIPE_SECRET_KEY` is missing or invalid in `.env`. Verify the key and restart with `pm2 restart nexusply`.
- **Webhook signature errors:** Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret of the exact endpoint receiving the events, and that your server is reachable over HTTPS.
- **Plan not updating after payment:** Confirm the Price IDs in `.env` exactly match those in the Stripe Dashboard, and that `SUPABASE_SERVICE_ROLE_KEY` is set (the webhook needs it to update the `profiles` table).
- **Env changes not taking effect:** After editing `.env`, restart the app (`pm2 restart nexusply`). For any `NEXT_PUBLIC_*` variable, you must also rebuild (`npm run build`).
