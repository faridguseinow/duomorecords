import { useEffect, useState } from 'react';

const STORAGE_KEY = 'duomo-theme-v2';

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return localStorage.getItem(STORAGE_KEY) || 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'dark' ? '#080808' : '#f6f1e8'
    );
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  return { theme, toggleTheme };
}
