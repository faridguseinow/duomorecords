-- DUOMO Records seed data. Safe to rerun.

insert into public.site_settings (setting_key, value, description, is_public)
values
  ('contact_information', '{"phone":"+994 99 340 03 40","instagram":"@duomorecords","address":{"az":"28 May, Jalə Plaza, Bakı, Azərbaycan","ru":"28 May, Jalə Plaza, Баку, Азербайджан","en":"28 May, Jalə Plaza, Baku, Azerbaijan"}}', 'Public contact details', true),
  ('social_links', '{"instagram":"https://instagram.com/duomorecords","whatsapp":"https://wa.me/994993400340"}', 'Public social links', true),
  ('default_seo', '{"title":{"az":"Duomo Records","ru":"Duomo Records","en":"Duomo Records"},"description":{"az":"Duomo Records — musiqi prodakşnı, səsyazma, mix/mastering, media və kreativ xidmətlər.","ru":"Duomo Records — музыкальный продакшн, запись, mix/mastering, медиа и креативные услуги.","en":"Duomo Records — music production, recording, mix/mastering, media and creative services."}}', 'Default SEO metadata', true)
on conflict (setting_key) do update
set value = excluded.value,
    description = excluded.description,
    is_public = excluded.is_public;

insert into public.site_sections (section_key, title, subtitle, description, is_visible, sort_order)
values
  ('hero', '{"az":"Səsi ideyadan final relizə qədər dizayn edirik","ru":"Проектируем звук от идеи до финального релиза","en":"Designing sound from first idea to final release"}', '{"az":"MUSIC PRODUCTION STUDIO","ru":"MUSIC PRODUCTION STUDIO","en":"MUSIC PRODUCTION STUDIO"}', null, true, 10),
  ('services', '{"az":"Xidmətlər","ru":"Услуги","en":"Services"}', null, null, true, 20),
  ('packages', '{"az":"Paketlər","ru":"Пакеты","en":"Packages"}', null, null, true, 30),
  ('portfolio', '{"az":"Portfolio","ru":"Портфолио","en":"Portfolio"}', null, null, true, 40),
  ('about', '{"az":"Haqqımızda","ru":"О студии","en":"About"}', null, null, true, 50),
  ('artists', '{"az":"Artists / Clients","ru":"Artists / Clients","en":"Artists / Clients"}', null, null, true, 60),
  ('partners', '{"az":"Partners","ru":"Partners","en":"Partners"}', null, null, true, 70),
  ('work_process', '{"az":"İş prosesi","ru":"Процесс","en":"Work process"}', null, null, true, 80),
  ('courses', '{"az":"DUOMO Academy","ru":"DUOMO Academy","en":"DUOMO Academy"}', null, null, true, 90),
  ('media_projects', '{"az":"Media Projects","ru":"Media Projects","en":"Media Projects"}', null, null, true, 100),
  ('blog', '{"az":"Blog","ru":"Blog","en":"Blog"}', null, null, true, 110),
  ('instagram', '{"az":"Instagram","ru":"Instagram","en":"Instagram"}', null, null, true, 120),
  ('booking', '{"az":"Booking","ru":"Booking","en":"Booking"}', null, null, true, 130),
  ('contacts', '{"az":"Kontaktlar","ru":"Контакты","en":"Contacts"}', null, null, true, 140)
on conflict (section_key) do update
set title = excluded.title,
    subtitle = excluded.subtitle,
    description = excluded.description,
    is_visible = excluded.is_visible,
    sort_order = excluded.sort_order;

