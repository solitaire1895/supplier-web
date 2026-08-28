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

---

## Support Chat System — Setup Instructions

The support page has been upgraded from a simple feedback form to a **real-time chat interface**. Users can start conversations with the support team, and admins can reply from the admin panel — all in real-time via Supabase Realtime.

### Action Required (1 Step)

#### Step 1: Run the SQL Migration

You must create the new `support_conversations` and `support_messages` tables in your Supabase database.

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **SQL Editor**
4. Click **New query**
5. Open the file `supabase/migrations/0011_support_chat.sql` from this project
6. Copy and paste its entire contents into the SQL Editor
7. Click **Run**

The SQL is idempotent (safe to run multiple times). It will:
- Create the `support_conversations` table (id, user_id, subject, status, created_at, updated_at)
- Create the `support_messages` table (id, conversation_id, sender_id, sender_role, content, created_at)
- Add indexes for fast lookups
- Enable Row Level Security with policies:
  - **Users** can insert/read/update their own conversations
  - **Users** can insert/read messages in their own conversations
  - **Admins** can read ALL conversations and messages
  - **Admins** can insert messages (replies) into any conversation
  - **Admins** can update any conversation status (resolve/reopen)
- Add both tables to the `supabase_realtime` publication for live updates
- Create a trigger to auto-update `updated_at` on new messages

### What Was Built

#### 1. User Support Page (`app/dashboard/support/page.tsx`)
- **FAQ section** (kept from before, collapsible accordion)
- **Contact cards** (Email + WhatsApp, kept from before)
- **Live Chat interface** (NEW):
  - Left sidebar: list of the user's conversations with status indicators
  - "New Chat" button to start a conversation (with optional subject + first message)
  - Right panel: chat bubbles (user messages in red on the right, admin replies in gray on the left)
  - Real-time message delivery via Supabase Realtime
  - "Resolve" / "Reopen" button to change conversation status
  - Auto-scroll to latest message
  - Enter to send, Shift+Enter for new line

#### 2. Admin Support Chat (`components/admin/support-chat-admin.tsx`)
- **Conversation list** with search (by user email, name, or subject) and status filter (all/open/resolved)
- Shows the user's email for each conversation
- **Open count badge** showing how many conversations need attention
- **Chat area** with the same bubble design (admin replies in red on the right, user messages in gray on the left)
- Real-time updates when users send new messages
- "Resolve" / "Reopen" button
- Admin replies are sent with `sender_role = 'admin'` and verified server-side

#### 3. Server Actions (`lib/supabase/actions.ts`)
Three new server actions were added:
- `createConversation(subject?)` — Creates a new conversation for the current user
- `sendMessage(conversationId, content, isAdmin)` — Sends a message; verifies admin role if `isAdmin=true`
- `resolveConversation(conversationId, status)` — Updates conversation status to 'open' or 'resolved'

#### 4. Admin Dashboard (`components/admin/admin-dashboard-client.tsx`)
- The Support tab now renders the `SupportChatAdmin` component instead of the old placeholder

### How to Verify

1. Run the SQL migration (Step 1 above)
2. Start your dev server: `npm run dev`
3. Sign in as a regular user
4. Go to `/dashboard/support`
5. Click "New Chat", write a message, and send it
6. Sign in as an admin in another browser/incognito window
7. Go to `/admin?tab=Support`
8. You should see the user's conversation in the list
9. Click it and reply — the user should see your reply appear in real-time
10. Click "Resolve" to mark the conversation as resolved

### Note About the Old `support_feedback` Table

The old `support_feedback` table and its feedback form have been replaced by the chat system. The table itself is not dropped by the migration (to preserve any existing data), but it is no longer used by the application. You can safely drop it manually if you no longer need it:
```sql
drop table if exists public.support_feedback cascade;
```

---

## Support Chat UI Redesign — Setup Instructions

The support chat interface has been redesigned to match the Nexusply brand identity with a premium glassmorphism design, category-based conversation flow, ticket IDs, agent assignment, and a resolution prompt system.

### Action Required (1 Step)

#### Step 1: Run the Enhancement Migration

You must add the new columns (`category`, `ticket_id`, `assigned_agent`) and update the status constraint to support 4 statuses.

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **SQL Editor**
4. Click **New query**
5. Open the file `supabase/migrations/0012_support_enhancements.sql` from this project
6. Copy and paste its entire contents into the SQL Editor
7. Click **Run**

The SQL is idempotent (safe to run multiple times). It will:
- Add `category` column (text, nullable) — stores the support category
- Add `ticket_id` column (text, unique, auto-generated like `TKT-XXXXXX`)
- Add `assigned_agent` column (text, nullable) — stores the agent name
- Update the `status` constraint to support: `open`, `waiting`, `resolved`, `closed`
- Add indexes on `ticket_id`, `category`, and `assigned_agent`

### What Was Built

