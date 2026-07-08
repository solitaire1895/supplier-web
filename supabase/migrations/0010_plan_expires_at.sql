-- ============================================================
-- Migration 0010: Add plan_expires_at column and fix constraints
-- ============================================================
-- This migration ensures the profiles table has the plan_expires_at
-- column that the Stripe webhook writes to, and that the
-- subscription_status constraint includes all statuses used by the
-- webhook handler.
-- ============================================================

-- 1. Add plan_expires_at column (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamp with time zone;

-- 2. Update subscription_status constraint to include all statuses
--    used by the webhook handler.
--    The original constraint from migration 0002 only allowed:
--    'free', 'trialing', 'active', 'canceled', 'past_due'
--    We keep those and they are already sufficient, but we drop and
--    recreate to be safe in case the constraint was missing.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('free', 'trialing', 'active', 'canceled', 'past_due'));

-- 3. Add an index on stripe_subscription_id for faster webhook lookups
--    (the webhook updates profiles by stripe_subscription_id for most events)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
  ON public.profiles(stripe_subscription_id);

-- 4. Add an index on stripe_customer_id for faster customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles(stripe_customer_id);