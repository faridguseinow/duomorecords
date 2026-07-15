import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getFallbackBlogPosts } from './fallbackService';
import { getLocalizedValue } from '../utils/localization';

function slugColumn(language) {
  return language === 'ru' ? 'slug_ru' : language === 'en' ? 'slug_en' : 'slug_az';
}

function mapPost(row, language) {
  const slug = row[slugColumn(language)] || row.slug_az;
  const contentBlocks = getLocalizedValue(row.content_json, language);
  const markdown = getLocalizedValue(row.content_markdown, language);

  return {
    id: row.id,
    slug,
    title: getLocalizedValue(row.title, language),
    excerpt: getLocalizedValue(row.excerpt, language),
    category: row.category || '',
    publishedAt: row.published_at ? row.published_at.slice(0, 10) : '',
    readingTime: row.reading_time ? `${row.reading_time} min` : '',
    readingTimeMinutes: row.reading_time,
    seoTitle: getLocalizedValue(row.seo_title, language),
    seoDescription: getLocalizedValue(row.seo_description, language),
    ogImageUrl: row.og_image_url,
    coverUrl: row.cover_url,
    content: Array.isArray(contentBlocks)
      ? contentBlocks.map((block) => block.text || block.content || '').filter(Boolean)
      : markdown
        ? String(markdown).split('\n\n').filter(Boolean)
        : []
  };
}

function fallbackPosts(language) {
  return getFallbackBlogPosts(language).map((post) => ({
    ...post,
    id: post.slug,
    readingTimeMinutes: Number.parseInt(post.readingTime, 10) || 4
  }));
}

function logDevError(scope, error) {
  if (import.meta.env.DEV) {
    console.warn(`[${scope}] Blog Supabase request failed, using fallback.`, error?.message || error);
  }
}

function publishedQuery() {
  return supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });
}

export async function getPublishedPosts(language) {
  if (!isSupabaseConfigured) {
    return { posts: fallbackPosts(language), source: 'fallback', error: null };
  }

  try {
    const { data, error } = await publishedQuery();
    if (error) throw error;
    return { posts: (data || []).map((row) => mapPost(row, language)), source: 'supabase', error: null };
  } catch (error) {
    logDevError('getPublishedPosts', error);
    return { posts: fallbackPosts(language), source: 'fallback', error };
  }
}

export async function getFeaturedPosts(language) {
  const result = await getPublishedPosts(language);
  return { ...result, posts: result.posts.slice(0, 4) };
}

export async function getPostBySlug(language, slug) {
  if (!isSupabaseConfigured) {
    const posts = fallbackPosts(language);
    return { post: posts.find((item) => item.slug === slug) || null, source: 'fallback', error: null };
  }

  const column = slugColumn(language);

  try {
    let query = publishedQuery().or(`${column}.eq.${slug},slug_az.eq.${slug}`).limit(1);
    const { data, error } = await query;
    if (error) throw error;
    const row = data?.[0] || null;
    return { post: row ? mapPost(row, language) : null, source: 'supabase', error: null };
  } catch (error) {
    logDevError('getPostBySlug', error);
    const posts = fallbackPosts(language);
    return { post: posts.find((item) => item.slug === slug) || null, source: 'fallback', error };
  }
}

export async function getRelatedPosts(postId, category, language) {
  if (!isSupabaseConfigured) {
    return fallbackPosts(language).filter((post) => post.id !== postId).slice(0, 2);
  }

  try {
    let query = publishedQuery().neq('id', postId).limit(2);
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row) => mapPost(row, language));
  } catch (error) {
    logDevError('getRelatedPosts', error);
    return fallbackPosts(language).filter((post) => post.id !== postId).slice(0, 2);
  }
}
