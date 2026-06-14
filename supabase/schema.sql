-- NOVUA Decision Room — minimal persistence schema
-- Run in Supabase SQL Editor or via supabase db push

create table if not exists workspace_state (
  id text primary key default 'default',
  session_started_at timestamptz not null default now(),
  applied_beat_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists deals (
  id text primary key,
  type text not null,
  title text not null,
  value_eur numeric not null,
  risk_score numeric not null,
  urgency_score numeric not null,
  margin_score numeric not null,
  confidence numeric not null,
  sla_hours numeric not null,
  deadline_at timestamptz not null,
  sla_breached boolean not null default false,
  urgency_boost numeric not null default 0,
  status text not null,
  financial_impact_eur numeric not null,
  decision_risk text not null,
  policy_block boolean not null,
  approval_state text not null,
  owner text not null,
  blockers jsonb not null default '[]'::jsonb,
  stakeholders jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists deal_events (
  id uuid primary key default gen_random_uuid(),
  deal_id text not null references deals(id) on delete cascade,
  display_time text not null,
  occurred_at timestamptz not null default now(),
  actor text not null,
  message text not null,
  tone text not null,
  source text not null default 'seed',
  beat_id text,
  created_at timestamptz not null default now()
);

create index if not exists deal_events_deal_id_occurred_at_idx
  on deal_events (deal_id, occurred_at);

alter table deals enable row level security;
alter table deal_events enable row level security;
alter table workspace_state enable row level security;

-- Server uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS). No anon policies yet.
