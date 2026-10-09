-- Milestone 1: durable identity, sessions, and moderation hooks. Real-time positions are never stored.
create table users (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('guest', 'wallet')),
  nickname      text not null check (char_length(nickname) between 2 and 20),
  color_index   smallint not null check (color_index between 0 and 7),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

-- Opaque session tokens: only the SHA-256 hash is stored.
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  token_hash  text not null unique,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  user_agent  text
);
create index sessions_user_idx on sessions(user_id);

create table user_blocks (
  blocker_id  uuid not null references users(id) on delete cascade,
  blocked_id  uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table reports (
  id           bigserial primary key,
  reporter_id  uuid not null references users(id) on delete cascade,
  target_id    uuid not null references users(id) on delete cascade,
  reason       text not null,
  note         text,
  created_at   timestamptz not null default now()
);
