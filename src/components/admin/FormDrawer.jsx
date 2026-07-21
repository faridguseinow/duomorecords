import { useEffect, useRef, useState } from 'react';
import { getValue } from '../../config/adminTableConfigs';

function stringifyValue(value, type) {
  if (type === 'json') return JSON.stringify(value || {}, null, 2);
  if (type === 'datetime-local' && value) return String(value).slice(0, 16);
  if (type === 'date' && value) return String(value).slice(0, 10);
  if (value == null) return '';
  return String(value);
}

export function FormDrawer({ title, open, item, fields = [], children, afterFields, onClose, onSave, saving }) {
  const [dirty, setDirty] = useState(false);
  const tabs = [...new Set(fields.map((field) => field.tab).filter(Boolean))];
  const [activeTab, setActiveTab] = useState(tabs[0] || '');
  const drawerRef = useRef(null);

  useEffect(() => {
    setActiveTab(tabs[0] || '');
  }, [open, fields]);

  useEffect(() => {
    if (!open) return undefined;
    const first = drawerRef.current?.querySelector('input, textarea, select, button');
    first?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        handleClose();
      }
      if (event.key === 'Tab') {
        const focusables = drawerRef.current?.querySelectorAll('a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])');
        if (!focusables?.length) return;
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        } else if (!event.shiftKey && document.activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function handleClose() {
    if (dirty && !window.confirm('Закрыть без сохранения изменений?')) return;
    setDirty(false);
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSave?.(new FormData(event.currentTarget));
    setDirty(false);
  }

  if (!open) return null;

  function fieldValue(field) {
    const value = getValue(item || {}, field.key);
    return value ?? field.defaultValue;
  }

  function renderField(field) {
    const value = fieldValue(field);
    const disabled = field.disabled || (field.readOnlyOnEdit && item?.id);

    if (field.type === 'checkbox') {
      return (
        <label key={field.key} className="admin-check">
          <input name={field.key} type="checkbox" defaultChecked={Boolean(value)} disabled={disabled} />
          {field.label}
        </label>
      );
    }

    if (field.type === 'select') {
      return (
        <label key={field.key}>
          {field.label}
          <select name={field.key} defaultValue={stringifyValue(value, field.type)} disabled={disabled} required={field.required}>
            <option value="">Выберите</option>
            {(field.options || []).map((option) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
            })}
          </select>
        </label>
      );
    }

    if (field.type === 'textarea' || field.type === 'json') {
      return (
        <label key={field.key}>
          {field.label}
          <textarea
            name={field.key}
            rows={field.rows || (field.type === 'json' ? 8 : 4)}
            defaultValue={stringifyValue(value, field.type)}
            disabled={disabled}
            required={field.required}
          />
        </label>
      );
    }

    return (
      <label key={field.key}>
        {field.label}
        <input
          name={field.key}
          type={field.type || 'text'}
          defaultValue={stringifyValue(value, field.type)}
          disabled={disabled}
          required={field.required}
        />
      </label>
    );
  }

  return (
    <div className="admin-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && handleClose()}>
      <aside className="admin-drawer" ref={drawerRef} aria-label={title}>
        <div className="admin-drawer-head">
          <h2>{title}</h2>
          <button type="button" className="admin-icon-btn" onClick={handleClose}>×</button>
        </div>

        {children || (
          <form className="admin-form" onSubmit={handleSubmit} onChange={() => setDirty(true)}>
            <div className="admin-form-body">
              {fields.filter((field) => !field.tab).map(renderField)}
              {tabs.length > 0 && (
                <div className="admin-form-tabs">
                  <div className="admin-tab-list" role="tablist">
                    {tabs.map((tab) => (
                      <button key={tab} type="button" className={tab === activeTab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="admin-tab-panel">
                    {fields.filter((field) => field.tab === activeTab).map(renderField)}
                  </div>
                </div>
              )}
              {afterFields}
            </div>
            <div className="admin-drawer-footer">
              <button type="button" className="admin-secondary-btn" onClick={handleClose}>Отмена</button>
              <button type="submit" className="admin-primary-btn" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