#### Design System
- **Background**: Black (`#050505`)
- **Glass cards**: `rgba(255,255,255,0.04–0.06)` with `backdrop-blur-xl`
- **Borders**: `rgba(255,255,255,0.08–0.12)`
- **Primary**: Nexus red (`red-500`)
- **Corners**: Large rounded corners (`rounded-2xl`, `rounded-3xl`)
- **Effects**: Subtle red glow shadows, backdrop blur
- **Typography**: Clean, modern, high readability

#### User Support Page (`app/dashboard/support/page.tsx`)
Complete redesign with component architecture:

1. **SupportHeader** — Nexusply logo + "Nexusply Support" title + online status indicator
2. **SupportWelcome** — "Hi, how can we help?" greeting + description
3. **SupportCategories** — 5 category cards in a grid:
   - Account & Profile (User icon)
   - Supplier Support (Truck icon)
   - Product Support (Package icon)
   - Billing & Plan (CreditCard icon)
   - Technical Support (Wrench icon)
4. **Conversation** — Chat view with:
   - User messages: right-aligned, red bubbles, rounded-2xl rounded-br-md
   - Support messages: left-aligned with logo avatar, glass bubbles, agent name header
   - Timestamps on each message
5. **MessageComposer** — Glass input + red send button
6. **ResolutionPrompt** — "Was your issue resolved?" with "Yes, solved" / "Not yet" buttons
7. **SupportFooter** — "Nexusply Support · Typically replies within a few hours"

**Flow:**
1. User lands → sees header + welcome + category grid + existing conversations
2. Clicks a category → message form opens
3. Sends first message → conversation view opens
4. Admin replies → user sees reply with agent identity
5. Resolution prompt appears after admin reply
6. User clicks "Yes, solved" → status becomes `resolved`
7. User clicks "Not yet" → status becomes `waiting`

#### Admin Support Chat (`components/admin/support-chat-admin.tsx`)
- **Header** with Nexusply logo + open/waiting count badges
- **Conversation list** with:
  - Search by user email, name, subject, or ticket ID
  - Status filter (all/open/waiting/resolved/closed)
  - Category icon per conversation
  - Ticket ID display
  - Assigned agent display
- **Chat area** with:
  - User messages: left-aligned with user avatar icon
  - Admin messages: right-aligned with Nexusply logo avatar
  - Agent name header on admin messages
- **Status dropdown** — change status to any of the 4 statuses
- **Agent assignment** — assign an agent by name (e.g. "Sarah")

#### Server Actions (`lib/supabase/actions.ts`)
- `createConversation(subject?, category?)` — now accepts category parameter
- `updateConversationStatus(conversationId, status)` — supports all 4 statuses
- `assignAgent(conversationId, agentName)` — admin-only agent assignment
- `resolveConversation()` — backward-compatible alias for `updateConversationStatus`

#### Statuses
- **open** — New conversation, awaiting admin response
- **waiting** — User marked as "Not yet" resolved, awaiting admin follow-up
- **resolved** — User confirmed issue is solved
- **closed** — Admin closed the conversation

### How to Verify

1. Run the SQL migration (Step 1 above)
2. Start your dev server: `npm run dev`
3. Sign in as a regular user
4. Go to `/dashboard/support`
5. You should see the Nexusply logo, welcome message, and 5 category cards
6. Click a category and send a message
7. Sign in as admin in another browser → `/admin?tab=Support`
8. You should see the conversation with ticket ID and category icon
9. Reply to the user — they should see it in real-time with the agent name
10. The user should see the "Was your issue resolved?" prompt
11. Test the status dropdown and agent assignment in the admin panel

---

## Fix: Recommendation Functions Missing (PGRST202)

### Problem

The dashboard logs this error:
```
Error getting recommended suppliers: {
  code: 'PGRST202',
  message: 'Could not find the function public.get_recommended_suppliers(p_limit, p_user_id) in the schema cache'
}
```

This happens because the PostgreSQL functions `get_recommended_products` and `get_recommended_suppliers` (defined in `supabase/migrations/0006_search_and_recommendations.sql`) were never created in your Supabase database.

### Action Required (1 Step)

#### Step 1: Run the Recommendation Functions Migration

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **SQL Editor**
4. Click **New query**
5. Open the file `supabase/migrations/0013_recommendation_functions.sql` from this project
6. Copy and paste its entire contents into the SQL Editor
7. Click **Run**

The SQL is idempotent (safe to run multiple times). It will:
- Ensure the `user_activity` table exists (with RLS policies)
- Create or replace `get_recommended_products(p_user_id, p_limit)` function
- Create or replace `get_recommended_suppliers(p_user_id, p_limit)` function

### What Was Fixed in Code

- **`lib/supabase/actions.ts`** and **`lib/supabase/queries.ts`**: Both `getRecommendedProductsAction`/`getRecommendedProducts` and `getRecommendedSuppliersAction`/`getRecommendedSuppliers` now silently return `[]` when the `PGRST202` error is encountered (function not found), instead of logging a noisy error. This prevents terminal spam while you run the migration. Once the migration is applied, recommendations will work normally.
