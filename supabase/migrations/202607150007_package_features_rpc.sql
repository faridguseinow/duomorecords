create or replace function public.save_package_with_features(
  input_package jsonb,
  input_features jsonb default '[]'::jsonb
)
returns public.packages
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.packages%rowtype;
  feature jsonb;
  saved_feature_id uuid;
  kept_feature_ids uuid[] := '{}';
  package_id uuid := nullif(input_package->>'id', '')::uuid;
begin
  if not public.is_admin_user() then
    raise exception 'admin_access_required';
  end if;

  if package_id is null then
    insert into public.packages (
      slug,
      title,
      subtitle,
      description,
      price,
      currency,
      is_featured,
      booking_enabled,
      is_active,
      sort_order,
      metadata
    )
    values (
      input_package->>'slug',
      coalesce(input_package->'title', '{}'::jsonb),
      input_package->'subtitle',
      input_package->'description',
      nullif(input_package->>'price', '')::numeric,
      coalesce(nullif(input_package->>'currency', ''), 'AZN'),
      coalesce((input_package->>'is_featured')::boolean, false),
      coalesce((input_package->>'booking_enabled')::boolean, true),
      coalesce((input_package->>'is_active')::boolean, true),
      coalesce(nullif(input_package->>'sort_order', '')::integer, 0),
      coalesce(input_package->'metadata', '{}'::jsonb)
    )
    on conflict (slug) do update
    set title = excluded.title,
        subtitle = excluded.subtitle,
        description = excluded.description,
        price = excluded.price,
        currency = excluded.currency,
        is_featured = excluded.is_featured,
        booking_enabled = excluded.booking_enabled,
        is_active = excluded.is_active,
        sort_order = excluded.sort_order,
        metadata = excluded.metadata
    returning * into saved;
  else
    update public.packages
    set slug = input_package->>'slug',
        title = coalesce(input_package->'title', '{}'::jsonb),
        subtitle = input_package->'subtitle',
        description = input_package->'description',
        price = nullif(input_package->>'price', '')::numeric,
        currency = coalesce(nullif(input_package->>'currency', ''), 'AZN'),
        is_featured = coalesce((input_package->>'is_featured')::boolean, false),
        booking_enabled = coalesce((input_package->>'booking_enabled')::boolean, true),
        is_active = coalesce((input_package->>'is_active')::boolean, true),
        sort_order = coalesce(nullif(input_package->>'sort_order', '')::integer, 0),
        metadata = coalesce(input_package->'metadata', '{}'::jsonb)
    where id = package_id
    returning * into saved;

    if not found then
      raise exception 'package_not_found';
    end if;
  end if;

  for feature in
    select value from jsonb_array_elements(coalesce(input_features, '[]'::jsonb))
  loop
    saved_feature_id := nullif(feature->>'id', '')::uuid;

    if saved_feature_id is null then
      insert into public.package_features (package_id, title, sort_order)
      values (
        saved.id,
        coalesce(feature->'title', '{}'::jsonb),
        coalesce(nullif(feature->>'sort_order', '')::integer, 0)
      )
      returning id into saved_feature_id;
    else
      update public.package_features
      set title = coalesce(feature->'title', '{}'::jsonb),
          sort_order = coalesce(nullif(feature->>'sort_order', '')::integer, 0)
      where id = saved_feature_id
        and package_id = saved.id
      returning id into saved_feature_id;

      if not found then
        insert into public.package_features (package_id, title, sort_order)
        values (
          saved.id,
          coalesce(feature->'title', '{}'::jsonb),
          coalesce(nullif(feature->>'sort_order', '')::integer, 0)
        )
        returning id into saved_feature_id;
      end if;
    end if;

    kept_feature_ids := array_append(kept_feature_ids, saved_feature_id);
  end loop;

  delete from public.package_features
  where package_id = saved.id
    and not (id = any(kept_feature_ids));

  perform public.log_admin_activity(
    'package_saved',
    'packages',
    saved.id,
    'Saved package with features',
    jsonb_build_object('features_count', coalesce(jsonb_array_length(input_features), 0))
  );

  return saved;
end;
$$;

grant execute on function public.save_package_with_features(jsonb, jsonb) to authenticated;
