import { useEffect, useState } from 'react';
import { getHomepageContent } from '../services/contentService';
import { getFallbackContent } from '../services/fallbackService';

export function useSiteContent(language) {
  const [state, setState] = useState(() => ({
    data: getFallbackContent(language),
    loading: true,
    error: null
  }));

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getHomepageContent(language)
      .then((data) => {
        if (active) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (active) {
          setState({ data: getFallbackContent(language), loading: false, error });
        }
      });

    return () => {
      active = false;
    };
  }, [language]);

  return state;
}