insert into public.services (slug, title, short_description, category, booking_enabled, is_active, sort_order)
values
  ('music-production', '{"az":"Music Production","ru":"Music Production","en":"Music Production"}', '{"az":"Aranjiman, beat, topline və relizə hazır musiqi prodakşnı.","ru":"Аранжировка, beat, topline и готовый к релизу музыкальный продакшн.","en":"Arrangement, beats, topline, and release-ready production."}', 'Studio', true, true, 10),
  ('recording-mix-mastering', '{"az":"Səs yazma + Mix & Mastering","ru":"Запись + Mix & Mastering","en":"Recording + Mix & Mastering"}', '{"az":"Vokal recording, editing, tonal balans və platformalara hazır master.","ru":"Recording, editing, баланс и master для платформ.","en":"Recording, editing, balance, and streaming-ready masters."}', 'Audio', true, true, 20),
  ('voice-over', '{"az":"Voice Over","ru":"Voice Over","en":"Voice Over"}', '{"az":"Reklam, video, təqdimat və sosial media üçün təmiz səsləndirmə.","ru":"Озвучивание для рекламы, видео, презентаций и social media.","en":"Clean voice work for ads, video, presentations, and social media."}', 'Media', true, true, 30),
  ('music-videos', '{"az":"Music Videos / Clips","ru":"Music Videos / Clips","en":"Music Videos / Clips"}', '{"az":"Klip konsepti, çəkiliş, montaj və release üçün vizual paket.","ru":"Концепт, съёмка, монтаж и визуальный пакет релиза.","en":"Concept, filming, editing, and release visual packages."}', 'Video', true, true, 40),
  ('reels', '{"az":"Reels","ru":"Reels","en":"Reels"}', '{"az":"Artist və brendlər üçün qısa formatlı, ritmik video kontent.","ru":"Короткий ритмичный видеоконтент для артистов и брендов.","en":"Short rhythmic video content for artists and brands."}', 'Social', true, true, 50),
  ('graphic-design', '{"az":"Graphic Design","ru":"Graphic Design","en":"Graphic Design"}', '{"az":"Cover art, logo, banner, promo və kampaniya vizualları.","ru":"Cover art, logo, banner, promo и campaign visuals.","en":"Cover art, logos, banners, promo and campaign visuals."}', 'Visual', true, true, 60),
  ('courses', '{"az":"Courses","ru":"Courses","en":"Courses"}', '{"az":"Prodakşn, səs rejissorluğu və aranjiman üzrə hazırlıq modulları.","ru":"Модули по продакшну, звукорежиссуре и аранжировке.","en":"Production, audio engineering, and arrangement modules."}', 'Academy', false, true, 70)
on conflict (slug) do update
set title = excluded.title,
    short_description = excluded.short_description,
    category = excluded.category,
    booking_enabled = excluded.booking_enabled,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

insert into public.packages (slug, title, subtitle, price, currency, is_featured, booking_enabled, is_active, sort_order)
values
  ('economy', '{"az":"Economy","ru":"Economy","en":"Economy"}', '{"az":"Starter","ru":"Starter","en":"Starter"}', 100, 'AZN', false, true, true, 10),
  ('standard', '{"az":"Standard","ru":"Standard","en":"Standard"}', '{"az":"Professional","ru":"Professional","en":"Professional"}', 150, 'AZN', true, true, true, 20),
  ('premium', '{"az":"Premium","ru":"Premium","en":"Premium"}', '{"az":"Elite","ru":"Elite","en":"Elite"}', 200, 'AZN', false, true, true, 30)
on conflict (slug) do update
set title = excluded.title,
    subtitle = excluded.subtitle,
    price = excluded.price,
    currency = excluded.currency,
    is_featured = excluded.is_featured,
    booking_enabled = excluded.booking_enabled,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

delete from public.package_features
where package_id in (select id from public.packages where slug in ('economy', 'standard', 'premium'));

insert into public.package_features (package_id, title, sort_order)
select packages.id, feature.title, feature.sort_order
from public.packages
join (
  values
    ('economy', '{"az":"1 hour recording","ru":"1 час записи","en":"1 hour recording"}'::jsonb, 10),
    ('economy', '{"az":"Basic vocal cleanup","ru":"Базовая чистка вокала","en":"Basic vocal cleanup"}'::jsonb, 20),
    ('economy', '{"az":"WAV + MP3","ru":"WAV + MP3","en":"WAV + MP3"}'::jsonb, 30),
    ('economy', '{"az":"Up to 2 revisions","ru":"До 2 правок","en":"Up to 2 revisions"}'::jsonb, 40),
    ('standard', '{"az":"1 hour recording","ru":"1 час записи","en":"1 hour recording"}'::jsonb, 10),
    ('standard', '{"az":"Mix & mastering","ru":"Mix & mastering","en":"Mix & mastering"}'::jsonb, 20),
    ('standard', '{"az":"Vocal effects","ru":"Эффекты вокала","en":"Vocal effects"}'::jsonb, 30),
    ('standard', '{"az":"WAV + MP3","ru":"WAV + MP3","en":"WAV + MP3"}'::jsonb, 40),
    ('standard', '{"az":"Up to 3 revisions","ru":"До 3 правок","en":"Up to 3 revisions"}'::jsonb, 50),
    ('premium', '{"az":"2 hour recording","ru":"2 часа записи","en":"2 hour recording"}'::jsonb, 10),
    ('premium', '{"az":"High-end mix & mastering","ru":"High-end mix & mastering","en":"High-end mix & mastering"}'::jsonb, 20),
    ('premium', '{"az":"AutoTune / Melodyne","ru":"AutoTune / Melodyne","en":"AutoTune / Melodyne"}'::jsonb, 30),
    ('premium', '{"az":"Sound design","ru":"Sound design","en":"Sound design"}'::jsonb, 40),
    ('premium', '{"az":"Up to 5 revisions","ru":"До 5 правок","en":"Up to 5 revisions"}'::jsonb, 50)
) as feature(package_slug, title, sort_order) on packages.slug = feature.package_slug;

