import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';

const navGroups = [
  {
    title: 'Управление',
    items: [
      ['Dashboard', ''],
      ['Заявки', 'bookings'],
      ['Календарь', 'calendar'],
      ['Клиенты', 'customers'],
      ['Медиа', 'media'],
      ['Настройки', 'settings'],
      ['Notifications', 'notifications'],
      ['История', 'activity']
    ]
  },
  {
    title: 'Контент',
    items: [
      ['Секции', 'sections'],
      ['Услуги', 'services'],
      ['Пакеты', 'packages'],
      ['Проекты', 'projects'],
      ['Артисты', 'artists'],
      ['Партнёры', 'partners'],
      ['Процесс', 'process'],
      ['Курсы', 'courses'],
      ['Блог', 'blog'],
      ['Instagram', 'instagram']
    ]
  }
];

export function AdminLayout() {
  const { lang = 'az' } = useParams();
  const { user, signOut } = useAdminAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-sidebar-head">
          <strong>DUOMO</strong>
          <button type="button" className="admin-icon-btn mobile-only" onClick={() => setOpen(false)}>×</button>
        </div>
        {navGroups.map((group) => (
          <nav key={group.title} className="admin-nav" aria-label={group.title}>
            <p>{group.title}</p>
            {group.items.map(([label, path]) => (
              <NavLink
                key={path || 'dashboard'}
                to={`/${lang}/admin${path ? `/${path}` : ''}`}
                end={!path}
                onClick={() => setOpen(false)}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        ))}
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-secondary-btn mobile-only" onClick={() => setOpen(true)}>Menu</button>
          <span>{user?.email}</span>
          <button type="button" className="admin-secondary-btn" onClick={signOut}>Logout</button>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
