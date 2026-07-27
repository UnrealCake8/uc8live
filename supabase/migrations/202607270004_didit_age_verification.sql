create type public.identity_verification_status as enum ('not_started','in_progress','in_review','approved','declined','abandoned','expired','error');

alter table public.profiles
  add column identity_verification_status identity_verification_status not null default 'not_started',
  add column age_verified_at timestamptz;

create table public.identity_verification_sessions(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider_session_id text not null unique,
  status identity_verification_status not null default 'not_started',
  age integer check(age is null or age between 0 and 130),
  provider_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index identity_verification_sessions_user_id_idx on public.identity_verification_sessions(user_id,created_at desc);

create table public.didit_webhook_events(
  id uuid primary key default gen_random_uuid(),
  provider_session_id text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.identity_verification_sessions enable row level security;
alter table public.didit_webhook_events enable row level security;
-- Verification records contain sensitive identity metadata. They are service-role only.

create or replace function public.prevent_unverified_streaming() returns trigger language plpgsql set search_path=public as $$
begin
  if new.is_enabled and not exists (
    select 1 from public.profiles p where p.id=new.owner_id and p.age_verified_at is not null
  ) then raise exception 'AGE_VERIFICATION_REQUIRED'; end if;
  return new;
end;$$;
create trigger require_age_verification_before_enabling before insert or update of is_enabled on public.live_channels for each row execute procedure public.prevent_unverified_streaming();

-- Existing channels remain usable until explicitly disabled; new channels start disabled.
alter table public.live_channels alter column is_enabled set default false;
