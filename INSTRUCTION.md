# Fix: Plan Not Updated After Checkout — Setup Instructions

## Problem

When users complete a Stripe checkout, their `active_plan` in the Supabase `profiles` table is not updated. This document explains the root cause and the **external actions you must take** to complete the fix.

---

## Root Cause

The Stripe webhook (`/api/stripe/webhook`) is responsible for updating the user's plan after a successful checkout. It uses the Supabase **Service Role Key** to bypass RLS and write directly to the `profiles` table.

**The `SUPABASE_SERVICE_ROLE_KEY` environment variable was missing from `.env.local`.** Without it, the webhook creates a Supabase client with an empty key, every database update silently fails, and the user's plan is never updated.

---

## Action Required (3 Steps)

### Step 1: Add the Supabase Service Role Key to `.env.local`

This is the **most critical step**. Without it, the webhook cannot update the database.

1. Go to your Supabase Dashboard: **https://supabase.com/dashboard**
2. Select your project: **zpwpsojgjrxxgbpbaanr** (or your actual project)
3. Navigate to: **Settings → API**
4. Under **Project API Keys**, find the **`service_role`** key
   - ⚠️ **WARNING**: This key bypasses RLS. Never expose it to the client. Never commit it to git.
5. Copy the `service_role` key value
6. Open your `.env.local` file and add this line at the end:

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_actual_service_role_key_here
```

7. **Restart your dev server** after adding the env variable:
   ```bash
   # Stop the current server (Ctrl+C) then:
   npm run dev
   ```

### Step 2: Run the SQL Migration

The `plan_expires_at` column (used by the webhook to store the subscription expiry date) may not exist in your database yet. Run the migration to create it.

1. Go to your Supabase Dashboard
2. Navigate to: **SQL Editor**
3. Click **New query**
4. Open the file `supabase/migrations/0010_plan_expires_at.sql` from this project
5. Copy and paste its entire contents into the SQL Editor
6. Click **Run**

The SQL is idempotent (safe to run multiple times). It will:
- Add the `plan_expires_at` column if it doesn't exist
- Ensure the `subscription_status` constraint is correct
- Add indexes on `stripe_subscription_id` and `stripe_customer_id` for faster webhook lookups

### Step 3: Configure the Stripe Webhook Endpoint

The webhook must be registered in Stripe so that Stripe sends event notifications to your app.

#### For Local Development:

1. Install the Stripe CLI (if not already installed):
   ```bash
   # On macOS:
   brew install stripe/stripe-cli/stripe
   
   # On Linux:
   curl -s https://packages.stripe.dev/api/security/key.txt | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg > /dev/null
   echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
   sudo apt update && sudo apt install stripe
   ```

2. Start the Stripe webhook listener in a separate terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. The CLI will print a **webhook signing secret** like:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxx
   ```

4. Update `STRIPE_WEBHOOK_SECRET` in your `.env.local` with this value:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
   ```

5. Restart your dev server.

#### For Production:

1. Go to the **Stripe Dashboard**: https://dashboard.stripe.com
2. Navigate to: **Developers → Webhooks**
3. Click **Add endpoint**
4. Set the endpoint URL to:
   ```
   https://your-domain.com/api/stripe/webhook
   ```
   (Replace `your-domain.com` with your actual deployed domain, e.g. `https://nexusply.com/api/stripe/webhook`)
5. Under **Events to send**, select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Click **Add endpoint**
7. After creating the endpoint, click on it and find the **Signing secret**
8. Copy the signing secret (starts with `whsec_`)
9. Update `STRIPE_WEBHOOK_SECRET` in your production environment variables with this value

---

## What Was Fixed in Code

The following code changes were made to fix the issue:

### 1. `app/api/stripe/webhook/route.ts`
- **Added validation**: The webhook now checks that `SUPABASE_SERVICE_ROLE_KEY` is present before processing. If missing, it returns a 500 error and logs a clear error message.
- **Added error checking**: All Supabase update calls now check for errors and retry up to 3 times with backoff. Previously, errors were silently swallowed.
- **Added logging**: Every webhook event is now logged with context (event type, user ID, plan, status) so you can debug issues in the server console.
- **Added `.select()` to updates**: This confirms how many rows were actually updated, and warns if 0 rows matched.

### 2. `lib/supabase/provider.tsx`
- **Fixed `active_plan` case**: Changed `"Free"` (capitalized) to `"free"` (lowercase) in the fallback profile creation. The `lib/plans.ts` file uses lowercase plan names, so this ensures consistency.

