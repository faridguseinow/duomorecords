import { getLocalizedValue } from '../utils/localization';

export const ADMIN_LANGUAGE = 'az';

const languages = [
  { code: 'az', label: 'AZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' }
];

export function getValue(row, path) {
  return path.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), row);
}

export function setValue(target, path, value) {
  const parts = path.split('.');
  let current = target;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      current[part] = value;
      return;
    }
    current[part] = current[part] && typeof current[part] === 'object' ? { ...current[part] } : {};
    current = current[part];
  });
}

export function formatCell(value, type) {
  if (value == null || value === '') return '—';
  if (type === 'boolean') return value ? 'Yes' : 'No';
  if (type === 'date') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('ru-RU');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function localized(path, language = ADMIN_LANGUAGE) {
  return (row) => getLocalizedValue(getValue(row, path), language, 'az') || '—';
}

export function money(row, amountKey = 'price') {
  const value = row[amountKey];
  if (value == null || value === '') return '—';
  return `${Number(value).toLocaleString('ru-RU')} ${row.currency || 'AZN'}`;
}

function localizedFields(path, label, type = 'text') {
  return languages.map((language) => ({
    key: `${path}.${language.code}`,
    label: `${label} ${language.label}`,
    tab: language.label,
    type
  }));
}

function required(value) {
  return value != null && String(value).trim() !== '';
}

function validateSlugAndTitle(payload, slugKey = 'slug') {
  if (!required(payload[slugKey])) return 'Slug is required';
  if (!required(payload.title?.az)) return 'Title AZ is required';
  return '';
}

export const bookingColumns = [
  { key: 'booking_number', label: 'Booking' },
  { key: 'booking_date', label: 'Date', type: 'dateOnly' },
  { key: 'booking_time', label: 'Time', render: (row) => String(row.booking_time || '').slice(0, 5) || '—' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'customer_phone', label: 'Phone' },
  {
    key: 'service_package',
    label: 'Service / Package',
    sortable: false,
    render: (row) => localized('services.title')(row) !== '—' ? localized('services.title')(row) : localized('packages.title')(row)
  },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'created_at', label: 'Created', type: 'date' }
];

