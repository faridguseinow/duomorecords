const DEFAULT_PROFILE_URL = 'https://www.instagram.com/duomorecords/';
const DEFAULT_GRAPH_VERSION = 'v23.0';

function sendJson(response, statusCode, payload, cacheControl = 'no-store') {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', cacheControl);
  response.end(JSON.stringify(payload));
}

function normalizeItem(item) {
  const imageUrl = item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url || item.thumbnail_url;

  return {
    id: item.id,
    title: item.caption || 'DUOMO Records',
    caption: item.caption || '',
    href: item.permalink || DEFAULT_PROFILE_URL,
    imageUrl,
    timestamp: item.timestamp || null,
    mediaType: item.media_type || 'IMAGE'
  };
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) {
    sendJson(response, 200, { profileUrl: DEFAULT_PROFILE_URL, posts: [] }, 's-maxage=60, stale-while-revalidate=300');
    return;
  }

  const graphHost = process.env.INSTAGRAM_GRAPH_HOST || 'graph.instagram.com';
  const graphVersion = process.env.INSTAGRAM_GRAPH_VERSION || DEFAULT_GRAPH_VERSION;
  const userId = process.env.INSTAGRAM_USER_ID || 'me';
  const limit = Math.min(Number(request.query?.limit) || 5, 8);
  const feedUrl = new URL(`https://${graphHost}/${graphVersion}/${userId}/media`);

  feedUrl.searchParams.set('fields', 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp');
  feedUrl.searchParams.set('limit', String(limit));
  feedUrl.searchParams.set('access_token', accessToken);

  try {
    const graphResponse = await fetch(feedUrl);
    const payload = await graphResponse.json();

    if (!graphResponse.ok) {
      sendJson(response, graphResponse.status, {
        error: payload?.error?.message || 'Instagram feed request failed',
        profileUrl: DEFAULT_PROFILE_URL,
        posts: []
      });
      return;
    }

    sendJson(
      response,
      200,
      {
        profileUrl: DEFAULT_PROFILE_URL,
        posts: (payload.data || []).map(normalizeItem)
      },
      's-maxage=900, stale-while-revalidate=3600'
    );
  } catch (error) {
    sendJson(response, 500, {
      error: error?.message || 'Instagram feed request failed',
      profileUrl: DEFAULT_PROFILE_URL,
      posts: []
    });
  }
}
