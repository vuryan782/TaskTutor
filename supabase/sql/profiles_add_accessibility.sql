-- ─────────────────────────────────────────────────────────────────────────────
-- Adds accessibility_prefs to profiles.
-- Safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists accessibility_prefs jsonb not null default jsonb_build_object(
    'highContrast', false,
    'largeText', false,
    'reduceMotion', false
  );
