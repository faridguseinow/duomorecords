const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/duomorecords/';
const DEFAULT_FEED_ENDPOINT = '/api/instagram-feed?limit=5';

function trimCaption(caption = '') {
  return caption.replace(/\s+/g, ' ').trim();
}

function getPostTitle(post, index) {
  const caption = trimCaption(post.caption || post.title || '');
  if (caption) {
    return caption.length > 86 ? `${caption.slice(0, 83)}...` : caption;
  }

  return `DUOMO update ${index + 1}`;
}

function normalizePost(post, index) {
  return {
    id: post.id || post.shortcode || `instagram-${index + 1}`,
    title: getPostTitle(post, index),
    caption: trimCaption(post.caption || post.title || ''),
    href: post.href || post.permalink || INSTAGRAM_PROFILE_URL,
    imageUrl: post.imageUrl || post.media_url || post.thumbnail_url || post.thumbnailUrl || '',
    timestamp: post.timestamp || post.taken_at || null,
    mediaType: post.mediaType || post.media_type || 'IMAGE'
  };
}

export async function getInstagramFeed(fallbackPosts = []) {
  const configuredEndpoint = import.meta.env.VITE_INSTAGRAM_FEED_URL;

  if (import.meta.env.DEV && !configuredEndpoint) {
    return {
      posts: fallbackPosts.map(normalizePost),
      profileUrl: INSTAGRAM_PROFILE_URL,
      source: 'fallback'
    };
  }

  const endpoint = configuredEndpoint || DEFAULT_FEED_ENDPOINT;

  try {
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Instagram feed returned ${response.status}`);
    }

    const payload = await response.json();
    const posts = Array.isArray(payload) ? payload : payload.posts || payload.data || [];
    const normalizedPosts = posts.map(normalizePost).filter((post) => post.href);

    if (normalizedPosts.length > 0) {
      return {
        posts: normalizedPosts,
        profileUrl: payload.profileUrl || payload.profile_url || INSTAGRAM_PROFILE_URL,
        source: 'live'
      };
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[instagram_feed] Live feed unavailable, using fallback posts.', error?.message || error);
    }
  }

  return {
    posts: fallbackPosts.map(normalizePost),
    profileUrl: INSTAGRAM_PROFILE_URL,
    source: 'fallback'
  };
}
