import { useEffect, useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Route, Routes, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminTable } from '../../components/admin/AdminTable';
import { FormDrawer } from '../../components/admin/FormDrawer';
import {
  buildPayloadFromForm,
  defaultFieldsForResource,
  deleteMedia,
  getDashboardSummary,
  listActivity,
  listBookings,
  listBookingHistory,
  listCalendarBookings,
  listCustomers,
  listMedia,
  listResource,
  listSettings,
  listTelegramDeliveryAttempts,
  listTelegramNotifications,
  rescheduleBooking,
  retryTelegramNotification,
  savePackageWithFeatures,
  saveSetting,
  updateBookingStatus,
  uploadMedia,
  upsertResource
} from '../../services/admin/adminDataService';
import { activityColumns, adminResources, bookingColumns, customerColumns, formatCell, getValue, statusLabels } from '../../config/adminTableConfigs';

const bookingStatuses = ['new', 'confirmed', 'in_progress', 'completed', 'rejected', 'cancelled'];

const bookingStatusTransitions = {
  new: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: []
};

const bookingStatusActionLabels = {
  confirmed: 'Подтвердить',
  in_progress: 'Взять в работу',
  completed: 'Завершить',
  rejected: 'Отклонить',
  cancelled: 'Отменить'
};

const bookingDetailLabels = {
  customer_name: 'Имя клиента',
  customer_phone: 'Телефон',
  customer_email: 'Email',
  booking_date: 'Дата',
  booking_time: 'Время',
  preferred_contact: 'Связь',
  language: 'Язык',
  source: 'Источник',
  status: 'Статус'
};

const customerDetailLabels = {
  full_name: 'Имя',
  phone: 'Телефон',
  email: 'Email',
  preferred_contact: 'Предпочтительный контакт',
  notes: 'Заметки'
};

const mediaFolderOptions = [
  { value: 'site', label: 'Сайт' },
  { value: 'projects', label: 'Проекты' },
  { value: 'artists', label: 'Артисты' },
  { value: 'partners', label: 'Партнёры' },
  { value: 'blog', label: 'Блог' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'courses', label: 'Курсы' }
];

function statusOption(value) {
  return { value, label: statusLabels[value] || value };
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatBookingSlot(booking) {
  if (!booking?.booking_date || !booking?.booking_time) {
    return 'Время не назначено';
  }

  return `${String(booking.booking_date).slice(0, 10)} · ${String(booking.booking_time).slice(0, 5)}`;
}

function usePagedData(loader, deps) {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState('');
  const [ascending, setAscending] = useState(true);
  const pageSize = 20;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loader({ page, pageSize, search, filters, sortKey, ascending });
      setRows(result.rows);
      setCount(result.count);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 220);
    return () => window.clearTimeout(timer);
  }, [page, search, JSON.stringify(filters), sortKey, ascending, ...deps]);

  function handleSort(key) {
    setSortKey(key);
    setAscending((value) => (sortKey === key ? !value : true));
  }

  return {
    rows,
    count,
    loading,
    error,
    page,
    pageSize,
    search,
    filters,
    sortKey,
    ascending,
    setPage,
    setSearch: (value) => {
      setPage(1);
      setSearch(value);
    },
    setFilter: (key, value) => {
      setPage(1);
      setFilters((current) => ({ ...current, [key]: value }));
    },
    handleSort,
    reload: load
  };
}