insert into public.projects (slug, title, description, project_type, is_featured, is_active, sort_order, metadata)
values
  ('qorxuram', '{"az":"Qorxuram","ru":"Qorxuram","en":"Qorxuram"}', '{"az":"Pop Production","ru":"Pop Production","en":"Pop Production"}', 'portfolio', true, true, 10, '{"tone":"orange"}'),
  ('susdum', '{"az":"Susdum","ru":"Susdum","en":"Susdum"}', '{"az":"R&B Vocal Production","ru":"R&B Vocal Production","en":"R&B Vocal Production"}', 'portfolio', true, true, 20, '{"tone":"graphite"}'),
  ('kaman-agla', '{"az":"Kaman Ağla","ru":"Kaman Ağla","en":"Kaman Ağla"}', '{"az":"EDM Crossover","ru":"EDM Crossover","en":"EDM Crossover"}', 'portfolio', false, true, 30, '{"tone":"sand"}'),
  ('midnight-session', '{"az":"Midnight Session","ru":"Midnight Session","en":"Midnight Session"}', '{"az":"Studio Direction","ru":"Studio Direction","en":"Studio Direction"}', 'portfolio', false, true, 40, '{"tone":"silver"}'),
  ('behind-the-session', '{"az":"Behind The Session","ru":"Behind The Session","en":"Behind The Session"}', '{"az":"Backstage media format","ru":"Backstage media format","en":"Backstage media format"}', 'media', true, true, 10, '{"tone":"orange"}'),
  ('live-vocal-direction', '{"az":"Live Vocal Direction","ru":"Live Vocal Direction","en":"Live Vocal Direction"}', '{"az":"Studio vocal media","ru":"Studio vocal media","en":"Studio vocal media"}', 'media', false, true, 20, '{"tone":"graphite"}'),
  ('clip-moodboard', '{"az":"Clip Moodboard","ru":"Clip Moodboard","en":"Clip Moodboard"}', '{"az":"Visual direction preview","ru":"Visual direction preview","en":"Visual direction preview"}', 'media', false, true, 30, '{"tone":"sand"}')
on conflict (slug) do update
set title = excluded.title,
    description = excluded.description,
    project_type = excluded.project_type,
    is_featured = excluded.is_featured,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    metadata = excluded.metadata;

insert into public.artists (slug, name, role, is_featured, is_active, sort_order)
values
  ('ayla', 'Ayla', 'Vocal production', true, true, 10),
  ('rz-project', 'RZ Project', 'Mix & mastering', true, true, 20),
  ('nova', 'NOVA', 'Visual direction', false, true, 30)
on conflict (slug) do update
set name = excluded.name,
    role = excluded.role,
    is_featured = excluded.is_featured,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

insert into public.partners (slug, name, is_active, sort_order)
values
  ('studio-partner', 'Studio Partner', true, 10),
  ('media-lab', 'Media Lab', true, 20),
  ('clip-unit', 'Clip Unit', true, 30),
  ('visual-desk', 'Visual Desk', true, 40),
  ('release-hub', 'Release Hub', true, 50),
  ('event-crew', 'Event Crew', true, 60)
on conflict (slug) do update
set name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

insert into public.process_steps (id, step_number, title, is_active, sort_order)
values
  ('10000000-0000-4000-8000-000000000001', 1, '{"az":"Zəng / müraciət","ru":"Заявка","en":"Request"}', true, 10),
  ('10000000-0000-4000-8000-000000000002', 2, '{"az":"Brief və referenslər","ru":"Brief и референсы","en":"Brief and references"}', true, 20),
  ('10000000-0000-4000-8000-000000000003', 3, '{"az":"Recording / production","ru":"Запись / production","en":"Recording / production"}', true, 30),
  ('10000000-0000-4000-8000-000000000004', 4, '{"az":"Mix & Master","ru":"Mix & Master","en":"Mix & Master"}', true, 40),
  ('10000000-0000-4000-8000-000000000005', 5, '{"az":"Düzəlişlər","ru":"Правки","en":"Revisions"}', true, 50),
  ('10000000-0000-4000-8000-000000000006', 6, '{"az":"Final transfer / release","ru":"Финальная передача / релиз","en":"Final transfer / release"}', true, 60)
