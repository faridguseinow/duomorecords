update public.projects
set is_active = false
where slug in (
  'midnight-session',
  'behind-the-session',
  'live-vocal-direction',
  'clip-moodboard'
)
and (
  cover_url is null
  or video_url is null
);
