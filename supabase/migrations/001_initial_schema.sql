-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Companies table
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  niche text,
  brand_voice_profile text,
  subscription_tier text default 'free',
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Users table (extends Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  company_id uuid references companies(id) on delete cascade,
  created_at timestamptz default now()
);

-- Locations table
create table locations (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  google_location_id text not null,
  name text not null,
  address text,
  created_at timestamptz default now()
);

-- Reviews table
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid not null references locations(id) on delete cascade,
  google_review_id text not null unique,
  rating integer not null check (rating between 1 and 5),
  reviewer_name text,
  review_text text,
  created_at timestamptz not null,
  synced_at timestamptz default now(),
  replied boolean default false,
  reply_text text,
  reply_posted_at timestamptz,
  sentiment_tag text,
  risk_flag boolean default false
);

-- AI logs table
create table ai_logs (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references reviews(id) on delete cascade,
  draft_text text,
  tokens_used integer,
  cost_estimate numeric(10,6),
  model text default 'gpt-4o-mini',
  created_at timestamptz default now()
);

-- Subscriptions table
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text not null default 'inactive',
  plan text not null default 'free',
  renewal_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Google OAuth tokens (encrypted)
create table google_oauth_tokens (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade unique,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  account_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table companies enable row level security;
alter table users enable row level security;
alter table locations enable row level security;
alter table reviews enable row level security;
alter table ai_logs enable row level security;
alter table subscriptions enable row level security;
alter table google_oauth_tokens enable row level security;

-- RLS Policies
create policy "Users can view own company" on companies
  for all using (
    id in (select company_id from users where id = auth.uid())
  );

create policy "Users can view own profile" on users
  for all using (id = auth.uid());

create policy "Users can view company locations" on locations
  for all using (
    company_id in (select company_id from users where id = auth.uid())
  );

create policy "Users can view company reviews" on reviews
  for all using (
    location_id in (
      select id from locations where company_id in (
        select company_id from users where id = auth.uid()
      )
    )
  );

create policy "Users can view company ai_logs" on ai_logs
  for all using (
    review_id in (
      select r.id from reviews r
      join locations l on r.location_id = l.id
      join users u on l.company_id = u.company_id
      where u.id = auth.uid()
    )
  );

create policy "Users can view company subscriptions" on subscriptions
  for all using (
    company_id in (select company_id from users where id = auth.uid())
  );

create policy "Users can view company oauth tokens" on google_oauth_tokens
  for all using (
    company_id in (select company_id from users where id = auth.uid())
  );

-- Indexes for performance
create index idx_reviews_location_id on reviews(location_id);
create index idx_reviews_replied on reviews(replied);
create index idx_reviews_rating on reviews(rating);
create index idx_reviews_risk_flag on reviews(risk_flag);
create index idx_locations_company_id on locations(company_id);
create index idx_users_company_id on users(company_id);