on conflict (id) do update
set step_number = excluded.step_number,
    title = excluded.title,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

update public.process_steps
set is_active = false
where title->>'en' in ('Request', 'Brief and references', 'Recording / production', 'Mix & Master', 'Revisions', 'Final transfer / release')
  and id::text not like '10000000-0000-4000-8000-%';

insert into public.courses (slug, title, short_description, enrollment_enabled, is_featured, is_active, sort_order)
values
  ('duomo-academy-preview', '{"az":"DUOMO Academy","ru":"DUOMO Academy","en":"DUOMO Academy"}', '{"az":"Kurs modulları üçün frontend yeri hazırdır.","ru":"Место под курсы подготовлено.","en":"The frontend place for course modules is ready."}', false, true, true, 10)
on conflict (slug) do update
set title = excluded.title,
    short_description = excluded.short_description,
    enrollment_enabled = excluded.enrollment_enabled,
    is_featured = excluded.is_featured,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

insert into public.blog_posts (slug_az, slug_ru, slug_en, title, excerpt, content_json, category, author_name, published_at, reading_time, status, is_featured, seo_title, seo_description)
values
  ('recording-before-studio', 'recording-before-studio', 'recording-before-studio', '{"az":"Studiyaya gəlməzdən əvvəl vokalı necə hazırlamaq olar","ru":"Как подготовить вокал перед студией","en":"How to prepare vocals before the studio"}', '{"az":"Recording günündə daha az stress və daha təmiz take üçün praktik hazırlıq.","ru":"Практическая подготовка для чистого take без лишнего стресса.","en":"Practical prep for a cleaner take with less stress."}', '[{"type":"paragraph","text":"Mətn, tonallıq və referenslər əvvəlcədən hazır olmalıdır."},{"type":"paragraph","text":"Demo versiya və istədiyiniz sound nümunələri prodüserlə işi sürətləndirir."}]', 'Recording', 'DUOMO Records', '2026-07-01T10:00:00+04:00', 4, 'published', true, '{"az":"Vokal recording hazırlığı | DUOMO Records","ru":"Подготовка вокала | DUOMO Records","en":"Vocal recording prep | DUOMO Records"}', '{"az":"Studiyaya gəlməzdən əvvəl vokal və material hazırlığı üçün qısa bələdçi.","ru":"Короткий гид по подготовке вокала перед студией.","en":"A short guide to preparing vocals before the studio."}'),
  ('mix-mastering-difference', 'mix-mastering-difference', 'mix-mastering-difference', '{"az":"Mix və mastering arasındakı fərq","ru":"Разница между mix и mastering","en":"The difference between mix and mastering"}', '{"az":"İki mərhələnin məqsədi fərqlidir: biri balans, digəri final yayım hazırlığıdır.","ru":"Один этап отвечает за баланс, другой — за финальную подготовку.","en":"One stage handles balance, the other final release readiness."}', '[{"type":"paragraph","text":"Mix trek daxilində elementlərin balansıdır."},{"type":"paragraph","text":"Mastering isə final faylı platformalar və sistemlər üçün sabitləşdirir."}]', 'Mixing', 'DUOMO Records', '2026-06-20T10:00:00+04:00', 5, 'published', false, '{"az":"Mix və mastering fərqi | DUOMO Records","ru":"Разница mix и mastering | DUOMO Records","en":"Mix and mastering difference | DUOMO Records"}', '{"az":"Mix və mastering proseslərinin nə üçün ayrı mərhələ olduğunu izah edirik.","ru":"Объясняем, почему mix и mastering — разные этапы.","en":"Why mix and mastering are separate stages."}'),
  ('release-visual-system', 'release-visual-system', 'release-visual-system', '{"az":"Reliz üçün vizual sistem niyə vacibdir","ru":"Почему релизу нужна визуальная система","en":"Why a release needs a visual system"}', '{"az":"Cover, reels və klip eyni dilə sahib olanda reliz daha güclü görünür.","ru":"Cover, reels и клип работают сильнее, когда говорят на одном языке.","en":"Cover, reels, and video work better when they share one language."}', '[{"type":"paragraph","text":"Vizual sistem dinləyicinin layihəni xatırlamasına kömək edir."},{"type":"paragraph","text":"Qısa formatlar cover və klip estetikası ilə bağlı olmalıdır."}]', 'Visual', 'DUOMO Records', '2026-06-04T10:00:00+04:00', 3, 'published', false, '{"az":"Reliz vizual sistemi | DUOMO Records","ru":"Визуальная система релиза | DUOMO Records","en":"Release visual system | DUOMO Records"}', '{"az":"Musiqi relizində vizual ardıcıllığın rolu.","ru":"Роль визуальной последовательности в релизе.","en":"The role of visual consistency in a music release."}'),
  ('first-production-brief', 'first-production-brief', 'first-production-brief', '{"az":"İlk prodakşn brief-i necə yazılır","ru":"Как написать первый production brief","en":"How to write a first production brief"}', '{"az":"Janr, mood, referens və məqsəd prodakşn qərarlarını aydınlaşdırır.","ru":"Жанр, mood, референсы и цель проясняют production-решения.","en":"Genre, mood, references, and goal clarify production decisions."}', '[{"type":"paragraph","text":"Brief layihənin istiqamətini qoruyur."},{"type":"paragraph","text":"Referenslər hiss, temp, vokal yanaşması və mix gözləntisini aydın edir."}]', 'Production', 'DUOMO Records', '2026-05-18T10:00:00+04:00', 4, 'published', false, '{"az":"Prodakşn brief necə yazılır | DUOMO Records","ru":"Как написать production brief | DUOMO Records","en":"How to write a production brief | DUOMO Records"}', '{"az":"Musiqi prodakşnı üçün sadə və effektiv brief strukturu.","ru":"Простая структура brief для музыкального продакшна.","en":"A simple brief structure for music production."}')
