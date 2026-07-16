import { useEffect, useMemo, useState } from 'react';
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
  listTelegramSettings,
  rescheduleBooking,
  retryTelegramNotification,
  savePackageWithFeatures,
  saveSetting,
  sendTelegramTestNotification,
  updateTelegramSettings,
  updateBookingStatus,
  uploadMedia,
  upsertResource
} from '../../services/admin/adminDataService';
import { activityColumns, adminResources, bookingColumns, customerColumns, formatCell, getValue } from '../../config/adminTableConfigs';

const bookingStatuses = ['new', 'confirmed', 'in_progress', 'completed', 'rejected', 'cancelled'];

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
      setError(err.message || 'Load failed');
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
      <PageHead title="Dashboard" />
      {error && <p className="admin-error">{error}</p>}
      <div className="admin-summary-grid">
        <div><span>New</span><strong>{summary?.newBookings ?? '—'}</strong></div>
        <div><span>Today</span><strong>{summary?.todayBookings ?? '—'}</strong></div>
        <div><span>Completed</span><strong>{summary?.completedBookings ?? '—'}</strong></div>
        <div><span>Customers</span><strong>{summary?.customers ?? '—'}</strong></div>
      </div>
      <div className="admin-dashboard-grid">
        <section>
          <h2>Latest bookings</h2>
          <div className="admin-list">
            {(summary?.latestBookings || []).map((booking) => (
              <p key={booking.id}><strong>{booking.booking_number}</strong> {booking.customer_name} · {booking.status}</p>
            ))}
          </div>
        </section>
        <section>
          <h2>Latest actions</h2>
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

  useEffect(() => {
    if (selected?.id) {
      listBookingHistory(selected.id).then(setHistory).catch(() => setHistory([]));
    }
  }, [selected?.id]);

  async function handleStatus(status) {
    setSaving(true);
    try {
      const note = window.prompt('Note', '') || null;
      const updated = await updateBookingStatus(selected.id, status, note);
      setSelected(updated);
      await data.reload();
      setHistory(await listBookingHistory(selected.id));
    } finally {
      setSaving(false);
    }
  }

  async function handleReschedule(formData) {
    setSaving(true);
    try {
      const updated = await rescheduleBooking(selected.id, formData.get('date'), formData.get('time'), formData.get('note'));
      setSelected(updated);
      await data.reload();
      setHistory(await listBookingHistory(selected.id));
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
          { key: 'status', label: 'Status', options: bookingStatuses.map((value) => ({ value, label: value })) },
          { key: 'booking_date', label: 'Date', type: 'date' }
        ]}
      />

      <FormDrawer title={selected?.booking_number || 'Booking'} open={Boolean(selected)} item={selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="admin-drawer-content">
            <div className="admin-detail-grid">
              {['customer_name', 'customer_phone', 'customer_email', 'booking_date', 'booking_time', 'preferred_contact', 'language', 'source', 'status'].map((key) => (
                <p key={key}><span>{key}</span><strong>{formatCell(selected[key])}</strong></p>
              ))}
              <p className="wide"><span>Description</span><strong>{selected.project_description || '—'}</strong></p>
              <p className="wide"><span>Notes</span><strong>{selected.admin_notes || '—'}</strong></p>
            </div>
            <div className="admin-actions-row">
              {bookingStatuses.map((status) => (
                <button key={status} type="button" className="admin-secondary-btn" disabled={saving || status === selected.status} onClick={() => handleStatus(status)}>
                  {status}
                </button>
              ))}
              <a className="admin-secondary-btn" href={`https://wa.me/${String(selected.customer_phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <button type="button" className="admin-secondary-btn" onClick={() => navigator.clipboard?.writeText(selected.customer_phone || '')}>Copy phone</button>
              <button type="button" className="admin-secondary-btn" onClick={() => navigator.clipboard?.writeText(selected.booking_number || '')}>Copy number</button>
            </div>
            <form className="admin-inline-form" onSubmit={(event) => { event.preventDefault(); handleReschedule(new FormData(event.currentTarget)); }}>
              <input name="date" type="date" defaultValue={selected.booking_date} />
              <input name="time" type="time" defaultValue={String(selected.booking_time).slice(0, 5)} />
              <input name="note" placeholder="Reschedule note" />
              <button className="admin-primary-btn" disabled={saving}>Reschedule</button>
            </form>
            <h3>History</h3>
            <div className="admin-list">
              {history.map((item) => (
                <p key={item.id}><strong>{item.previous_status || '—'} → {item.new_status}</strong> {item.note}</p>
              ))}
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
            <button className="admin-secondary-btn" onClick={() => setMonth(new Date())}>Today</button>
            <button className="admin-secondary-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>Prev</button>
            <button className="admin-secondary-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Next</button>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              {bookingStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
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
      <FormDrawer title={selectedDate || 'Date'} open={Boolean(selectedDate)} onClose={() => setSelectedDate('')}>
        <div className="admin-drawer-content">
          {(byDate.get(selectedDate) || []).map((booking) => (
            <p key={booking.id}><strong>{booking.booking_time} · {booking.booking_number}</strong> {booking.customer_name} · {booking.status}</p>
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
      <FormDrawer title={selected?.full_name || 'Customer'} open={Boolean(selected)} item={selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="admin-drawer-content">
            {['full_name', 'phone', 'email', 'preferred_contact', 'notes'].map((key) => (
              <p key={key}><span>{key}</span><strong>{selected[key] || '—'}</strong></p>
            ))}
            <h3>Bookings</h3>
            <div className="admin-list">
              {(selected.bookings || []).map((booking) => (
                <p key={booking.id}><strong>{booking.booking_number}</strong> {booking.booking_date} · {booking.status}</p>
              ))}
              {(selected.bookings || []).length === 0 && <p>No bookings</p>}
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
        <h3>Package features</h3>
        <button type="button" className="admin-secondary-btn" onClick={addFeature}>Add feature</button>
      </div>
      {features.map((feature, index) => (
        <div className="admin-feature-row" key={feature.id || index}>
          <input value={feature.title?.az || ''} onChange={(event) => updateFeature(index, 'title.az', event.target.value)} placeholder="Feature AZ" />
          <input value={feature.title?.ru || ''} onChange={(event) => updateFeature(index, 'title.ru', event.target.value)} placeholder="RU" />
          <input value={feature.title?.en || ''} onChange={(event) => updateFeature(index, 'title.en', event.target.value)} placeholder="EN" />
          <input type="number" value={feature.sort_order ?? index * 10} onChange={(event) => updateFeature(index, 'sort_order', Number(event.target.value))} aria-label="Order" />
          <button type="button" className="admin-secondary-btn" onClick={() => removeFeature(index)}>Delete</button>
        </div>
      ))}
      {features.length === 0 && <p className="admin-muted">No features</p>}
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
      const payload = buildPayloadFromForm(selected || {}, fields, formData);
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
      setSaveError(error.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <PageHead
        title={config.title}
        actions={<button className="admin-primary-btn" onClick={() => setSelected({})}>Create</button>}
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
        title={selected?.id ? 'Edit' : 'Create'}
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
    title: 'Contacts',
    description: 'Public contact details',
    fields: [
      ['phone', 'Phone'],
      ['instagram', 'Instagram'],
      ['address.az', 'Address AZ'],
      ['address.ru', 'Address RU'],
      ['address.en', 'Address EN']
    ]
  },
  {
    key: 'social_links',
    title: 'Social links',
    description: 'Public social URLs',
    fields: [
      ['instagram', 'Instagram URL'],
      ['whatsapp', 'WhatsApp URL'],
      ['youtube', 'YouTube URL'],
      ['tiktok', 'TikTok URL']
    ]
  },
  {
    key: 'default_seo',
    title: 'Default SEO',
    description: 'Default public metadata',
    fields: [
      ['title.az', 'Title AZ'],
      ['title.ru', 'Title RU'],
      ['title.en', 'Title EN'],
      ['description.az', 'Description AZ'],
      ['description.ru', 'Description RU'],
      ['description.en', 'Description EN']
    ]
  },
  { key: 'booking', title: 'Booking', description: 'Booking UI/settings JSON', json: true },
  { key: 'business_hours', title: 'Business hours', description: 'Business hours JSON', json: true },
  { key: 'navigation', title: 'Navigation', description: 'Navigation labels/order JSON', json: true }
];

function SettingsPage() {
  const [values, setValues] = useState({});
  const [telegramSettings, setTelegramSettings] = useState(null);
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [rows, telegram, notifications] = await Promise.all([
        listSettings(),
        listTelegramSettings(),
        listTelegramNotifications({ page: 1, pageSize: 1 })
      ]);
      setValues(Object.fromEntries(rows.map((row) => [row.setting_key, row.value || {}])));
      setTelegramSettings(telegram);
      setTelegramStatus(notifications.rows[0] || null);
    } catch (err) {
      setError(err.message || 'Settings load failed');
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
      for (const section of settingSections) {
        let value = values[section.key] || {};
        if (section.json) {
          const raw = new FormData(event.currentTarget).get(section.key);
          value = raw ? JSON.parse(raw) : {};
        }
        await saveSetting(section.key, value, section.description, true);
      }
      if (telegramSettings) {
        await updateTelegramSettings(telegramSettings);
      }
      await load();
    } catch (err) {
      setError(err.message || 'Settings save failed');
    } finally {
      setSaving(false);
    }
  }

  function setTelegramField(key, value) {
    setTelegramSettings((current) => ({ ...current, [key]: value }));
  }

  async function handleTelegramTest() {
    setSaving(true);
    setError('');
    try {
      await sendTelegramTestNotification();
      await load();
    } catch (err) {
      setError(err.message || 'Telegram test failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <PageHead title="Настройки" />
      {error && <p className="admin-error">{error}</p>}
      {loading ? (
        <div className="admin-table-card">Loading...</div>
      ) : (
        <form className="admin-settings-form" onSubmit={handleSubmit}>
          {settingSections.map((section) => (
            <section key={section.key} className="admin-settings-section">
              <h2>{section.title}</h2>
              {section.json ? (
                <textarea name={section.key} rows={7} defaultValue={JSON.stringify(values[section.key] || {}, null, 2)} />
              ) : (
                <div className="admin-form-body">
                  {section.fields.map(([path, label]) => (
                    <label key={`${section.key}-${path}`}>
                      {label}
                      <input value={getValue(values[section.key] || {}, path) || ''} onChange={(event) => setNested(section.key, path, event.target.value)} />
                    </label>
                  ))}
                </div>
              )}
            </section>
          ))}
          <section className="admin-settings-section">
            <div className="admin-section-title">
              <h2>Telegram notifications</h2>
              <button type="button" className="admin-secondary-btn" disabled={saving} onClick={handleTelegramTest}>Send test notification</button>
            </div>
            <div className="admin-telegram-status">
              <span className={`admin-pill ${telegramStatus?.status === 'sent' ? 'is-on' : 'is-off'}`}>
                {telegramStatus ? `Last: ${telegramStatus.status}` : 'No notifications yet'}
              </span>
              {telegramStatus?.error_message && <span className="admin-error">{telegramStatus.error_message}</span>}
            </div>
            {telegramSettings && (
              <div className="admin-form-body compact">
                {[
                  ['notifications_enabled', 'Enabled'],
                  ['booking_created_enabled', 'New booking'],
                  ['booking_status_enabled', 'Status updates'],
                  ['reminders_enabled', 'Reminders'],
                  ['daily_summary_enabled', 'Daily summary']
                ].map(([key, label]) => (
                  <label key={key} className="admin-check">
                    <input type="checkbox" checked={Boolean(telegramSettings[key])} onChange={(event) => setTelegramField(key, event.target.checked)} />
                    {label}
                  </label>
                ))}
                <label>
                  First reminder after
                  <input type="number" value={telegramSettings.reminder_after_minutes || 20} onChange={(event) => setTelegramField('reminder_after_minutes', Number(event.target.value))} />
                </label>
                <label>
                  Repeat interval
                  <input type="number" value={telegramSettings.reminder_repeat_minutes || 60} onChange={(event) => setTelegramField('reminder_repeat_minutes', Number(event.target.value))} />
                </label>
                <label>
                  Active from
                  <input type="time" value={String(telegramSettings.active_start_time || '09:00').slice(0, 5)} onChange={(event) => setTelegramField('active_start_time', event.target.value)} />
                </label>
                <label>
                  Active until
                  <input type="time" value={String(telegramSettings.active_end_time || '21:00').slice(0, 5)} onChange={(event) => setTelegramField('active_end_time', event.target.value)} />
                </label>
                <label>
                  Summary time
                  <input type="time" value={String(telegramSettings.daily_summary_time || '09:00').slice(0, 5)} onChange={(event) => setTelegramField('daily_summary_time', event.target.value)} />
                </label>
              </div>
            )}
          </section>
          <div className="admin-drawer-footer inline">
            <button type="submit" className="admin-primary-btn" disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</button>
          </div>
        </form>
      )}
    </section>
  );
}

const notificationColumns = [
  { key: 'created_at', label: 'Date', type: 'date' },
  { key: 'booking', label: 'Booking', render: (row) => row.bookings?.booking_number || '—', sortable: false },
  { key: 'event_type', label: 'Event' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'attempt_count', label: 'Attempts' },
  { key: 'telegram_message_id', label: 'Telegram message ID' },
  { key: 'error_message', label: 'Error' }
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
      setError(err.message || 'Retry failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <PageHead title="Telegram notifications" />
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
          { key: 'status', label: 'Status', options: ['pending', 'sent', 'failed', 'skipped'].map((value) => ({ value, label: value })) },
          { key: 'event_type', label: 'Event', options: ['booking_created', 'booking_confirmed', 'booking_rescheduled', 'booking_cancelled', 'booking_rejected', 'booking_completed', 'booking_reminder', 'daily_summary'].map((value) => ({ value, label: value })) }
        ]}
      />
      <FormDrawer title="Notification" open={Boolean(selected)} item={selected} onClose={() => setSelected(null)}>
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
                Retry
              </button>
            </div>
            <h3>Delivery attempts</h3>
            <div className="admin-list">
              {attempts.map((attempt) => (
                <p key={attempt.id}>
                  <strong>#{attempt.attempt_number} · {attempt.response_status || '—'}</strong> {attempt.error_message || JSON.stringify(attempt.response_body || {})}
                </p>
              ))}
              {attempts.length === 0 && <p>No attempts</p>}
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
              {['site', 'projects', 'artists', 'partners', 'blog', 'instagram', 'courses'].map((item) => <option key={item}>{item}</option>)}
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
                <button className="admin-secondary-btn" onClick={() => navigator.clipboard?.writeText(path)}>Copy path</button>
                <button className="admin-secondary-btn" onClick={async () => { await deleteMedia(path); load(); }}>Delete</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        {Object.keys(adminResources).map((key) => (
          <Route key={key} path={key} element={<ResourcePage resourceKey={key} />} />
        ))}
      </Route>
    </Routes>
  );
}
