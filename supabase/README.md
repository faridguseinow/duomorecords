# DUOMO Records Supabase Setup

## Order

Run in Supabase SQL Editor or through Supabase CLI:

1. `migrations/202607150001_initial_schema.sql`
2. `migrations/202607150002_rls_policies.sql`
3. `migrations/202607150003_booking_constraints.sql`
4. `seed.sql`

## Environment

Create a local `.env` file from `.env.example`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Only the anon key belongs in the frontend. Do not add service role keys, database passwords, Telegram tokens, or admin credentials to this repo.

## Storage Buckets

Create these public buckets in Supabase Storage:

- `public-media`
- `project-covers`
- `blog-covers`
- `artist-images`
- `partner-logos`
- `instagram-images`
- `course-covers`

At this stage the frontend only reads public URLs. Admin upload/delete policies are intentionally deferred.

## RLS

RLS is enabled on all public tables.

Public `anon` and `authenticated` users can read only:

- public `site_settings`;
- visible `site_sections`;
- active services, packages, projects, artists, partners, process steps, courses, Instagram posts;
- published blog posts where `published_at <= now()`;
- enabled booking settings.

Bookings are not readable or writable through direct table policies. Public creation goes through:

- `get_available_booking_slots(target_date date)`
- `create_public_booking(...)`

## Booking Logic

PostgreSQL day numbering in `booking_settings.working_days` uses ISO DOW:

- Monday = 1
- Tuesday = 2
- Wednesday = 3
- Thursday = 4
- Friday = 5
- Saturday = 6
- Sunday = 7

Seed uses `{1,2,3,4,5,6}`, so Sunday is non-working.

`get_available_booking_slots`:

- reads active booking settings;
- uses `Asia/Baku`;
- checks working days and disabled dates;
- generates slots between opening and closing time;
- applies minimum advance time;
- excludes occupied slots.

`create_public_booking`:

- validates allowed fields;
- validates service/package IDs;
- validates the date/time through `get_available_booking_slots`;
- generates `booking_number` server-side;
- inserts status `new`;
- returns only public confirmation fields.

Double booking is blocked with a partial unique index:

```sql
(booking_date, booking_time)
where status in ('new', 'confirmed', 'in_progress')
```

Cancelled, rejected, and completed bookings do not block a slot.

## Manual Checks

After seed:

1. Use the anon key in the frontend and verify public content loads.
2. Call `select * from public.get_available_booking_slots(current_date + 1);`.
3. Call `create_public_booking(...)` with a valid `service_id` or `package_id`.
4. Try the same date/time again and confirm `slot_unavailable`.
5. As anon, verify direct `select * from public.bookings` returns no rows or is denied by RLS.
6. As anon, verify direct insert/update/delete on content tables is denied.