### 3. `components/dashboard/dashboard-client.tsx`
- **Added success-redirect polling**: When users return from Stripe checkout with `?success=true`, the dashboard now polls `refreshProfile()` up to 6 times (every 2 seconds) to detect when the webhook has updated the plan. This handles the race condition where the webhook hasn't finished processing by the time the user lands back on the dashboard.
- **Fixed `active_plan` case**: Changed `"Free"` to `"free"` in `handleContactSupplier` for consistency.

### 4. `supabase/migrations/0010_plan_expires_at.sql`
- **New migration file**: Ensures the `plan_expires_at` column exists in the `profiles` table, fixes the `subscription_status` constraint, and adds indexes for faster webhook lookups.

---

## How to Verify the Fix Works

After completing the 3 steps above:

1. Start your dev server: `npm run dev`
2. Open the app and sign in
3. Go to the pricing page and click a plan to subscribe
4. Complete the Stripe checkout (use a test card: `4242 4242 4242 4242`, any future date, any CVC)
5. You should be redirected back to `/dashboard?success=true`
6. Check your server console — you should see logs like:
   ```
   WEBHOOK received event: checkout.session.completed
   WEBHOOK [checkout.session.completed] updating user <uuid> to plan: explorateur
   WEBHOOK [checkout.session.completed] success: { matched: 'id', value: '<uuid>', updatedRows: 1, newPlan: 'explorateur', newStatus: 'active' }
   ```
7. Go to **Profile → Plan** tab — your plan should show the updated plan name and a renewal countdown

### If the plan still doesn't update:

1. Check your server console for `WEBHOOK FATAL: Missing Supabase environment variables` — this means `SUPABASE_SERVICE_ROLE_KEY` is not set
2. Check your server console for `WEBHOOK SIGNATURE ERROR` — this means `STRIPE_WEBHOOK_SECRET` doesn't match
3. Check the Stripe Dashboard → Developers → Webhooks → your endpoint → **Events** tab to see if events are being sent
4. Check the Supabase Dashboard → Table Editor → `profiles` table to see if the `active_plan` column was updated

---

## Admin Panel: Manual Plan Management

As an admin, you can now manually update any user's plan directly from the admin panel. This is useful for fixing errors (e.g. a user paid but the webhook failed, or you want to grant a complimentary plan).

### How It Works

1. Go to **/admin** in your app (you must be signed in as an admin or super_admin)
2. In the **User Management** table, the **Plan** column now shows a dropdown selector for each user
3. Select the desired plan from the dropdown:
   - **Free** — resets to free plan, clears `plan_expires_at`
   - **Explorer** — sets `active_plan` to `explorateur`, `subscription_status` to `active`, `plan_expires_at` to now + 30 days
   - **Importer** — sets `active_plan` to `importateur`, `subscription_status` to `active`, `plan_expires_at` to now + 30 days
   - **Partner** — sets `active_plan` to `partenaire`, `subscription_status` to `active`, `plan_expires_at` to now + 30 days
4. The change takes effect immediately — the user's dashboard will reflect the new plan on their next page load

### Security

- The `updateUserPlan` server action verifies that the caller is an admin or super_admin before making any changes
- The plan value is validated against the allowed list (`free`, `explorateur`, `importateur`, `partenaire`)
- All admin plan changes are logged to the server console: `Admin <admin_id> updated user <user_id> plan to: <plan>`

### No SQL Required

The existing RLS policy `profiles_update` (defined in `supabase/fixes.sql`) already allows admins to update any profile row:
```sql
CREATE POLICY "profiles_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());
```
No additional SQL migration is needed for admin plan management.

### What Was Fixed in the Admin Panel

1. **`lib/supabase/actions.ts`** — Added `updateUserPlan()` server action with admin verification, plan validation, and automatic `subscription_status` / `plan_expires_at` updates
2. **`components/admin/users-admin.tsx`**:
   - Replaced the static plan badge with a dropdown selector (visible to admins and super_admins)
   - Fixed plan badge colors to match actual plan names (was using non-existent `'pro'` and `'enterprise'`)
   - Fixed revenue calculation to use actual plan prices from `lib/plans.ts` (1,700 / 2,900 / 4,000 FCFA) instead of hardcoded USD values
   - Fixed the Status column to show `subscription_status` (active/trialing/canceled/past_due) instead of the non-existent `status` field
   - Revenue display now shows FCFA instead of USD
