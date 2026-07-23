-- Evolve · Datenbank-Schema (Meilenstein A2)
-- Im Supabase-SQL-Editor ausfuehren (Dashboard -> SQL Editor -> New query -> Run).
-- Ein lebendes Wesen pro Nutzer (v1). Row Level Security: jeder sieht nur sein eigenes.

create table if not exists public.creatures (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  genome       jsonb       not null,                 -- 8 Gene [0..1]
  env          jsonb       not null,                 -- 6 Umwelt-Regler [0..1]
  generation   integer     not null default 0,
  lineage_seed bigint      not null,                 -- Lebens-Seed (Drift)
  discovered   text[]      not null default '{}',    -- Genbuch: entdeckte Archetypen
  name         text,                                 -- optionaler Name (Meilenstein B)
  last_seen    timestamptz not null default now(),   -- fuer Offline-Zeit-Nachsimulation
  updated_at   timestamptz not null default now()
);

alter table public.creatures enable row level security;

-- Jeder Nutzer darf ausschliesslich sein eigenes Wesen lesen/schreiben.
create policy "creatures_select_own" on public.creatures
  for select using (auth.uid() = user_id);
create policy "creatures_insert_own" on public.creatures
  for insert with check (auth.uid() = user_id);
create policy "creatures_update_own" on public.creatures
  for update using (auth.uid() = user_id);
create policy "creatures_delete_own" on public.creatures
  for delete using (auth.uid() = user_id);

-- updated_at automatisch pflegen
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists creatures_touch on public.creatures;
create trigger creatures_touch before update on public.creatures
  for each row execute function public.touch_updated_at();
