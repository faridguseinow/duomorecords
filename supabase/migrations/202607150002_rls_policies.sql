alter table public.site_settings enable row level security;
alter table public.site_sections enable row level security;
alter table public.services enable row level security;
alter table public.packages enable row level security;
alter table public.package_features enable row level security;
alter table public.projects enable row level security;
alter table public.artists enable row level security;
alter table public.partners enable row level security;
alter table public.process_steps enable row level security;
alter table public.courses enable row level security;
alter table public.blog_posts enable row level security;
alter table public.instagram_posts enable row level security;
alter table public.booking_settings enable row level security;
alter table public.bookings enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.site_sections to anon, authenticated;
grant select on public.services to anon, authenticated;
grant select on public.packages to anon, authenticated;
grant select on public.package_features to anon, authenticated;
grant select on public.projects to anon, authenticated;
grant select on public.artists to anon, authenticated;
grant select on public.partners to anon, authenticated;
grant select on public.process_steps to anon, authenticated;
grant select on public.courses to anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant select on public.instagram_posts to anon, authenticated;
grant select on public.booking_settings to anon, authenticated;

create policy "public can read public site settings"
on public.site_settings for select
to anon, authenticated
using (is_public = true);

create policy "public can read visible site sections"
on public.site_sections for select
to anon, authenticated
using (is_visible = true);

create policy "public can read active services"
on public.services for select
to anon, authenticated
using (is_active = true);

create policy "public can read active packages"
on public.packages for select
to anon, authenticated
using (is_active = true);

create policy "public can read active package features"
on public.package_features for select
to anon, authenticated
using (
  exists (
    select 1 from public.packages
    where packages.id = package_features.package_id
      and packages.is_active = true
  )
);

create policy "public can read active projects"
on public.projects for select
to anon, authenticated
using (is_active = true);

create policy "public can read active artists"
on public.artists for select
to anon, authenticated
using (is_active = true);

create policy "public can read active partners"
on public.partners for select
to anon, authenticated
using (is_active = true);

create policy "public can read active process steps"
on public.process_steps for select
to anon, authenticated
using (is_active = true);

create policy "public can read active courses"
on public.courses for select
to anon, authenticated
using (is_active = true);

create policy "public can read published blog posts"
on public.blog_posts for select
to anon, authenticated
using (status = 'published' and published_at <= now());

create policy "public can read active instagram posts"
on public.instagram_posts for select
to anon, authenticated
using (is_active = true);

create policy "public can read enabled booking settings"
on public.booking_settings for select
to anon, authenticated
using (is_booking_enabled = true);

-- No public SELECT/INSERT/UPDATE/DELETE policies are created for bookings.
-- Public booking creation is intentionally limited to the create_public_booking RPC.