export const customerColumns = [
  { key: 'full_name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'bookings_count', label: 'Bookings', sortable: false, render: (row) => row.bookings?.length || 0 },
  {
    key: 'last_booking',
    label: 'Last booking',
    sortable: false,
    render: (row) => {
      const latest = [...(row.bookings || [])].sort((a, b) => String(b.booking_date).localeCompare(String(a.booking_date)))[0];
      return latest?.booking_date || '—';
    }
  },
  { key: 'created_at', label: 'Created', type: 'date' }
];

export const activityColumns = [
  { key: 'created_at', label: 'Date', type: 'date' },
  { key: 'admin_user_id', label: 'Admin', render: (row) => row.admin_users?.display_name || row.admin_user_id || '—' },
  { key: 'action', label: 'Action' },
  { key: 'entity_type', label: 'Entity' },
  { key: 'summary', label: 'Summary' }
];

export const adminResources = {
  sections: {
    table: 'site_sections',
    title: 'Секции сайта',
    select: '*',
    searchColumns: ['section_key'],
    order: 'sort_order',
    columns: [
      { key: 'section_key', label: 'Section' },
      { key: 'title', label: 'Title', render: localized('title') },
      { key: 'is_visible', label: 'Visible', type: 'boolean' },
      { key: 'sort_order', label: 'Order' },
      { key: 'updated_at', label: 'Updated', type: 'date' }
    ],
    fields: [
      { key: 'section_key', label: 'Section key', readOnlyOnEdit: true },
      ...localizedFields('title', 'Title'),
      ...localizedFields('subtitle', 'Subtitle'),
      ...localizedFields('description', 'Description', 'textarea'),
      { key: 'is_visible', label: 'Visible', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Order', type: 'number', defaultValue: 0 },
      { key: 'settings', label: 'Settings JSON', type: 'json', defaultValue: {} }
    ]
  },
  services: {
    table: 'services',
    title: 'Услуги',
    select: '*',
    searchColumns: ['slug', 'category'],
    order: 'sort_order',
    columns: [
      { key: 'title', label: 'Title', render: localized('title') },
      { key: 'category', label: 'Category' },
      { key: 'starting_price', label: 'Price', render: (row) => money(row, 'starting_price') },
      { key: 'booking_enabled', label: 'Booking', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
      { key: 'sort_order', label: 'Order' }
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      ...localizedFields('title', 'Title'),
      ...localizedFields('short_description', 'Short description', 'textarea'),
      ...localizedFields('full_description', 'Full description', 'textarea'),
      { key: 'category', label: 'Category' },
      { key: 'icon_name', label: 'Icon' },
      { key: 'image_url', label: 'Image URL' },
      { key: 'starting_price', label: 'Starting price', type: 'number' },
      { key: 'currency', label: 'Currency', defaultValue: 'AZN' },
      { key: 'duration_minutes', label: 'Duration minutes', type: 'number' },
      { key: 'booking_enabled', label: 'Booking enabled', type: 'checkbox', defaultValue: true },
      { key: 'is_featured', label: 'Featured', type: 'checkbox' },
      { key: 'is_active', label: 'Active', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Order', type: 'number', defaultValue: 0 }
    ],
    validate: validateSlugAndTitle
  },
  packages: {
    table: 'packages',
    title: 'Пакеты',
    select: '*, package_features(*)',
    searchColumns: ['slug'],
    order: 'sort_order',
    withFeatures: true,
    columns: [
      { key: 'title', label: 'Title', render: localized('title') },
      { key: 'price', label: 'Price', render: money },
      { key: 'is_featured', label: 'Featured', type: 'boolean' },
      { key: 'booking_enabled', label: 'Booking', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
      { key: 'sort_order', label: 'Order' }
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      ...localizedFields('title', 'Title'),
      ...localizedFields('subtitle', 'Subtitle'),
      ...localizedFields('description', 'Description', 'textarea'),
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'currency', label: 'Currency', defaultValue: 'AZN' },
      { key: 'is_featured', label: 'Featured', type: 'checkbox' },
      { key: 'booking_enabled', label: 'Booking enabled', type: 'checkbox', defaultValue: true },
      { key: 'is_active', label: 'Active', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Order', type: 'number', defaultValue: 0 }
    ],
    validate: validateSlugAndTitle
  },
  projects: {
    table: 'projects',
    title: 'Проекты',
    select: '*',
    searchColumns: ['slug', 'project_type', 'client_name', 'artist_name'],
    order: 'sort_order',
    columns: [
      { key: 'title', label: 'Title', render: localized('title') },
      { key: 'project_type', label: 'Type' },
      { key: 'client_artist', label: 'Client / Artist', render: (row) => row.client_name || row.artist_name || '—' },
      { key: 'is_featured', label: 'Featured', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
      { key: 'release_date', label: 'Release date', type: 'dateOnly' }
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      ...localizedFields('title', 'Title'),
      ...localizedFields('description', 'Description', 'textarea'),
      { key: 'project_type', label: 'Type', type: 'select', options: ['portfolio', 'media', 'release', 'case-study'] },
      { key: 'client_name', label: 'Client' },
      { key: 'artist_name', label: 'Artist' },
      { key: 'cover_url', label: 'Cover URL' },
      { key: 'video_url', label: 'Video URL' },
      { key: 'audio_url', label: 'Audio URL' },
      { key: 'external_url', label: 'External URL' },
      { key: 'release_date', label: 'Release date', type: 'date' },
      { key: 'is_featured', label: 'Featured', type: 'checkbox' },
      { key: 'is_active', label: 'Active', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Order', type: 'number', defaultValue: 0 }
    ],
    validate: validateSlugAndTitle
  },
  artists: {
    table: 'artists',
    title: 'Артисты',
    select: '*',
    searchColumns: ['slug', 'name', 'role'],
    order: 'sort_order',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'is_featured', label: 'Featured', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
      { key: 'sort_order', label: 'Order' }
    ],
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'slug', label: 'Slug' },
      ...localizedFields('description', 'Description', 'textarea'),
      { key: 'image_url', label: 'Image URL' },
      { key: 'role', label: 'Role' },
      { key: 'external_url', label: 'External URL' },
      { key: 'is_featured', label: 'Featured', type: 'checkbox' },
      { key: 'is_active', label: 'Active', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Order', type: 'number', defaultValue: 0 }
    ],
    validate: (payload) => (required(payload.name) ? '' : 'Name is required')
  },
  partners: {
    table: 'partners',
    title: 'Партнёры',
    select: '*',
    searchColumns: ['slug', 'name'],
    order: 'sort_order',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
      { key: 'sort_order', label: 'Order' },
      { key: 'updated_at', label: 'Updated', type: 'date' }
    ],
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'slug', label: 'Slug' },
      ...localizedFields('description', 'Description', 'textarea'),
      { key: 'logo_url', label: 'Logo URL' },
      { key: 'external_url', label: 'External URL' },
      { key: 'is_active', label: 'Active', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Order', type: 'number', defaultValue: 0 }
    ],
    validate: (payload) => (required(payload.name) ? '' : 'Name is required')
  },
  process: {
    table: 'process_steps',
    title: 'Процесс работы',
    select: '*',
    searchColumns: ['icon_name'],
    order: 'sort_order',
    columns: [
      { key: 'step_number', label: 'Step' },
      { key: 'title', label: 'Title', render: localized('title') },
      { key: 'is_active', label: 'Active', type: 'boolean' },
      { key: 'sort_order', label: 'Order' }
    ],
    fields: [
      { key: 'step_number', label: 'Step', type: 'number' },
      ...localizedFields('title', 'Title'),
      ...localizedFields('description', 'Description', 'textarea'),
      { key: 'icon_name', label: 'Icon' },
      { key: 'is_active', label: 'Active', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Order', type: 'number', defaultValue: 0 }
    ],
    validate: (payload) => (required(payload.title?.az) ? '' : 'Title AZ is required')
  },
  courses: {
    table: 'courses',
    title: 'Курсы',
    select: '*',
    searchColumns: ['slug', 'level'],
    order: 'sort_order',
    columns: [
      { key: 'title', label: 'Title', render: localized('title') },
      { key: 'level', label: 'Level' },
      { key: 'price', label: 'Price', render: money },
      { key: 'enrollment_enabled', label: 'Enrollment', type: 'boolean' },
      { key: 'is_featured', label: 'Featured', type: 'boolean' },
      { key: 'is_active', label: 'Active', type: 'boolean' }
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      ...localizedFields('title', 'Title'),
      ...localizedFields('short_description', 'Short description', 'textarea'),
      ...localizedFields('full_description', 'Full description', 'textarea'),
      { key: 'cover_url', label: 'Cover URL' },
      { key: 'promo_video_url', label: 'Promo video URL' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'currency', label: 'Currency', defaultValue: 'AZN' },
      ...localizedFields('duration_text', 'Duration'),
      { key: 'level', label: 'Level' },
      { key: 'enrollment_enabled', label: 'Enrollment', type: 'checkbox' },
      { key: 'is_featured', label: 'Featured', type: 'checkbox' },
      { key: 'is_active', label: 'Active', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Order', type: 'number', defaultValue: 0 }
    ],
    validate: validateSlugAndTitle
  },
  blog: {
    table: 'blog_posts',
    title: 'Блог',
    select: '*',
    searchColumns: ['slug_az', 'slug_ru', 'slug_en', 'category', 'status'],
    order: 'published_at',
    ascending: false,
    columns: [
      { key: 'title', label: 'Title', render: localized('title') },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'published_at', label: 'Published at', type: 'date' },
      { key: 'is_featured', label: 'Featured', type: 'boolean' },
      { key: 'updated_at', label: 'Updated', type: 'date' }
    ],
    fields: [
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'archived'], defaultValue: 'draft' },
      { key: 'published_at', label: 'Published at', type: 'datetime-local' },
      { key: 'reading_time', label: 'Reading time', type: 'number' },
      { key: 'is_featured', label: 'Featured', type: 'checkbox' },
      { key: 'cover_url', label: 'Cover URL' },
      { key: 'og_image_url', label: 'OG image URL' },
      { key: 'slug_az', label: 'Slug AZ', tab: 'AZ', required: true },
      { key: 'title.az', label: 'Title AZ', tab: 'AZ', required: true },
      { key: 'excerpt.az', label: 'Excerpt AZ', tab: 'AZ', type: 'textarea' },
      { key: 'content_markdown.az', label: 'Content AZ', tab: 'AZ', type: 'textarea', rows: 10 },
      { key: 'seo_title.az', label: 'SEO title AZ', tab: 'AZ' },
      { key: 'seo_description.az', label: 'SEO description AZ', tab: 'AZ', type: 'textarea' },
      { key: 'slug_ru', label: 'Slug RU', tab: 'RU' },
      { key: 'title.ru', label: 'Title RU', tab: 'RU' },
      { key: 'excerpt.ru', label: 'Excerpt RU', tab: 'RU', type: 'textarea' },
      { key: 'content_markdown.ru', label: 'Content RU', tab: 'RU', type: 'textarea', rows: 10 },
      { key: 'seo_title.ru', label: 'SEO title RU', tab: 'RU' },
      { key: 'seo_description.ru', label: 'SEO description RU', tab: 'RU', type: 'textarea' },
      { key: 'slug_en', label: 'Slug EN', tab: 'EN' },
      { key: 'title.en', label: 'Title EN', tab: 'EN' },
      { key: 'excerpt.en', label: 'Excerpt EN', tab: 'EN', type: 'textarea' },
      { key: 'content_markdown.en', label: 'Content EN', tab: 'EN', type: 'textarea', rows: 10 },
      { key: 'seo_title.en', label: 'SEO title EN', tab: 'EN' },
      { key: 'seo_description.en', label: 'SEO description EN', tab: 'EN', type: 'textarea' }
    ],
    validate: (payload) => {
      if (!required(payload.slug_az)) return 'Slug AZ is required';
      if (!required(payload.title?.az)) return 'Title AZ is required';
      if (payload.status === 'published' && !required(payload.published_at)) return 'Published article requires Published at';
      return '';
    }
  },
  instagram: {
    table: 'instagram_posts',
    title: 'Instagram',
    select: '*',
    searchColumns: ['instagram_url'],
    order: 'sort_order',
    columns: [
      {
        key: 'image_url',
        label: 'Preview',
        sortable: false,
        type: 'image'
      },
      { key: 'caption', label: 'Caption', render: localized('caption') },
      { key: 'published_at', label: 'Published at', type: 'date' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
      { key: 'sort_order', label: 'Order' }
    ],
    fields: [
      { key: 'image_url', label: 'Image URL' },
      { key: 'instagram_url', label: 'Instagram URL', required: true },
      ...localizedFields('caption', 'Caption', 'textarea'),
      { key: 'published_at', label: 'Published at', type: 'datetime-local' },
      { key: 'is_active', label: 'Active', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Order', type: 'number', defaultValue: 0 }
    ],
    validate: (payload) => (required(payload.instagram_url) ? '' : 'Instagram URL is required')
  }
};
