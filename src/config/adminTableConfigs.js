import { getLocalizedValue } from '../utils/localization';

export const ADMIN_LANGUAGE = 'az';

export const statusLabels = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  in_progress: 'В работе',
  completed: 'Завершена',
  rejected: 'Отклонена',
  cancelled: 'Отменена',
  draft: 'Черновик',
  published: 'Опубликовано',
  archived: 'Архив',
  pending: 'Ожидает',
  sent: 'Отправлено',
  failed: 'Ошибка',
  skipped: 'Пропущено'
};

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
  if (type === 'badge') return statusLabels[value] || String(value);
  if (type === 'boolean') return value ? 'Да' : 'Нет';
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
  if (!required(payload[slugKey])) return 'Slug обязателен';
  if (!required(payload.title?.az)) return 'Название AZ обязательно';
  return '';
}

export const bookingColumns = [
  { key: 'booking_number', label: 'Заявка' },
  { key: 'booking_date', label: 'Дата', render: (row) => row.booking_date ? String(row.booking_date).slice(0, 10) : 'Не назначено' },
  { key: 'booking_time', label: 'Время', render: (row) => String(row.booking_time || '').slice(0, 5) || '—' },
  { key: 'customer_name', label: 'Клиент' },
  { key: 'customer_phone', label: 'Телефон' },
  {
    key: 'service_package',
    label: 'Услуга / пакет',
    sortable: false,
    render: (row) => localized('services.title')(row) !== '—' ? localized('services.title')(row) : localized('packages.title')(row)
  },
  { key: 'status', label: 'Статус', type: 'badge' },
  { key: 'created_at', label: 'Создано', type: 'date' }
];

export const customerColumns = [
  { key: 'full_name', label: 'Имя' },
  { key: 'phone', label: 'Телефон' },
  { key: 'email', label: 'Email' },
  { key: 'bookings_count', label: 'Заявки', sortable: false, render: (row) => row.bookings?.length || 0 },
  {
    key: 'last_booking',
    label: 'Последняя заявка',
    sortable: false,
    render: (row) => {
      const latest = [...(row.bookings || [])].sort((a, b) => String(b.booking_date).localeCompare(String(a.booking_date)))[0];
      return latest?.booking_date || '—';
    }
  },
  { key: 'created_at', label: 'Создано', type: 'date' }
];

export const activityColumns = [
  { key: 'created_at', label: 'Дата', type: 'date' },
  { key: 'admin_user_id', label: 'Админ', render: (row) => row.admin_users?.display_name || row.admin_user_id || '—' },
  { key: 'action', label: 'Действие' },
  { key: 'entity_type', label: 'Раздел' },
  { key: 'summary', label: 'Описание' }
];

