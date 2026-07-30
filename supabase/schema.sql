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


-- ===========================================================================
-- Vergleichsraum (V1-Ausbaustufe, docs/bindung-konzept.md Abschnitt 3 V1/V5):
-- feste Startwelt -> Bestenliste nach Generationenzahl -> "Welt der Woche".
--
-- Ein Ergebnis = "Spieler X hat Herausforderung Y in Startwelt Z nach N
-- Generationen geschafft, und dabei kam Form F heraus". Genau zwei Dinge werden
-- damit sichtbar:
--   1. VIELFALT  — welche Formen andere aus derselben Welt hervorgebracht haben
--                  (das eigentliche Ziel: "drei Spieler haben einen Pilz gemacht,
--                  du einen Fisch"),
--   2. Generationenzahl — als sekundaeres Ranking, kein Punktesystem.
--
-- KEINE personenbezogenen Daten: kein Name, kein frei getippter Text, keine
-- E-Mail. `form`/`kingdom` stammen aus dem festen Vokabular von classify()
-- (44 Archetypen / 5 Reiche), sind also nicht frei waehlbar.
--
-- ANTI-MANIPULATION, bewusst minimal (der Client ist autoritativ, es gibt KEINE
-- Server-Simulation — das ist kein E-Sport-Titel):
--   * Schreiben nur angemeldet und nur die EIGENE Zeile (RLS, auth.uid()).
--   * Primaerschluessel (user_id, world_key, challenge_id): genau EIN Eintrag je
--     Spieler und Welt — kein Fluten der Liste durch Wiederholung.
--   * generations >= 5 spiegelt CHAL_MIN_GENS der App: ein "in 0 Generationen
--     geschafft" ist strukturell unmoeglich.
--   * Laengen-/Formatgrenzen auf allen Textspalten.
-- Bewusst NICHT gebaut: signierte Laeufe, Server-Nachsimulation, Replay-Pruefung.
-- ===========================================================================

create table if not exists public.challenge_results (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  world_key    text        not null,   -- 'fest' (feste Startwelt) oder 'w:2026-W31' (Welt der Woche)
  challenge_id text        not null,   -- id aus app/challenges.js
  generations  integer     not null,   -- Generationen von "Uhr laeuft" bis "geschafft"
  form          text       not null,   -- classify().n des Endgenoms (festes Vokabular)
  kingdom       text       not null,   -- Reich dazu (Mikrobe/Protist/Pflanze/Pilz/Tier)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, world_key, challenge_id),
  constraint challenge_results_gens_range
    check (generations >= 5 and generations <= 200000),
  constraint challenge_results_world_key_shape
    check (world_key = 'fest' or world_key ~ '^w:[0-9]{4}-W[0-9]{2}$'),
  constraint challenge_results_text_len
    check (char_length(challenge_id) between 1 and 64
       and char_length(form) between 1 and 64
       and char_length(kingdom) between 1 and 32)
);

-- Die einzige Abfrage der Bestenliste: "alle Ergebnisse dieser Welt, wenigste
-- Generationen zuerst".
create index if not exists challenge_results_board_idx
  on public.challenge_results (world_key, challenge_id, generations);

alter table public.challenge_results enable row level security;

-- Die TABELLE bleibt streng privat (genau wie creatures): jeder sieht/schreibt nur
-- seine eigene Zeile. Der oeffentliche Vergleich laeuft ausschliesslich ueber die
-- View unten — so wird nie eine user_id an andere Spieler ausgeliefert.
create policy "challenge_results_select_own" on public.challenge_results
  for select to authenticated using (auth.uid() = user_id);
create policy "challenge_results_insert_own" on public.challenge_results
  for insert to authenticated with check (auth.uid() = user_id);
create policy "challenge_results_update_own" on public.challenge_results
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "challenge_results_delete_own" on public.challenge_results
  for delete to authenticated using (auth.uid() = user_id);

drop trigger if exists challenge_results_touch on public.challenge_results;
create trigger challenge_results_touch before update on public.challenge_results
  for each row execute function public.touch_updated_at();

-- Der oeffentliche Vergleichsraum. Eine View statt einer offenen Tabellen-Policy,
-- damit die user_id NICHT nach aussen geht — sichtbar sind nur Generationenzahl,
-- Form und Reich, plus ein Kennzeichen "das war ich" fuer die eigene Zeile.
-- Die View gehoert dem Ausfuehrenden (Owner-Rechte, PostgreSQL-Default
-- security_invoker = off) und umgeht damit die RLS der Basistabelle bewusst —
-- das ist der Zweck. Lesbar auch OHNE Anmeldung: wer nur zuschauen will, soll
-- sehen duerfen, welche Formen andere aus dieser Welt gemacht haben.
drop view if exists public.challenge_board;
create view public.challenge_board as
  select world_key, challenge_id, generations, form, kingdom, created_at,
         (user_id = auth.uid()) as is_me
    from public.challenge_results;

grant select on public.challenge_board to anon, authenticated;