on conflict (slug_az) do update
set slug_ru = excluded.slug_ru,
    slug_en = excluded.slug_en,
    title = excluded.title,
    excerpt = excluded.excerpt,
    content_json = excluded.content_json,
    category = excluded.category,
    author_name = excluded.author_name,
    published_at = excluded.published_at,
    reading_time = excluded.reading_time,
    status = excluded.status,
    is_featured = excluded.is_featured,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description;

insert into public.instagram_posts (id, caption, instagram_url, published_at, is_active, sort_order)
values
  ('20000000-0000-4000-8000-000000000001', '{"az":"Studio session","ru":"Studio session","en":"Studio session"}', 'https://instagram.com/duomorecords', now(), true, 10),
  ('20000000-0000-4000-8000-000000000002', '{"az":"Vocal direction","ru":"Vocal direction","en":"Vocal direction"}', 'https://instagram.com/duomorecords', now(), true, 20),
  ('20000000-0000-4000-8000-000000000003', '{"az":"Mix detail","ru":"Mix detail","en":"Mix detail"}', 'https://instagram.com/duomorecords', now(), true, 30),
  ('20000000-0000-4000-8000-000000000004', '{"az":"Release visual","ru":"Release visual","en":"Release visual"}', 'https://instagram.com/duomorecords', now(), true, 40)
on conflict (id) do update
set caption = excluded.caption,
    instagram_url = excluded.instagram_url,
    published_at = excluded.published_at,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

update public.instagram_posts
set is_active = false
where caption->>'en' in ('Studio session', 'Vocal direction', 'Mix detail', 'Release visual')
  and id::text not like '20000000-0000-4000-8000-%';

insert into public.booking_settings (
  id,
  timezone,
  opening_time,
  closing_time,
  slot_duration_minutes,
  minimum_advance_minutes,
  maximum_advance_days,
  working_days,
  disabled_dates,
  is_booking_enabled
)
values (
  '00000000-0000-4000-8000-000000000001',
  'Asia/Baku',
  '11:00',
  '20:00',
  60,
  120,
  90,
  '{1,2,3,4,5,6}',
  '{}',
  true
)
on conflict (id) do update
set timezone = excluded.timezone,
    opening_time = excluded.opening_time,
    closing_time = excluded.closing_time,
    slot_duration_minutes = excluded.slot_duration_minutes,
    minimum_advance_minutes = excluded.minimum_advance_minutes,
    maximum_advance_days = excluded.maximum_advance_days,
    working_days = excluded.working_days,
    disabled_dates = excluded.disabled_dates,
    is_booking_enabled = excluded.is_booking_enabled;
