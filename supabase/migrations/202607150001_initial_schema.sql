create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique not null,
  value jsonb not null,
  description text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  title jsonb,
  subtitle jsonb,
  description jsonb,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null,
  short_description jsonb,
  full_description jsonb,
  category text,
  icon_name text,
  image_url text,
  starting_price numeric(10,2),
  currency text not null default 'AZN',
  duration_minutes integer,
  booking_enabled boolean not null default true,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null,
  subtitle jsonb,
  description jsonb,
  price numeric(10,2),
  currency text not null default 'AZN',
  is_featured boolean not null default false,
  booking_enabled boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.package_features (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  title jsonb not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null,
  description jsonb,
  project_type text not null default 'portfolio',
  client_name text,
  artist_name text,
  cover_url text,
  video_url text,
  audio_url text,
  external_url text,
  release_date date,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_type_check check (project_type in ('portfolio', 'media', 'release', 'case-study'))
);

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  description jsonb,
  image_url text,
  role text,
  external_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  description jsonb,
  logo_url text,
  external_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.process_steps (
  id uuid primary key default gen_random_uuid(),
  step_number integer,
  title jsonb not null,
  description jsonb,
  icon_name text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null,
  short_description jsonb,
  full_description jsonb,
  cover_url text,
  promo_video_url text,
  price numeric(10,2),
  currency text not null default 'AZN',
  duration_text jsonb,
  level text,
  enrollment_enabled boolean not null default false,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug_az text unique not null,
  slug_ru text unique,
  slug_en text unique,
  title jsonb not null,
  excerpt jsonb,
  content_json jsonb,
  content_markdown jsonb,
  cover_url text,
  category text,
  author_name text,
  published_at timestamptz,
  reading_time integer,
  status text not null default 'draft',
  is_featured boolean not null default false,
  seo_title jsonb,
  seo_description jsonb,
  og_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_status_check check (status in ('draft', 'published', 'archived'))
);

create table public.instagram_posts (
  id uuid primary key default gen_random_uuid(),
  caption jsonb,
  image_url text,
  instagram_url text not null,
  published_at timestamptz,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booking_settings (
  id uuid primary key default gen_random_uuid(),
  timezone text not null default 'Asia/Baku',
  opening_time time not null default '11:00',
  closing_time time not null default '20:00',
  slot_duration_minutes integer not null default 60,
  minimum_advance_minutes integer not null default 120,
  maximum_advance_days integer not null default 90,
  working_days integer[] not null default '{1,2,3,4,5,6}',
  disabled_dates date[] not null default '{}',
  is_booking_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_settings_time_check check (opening_time < closing_time),
  constraint booking_settings_duration_check check (slot_duration_minutes > 0),
  constraint booking_settings_advance_check check (minimum_advance_minutes >= 0 and maximum_advance_days > 0)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text unique not null,
  user_id uuid null references auth.users(id) on delete set null,
  service_id uuid null references public.services(id) on delete set null,
  package_id uuid null references public.packages(id) on delete set null,
  booking_date date not null,
  booking_time time not null,
  duration_minutes integer not null default 60,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  project_description text,
  preferred_contact text,
  language text not null default 'az',
  source text not null default 'website',
  status text not null default 'new',
  admin_notes text,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_status_check check (status in ('new', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected')),
  constraint bookings_language_check check (language in ('az', 'ru', 'en')),
  constraint bookings_contact_check check (preferred_contact in ('phone', 'whatsapp', 'telegram', 'email', 'instagram')),
  constraint bookings_duration_check check (duration_minutes > 0),
  constraint bookings_service_or_package_check check (service_id is not null or package_id is not null)
);

create index site_sections_visible_order_idx on public.site_sections (is_visible, sort_order);
create index services_active_order_idx on public.services (is_active, sort_order);
create index packages_active_order_idx on public.packages (is_active, sort_order);
create index package_features_package_order_idx on public.package_features (package_id, sort_order);
create index projects_type_active_order_idx on public.projects (project_type, is_active, sort_order);
create index artists_active_order_idx on public.artists (is_active, sort_order);
create index partners_active_order_idx on public.partners (is_active, sort_order);
create index process_steps_active_order_idx on public.process_steps (is_active, sort_order);
create index courses_active_order_idx on public.courses (is_active, sort_order);
create index blog_posts_published_idx on public.blog_posts (status, published_at desc);
create index instagram_posts_active_order_idx on public.instagram_posts (is_active, sort_order);
create index bookings_user_idx on public.bookings (user_id);
create index bookings_date_time_idx on public.bookings (booking_date, booking_time);

create trigger set_site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
create trigger set_site_sections_updated_at before update on public.site_sections for each row execute function public.set_updated_at();
create trigger set_services_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger set_packages_updated_at before update on public.packages for each row execute function public.set_updated_at();
create trigger set_package_features_updated_at before update on public.package_features for each row execute function public.set_updated_at();
create trigger set_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger set_artists_updated_at before update on public.artists for each row execute function public.set_updated_at();
create trigger set_partners_updated_at before update on public.partners for each row execute function public.set_updated_at();
create trigger set_process_steps_updated_at before update on public.process_steps for each row execute function public.set_updated_at();
create trigger set_courses_updated_at before update on public.courses for each row execute function public.set_updated_at();
create trigger set_blog_posts_updated_at before update on public.blog_posts for each row execute function public.set_updated_at();
create trigger set_instagram_posts_updated_at before update on public.instagram_posts for each row execute function public.set_updated_at();
create trigger set_booking_settings_updated_at before update on public.booking_settings for each row execute function public.set_updated_at();
create trigger set_bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
