import { FALLBACK_LANGUAGE } from './constants';

export function getLocalizedValue(value, language, fallbackLanguage = FALLBACK_LANGUAGE) {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'object') {
    return '';
  }

  const preferred = value[language];
  if (preferred) {
    return preferred;
  }

  const fallback = value[fallbackLanguage];
  if (fallback) {
    return fallback;
  }

  const first = Object.values(value).find((entry) => {
    if (Array.isArray(entry)) {
      return entry.length > 0;
    }
    return entry !== null && entry !== undefined && String(entry).trim() !== '';
  });

  return first || '';
}

export function normalizeLocalizedObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { az: '', ru: '', en: '' };
  }

  return {
    az: value.az || '',
    ru: value.ru || '',
    en: value.en || ''
  };
}

export function setLocalizedValue(value, language, nextValue) {
  return {
    ...normalizeLocalizedObject(value),
    [language]: nextValue
  };
}

export function localizedFormDefaults(value) {
  return normalizeLocalizedObject(value);
}
