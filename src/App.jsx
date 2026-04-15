import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { siteContent, supportedLanguages } from './content';
import { createBooking, fetchAvailableSlots } from './lib/calendarApi';
import {
  fallbackCollaborations,
  fallbackMediaProjects,
  fallbackPortfolio,
  fetchSheetsData
} from './lib/googleSheets';
import logoWhite from './assets/duomo-logo-white.svg';
import logoBlack from './assets/duomo-logo-black.svg';

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
          <img src={logoWhite} alt="Duomo Records" />
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
              <img src={item.logoUrl || logoBlack} alt={item.name} loading="lazy" />
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

function BookingSection({ content, services }) {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [status, setStatus] = useState('idle');
  const [loadingSlots, setLoadingSlots] = useState(false);

  const calendarEmbedUrl =
    import.meta.env.VITE_GOOGLE_CALENDAR_EMBED_URL ||
    'https://calendar.google.com/calendar/embed?src=en.azerbaijan%23holiday%40group.v.calendar.google.com';
  const calendarApiUrl = import.meta.env.VITE_GOOGLE_CALENDAR_WEBHOOK_URL || '';

  useEffect(() => {
    if (!date) {
      setSlots([]);
      setSelectedSlot('');
      return;
    }

    let active = true;

    async function load() {
      setLoadingSlots(true);
      try {
        const found = await fetchAvailableSlots(calendarApiUrl, date);
        if (active) {
          setSlots(found);
          setSelectedSlot(found[0] || '');
        }
      } catch {
        if (active) {
          setSlots([]);
          setSelectedSlot('');
        }
      } finally {
        if (active) {
          setLoadingSlots(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [calendarApiUrl, date]);

  async function handleBook(event) {
    event.preventDefault();
    setStatus('loading');

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      await createBooking(calendarApiUrl, payload);
      event.currentTarget.reset();
      setDate('');
      setSlots([]);
      setSelectedSlot('');
      setStatus('success');
    } catch {
      setStatus('error');
    }
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
            {content.booking.date}
            <input
              type="date"
              name="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>

          <label>
            {content.booking.slot}
            <select
              name="slot"
              value={selectedSlot}
              onChange={(event) => setSelectedSlot(event.target.value)}
              required
              disabled={loadingSlots || slots.length === 0}
            >
              {loadingSlots && <option>{content.booking.loading}</option>}
              {!loadingSlots &&
                slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              {!loadingSlots && slots.length === 0 && <option>{content.booking.noSlots}</option>}
            </select>
          </label>

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
          {status === 'error' && <p className="status error">{content.booking.error}</p>}
        </form>

        <div className="calendar-block">
          <p className="embed-label">{content.booking.calendarEmbedLabel}</p>
          <iframe title="Google Calendar" src={calendarEmbedUrl} className="calendar" loading="lazy" />
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  const { lang, content, invalid } = useLanguageOrRedirect();
  const { portfolio, collaborations } = useSheetsContent();

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = 'Duomo Records';
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute('content', content.seoDescription);
    }
  }, [lang, content.seoDescription]);

  return (
    <div className="page">
      <TopNav lang={lang} content={content} />

      <section className="hero">
        <div className="logo-stage">
          <div className="line-orbit" aria-hidden="true" />
          <img src={logoWhite} alt="Duomo Records" className="hero-logo" />
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

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `Duomo Records — ${content.mediaProjects.pageTitle}`;
  }, [lang, content.mediaProjects.pageTitle]);

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
