-- Complete schema (single-tenant MVP). Run in Supabase SQL editor.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  line_user_id text unique,
  name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_mins int not null,
  price numeric(10,2) not null,
  deposit numeric(10,2) not null,
  image_url text,
  is_active boolean default true
);

create type booking_status as enum ('awaiting_deposit','confirmed','cancelled','no_show');
create type payment_status as enum ('unpaid','paid','refunded','rejected');

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  start_at timestamptz not null,
  status booking_status not null default 'awaiting_deposit',
  deposit_amount numeric(10,2) not null,
  payment_status payment_status not null default 'unpaid',
  payment_slip_url text,
  created_at timestamptz default now()
);

-- Prevent exact same start time per service (extra guard);
-- app-level also checks time-window conflicts using duration_mins
create unique index if not exists bookings_unique_slot
  on bookings(service_id, start_at)
  where status in ('awaiting_deposit','confirmed');

-- Seed example services
insert into services (name, duration_mins, price, deposit, image_url) values
('โบท็อกซ์', 30, 2990, 500, 'https://images.unsplash.com/photo-1584305574647-1d4f6f04a6c8?q=80&w=1600&auto=format&fit=crop'),
('เลเซอร์หน้าใส', 45, 1990, 300, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1600&auto=format&fit=crop')
on conflict do nothing;

-- Create storage bucket for payment slips (run once)
-- select storage.create_bucket('payment-slips', public => false);
