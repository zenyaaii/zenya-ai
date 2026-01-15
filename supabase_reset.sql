-- ⚠️ DANGER: This will delete ALL your data in these tables.
-- Run this in the Supabase SQL Editor.

-- 1. Drop Tables (Order matters due to foreign keys, but CASCADE handles it)
drop table if exists activity_logs cascade;
drop table if exists scrape_history cascade;
drop table if exists subscriptions cascade;
drop table if exists themes cascade;
drop table if exists profiles cascade;

-- 2. Drop Triggers and Functions (Clean up Auth hooks)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- =========================================================
-- OPTIONAL: "Nuclear Option" - Wipes EVERYTHING in public
-- Use this ONLY if you want a completely fresh start.
-- =========================================================
/*
drop schema public cascade;
create schema public;
grant all on schema public to postgres;
grant all on schema public to public;
*/
