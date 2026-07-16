alter table public.admin_users enable row level security;
alter table public.customers enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.admin_activity_log enable row level security;

grant select on public.admin_users to authenticated;
grant select, insert, update on public.customers to authenticated;
grant select on public.bookings to authenticated;
grant select on public.booking_status_history to authenticated;
grant select on public.admin_activity_log to authenticated;

grant select, insert, update on public.site_settings to authenticated;
grant select, insert, update on public.site_sections to authenticated;
grant select, insert, update on public.services to authenticated;
grant select, insert, update on public.packages to authenticated;
grant select, insert, update on public.package_features to authenticated;
grant select, insert, update on public.projects to authenticated;
grant select, insert, update on public.artists to authenticated;
grant select, insert, update on public.partners to authenticated;
grant select, insert, update on public.process_steps to authenticated;
grant select, insert, update on public.courses to authenticated;
grant select, insert, update on public.blog_posts to authenticated;
grant select, insert, update on public.instagram_posts to authenticated;
grant select, insert, update on public.booking_settings to authenticated;

create policy "admin can read admin users"
on public.admin_users for select
to authenticated
using (public.is_admin_user());

create policy "admin can read bookings"
on public.bookings for select
to authenticated
using (public.is_admin_user());

create policy "admin can read booking history"
on public.booking_status_history for select
to authenticated
using (public.is_admin_user());

create policy "admin can read activity log"
on public.admin_activity_log for select
to authenticated
using (public.is_admin_user());

create policy "admin can read customers"
on public.customers for select
to authenticated
using (public.is_admin_user());

create policy "admin can insert customers"
on public.customers for insert
to authenticated
with check (public.is_admin_user());

create policy "admin can update customers"
on public.customers for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage site settings"
on public.site_settings for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage site sections"
on public.site_sections for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage services"
on public.services for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage packages"
on public.packages for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage package features"
on public.package_features for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage projects"
on public.projects for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage artists"
on public.artists for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage partners"
on public.partners for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage process steps"
on public.process_steps for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage courses"
on public.courses for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage blog posts"
on public.blog_posts for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage instagram posts"
on public.instagram_posts for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "admin can manage booking settings"
on public.booking_settings for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-media',
  'public-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "public can read public media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'public-media');

create policy "admin can upload public media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'public-media' and public.is_admin_user());

create policy "admin can update public media"
on storage.objects for update
to authenticated
using (bucket_id = 'public-media' and public.is_admin_user())
with check (bucket_id = 'public-media' and public.is_admin_user());

create policy "admin can delete public media"
on storage.objects for delete
to authenticated
using (bucket_id = 'public-media' and public.is_admin_user());
