import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getFallbackContent } from './fallbackService';
import { getLocalizedValue } from '../utils/localization';
import { PROJECT_TYPES } from '../utils/constants';

function logDevError(scope, error) {
  if (import.meta.env.DEV) {
    console.warn(`[${scope}] Supabase request failed, using fallback where applicable.`, error?.message || error);
  }
}

function mapService(row, language) {
  return {
    id: row.slug,
    dbId: row.id,
    category: row.category || '',
    title: getLocalizedValue(row.title, language),
    text: getLocalizedValue(row.short_description, language),
    bookingEnabled: row.booking_enabled,
    iconName: row.icon_name,
    imageUrl: row.image_url,
    startingPrice: row.starting_price,
    currency: row.currency || 'AZN'
  };
}

function mapPackage(row, language) {
  return {
    id: row.slug,
    dbId: row.id,
    name: getLocalizedValue(row.title, language),
    subtitle: getLocalizedValue(row.subtitle, language),
    price: row.price != null ? `${Number(row.price).toFixed(0)} ${row.currency || 'AZN'}` : '',
    marker: String((row.sort_order || 0) + 1).padStart(2, '0'),
    featured: row.is_featured,
    bookingEnabled: row.booking_enabled,
    features: (row.package_features || [])
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((feature) => getLocalizedValue(feature.title, language))
  };
}

function mapProject(row, language) {
  return {
    id: row.slug,
    dbId: row.id,
    title: getLocalizedValue(row.title, language),
    category: row.project_type || 'portfolio',
    description: getLocalizedValue(row.description, language),
    imageUrl: row.cover_url,
    externalUrl: row.external_url || row.video_url || row.audio_url,
    tone: row.metadata?.tone || 'orange',
    status: row.cover_url ? 'published' : 'placeholder',
    projectType: row.project_type
  };
}

function mapArtist(row, language) {
  return {
    id: row.slug || row.id,
    name: row.name,
    role: row.role || getLocalizedValue(row.description, language),
    imageUrl: row.image_url
  };
}

function mapPartner(row) {
  return {
    id: row.slug || row.id,
    name: row.name,
    logoUrl: row.logo_url,
    externalUrl: row.external_url
  };
}

function mapProcessStep(row, language) {
  return {
    id: row.id,
    stepNumber: row.step_number,
    title: getLocalizedValue(row.title, language),
    description: getLocalizedValue(row.description, language)
  };
}

function mapInstagram(row, language) {
  return {
    id: row.id,
    title: getLocalizedValue(row.caption, language) || 'Instagram',
    href: row.instagram_url,
    imageUrl: row.image_url
  };
}

async function safeQuery(key, fallbackValue, queryFactory, mapper) {
  if (!isSupabaseConfigured) {
    return { value: fallbackValue, source: 'fallback', error: null };
  }

  try {
    const { data, error } = await queryFactory();
    if (error) {
      throw error;
    }

    return {
      value: mapper ? mapper(data || []) : data || [],
      source: 'supabase',
      error: null
    };
  } catch (error) {
    logDevError(key, error);
    return { value: fallbackValue, source: 'fallback', error };
  }
}

export async function getHomepageContent(language) {
  const fallback = getFallbackContent(language);

  if (!isSupabaseConfigured) {
    return {
      ...fallback,
      sections: [],
      bookingSettings: null,
      source: 'fallback',
      errors: {}
    };
  }

  const [
    sections,
    services,
    packagesResult,
    portfolioProjects,
    mediaProjects,
    artists,
    partners,
    processSteps,
    instagram,
    bookingSettings
  ] = await Promise.all([
    safeQuery(
      'site_sections',
      [],
      () => supabase.from('site_sections').select('*').eq('is_visible', true).order('sort_order', { ascending: true })
    ),
    safeQuery(
      'services',
      fallback.services,
      () => supabase.from('services').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      (rows) => rows.map((row) => mapService(row, language))
    ),
    safeQuery(
      'packages',
      fallback.packages,
      () =>
        supabase
          .from('packages')
          .select('*, package_features(*)')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('sort_order', { referencedTable: 'package_features', ascending: true }),
      (rows) => rows.map((row) => mapPackage(row, language))
    ),
    safeQuery(
      'projects.portfolio',
      fallback.projects,
      () =>
        supabase
          .from('projects')
          .select('*')
          .eq('is_active', true)
          .eq('project_type', PROJECT_TYPES.PORTFOLIO)
          .order('sort_order', { ascending: true }),
      (rows) => rows.map((row) => mapProject(row, language))
    ),
    safeQuery(
      'projects.media',
      fallback.mediaProjects,
      () =>
        supabase
          .from('projects')
          .select('*')
          .eq('is_active', true)
          .eq('project_type', PROJECT_TYPES.MEDIA)
          .order('sort_order', { ascending: true }),
      (rows) => rows.map((row) => mapProject(row, language))
    ),
    safeQuery(
      'artists',
      fallback.artists,
      () => supabase.from('artists').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      (rows) => rows.map((row) => mapArtist(row, language))
    ),
    safeQuery(
      'partners',
      fallback.partners,
      () => supabase.from('partners').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      (rows) => rows.map(mapPartner)
    ),
    safeQuery(
      'process_steps',
      fallback.processSteps,
      () => supabase.from('process_steps').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      (rows) => rows.map((row) => mapProcessStep(row, language))
    ),
    safeQuery(
      'instagram_posts',
      fallback.instagramPosts,
      () => supabase.from('instagram_posts').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      (rows) => rows.map((row) => mapInstagram(row, language))
    ),
    safeQuery(
      'booking_settings',
      null,
      () => supabase.from('booking_settings').select('*').eq('is_booking_enabled', true).limit(1).maybeSingle(),
      (row) => row
    )
  ]);

  return {
    content: fallback.content,
    services: services.value,
    packages: packagesResult.value,
    projects: portfolioProjects.value,
    mediaProjects: mediaProjects.value,
    artists: artists.value,
    partners: partners.value,
    processSteps: processSteps.value,
    instagramPosts: instagram.value,
    timeSlots: fallback.timeSlots,
    bookingSettings: bookingSettings.value,
    sections: sections.value,
    source: 'supabase',
    errors: {
      services: services.error,
      packages: packagesResult.error,
      projects: portfolioProjects.error,
      mediaProjects: mediaProjects.error,
      artists: artists.error,
      partners: partners.error,
      processSteps: processSteps.error,
      instagramPosts: instagram.error,
      bookingSettings: bookingSettings.error
    }
  };
}

export async function getMediaProjects(language) {
  const homepage = await getHomepageContent(language);
  return homepage.mediaProjects;
}
