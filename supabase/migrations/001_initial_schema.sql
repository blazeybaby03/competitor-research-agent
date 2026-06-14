-- CompeteIQ initial schema
-- Run this in Supabase SQL editor: supabase.com → your project → SQL Editor
-- Safe to re-run: drops policies before recreating them

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'inactive', 'canceled')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  trial_reports_used integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Businesses ───────────────────────────────────────────────────────────────
create table if not exists public.businesses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  industry text not null,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

drop policy if exists "Users can CRUD own businesses" on public.businesses;

create policy "Users can CRUD own businesses"
  on public.businesses for all
  using (auth.uid() = user_id);

-- ─── Competitors ──────────────────────────────────────────────────────────────
create table if not exists public.competitors (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  name text,
  created_at timestamptz not null default now()
);

alter table public.competitors enable row level security;

drop policy if exists "Users can CRUD own competitors" on public.competitors;

create policy "Users can CRUD own competitors"
  on public.competitors for all
  using (auth.uid() = user_id);

-- ─── Scrape Jobs ──────────────────────────────────────────────────────────────
create table if not exists public.scrape_jobs (
  id uuid primary key default uuid_generate_v4(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  raw_content text,
  cleaned_text text,
  error_message text,
  scraped_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.scrape_jobs enable row level security;

drop policy if exists "Users can view own scrape jobs" on public.scrape_jobs;

create policy "Users can view own scrape jobs"
  on public.scrape_jobs for select
  using (
    exists (
      select 1 from public.competitors c
      where c.id = competitor_id and c.user_id = auth.uid()
    )
  );

-- ─── Reports ──────────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'generating', 'completed', 'failed')),
  title text not null,
  executive_summary text,
  competitor_summaries jsonb,
  positioning_analysis text,
  pricing_analysis text,
  strengths_weaknesses jsonb,
  market_gaps jsonb,
  recommended_actions jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reports enable row level security;

drop policy if exists "Users can CRUD own reports" on public.reports;

create policy "Users can CRUD own reports"
  on public.reports for all
  using (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_businesses_user_id on public.businesses(user_id);
create index if not exists idx_competitors_business_id on public.competitors(business_id);
create index if not exists idx_competitors_user_id on public.competitors(user_id);
create index if not exists idx_reports_user_id on public.reports(user_id);
create index if not exists idx_reports_business_id on public.reports(business_id);
create index if not exists idx_reports_created_at on public.reports(created_at desc);
