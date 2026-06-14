-- Migration: Add direct factory access contact info to suppliers
-- Created: 2026-06-13

ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS wechat text,
ADD COLUMN IF NOT EXISTS private_email text;

-- Add comments for clarity
COMMENT ON COLUMN public.suppliers.whatsapp IS 'Direct factory WhatsApp number or phone';
COMMENT ON COLUMN public.suppliers.wechat IS 'Direct factory WeChat ID';
COMMENT ON COLUMN public.suppliers.private_email IS 'Direct factory private email address';
