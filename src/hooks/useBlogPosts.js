import { useCallback, useEffect, useState } from 'react';
import { getPostBySlug, getPublishedPosts, getRelatedPosts } from '../services/blogService';

export function useBlogPosts(language) {
  const [state, setState] = useState({ posts: [], loading: true, error: null, source: 'pending' });

  const load = useCallback(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    getPublishedPosts(language).then((result) => {
      if (!cancelled) {
        setState({
          posts: result.posts,
          loading: false,
          error: result.error,
          source: result.source
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => load(), [load]);

  return { ...state, refetch: load };
}

export function useBlogPost(language, slug) {
  const [state, setState] = useState({
    post: null,
    relatedPosts: [],
    loading: true,
    error: null,
    source: 'pending'
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    async function load() {
      const result = await getPostBySlug(language, slug);
      const relatedPosts = result.post
        ? await getRelatedPosts(result.post.id, result.post.category, language)
        : [];

      if (active) {
        setState({
          post: result.post,
          relatedPosts,
          loading: false,
          error: result.error,
          source: result.source
        });
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [language, slug]);

  return state;
}
