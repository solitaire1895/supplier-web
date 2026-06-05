-- Add trial and subscription fields to profiles
alter table public.profiles 
add column trial_ends_at timestamp with time zone,
add column subscription_status text default 'free' check (subscription_status in ('free', 'trialing', 'active', 'canceled', 'past_due')),
add column stripe_subscription_id text;

-- Update handle_new_user function to include trial period
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, trial_ends_at, subscription_status)
  values (
    new.id, 
    new.email, 
    timezone('utc'::text, now()) + interval '14 days', 
    'trialing'
  );
  return new;
end;
$$ language plpgsql security definer;