export const adminResources = {
  sections: {
    table: 'site_sections',
    title: 'Секции сайта',
    select: '*',
    searchColumns: ['section_key'],
    order: 'sort_order',
    columns: [
      { key: 'section_key', label: 'Секция' },
      { key: 'title', label: 'Название', render: localized('title') },
      { key: 'is_visible', label: 'Видимость', type: 'boolean' },
      { key: 'sort_order', label: 'Порядок' },
      { key: 'updated_at', label: 'Обновлено', type: 'date' }
    ],
    fields: [
      { key: 'section_key', label: 'Ключ секции', readOnlyOnEdit: true },
      ...localizedFields('title', 'Название'),
      ...localizedFields('subtitle', 'Подзаголовок'),
      ...localizedFields('description', 'Описание', 'textarea'),
      { key: 'is_visible', label: 'Показывать на сайте', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Порядок', type: 'number', defaultValue: 0 },
      { key: 'settings', label: 'Настройки JSON', type: 'json', defaultValue: {} }
    ]
  },
  services: {
    table: 'services',
    title: 'Услуги',
    select: '*',
    searchColumns: ['slug', 'category'],
    order: 'sort_order',
    columns: [
      { key: 'title', label: 'Название', render: localized('title') },
      { key: 'category', label: 'Категория' },
      { key: 'starting_price', label: 'Цена от', render: (row) => money(row, 'starting_price') },
      { key: 'booking_enabled', label: 'Бронь', type: 'boolean' },
      { key: 'is_active', label: 'Активно', type: 'boolean' },
      { key: 'sort_order', label: 'Порядок' }
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      ...localizedFields('title', 'Название'),
      ...localizedFields('short_description', 'Краткое описание', 'textarea'),
      ...localizedFields('full_description', 'Полное описание', 'textarea'),
      { key: 'category', label: 'Категория' },
      { key: 'icon_name', label: 'Иконка' },
      { key: 'image_url', label: 'URL изображения' },
      { key: 'starting_price', label: 'Цена от', type: 'number' },
      { key: 'currency', label: 'Валюта', defaultValue: 'AZN' },
      { key: 'duration_minutes', label: 'Длительность, минут', type: 'number' },
      { key: 'booking_enabled', label: 'Доступно для заявки', type: 'checkbox', defaultValue: true },
      { key: 'is_featured', label: 'Выделить', type: 'checkbox' },
      { key: 'is_active', label: 'Активно', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Порядок', type: 'number', defaultValue: 0 }
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
      { key: 'title', label: 'Название', render: localized('title') },
      { key: 'price', label: 'Цена', render: money },
      { key: 'is_featured', label: 'Выделен', type: 'boolean' },
      { key: 'booking_enabled', label: 'Бронь', type: 'boolean' },
      { key: 'is_active', label: 'Активно', type: 'boolean' },
      { key: 'sort_order', label: 'Порядок' }
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      ...localizedFields('title', 'Название'),
      ...localizedFields('subtitle', 'Подзаголовок'),
      ...localizedFields('description', 'Описание', 'textarea'),
      { key: 'price', label: 'Цена', type: 'number' },
      { key: 'currency', label: 'Валюта', defaultValue: 'AZN' },
      { key: 'is_featured', label: 'Выделить пакет', type: 'checkbox' },
      { key: 'booking_enabled', label: 'Доступен для заявки', type: 'checkbox', defaultValue: true },
      { key: 'is_active', label: 'Активно', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Порядок', type: 'number', defaultValue: 0 }
    ],
    validate: validateSlugAndTitle
  },
  projects: {
    table: 'projects',
    title: 'Проекты',
    select: '*',
    searchColumns: ['slug', 'project_type', 'client_name', 'artist_name'],
    notFilters: { project_type: 'portfolio' },
    order: 'sort_order',
    columns: [
      { key: 'title', label: 'Название', render: localized('title') },
      { key: 'project_type', label: 'Тип' },
      { key: 'client_artist', label: 'Клиент / артист', render: (row) => row.client_name || row.artist_name || '—' },
      { key: 'is_featured', label: 'Выделен', type: 'boolean' },
      { key: 'is_active', label: 'Активно', type: 'boolean' },
      { key: 'release_date', label: 'Дата релиза', type: 'dateOnly' }
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      ...localizedFields('title', 'Название'),
      ...localizedFields('description', 'Описание', 'textarea'),
      {
        key: 'project_type',
        label: 'Тип',
        type: 'select',
        options: [
          { value: 'portfolio', label: 'Портфель' },
          { value: 'media', label: 'Медиа-проект' },
          { value: 'release', label: 'Релиз' },
          { value: 'case-study', label: 'Кейс' }
        ]
      },
      { key: 'client_name', label: 'Клиент' },
      { key: 'artist_name', label: 'Артист' },
      { key: 'cover_url', label: 'URL обложки' },
      { key: 'video_url', label: 'URL видео' },
      { key: 'audio_url', label: 'URL аудио' },
      { key: 'external_url', label: 'Внешняя ссылка' },
      { key: 'release_date', label: 'Дата релиза', type: 'date' },
      { key: 'is_featured', label: 'Выделить', type: 'checkbox' },
      { key: 'is_active', label: 'Активно', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Порядок', type: 'number', defaultValue: 0 }
    ],
    validate: validateSlugAndTitle
  },
  portfolio: {
    table: 'projects',
    title: 'Портфель',
    select: '*',
    searchColumns: ['slug', 'client_name', 'artist_name'],
    fixedFilters: { project_type: 'portfolio' },
    defaultItem: { project_type: 'portfolio' },
    order: 'sort_order',
    columns: [
      { key: 'title', label: 'Название', render: localized('title') },
      { key: 'client_artist', label: 'Клиент / артист', render: (row) => row.client_name || row.artist_name || '—' },
      { key: 'is_featured', label: 'Выделен', type: 'boolean' },
      { key: 'is_active', label: 'Активно', type: 'boolean' },
      { key: 'release_date', label: 'Дата релиза', type: 'dateOnly' }
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      ...localizedFields('title', 'Название'),
      ...localizedFields('description', 'Описание', 'textarea'),
      { key: 'client_name', label: 'Клиент' },
      { key: 'artist_name', label: 'Артист' },
      { key: 'cover_url', label: 'URL обложки' },
      { key: 'video_url', label: 'URL видео' },
      { key: 'audio_url', label: 'URL аудио' },
      { key: 'external_url', label: 'Внешняя ссылка' },
      { key: 'release_date', label: 'Дата релиза', type: 'date' },
      { key: 'is_featured', label: 'Выделить', type: 'checkbox' },
      { key: 'is_active', label: 'Активно', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Порядок', type: 'number', defaultValue: 0 }
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
      { key: 'name', label: 'Имя' },
      { key: 'role', label: 'Роль' },
      { key: 'is_featured', label: 'Выделен', type: 'boolean' },
      { key: 'is_active', label: 'Активно', type: 'boolean' },
      { key: 'sort_order', label: 'Порядок' }
    ],
    fields: [
      { key: 'name', label: 'Имя', required: true },
      { key: 'slug', label: 'Slug' },
      ...localizedFields('description', 'Описание', 'textarea'),
      { key: 'image_url', label: 'URL изображения' },
      { key: 'role', label: 'Роль' },
      { key: 'external_url', label: 'Внешняя ссылка' },
      { key: 'is_featured', label: 'Выделить', type: 'checkbox' },
      { key: 'is_active', label: 'Активно', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Порядок', type: 'number', defaultValue: 0 }
    ],
    validate: (payload) => (required(payload.name) ? '' : 'Имя обязательно')
  },
  partners: {
    table: 'partners',
    title: 'Партнёры',
    select: '*',
    searchColumns: ['slug', 'name'],
    order: 'sort_order',
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'is_active', label: 'Активно', type: 'boolean' },
      { key: 'sort_order', label: 'Порядок' },
      { key: 'updated_at', label: 'Обновлено', type: 'date' }
    ],
    fields: [
      { key: 'name', label: 'Название', required: true },
      { key: 'slug', label: 'Slug' },
      ...localizedFields('description', 'Описание', 'textarea'),
      { key: 'logo_url', label: 'URL логотипа' },
      { key: 'external_url', label: 'Внешняя ссылка' },
      { key: 'is_active', label: 'Активно', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Порядок', type: 'number', defaultValue: 0 }
    ],
    validate: (payload) => (required(payload.name) ? '' : 'Название обязательно')
  },
  process: {
    table: 'process_steps',
    title: 'Процесс работы',
    select: '*',
    searchColumns: ['icon_name'],
    order: 'sort_order',
    columns: [
      { key: 'step_number', label: 'Шаг' },
      { key: 'title', label: 'Название', render: localized('title') },
      { key: 'is_active', label: 'Активно', type: 'boolean' },
      { key: 'sort_order', label: 'Порядок' }
    ],
    fields: [
      { key: 'step_number', label: 'Номер шага', type: 'number' },
      ...localizedFields('title', 'Название'),
      ...localizedFields('description', 'Описание', 'textarea'),
      { key: 'icon_name', label: 'Иконка' },
      { key: 'is_active', label: 'Активно', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Порядок', type: 'number', defaultValue: 0 }
    ],
    validate: (payload) => (required(payload.title?.az) ? '' : 'Название AZ обязательно')
  },
  courses: {
    table: 'courses',
    title: 'Курсы академии',
    select: '*',
    searchColumns: ['slug', 'level'],
    order: 'sort_order',
    columns: [
      { key: 'title', label: 'Название', render: localized('title') },
      { key: 'level', label: 'Уровень' },
      { key: 'price', label: 'Цена', render: money },
      { key: 'enrollment_enabled', label: 'Запись', type: 'boolean' },
      { key: 'is_featured', label: 'Выделен', type: 'boolean' },
      { key: 'is_active', label: 'Активно', type: 'boolean' }
    ],
    fields: [
      { key: 'slug', label: 'Slug', required: true },
      ...localizedFields('title', 'Название'),
      ...localizedFields('short_description', 'Краткое описание', 'textarea'),
      ...localizedFields('full_description', 'Полное описание', 'textarea'),
      { key: 'cover_url', label: 'URL обложки' },
      { key: 'promo_video_url', label: 'URL промо-видео' },
      { key: 'price', label: 'Цена', type: 'number' },
      { key: 'currency', label: 'Валюта', defaultValue: 'AZN' },
      ...localizedFields('duration_text', 'Длительность'),
      { key: 'level', label: 'Уровень' },
      { key: 'enrollment_enabled', label: 'Открыта запись', type: 'checkbox' },
      { key: 'is_featured', label: 'Выделить', type: 'checkbox' },
      { key: 'is_active', label: 'Активно', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Порядок', type: 'number', defaultValue: 0 }
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
      { key: 'title', label: 'Название', render: localized('title') },
      { key: 'category', label: 'Категория' },
      { key: 'status', label: 'Статус', type: 'badge' },
      { key: 'published_at', label: 'Дата публикации', type: 'date' },
      { key: 'is_featured', label: 'Выделен', type: 'boolean' },
      { key: 'updated_at', label: 'Обновлено', type: 'date' }
    ],
    fields: [
      { key: 'category', label: 'Категория' },
      { key: 'status', label: 'Статус', type: 'select', options: [{ value: 'draft', label: 'Черновик' }, { value: 'published', label: 'Опубликовано' }, { value: 'archived', label: 'Архив' }], defaultValue: 'draft' },
      { key: 'published_at', label: 'Дата публикации', type: 'datetime-local' },
      { key: 'reading_time', label: 'Время чтения, минут', type: 'number' },
      { key: 'is_featured', label: 'Выделить', type: 'checkbox' },
      { key: 'cover_url', label: 'URL обложки' },
      { key: 'og_image_url', label: 'URL OG-изображения' },
      { key: 'slug_az', label: 'Slug AZ', tab: 'AZ', required: true },
      { key: 'title.az', label: 'Название AZ', tab: 'AZ', required: true },
      { key: 'excerpt.az', label: 'Анонс AZ', tab: 'AZ', type: 'textarea' },
      { key: 'content_markdown.az', label: 'Текст AZ', tab: 'AZ', type: 'textarea', rows: 10 },
      { key: 'seo_title.az', label: 'SEO title AZ', tab: 'AZ' },
      { key: 'seo_description.az', label: 'SEO description AZ', tab: 'AZ', type: 'textarea' },
      { key: 'slug_ru', label: 'Slug RU', tab: 'RU' },
      { key: 'title.ru', label: 'Название RU', tab: 'RU' },
      { key: 'excerpt.ru', label: 'Анонс RU', tab: 'RU', type: 'textarea' },
      { key: 'content_markdown.ru', label: 'Текст RU', tab: 'RU', type: 'textarea', rows: 10 },
      { key: 'seo_title.ru', label: 'SEO title RU', tab: 'RU' },
      { key: 'seo_description.ru', label: 'SEO description RU', tab: 'RU', type: 'textarea' },
      { key: 'slug_en', label: 'Slug EN', tab: 'EN' },
      { key: 'title.en', label: 'Название EN', tab: 'EN' },
      { key: 'excerpt.en', label: 'Анонс EN', tab: 'EN', type: 'textarea' },
      { key: 'content_markdown.en', label: 'Текст EN', tab: 'EN', type: 'textarea', rows: 10 },
      { key: 'seo_title.en', label: 'SEO title EN', tab: 'EN' },
      { key: 'seo_description.en', label: 'SEO description EN', tab: 'EN', type: 'textarea' }
    ],
    validate: (payload) => {
      if (!required(payload.slug_az)) return 'Slug AZ обязателен';
      if (!required(payload.title?.az)) return 'Название AZ обязательно';
      if (payload.status === 'published' && !required(payload.published_at)) return 'Для опубликованной статьи нужна дата публикации';
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
        label: 'Превью',
        sortable: false,
        type: 'image'
      },
      { key: 'caption', label: 'Подпись', render: localized('caption') },
      { key: 'published_at', label: 'Дата публикации', type: 'date' },
      { key: 'is_active', label: 'Активно', type: 'boolean' },
      { key: 'sort_order', label: 'Порядок' }
    ],
    fields: [
      { key: 'image_url', label: 'URL изображения' },
      { key: 'instagram_url', label: 'Instagram URL', required: true },
      ...localizedFields('caption', 'Подпись', 'textarea'),
      { key: 'published_at', label: 'Дата публикации', type: 'datetime-local' },
      { key: 'is_active', label: 'Активно', type: 'checkbox', defaultValue: true },
      { key: 'sort_order', label: 'Порядок', type: 'number', defaultValue: 0 }
    ],
    validate: (payload) => (required(payload.instagram_url) ? '' : 'Instagram URL обязателен')
  }
};
