delete from public.projects
where project_type = 'media'
  and metadata->>'source' = 'old_netlify';

update public.projects
set is_active = false
where project_type = 'media'
  and slug in (
    'behind-the-session',
    'live-vocal-direction',
    'clip-moodboard'
  );