function PageHead({ title, actions }) {
  return (
    <div className="admin-page-head">
      <h1>{title}</h1>
      <div>{actions}</div>
    </div>
  );
}

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardSummary().then(setSummary).catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <PageHead title="Главная доска" />
      {error && <p className="admin-error">{error}</p>}
      <div className="admin-summary-grid">
        <div><span>Новые</span><strong>{summary?.newBookings ?? '—'}</strong></div>
        <div><span>Сегодня</span><strong>{summary?.todayBookings ?? '—'}</strong></div>
        <div><span>Завершено</span><strong>{summary?.completedBookings ?? '—'}</strong></div>
        <div><span>Клиенты</span><strong>{summary?.customers ?? '—'}</strong></div>
      </div>
      <div className="admin-dashboard-grid">
        <section>
          <h2>Последние заявки</h2>
          <div className="admin-list">
            {(summary?.latestBookings || []).map((booking) => (
              <p key={booking.id}><strong>{booking.booking_number}</strong> {booking.customer_name} · {statusLabels[booking.status] || booking.status}</p>
            ))}
          </div>
        </section>
        <section>
          <h2>Последние действия</h2>
          <div className="admin-list">
            {(summary?.activity || []).map((item) => (
              <p key={item.id}><strong>{item.action}</strong> {item.summary}</p>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function BookingsPage() {
  const data = usePagedData(
    ({ page, pageSize, search, filters }) => listBookings({ page, pageSize, search, status: filters.status || '', date: filters.booking_date || '' }),
    []
  );
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (selected?.id) {
      listBookingHistory(selected.id).then(setHistory).catch(() => setHistory([]));
      setActionError('');
    }
  }, [selected?.id]);

  async function handleStatus(status) {
    setSaving(true);
    setActionError('');
    try {
      const updated = await updateBookingStatus(selected.id, status, null);
      setSelected(updated);
      await data.reload();
      setHistory(await listBookingHistory(selected.id));
    } catch (err) {
      setActionError(err.message || 'Не удалось обновить статус');
    } finally {
      setSaving(false);
    }
  }

  async function handleSchedule(formData) {
    const date = formData.get('date');
    const time = formData.get('time');
    const note = formData.get('note');

    if (!date || !time) {
      setActionError('Укажите дату и время брони.');
      return;
    }

    setSaving(true);
    setActionError('');
    try {
      let updated = await rescheduleBooking(selected.id, date, time, note);
      if (updated.status === 'new') {
        updated = await updateBookingStatus(updated.id, 'confirmed', note || 'Дата и время назначены администратором');
      }
      setSelected(updated);
      await data.reload();
      setHistory(await listBookingHistory(selected.id));
    } catch (err) {
      setActionError(err.message || 'Не удалось назначить время');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <PageHead title="Заявки" />
      {data.error && <p className="admin-error">{data.error}</p>}
      <AdminTable
        id="bookings"
        columns={bookingColumns}
        rows={data.rows}
        count={data.count}
        loading={data.loading}
        page={data.page}
        pageSize={data.pageSize}
        search={data.search}
        filters={data.filters}
        sortKey={data.sortKey}
        ascending={data.ascending}
        onSearch={data.setSearch}
        onFilter={data.setFilter}
        onPage={data.setPage}
        onSort={data.handleSort}
        onRowClick={setSelected}
        filterOptions={[
          { key: 'status', label: 'Статус', options: bookingStatuses.map(statusOption) },
          { key: 'booking_date', label: 'Дата', type: 'date' }
        ]}
      />

      <FormDrawer title={selected?.booking_number || 'Заявка'} open={Boolean(selected)} item={selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="admin-drawer-content">
            {actionError && <p className="admin-error">{actionError}</p>}
            <div className="admin-booking-summary">
              <div>
                <span>Текущий статус</span>
                <strong>{statusLabels[selected.status] || selected.status}</strong>
              </div>
              <div>
                <span>Назначенное время</span>
                <strong>{formatBookingSlot(selected)}</strong>
              </div>
            </div>
            <div className="admin-detail-grid">
              {['customer_name', 'customer_phone', 'customer_email', 'booking_date', 'booking_time', 'preferred_contact', 'language', 'source', 'status'].map((key) => (
                <p key={key}><span>{bookingDetailLabels[key] || key}</span><strong>{key === 'status' ? statusLabels[selected[key]] || selected[key] : formatCell(selected[key])}</strong></p>
              ))}
              <p className="wide"><span>Услуга / пакет</span><strong>{selected.services?.title?.az || selected.packages?.title?.az || '—'}</strong></p>
              <p className="wide"><span>Описание проекта</span><strong>{selected.project_description || '—'}</strong></p>
              <p className="wide"><span>Заметки админа</span><strong>{selected.admin_notes || '—'}</strong></p>
            </div>
            <div className="admin-actions-panel">
              <h3>Обработка заявки</h3>
              <div className="admin-actions-row">
                {(bookingStatusTransitions[selected.status] || []).map((status) => (
                  <button key={status} type="button" className="admin-secondary-btn" disabled={saving} onClick={() => handleStatus(status)}>
                    {bookingStatusActionLabels[status] || statusLabels[status] || status}
                  </button>
                ))}
                {(bookingStatusTransitions[selected.status] || []).length === 0 && <p className="admin-muted">Для этого статуса нет дальнейших действий.</p>}
              </div>
            </div>
            <div className="admin-actions-row">
              <a className="admin-secondary-btn" href={`https://wa.me/${String(selected.customer_phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <button type="button" className="admin-secondary-btn" onClick={() => navigator.clipboard?.writeText(selected.customer_phone || '')}>Копировать телефон</button>
              <button type="button" className="admin-secondary-btn" onClick={() => navigator.clipboard?.writeText(selected.booking_number || '')}>Копировать номер</button>
            </div>
            <form className="admin-schedule-form" onSubmit={(event) => { event.preventDefault(); handleSchedule(new FormData(event.currentTarget)); }}>
              <div className="admin-section-title">
                <div>
                  <h3>{selected.booking_date ? 'Изменить время брони' : 'Назначить дату и время'}</h3>
                  <p className="admin-muted">После назначения новая заявка станет подтверждённой и появится в календаре.</p>
                </div>
                <button className="admin-primary-btn" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить время'}</button>
              </div>
              <label>
                Дата
                <input name="date" type="date" required defaultValue={selected.booking_date || ''} />
              </label>
              <label>
                Время
                <input name="time" type="time" required defaultValue={String(selected.booking_time || '').slice(0, 5)} />
              </label>
              <label className="wide">
                Комментарий администратора
                <textarea name="note" rows="4" placeholder="Например: согласовали по WhatsApp, клиент придёт на запись вокала." />
              </label>
            </form>
            <h3>История</h3>
            <div className="admin-list">
              {history.map((item) => (
                <p key={item.id}><strong>{item.previous_status || '—'} → {item.new_status}</strong> {item.note}</p>
              ))}
              {history.length === 0 && <p>Истории пока нет</p>}
            </div>
          </div>
        )}
      </FormDrawer>
    </section>
  );
}

function CalendarPage() {
  const [month, setMonth] = useState(() => new Date());
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const cells = [];
  for (let i = 0; i < (monthStart.getDay() + 6) % 7; i += 1) cells.push(null);
  for (let d = 1; d <= monthEnd.getDate(); d += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  useEffect(() => {
    const start = formatLocalDate(monthStart);
    const end = formatLocalDate(monthEnd);
    listCalendarBookings({ startDate: start, endDate: end, status }).then(setRows).catch(() => setRows([]));
  }, [month.getFullYear(), month.getMonth(), status]);

  const byDate = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => map.set(row.booking_date, [...(map.get(row.booking_date) || []), row]));
    return map;
  }, [rows]);

  return (
    <section>
      <PageHead
        title="Календарь"
        actions={
          <div className="admin-actions-row">
            <button className="admin-secondary-btn" onClick={() => setMonth(new Date())}>Сегодня</button>
            <button className="admin-secondary-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>Назад</button>
            <button className="admin-secondary-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Вперёд</button>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Все статусы</option>
              {bookingStatuses.map((item) => <option key={item} value={item}>{statusLabels[item] || item}</option>)}
            </select>
          </div>
        }
      />
      <div className="admin-calendar-title">{month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</div>
      <div className="admin-calendar-grid">
        {cells.map((cell, index) => {
          const iso = cell ? formatLocalDate(cell) : '';
          const bookings = iso ? byDate.get(iso) || [] : [];
          return (
            <button key={iso || `empty-${index}`} type="button" className="admin-calendar-day" disabled={!cell} onClick={() => setSelectedDate(iso)}>
              <span>{cell?.getDate() || ''}</span>
              {bookings.length > 0 && <strong>{bookings.length}</strong>}
            </button>
          );
        })}
      </div>
      <FormDrawer title={selectedDate || 'Дата'} open={Boolean(selectedDate)} onClose={() => setSelectedDate('')}>
        <div className="admin-drawer-content">
          {(byDate.get(selectedDate) || []).map((booking) => (
            <p key={booking.id}><strong>{booking.booking_time} · {booking.booking_number}</strong> {booking.customer_name} · {statusLabels[booking.status] || booking.status}</p>
          ))}
        </div>
      </FormDrawer>
    </section>
  );
}

function CustomersPage() {
  const data = usePagedData(({ page, pageSize, search }) => listCustomers({ page, pageSize, search }), []);
  const [selected, setSelected] = useState(null);
  return (
    <section>
      <PageHead title="Клиенты" />
      <AdminTable
        id="customers"
        columns={customerColumns}
        rows={data.rows}
        count={data.count}
        loading={data.loading}
        page={data.page}
        pageSize={data.pageSize}
        search={data.search}
        filters={data.filters}
        sortKey={data.sortKey}
        ascending={data.ascending}
        onSearch={data.setSearch}
        onFilter={data.setFilter}
        onPage={data.setPage}
        onSort={data.handleSort}
        onRowClick={setSelected}
      />
      <FormDrawer title={selected?.full_name || 'Клиент'} open={Boolean(selected)} item={selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="admin-drawer-content">
            {['full_name', 'phone', 'email', 'preferred_contact', 'notes'].map((key) => (
              <p key={key}><span>{customerDetailLabels[key] || key}</span><strong>{selected[key] || '—'}</strong></p>
            ))}
            <h3>Заявки</h3>
            <div className="admin-list">
              {(selected.bookings || []).map((booking) => (
                <p key={booking.id}><strong>{booking.booking_number}</strong> {booking.booking_date} · {statusLabels[booking.status] || booking.status}</p>
              ))}
              {(selected.bookings || []).length === 0 && <p>Заявок пока нет</p>}
            </div>
          </div>
        )}
      </FormDrawer>
    </section>
  );
}

function PackageFeaturesEditor({ features, onChange }) {
  function updateFeature(index, path, value) {
    onChange(features.map((feature, featureIndex) => {
      if (featureIndex !== index) return feature;
      if (path.startsWith('title.')) {
        const language = path.split('.')[1];
        return { ...feature, title: { ...(feature.title || {}), [language]: value } };
      }
      return { ...feature, [path]: value };
    }));
  }

  function addFeature() {
    onChange([...features, { title: { az: '', ru: '', en: '' }, sort_order: (features.length + 1) * 10 }]);
  }

  function removeFeature(index) {
    onChange(features.filter((_, featureIndex) => featureIndex !== index));
  }

  return (
    <div className="admin-feature-editor">
      <div className="admin-section-title">
        <h3>Что входит в пакет</h3>
        <button type="button" className="admin-secondary-btn" onClick={addFeature}>Добавить пункт</button>
      </div>
      {features.map((feature, index) => (
        <div className="admin-feature-row" key={feature.id || index}>
          <input value={feature.title?.az || ''} onChange={(event) => updateFeature(index, 'title.az', event.target.value)} placeholder="Пункт AZ" />
          <input value={feature.title?.ru || ''} onChange={(event) => updateFeature(index, 'title.ru', event.target.value)} placeholder="RU" />
          <input value={feature.title?.en || ''} onChange={(event) => updateFeature(index, 'title.en', event.target.value)} placeholder="EN" />
          <input type="number" value={feature.sort_order ?? index * 10} onChange={(event) => updateFeature(index, 'sort_order', Number(event.target.value))} aria-label="Порядок" />
          <button type="button" className="admin-secondary-btn" onClick={() => removeFeature(index)}>Удалить</button>
        </div>
      ))}
      {features.length === 0 && <p className="admin-muted">Пункты пакета пока не добавлены</p>}
    </div>
  );
}

function ResourcePage({ resourceKey }) {
  const config = adminResources[resourceKey];
  const data = usePagedData(
    ({ page, pageSize, search, filters, sortKey, ascending }) => listResource(config, { page, pageSize, search, filters, sortKey, ascending }),
    [resourceKey]
  );
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [features, setFeatures] = useState([]);
  const fields = defaultFieldsForResource(config);

  useEffect(() => {
    if (resourceKey !== 'packages' || !selected) return;
    setFeatures([...(selected.package_features || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
  }, [resourceKey, selected]);

  async function handleSave(formData) {
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        ...(config.defaultItem || {}),
        ...buildPayloadFromForm(selected || {}, fields, formData)
      };
      const validationError = config.validate?.(payload);
      if (validationError) {
        setSaveError(validationError);
        return;
      }
      if (config.withFeatures) {
        await savePackageWithFeatures(config, payload, features);
      } else {
        await upsertResource(config, payload);
      }
      await data.reload();
      setSelected(null);
    } catch (error) {
      setSaveError(error.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <PageHead
        title={config.title}
        actions={<button className="admin-primary-btn" onClick={() => setSelected({ ...(config.defaultItem || {}) })}>Создать</button>}
      />
      {data.error && <p className="admin-error">{data.error}</p>}
      <AdminTable
        id={resourceKey}
        columns={config.columns}
        rows={data.rows}
        count={data.count}
        loading={data.loading}
        page={data.page}
        pageSize={data.pageSize}
        search={data.search}
        filters={data.filters}
        sortKey={data.sortKey}
        ascending={data.ascending}
        onSearch={data.setSearch}
        onFilter={data.setFilter}
        onPage={data.setPage}
        onSort={data.handleSort}
        onRowClick={setSelected}
        actions={selected ? null : undefined}
      />
      {saveError && <p className="admin-error">{saveError}</p>}
      <FormDrawer
        title={selected?.id ? 'Редактирование' : 'Создание'}
        open={Boolean(selected)}
        item={selected}
        fields={fields}
        afterFields={resourceKey === 'packages' ? <PackageFeaturesEditor features={features} onChange={setFeatures} /> : null}
        onClose={() => setSelected(null)}
        onSave={handleSave}
        saving={saving}
      />
    </section>
  );
}

const settingSections = [
  {
    key: 'contact_information',
    title: 'Контактные данные',
    description: 'Публичные контакты, которые показываются на сайте',
    fields: [
      ['phone', 'Телефон'],
      ['instagram', 'Instagram'],
      ['address.az', 'Адрес AZ'],
      ['address.ru', 'Адрес RU'],
      ['address.en', 'Адрес EN']
    ]
  },
  {
    key: 'social_links',
    title: 'Социальные ссылки',
    description: 'Публичные ссылки на социальные сети',
    fields: [
      ['instagram', 'Instagram URL'],
      ['whatsapp', 'WhatsApp URL'],
      ['youtube', 'YouTube URL'],
      ['tiktok', 'TikTok URL']
    ]
  },
  {
    key: 'default_seo',
    title: 'SEO по умолчанию',
    description: 'Публичные метаданные по умолчанию',
    fields: [
      ['title.az', 'Название AZ'],
      ['title.ru', 'Название RU'],
      ['title.en', 'Название EN'],
      ['description.az', 'Описание AZ'],
      ['description.ru', 'Описание RU'],
      ['description.en', 'Описание EN']
    ]
  },
  { key: 'booking', title: 'Заявки', description: 'JSON настроек заявок', json: true },
  { key: 'business_hours', title: 'Рабочие часы', description: 'JSON рабочих часов', json: true },
  { key: 'navigation', title: 'Навигация', description: 'JSON навигации', json: true }
];

const contactSections = settingSections.filter((section) => ['contact_information', 'social_links'].includes(section.key));

function SettingsPage({ theme, onThemeToggle }) {
  const isDark = theme === 'dark';
  const toggleTheme = onThemeToggle || (() => {});

  return (
    <section>
      <PageHead title="Настройки" />
      <div className="admin-settings-form">
        <section className="admin-settings-section admin-preferences-card">
          <div>
            <h2>Персонализация админки</h2>
            <p className="admin-muted">Здесь будут настройки админ-панели. Пока доступен только режим оформления.</p>
          </div>
          <button type="button" className="admin-theme-switch" onClick={toggleTheme} aria-pressed={isDark}>
            <span className={isDark ? 'active' : ''}>
              <Moon aria-hidden="true" size={18} />
              Тёмная
            </span>
            <span className={!isDark ? 'active' : ''}>
              <Sun aria-hidden="true" size={18} />
              Светлая
            </span>
          </button>
        </section>
      </div>
    </section>
  );
}

function ContactsPage() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const rows = await listSettings();
      setValues(Object.fromEntries(rows.map((row) => [row.setting_key, row.value || {}])));
    } catch (err) {
      setError(err.message || 'Не удалось загрузить контакты');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function setNested(sectionKey, path, value) {
    setValues((current) => {
      const next = { ...current, [sectionKey]: { ...(current[sectionKey] || {}) } };
      const parts = path.split('.');
      let target = next[sectionKey];
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          target[part] = value;
        } else {
          target[part] = { ...(target[part] || {}) };
          target = target[part];
        }
      });
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      for (const section of contactSections) {
        await saveSetting(section.key, values[section.key] || {}, section.description, true);
      }
      await load();
    } catch (err) {
      setError(err.message || 'Не удалось сохранить контакты');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <PageHead title="Контакты" />
      {error && <p className="admin-error">{error}</p>}
      {loading ? (
        <div className="admin-table-card admin-loading-card">Загрузка...</div>
      ) : (
        <form className="admin-settings-form" onSubmit={handleSubmit}>
          {contactSections.map((section) => (
            <section key={section.key} className="admin-settings-section">
              <h2>{section.title}</h2>
              <p className="admin-muted">{section.description}</p>
              <div className="admin-form-body">
                {section.fields.map(([path, label]) => (
                  <label key={`${section.key}-${path}`}>
                    {label}
                    <input value={getValue(values[section.key] || {}, path) || ''} onChange={(event) => setNested(section.key, path, event.target.value)} />
                  </label>
                ))}
              </div>
            </section>
          ))}
          <div className="admin-drawer-footer inline">
            <button type="submit" className="admin-primary-btn" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить контакты'}</button>
          </div>
        </form>
      )}
    </section>
  );
}

const notificationColumns = [
  { key: 'created_at', label: 'Дата', type: 'date' },
  { key: 'booking', label: 'Заявка', render: (row) => row.bookings?.booking_number || '—', sortable: false },
  { key: 'event_type', label: 'Событие' },
  { key: 'status', label: 'Статус', type: 'badge' },
  { key: 'attempt_count', label: 'Попытки' },
  { key: 'telegram_message_id', label: 'ID сообщения Telegram' },
  { key: 'error_message', label: 'Ошибка' }
];

function NotificationsPage() {
  const data = usePagedData(
    ({ page, pageSize, search, filters }) => listTelegramNotifications({ page, pageSize, search, filters }),
    []
  );
  const [selected, setSelected] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selected?.id) return;
    listTelegramDeliveryAttempts(selected.id).then(setAttempts).catch(() => setAttempts([]));
  }, [selected?.id]);

  async function handleRetry() {
    setSaving(true);
    setError('');
    try {
      await retryTelegramNotification(selected.id);
      await data.reload();
      setAttempts(await listTelegramDeliveryAttempts(selected.id));
    } catch (err) {
      setError(err.message || 'Не удалось повторить отправку');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <PageHead title="Telegram уведомления" />
      {data.error && <p className="admin-error">{data.error}</p>}
      <AdminTable
        id="telegram-notifications"
        columns={notificationColumns}
        rows={data.rows}
        count={data.count}
        loading={data.loading}
        page={data.page}
        pageSize={data.pageSize}
        search={data.search}
        filters={data.filters}
        sortKey={data.sortKey}
        ascending={data.ascending}
        onSearch={data.setSearch}
        onFilter={data.setFilter}
        onPage={data.setPage}
        onSort={data.handleSort}
        onRowClick={setSelected}
        filterOptions={[
          { key: 'status', label: 'Статус', options: ['pending', 'sent', 'failed', 'skipped'].map(statusOption) },
          { key: 'event_type', label: 'Событие', options: ['booking_created', 'booking_confirmed', 'booking_rescheduled', 'booking_cancelled', 'booking_rejected', 'booking_completed', 'booking_reminder', 'daily_summary'].map((value) => ({ value, label: value })) }
        ]}
      />
      <FormDrawer title="Уведомление" open={Boolean(selected)} item={selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="admin-drawer-content">
            {error && <p className="admin-error">{error}</p>}
            <div className="admin-detail-grid">
              {['event_type', 'status', 'deduplication_key', 'telegram_message_id', 'attempt_count', 'error_message'].map((key) => (
                <p key={key} className={key === 'deduplication_key' || key === 'error_message' ? 'wide' : ''}>
                  <span>{key}</span>
                  <strong>{formatCell(selected[key])}</strong>
                </p>
              ))}
              <p className="wide"><span>Payload</span><strong>{JSON.stringify(selected.payload || {}, null, 2)}</strong></p>
            </div>
            <div className="admin-actions-row">
              <button type="button" className="admin-secondary-btn" disabled={saving || selected.status !== 'failed' || selected.attempt_count >= 3} onClick={handleRetry}>
                Повторить
              </button>
            </div>
            <h3>Попытки доставки</h3>
            <div className="admin-list">
              {attempts.map((attempt) => (
                <p key={attempt.id}>
                  <strong>#{attempt.attempt_number} · {attempt.response_status || '—'}</strong> {attempt.error_message || JSON.stringify(attempt.response_body || {})}
                </p>
              ))}
              {attempts.length === 0 && <p>Попыток пока нет</p>}
            </div>
          </div>
        )}
      </FormDrawer>
    </section>
  );
}

function ActivityPage() {
  const data = usePagedData(({ page, pageSize }) => listActivity({ page, pageSize }), []);
  return (
    <section>
      <PageHead title="История действий" />
      <AdminTable
        id="activity"
        columns={activityColumns}
        rows={data.rows}
        count={data.count}
        loading={data.loading}
        page={data.page}
        pageSize={data.pageSize}
        search={data.search}
        filters={data.filters}
        sortKey={data.sortKey}
        ascending={data.ascending}
        onSearch={data.setSearch}
        onFilter={data.setFilter}
        onPage={data.setPage}
        onSort={data.handleSort}
      />
    </section>
  );
}

function MediaPage() {
  const [folder, setFolder] = useState('site');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setItems(await listMedia(folder));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [folder]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadMedia(file, folder);
    event.target.value = '';
    load();
  }

  return (
    <section>
      <PageHead
        title="Медиа"
        actions={
          <div className="admin-actions-row">
            <select value={folder} onChange={(event) => setFolder(event.target.value)}>
              {mediaFolderOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.avif,.mp4,.webm" onChange={handleUpload} />
          </div>
        }
      />
      {error && <p className="admin-error">{error}</p>}
      <div className="admin-media-grid">
        {items.map((item) => {
          const path = `${folder}/${item.name}`;
          return (
            <article key={item.id || item.name}>
              <div className="admin-media-preview">{item.name.split('.').pop()?.toUpperCase()}</div>
              <strong>{item.name}</strong>
              <span>{Math.round((item.metadata?.size || 0) / 1024)} KB</span>
              <div className="admin-actions-row">
                <button className="admin-secondary-btn" onClick={() => navigator.clipboard?.writeText(path)}>Копировать путь</button>
                <button className="admin-secondary-btn" onClick={async () => { await deleteMedia(path); load(); }}>Удалить</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function AdminApp({ theme, onThemeToggle }) {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="settings" element={<SettingsPage theme={theme} onThemeToggle={onThemeToggle} />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        {Object.keys(adminResources).map((key) => (
          <Route key={key} path={key} element={<ResourcePage resourceKey={key} />} />
        ))}
      </Route>
    </Routes>
  );
}
