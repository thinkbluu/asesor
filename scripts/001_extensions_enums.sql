-- ============================================================
-- ASESOR · 001 — Extensions & Enums
-- Run first. Idempotent.
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists btree_gist;   -- EXCLUDE constraints on uuid + range
create extension if not exists pg_trgm;      -- client search
create extension if not exists citext;       -- case-insensitive emails/slugs

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------

create type public.member_role as enum ('owner', 'manager', 'staff', 'receptionist');

create type public.appointment_status as enum (
  'in_asteptare', 'confirmat', 'in_desfasurare', 'finalizat', 'anulat', 'no_show'
);

create type public.appointment_source as enum ('online', 'telefon', 'salon', 'whatsapp');

create type public.payment_method as enum ('numerar', 'card', 'transfer');

create type public.transaction_status as enum ('incasat', 'rambursata', 'in_asteptare');

create type public.stock_movement_type as enum ('receptie', 'consum', 'ajustare', 'pierdere', 'retur');

create type public.expense_category as enum (
  'chirie', 'salarii', 'produse', 'marketing', 'utilitati', 'echipamente', 'altele'
);

create type public.staff_status as enum ('activ', 'concediu', 'inactiv');

create type public.commission_type as enum ('procent', 'fix', 'salariu');
