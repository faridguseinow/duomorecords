import { useEffect, useMemo, useState } from 'react';
import { formatCell, getValue } from '../../config/adminTableConfigs';

function loadColumnSettings(storageKey, columns) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const byKey = new Map(columns.map((column) => [column.key, column]));
    const ordered = (saved.order || columns.map((column) => column.key))
      .filter((key) => byKey.has(key))
      .map((key) => ({
        ...byKey.get(key),
        hidden: saved.hidden?.includes(key),
        width: saved.widths?.[key] || byKey.get(key).width
      }));

    columns.forEach((column) => {
      if (!ordered.some((item) => item.key === column.key)) {
        ordered.push(column);
      }
    });

    return ordered;
  } catch {
    return columns;
  }
}

export function AdminTable({
  id,
  columns,
  rows,
  count,
  loading,
  emptyText = 'No data',
  page,
  pageSize,
  search,
  filters,
  sortKey,
  ascending,
  onSearch,
  onFilter,
  onPage,
  onSort,
  onRowClick,
  filterOptions = [],
  actions
}) {
  const storageKey = `duomo-admin-table-v2-${id}`;
  const [tableColumns, setTableColumns] = useState(() => loadColumnSettings(storageKey, columns));
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setTableColumns(loadColumnSettings(storageKey, columns));
  }, [storageKey, columns]);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        order: tableColumns.map((column) => column.key),
        hidden: tableColumns.filter((column) => column.hidden).map((column) => column.key),
        widths: Object.fromEntries(tableColumns.map((column) => [column.key, column.width]).filter(([, width]) => width))
      })
    );
  }, [storageKey, tableColumns]);

  const visibleColumns = useMemo(() => tableColumns.filter((column) => !column.hidden), [tableColumns]);
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  function moveColumn(key, direction) {
    setTableColumns((current) => {
      const index = current.findIndex((column) => column.key === key);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function toggleColumn(key) {
    setTableColumns((current) =>
      current.map((column) => (column.key === key ? { ...column, hidden: !column.hidden } : column))
    );
  }

  function resizeColumn(key, width) {
    setTableColumns((current) =>
      current.map((column) => (column.key === key ? { ...column, width: width || undefined } : column))
    );
  }

  function resetColumns() {
    localStorage.removeItem(storageKey);
    setTableColumns(columns);
  }

  function renderCell(row, column) {
    if (column.render) return column.render(row, column);
    const value = getValue(row, column.key);
    if (column.type === 'badge') {
      return (
        <span className={`admin-badge status-${value || 'empty'}`}>
          {formatCell(value, column.type)}
        </span>
      );
    }
    if (column.type === 'boolean') {
      return <span className={`admin-pill ${value ? 'is-on' : 'is-off'}`}>{value ? 'Yes' : 'No'}</span>;
    }
    if (column.type === 'dateOnly') {
      return value ? String(value).slice(0, 10) : '—';
    }
    if (column.type === 'image') {
      return value ? <img className="admin-thumb" src={value} alt="" loading="lazy" /> : '—';
    }
    return formatCell(value, column.type);
  }

  return (
    <div className="admin-table-card">
      <div className="admin-table-toolbar">
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search"
          aria-label="Search table"
        />
        {filterOptions.map((filter) => (
          filter.type === 'date' ? (
            <input
              key={filter.key}
              type="date"
              value={filters[filter.key] || ''}
              onChange={(event) => onFilter(filter.key, event.target.value)}
              aria-label={filter.label}
            />
          ) : (
            <select
              key={filter.key}
              value={filters[filter.key] || ''}
              onChange={(event) => onFilter(filter.key, event.target.value)}
              aria-label={filter.label}
            >
              <option value="">{filter.label}</option>
              {(filter.options || []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )
        ))}
        {actions}
        <button type="button" className="admin-secondary-btn" onClick={() => setSettingsOpen((value) => !value)}>
          Columns
        </button>
      </div>

      {settingsOpen && (
        <div className="admin-column-settings">
          {tableColumns.map((column) => (
            <div key={column.key}>
              <label>
                <input type="checkbox" checked={!column.hidden} onChange={() => toggleColumn(column.key)} />
                {column.label}
              </label>
              <button type="button" onClick={() => moveColumn(column.key, -1)}>↑</button>
              <button type="button" onClick={() => moveColumn(column.key, 1)}>↓</button>
              <input
                type="number"
                min="80"
                placeholder="width"
                value={column.width || ''}
                onChange={(event) => resizeColumn(column.key, event.target.value)}
              />
            </div>
          ))}
          <button type="button" className="admin-secondary-btn" onClick={resetColumns}>Reset columns</button>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {visibleColumns.map((column) => (
                <th key={column.key} style={{ width: column.width ? `${column.width}px` : undefined }}>
                  <button
                    type="button"
                    disabled={column.sortable === false || Boolean(column.render) || column.type === 'image'}
                    onClick={() => (column.sortable === false || column.render || column.type === 'image' ? null : onSort(column.key))}
                  >
                    {column.label}
                    {sortKey === column.key && <span>{ascending ? ' ↑' : ' ↓'}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={visibleColumns.length}>Loading...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length}>{emptyText}</td>
              </tr>
            )}
            {!loading && rows.map((row) => (
              <tr key={row.id || row.booking_number || JSON.stringify(row)} onClick={() => onRowClick?.(row)}>
                {visibleColumns.map((column) => (
                  <td key={column.key} data-label={column.label}>
                    {renderCell(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <span>{count || 0} rows</span>
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
        <span>{page} / {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
