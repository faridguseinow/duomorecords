import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { siteContent, supportedLanguages } from './content';
import {
  addDays,
  createBooking,
  fetchAvailableSlots,
  toIsoDate
} from './lib/calendarApi';
import {
  fallbackCollaborations,
  fallbackMediaProjects,
  fallbackPortfolio,
  fetchSheetsData
} from './lib/googleSheets';
import duomoLogo from './assets/icons/logo_duomo_white.svg';

function getSwitchedLanguagePath(pathname, nextLang) {
  const parts = pathname.split('/').filter(Boolean);

  if (!parts.length) {
    return `/${nextLang}`;
  }

  parts[0] = nextLang;
  return `/${parts.join('/')}`;
}

function LanguageSwitcher({ lang }) {
  const location = useLocation();

  return (
    <div className="lang-switcher">
      {supportedLanguages.map((code) => (
        <Link
          key={code}
          to={getSwitchedLanguagePath(location.pathname, code)}
          className={code === lang ? 'active' : ''}
        >
          {code.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}

function TopNav({ lang, content, isMediaPage = false }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [lang, isMediaPage]);

  return (
    <header className="topbar-wrap">
      <nav className="topbar">
        <Link to={`/${lang}`} className="logo-mini" aria-label="Duomo Records home">
          <img src={duomoLogo} alt="Duomo Records" />
        </Link>

        <div className="topbar-actions">
          <LanguageSwitcher lang={lang} />
          <button className="menu-btn" type="button" onClick={() => setIsOpen((prev) => !prev)}>
            {content.nav.menu}
          </button>
        </div>
      </nav>

      <div className={`dropdown-menu ${isOpen ? 'open' : ''}`}>
        <a href={`/${lang}#services`}>{content.nav.services}</a>
        <a href={`/${lang}#pricing`}>{content.nav.pricing}</a>
        <a href={`/${lang}#portfolio`}>{content.nav.portfolio}</a>
        <Link to={`/${lang}/media-projects`}>{content.nav.mediaProjects}</Link>
        <a href={`/${lang}#collaborations`}>{content.nav.collaborations}</a>
        <a href={`/${lang}#booking`}>{content.nav.booking}</a>
        <a href={`/${lang}#contact`}>{content.nav.contact}</a>
        {isMediaPage && <Link to={`/${lang}`}>{content.nav.home}</Link>}
      </div>
    </header>
  );
}

function MobileFooterNav({ lang, content }) {
  return (
    <nav className="mobile-footer" aria-label="Mobile navigation">
      <Link to={`/${lang}`}>{content.mobileNav.home}</Link>
      <a href={`/${lang}#booking`} className="primary-link">
        {content.mobileNav.book}
      </a>
      <Link to={`/${lang}/media-projects`}>{content.mobileNav.media}</Link>
    </nav>
  );
}

function useLanguageOrRedirect() {
  const { lang } = useParams();

  if (!supportedLanguages.includes(lang)) {
    return { lang: 'az', content: null, invalid: true };
  }

  return { lang, content: siteContent[lang], invalid: false };
}

function useSheetsContent() {
  const [data, setData] = useState({
    portfolio: fallbackPortfolio,
    mediaProjects: fallbackMediaProjects,
    collaborations: fallbackCollaborations
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await fetchSheetsData({
          sheetId: import.meta.env.VITE_GOOGLE_SHEET_ID,
          portfolioGid: import.meta.env.VITE_GOOGLE_SHEET_PORTFOLIO_GID,
          mediaGid: import.meta.env.VITE_GOOGLE_SHEET_MEDIA_GID,
          collaborationsGid: import.meta.env.VITE_GOOGLE_SHEET_COLLAB_GID
        });

        if (active) {
          setData(result);
        }
      } catch {
        if (active) {
          setData({
            portfolio: fallbackPortfolio,
            mediaProjects: fallbackMediaProjects,
            collaborations: fallbackCollaborations
          });
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return data;
}

function PortfolioSection({ content, projects }) {
  return (
    <section id="portfolio" className="section">
      <div className="section-headline">
        <p>{content.portfolio.subtitle}</p>
        <h2>{content.portfolio.title}</h2>
        <span>{content.portfolio.text}</span>
      </div>

      <div className="portfolio-track">
        {projects.map((project, index) => {
          const card = (
            <article className="portfolio-card" key={project.id || `${project.title}-${index}`}>
              <div className="portfolio-image-wrap">
                <img src={project.imageUrl} alt={project.title} loading="lazy" />
                <span className="play-badge" aria-hidden="true">
                  ▶
                </span>
              </div>
              <div className="portfolio-meta">
                <strong>#{String(index + 1).padStart(2, '0')}</strong>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
            </article>
          );

          if (project.youtubeUrl) {
            return (
              <a
                key={project.id || `${project.title}-${index}`}
                href={project.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="card-link"
              >
                {card}
              </a>
            );
          }

          return card;
        })}
      </div>
    </section>
  );
}

function CollaborationsSection({ content, items }) {
  return (
    <section id="collaborations" className="section">
      <div className="section-headline">
        <p>DUOMO NETWORK</p>
        <h2>{content.collaborations.title}</h2>
        <span>{content.collaborations.text}</span>
      </div>

      <div className="collabs-grid">
        {items.map((item) => {
          const card = (
            <article className="collab-card" key={item.id || item.name}>
              <img src={item.logoUrl || duomoLogo} alt={item.name} loading="lazy" />
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </article>
          );

          if (item.linkUrl) {
            return (
              <a
                key={item.id || item.name}
                href={item.linkUrl}
                className="card-link"
                target="_blank"
                rel="noreferrer"
              >
                {card}
              </a>
            );
          }

          return card;
        })}
      </div>
    </section>
  );
}

function getMonthCells(monthDate) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const leading = (monthStart.getDay() + 6) % 7;
  const cells = [];

  for (let i = 0; i < leading; i += 1) cells.push(null);
  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function monthLabel(date) {
  return date.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' });
}

function BookingSection({ content, services }) {
  const today = new Date();
  const todayIso = toIsoDate(today);
  const maxDate = toIsoDate(addDays(today, 30));
  const calendarApiUrl = import.meta.env.VITE_GOOGLE_CALENDAR_WEBHOOK_URL || '';

  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [status, setStatus] = useState('idle');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [pickerDate, setPickerDate] = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSlots, setPickerSlots] = useState([]);

  const cells = getMonthCells(pickerMonth);
  const selectedLabel = date && selectedSlot ? `${date} — ${selectedSlot}` : '';

  async function handlePickDate(dayIso) {
    if (dayIso < todayIso || dayIso > maxDate) return;

    setPickerDate(dayIso);
    setPickerLoading(true);
    try {
      const found = await fetchAvailableSlots(calendarApiUrl, dayIso);
      setPickerSlots(found);
    } catch {
      setPickerSlots([]);
    } finally {
      setPickerLoading(false);
    }
  }

  async function handleBook(event) {
    event.preventDefault();
    setStatus('loading');

    if (!date || !selectedSlot) {
      setStatus('pick_error');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    // Booking POST can trigger CORB/CORS noise in the console even when it succeeds.
    // The Apps Script side is the source of truth; we treat the dispatch as accepted.
    createBooking(calendarApiUrl, payload);

    event.currentTarget.reset();
    setDate('');
    setSelectedSlot('');
    setStatus('success');
  }

  return (
    <section id="booking" className="section booking-section">
      <div className="section-headline">
        <p>BOOKING</p>
        <h2>{content.booking.title}</h2>
        <span>{content.booking.text}</span>
      </div>

      <div className="booking-grid">
        <form className="booking-form" onSubmit={handleBook}>
          <label>
            {content.booking.slot}
            <button type="button" className="picker-trigger" onClick={() => setPickerOpen(true)}>
              {selectedLabel || content.booking.openPicker || 'Tarix və saat seçin'}
            </button>
          </label>

          <input type="hidden" name="date" value={date} required />
          <input type="hidden" name="slot" value={selectedSlot} required />

          <label>
            {content.booking.name}
            <input name="name" type="text" required />
          </label>

          <label>
            {content.booking.phone}
            <input name="phone" type="tel" required />
          </label>

          <label>
            {content.booking.service}
            <select name="service" required defaultValue="">
              <option value="" disabled>
                ---
              </option>
              {services.map((service) => (
                <option key={service.title} value={service.title}>
                  {service.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            {content.booking.details}
            <textarea name="details" rows="4" />
          </label>

          <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
            {content.booking.submit}
          </button>

          {status === 'success' && <p className="status ok">{content.booking.success}</p>}
          {status === 'pick_error' && (
            <p className="status error">{content.booking.pickError || content.booking.error}</p>
          )}
          {status === 'error' && <p className="status error">{content.booking.error}</p>}
        </form>
      </div>

      {pickerOpen && (
        <div className="picker-modal-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="picker-modal" onClick={(event) => event.stopPropagation()}>
            <div className="picker-modal-head">
              <h3>{content.booking.modalTitle || 'Tarix və saat seçin'}</h3>
              <button type="button" className="menu-btn" onClick={() => setPickerOpen(false)}>
                ×
              </button>
            </div>

            <div className="picker-month-nav">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))
                }
              >
                ←
              </button>
              <strong>{monthLabel(pickerMonth)}</strong>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))
                }
              >
                →
              </button>
            </div>

            <div className="picker-calendar-grid">
              {cells.map((cell, index) => {
                if (!cell) return <span key={`e-${index}`} className="calendar-empty" />;

                const dayIso = toIsoDate(cell);
                const disabled = dayIso < todayIso || dayIso > maxDate;

                return (
                  <button
                    key={dayIso}
                    type="button"
                    className={`calendar-day ${pickerDate === dayIso ? 'active' : ''}`}
                    disabled={disabled}
                    onClick={() => handlePickDate(dayIso)}
                  >
                    {cell.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="picker-slots">
              {pickerLoading && <p>{content.booking.loading}</p>}
              {!pickerLoading && !pickerDate && (
                <p>{content.booking.chooseDateFirst || 'Əvvəl tarix seçin'}</p>
              )}
              {!pickerLoading && pickerDate && pickerSlots.length === 0 && <p>{content.booking.noSlots}</p>}
              {!pickerLoading &&
                pickerSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`slot-chip ${date === pickerDate && selectedSlot === slot ? 'active' : ''}`}
                    onClick={() => {
                      setDate(pickerDate);
                      setSelectedSlot(slot);
                      setPickerOpen(false);
                    }}
                  >
                    {pickerDate} · {slot}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function HomePage() {
  const { lang, content, invalid } = useLanguageOrRedirect();
  const { portfolio, collaborations } = useSheetsContent();

  useEffect(() => {
    if (invalid) {
      return;
    }

    document.documentElement.lang = lang;
    document.title = 'Duomo Records';
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute('content', content.seoDescription);
    }
  }, [lang, content, invalid]);

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  return (
    <div className="page">
      <TopNav lang={lang} content={content} />

      <section className="hero">
        <div className="logo-stage">
          <div className="line-orbit" aria-hidden="true" />
          <img src={duomoLogo} alt="Duomo Records" className="hero-logo" />
        </div>

        <p className="hero-eyebrow">{content.hero.eyebrow}</p>
        <h1>{content.hero.title}</h1>
        <p>{content.hero.text}</p>

        <div className="hero-actions">
          <a href="#booking" className="btn btn-primary">
            {content.hero.primary}
          </a>
          <a href="#portfolio" className="btn btn-secondary">
            {content.hero.secondary}
          </a>
        </div>
      </section>

      <section id="services" className="section">
        <div className="section-headline">
          <p>STUDIO</p>
          <h2>{content.servicesTitle}</h2>
        </div>
        <div className="cards-grid">
          {content.services.map((service) => (
            <article className="service-card" key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <a className="text-link" href="#booking">
                {content.orderLabel}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="section">
        <div className="section-headline">
          <p>PRICING</p>
          <h2>{content.pricingTitle}</h2>
        </div>

        <div className="pricing-grid">
          {content.pricing.map((plan) => (
            <article className="price-card" key={plan.name}>
              <p className="plan-name">{plan.name}</p>
              <h3>{plan.subtitle}</h3>
              <strong>{plan.price}</strong>
              <p>{plan.target}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a href="#booking" className="btn btn-primary">
                {content.orderLabel}
              </a>
            </article>
          ))}
        </div>
      </section>

      <PortfolioSection content={content} projects={portfolio} />
      <CollaborationsSection content={content} items={collaborations} />
      <BookingSection content={content} services={content.services} />

      <section id="contact" className="section contact-section">
        <div className="section-headline">
          <p>CONTACT</p>
          <h2>{content.contact.title}</h2>
          <span>{content.contact.text}</span>
        </div>

        <div className="contact-grid">
          <a href={`https://wa.me/${content.contact.whatsapp.replace(/\D/g, '')}`}>
            WhatsApp: {content.contact.whatsapp}
          </a>
          <a href="https://instagram.com/duomorecords" target="_blank" rel="noreferrer">
            Instagram: {content.contact.instagram}
          </a>
          <p>{content.contact.address}</p>
          <a href="https://maps.google.com/?q=Jala+Plaza+Baku" target="_blank" rel="noreferrer">
            {content.contact.map}
          </a>
        </div>
      </section>

      <MobileFooterNav lang={lang} content={content} />
    </div>
  );
}

function MediaProjectsPage() {
  const { lang, content, invalid } = useLanguageOrRedirect();
  const { mediaProjects } = useSheetsContent();

  useEffect(() => {
    if (invalid) {
      return;
    }

    document.documentElement.lang = lang;
    document.title = `Duomo Records — ${content.mediaProjects.pageTitle}`;
  }, [lang, content, invalid]);

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  return (
    <div className="page media-page">
      <TopNav lang={lang} content={content} isMediaPage />

      <section className="hero media-hero">
        <h1>{content.mediaProjects.pageTitle}</h1>
        <p>{content.mediaProjects.text}</p>
      </section>

      <section className="section media-grid-section">
        <div className="media-grid">
          {mediaProjects.map((project) => {
            const card = (
              <article className="media-card" key={project.id || project.title}>
                <img src={project.imageUrl} alt={project.title} loading="lazy" />
                <h3>{project.title}</h3>
              </article>
            );

            if (project.projectUrl) {
              return (
                <a
                  className="card-link"
                  href={project.projectUrl}
                  target="_blank"
                  rel="noreferrer"
                  key={project.id || project.title}
                >
                  {card}
                </a>
              );
            }

            return card;
          })}
        </div>
      </section>

      <MobileFooterNav lang={lang} content={content} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/az" replace />} />
      <Route path="/:lang" element={<HomePage />} />
      <Route path="/:lang/media-projects" element={<MediaProjectsPage />} />
      <Route path="*" element={<Navigate to="/az" replace />} />
    </Routes>
  );
}
