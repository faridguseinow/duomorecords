import { useEffect, useState } from 'react';

const STORAGE_KEY = 'duomo-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return localStorage.getItem(STORAGE_KEY) || 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'dark' ? '#181817' : '#f6f1e8'
    );
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  return { theme, toggleTheme };
}
