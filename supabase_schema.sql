-- ==========================================
-- 1. INSPECT EXISTING TABLES
-- Run this query to see all your current tables
-- ==========================================
/*
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
*/

-- ==========================================
-- 2. PROFILES (Login/Signup & Credits)
-- ==========================================
-- Create a table for public profiles (syncs with Auth)
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique,
  full_name text,
  avatar_url text,
  credits integer default 3, -- Free credits for new users
  is_subscribed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- RLS Policies
create policy "Users can view own profile." on profiles for select using (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Trigger to handle new user signup automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- 3. THEMES (Generated Content)
-- ==========================================
create table if not exists themes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_url text, -- The source URL
  product_name text,
  images text[], -- Array of image URLs
  primary_color text,
  secondary_color text,
  content jsonb, -- Store generated content structure
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table themes enable row level security;

-- RLS Policies
create policy "Users can view own themes." on themes for select using (auth.uid() = user_id);
create policy "Users can insert own themes." on themes for insert with check (auth.uid() = user_id);
create policy "Users can delete own themes." on themes for delete using (auth.uid() = user_id);
create policy "Public view for published themes." on themes for select using (is_published = true);

-- Indexes for hot paths
create index if not exists themes_user_id_idx on themes(user_id);
create index if not exists themes_created_at_idx on themes(created_at desc);


-- ==========================================
-- 4. SUBSCRIPTIONS (Plans & Payments)
-- ==========================================
create table if not exists subscriptions (
  id text primary key, -- Stripe Subscription ID
  user_id uuid references auth.users on delete cascade not null,
  status text check (status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')),
  stripe_customer_id text,
  price_id text,
  quantity integer,
  cancel_at_period_end boolean,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone
);

-- Enable RLS
alter table subscriptions enable row level security;

-- RLS Policies
create policy "Users can view own subscription." on subscriptions for select using (auth.uid() = user_id);

-- Indexes for hot paths
create index if not exists subscriptions_user_id_idx on subscriptions(user_id);
create index if not exists subscriptions_status_idx on subscriptions(status);
create index if not exists subscriptions_stripe_customer_id_idx on subscriptions(stripe_customer_id);


-- ==========================================
-- 4b. STRIPE CUSTOMERS (user_id <-> Stripe customer mapping)
-- ==========================================
create table if not exists stripe_customers (
  customer_id text primary key,        -- Stripe customer id (cus_*)
  email text not null,
  user_id uuid references auth.users on delete cascade, -- nullable so we can still record customers that came in webhook-first
  updated_at timestamp with time zone not null default now()
);

alter table stripe_customers enable row level security;
-- No RLS policies on purpose: only the service role (webhooks) should read/write.

create index if not exists stripe_customers_user_id_idx on stripe_customers(user_id);


-- ==========================================
-- 4c. STRIPE EVENTS (webhook idempotency log)
-- ==========================================
create table if not exists stripe_events (
  id text primary key,                 -- Stripe event id (evt_*)
  type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  created_at timestamp with time zone not null default now()
);

alter table stripe_events enable row level security;
-- No RLS policies on purpose: webhook-only via service role.

create index if not exists stripe_events_type_idx on stripe_events(type);
create index if not exists stripe_events_created_at_idx on stripe_events(created_at desc);


-- ==========================================
-- 4d. SHOPIFY SESSION (managed by @shopify/shopify-app-session-storage-prisma)
-- The Prisma model lives in prisma/schema.prisma; this is here for reference
-- only so the SQL file matches the live schema. The table is created on first
-- boot by ensurePrismaSessionTable() in lib/shopify.ts.
-- ==========================================
-- create table if not exists "Session" (
--   id text primary key,
--   shop text not null,
--   state text not null,
--   "isOnline" boolean not null default false,
--   scope text,
--   expires timestamp(3),
--   "accessToken" text not null,
--   "userId" bigint
-- );
-- create index if not exists "Session_shop_idx" on "Session"(shop);


-- ==========================================
-- 5. SCRAPE HISTORY (What users want to scrape)
-- ==========================================
-- Future-proofing: Save every URL they try to scrape, even if they don't finish
create table if not exists scrape_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  url text not null,
  status text default 'success', -- success, failed
  method text, -- 'scraperapi', 'direct', 'demo'
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table scrape_history enable row level security;

-- RLS Policies
create policy "Users can view own scrape history." on scrape_history for select using (auth.uid() = user_id);
create policy "Users can insert own scrape history." on scrape_history for insert with check (auth.uid() = user_id);


-- ==========================================
-- 6. ACTIVITY LOGS (Future Analytics)
-- ==========================================
-- Track user actions for analytics and debugging
create table if not exists activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  action text not null, -- 'login', 'generate_theme', 'download_code', 'copy_preview'
  details jsonb, -- Extra data (e.g., theme_id)
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table activity_logs enable row level security;

-- RLS Policies
create policy "Users can insert own logs." on activity_logs for insert with check (auth.uid() = user_id);
-- (No select policy for users - logs are for admins/analytics)


-- ==========================================
-- 7. BRAND ASSETS (User Experience)
-- ==========================================
-- Save logo and brand colors so users don't have to re-upload every time
create table if not exists brand_assets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  brand_name text,
  logo_url text,
  colors text[], -- Array of favorite hex codes
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table brand_assets enable row level security;

-- RLS Policies
create policy "Users can view own brand assets." on brand_assets for select using (auth.uid() = user_id);
create policy "Users can manage own brand assets." on brand_assets for all using (auth.uid() = user_id);


-- ==========================================
-- 8. THEME FEEDBACK (Product Improvement)
-- ==========================================
-- Collect ratings on generated themes to improve the AI
create table if not exists theme_feedback (
  id uuid default gen_random_uuid() primary key,
  theme_id uuid references themes on delete set null,
  user_id uuid references auth.users on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table theme_feedback enable row level security;

-- RLS Policies
create policy "Users can insert feedback." on theme_feedback for insert with check (auth.uid() = user_id);
-- Users generally don't need to read their own feedback, but admins do.


-- ==========================================
-- 9. ONBOARDING ANSWERS (Segmentation)
-- ==========================================
-- Understand who your users are (Dropshipper vs Brand vs Agency)
create table if not exists user_segmentation (
  user_id uuid references auth.users on delete cascade not null primary key,
  role text, -- 'dropshipper', 'brand_owner', 'agency', 'developer'
  goal text, -- 'launch_store', 'test_product', 'client_work'
  experience_level text, -- 'beginner', 'expert'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table user_segmentation enable row level security;

-- RLS Policies
create policy "Users can view own segmentation." on user_segmentation for select using (auth.uid() = user_id);
create policy "Users can update own segmentation." on user_segmentation for all using (auth.uid() = user_id);
