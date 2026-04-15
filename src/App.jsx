import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { siteContent, supportedLanguages } from './content';

function LanguageSwitcher({ lang }) {
  return (
    <div className="lang-switcher">
      {supportedLanguages.map((code) => (
        <a key={code} href={`/${code}`} className={code === lang ? 'active' : ''}>
          {code.toUpperCase()}
        </a>
      ))}
    </div>
  );
}

function HomePage() {
  const { lang } = useParams();

  if (!supportedLanguages.includes(lang)) {
    return <Navigate to="/az" replace />;
  }

  const content = siteContent[lang];
  const calendarUrl =
    import.meta.env.VITE_GOOGLE_CALENDAR_EMBED_URL ||
    'https://calendar.google.com/calendar/embed?src=en.azerbaijan%23holiday%40group.v.calendar.google.com';
  const sheetsWebhook = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL || '';
  const [status, setStatus] = useState('idle');

  const servicesOptions = useMemo(
    () => content.services.map((item) => item.title),
    [content.services]
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = 'Duomo Records';
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute('content', content.seoDescription);
    }
  }, [lang, content.seoDescription]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('loading');

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    payload.language = lang;
    payload.createdAt = new Date().toISOString();

    if (!sheetsWebhook) {
      setStatus('success');
      event.currentTarget.reset();
      return;
    }

    try {
      const response = await fetch(sheetsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to send');
      }

      setStatus('success');
      event.currentTarget.reset();
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="page">
      <header className="hero" id="top">
        <nav className="top-nav">
          <div className="brand">Duomo Records</div>
          <div className="menu">
            <a href="#services">{content.nav.services}</a>
            <a href="#pricing">{content.nav.pricing}</a>
            <a href="#portfolio">{content.nav.portfolio}</a>
            <a href="#schedule">{content.nav.schedule}</a>
            <a href="#contact">{content.nav.contact}</a>
          </div>
          <LanguageSwitcher lang={lang} />
        </nav>

        <div className="hero-content">
          <span className="badge">{content.hero.badge}</span>
          <h1>{content.hero.title}</h1>
          <p>{content.hero.text}</p>
          <div className="hero-cta">
            <a className="btn btn-primary" href="#contact">
              {content.hero.ctaPrimary}
            </a>
            <a className="btn btn-secondary" href="#portfolio">
              {content.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="section" id="about">
          <h2>{content.about.title}</h2>
          <p>{content.about.text}</p>
        </section>

        <section className="section" id="services">
          <h2>{content.servicesTitle}</h2>
          <div className="cards-grid">
            {content.services.map((service) => (
              <article className="card" key={service.title}>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="pricing">
          <h2>{content.pricingTitle}</h2>
          <div className="cards-grid pricing-grid">
            {content.pricing.map((plan) => (
              <article className="card pricing-card" key={plan.name}>
                <div className="plan-head">
                  <span>{plan.name}</span>
                  <h3>{plan.subtitle}</h3>
                  <strong>{plan.price}</strong>
                </div>
                <p>{plan.target}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <a className="btn btn-primary" href="#contact">
                  Sifariş Et
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="portfolio">
          <h2>{content.portfolio.title}</h2>
          <p>{content.portfolio.text}</p>
          <div className="placeholder-media">YouTube / SoundCloud / Instagram embeds</div>
        </section>

        <section className="section" id="schedule">
          <h2>{content.schedule.title}</h2>
          <p>{content.schedule.text}</p>
          <div className="calendar-wrap">
            <iframe
              title="Google Calendar"
              src={calendarUrl}
              className="calendar"
              loading="lazy"
            />
          </div>
        </section>

        <section className="section" id="contact">
          <h2>{content.form.title}</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <label>
              {content.form.name}
              <input type="text" name="name" required />
            </label>

            <label>
              {content.form.phone}
              <input type="text" name="phone" required />
            </label>

            <label>
              {content.form.service}
              <select name="service" required defaultValue="">
                <option value="" disabled>
                  ---
                </option>
                {servicesOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {content.form.message}
              <textarea name="message" rows="5" required />
            </label>

            <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
              {content.form.submit}
            </button>

            {status === 'success' && <p className="status ok">{content.form.success}</p>}
            {status === 'error' && <p className="status error">{content.form.error}</p>}
          </form>

          <div className="contact-info">
            <h3>{content.contact.title}</h3>
            <p>{content.contact.text}</p>
            <p>
              WhatsApp:{' '}
              <a href={`https://wa.me/${content.contact.whatsapp.replace(/\D/g, '')}`}>
                {content.contact.whatsapp}
              </a>
            </p>
            <p>
              Instagram:{' '}
              <a href="https://instagram.com/duomorecords" target="_blank" rel="noreferrer">
                {content.contact.instagram}
              </a>
            </p>
            <p>{content.contact.address}</p>
            <a
              href="https://maps.google.com/?q=Jala+Plaza+Baku"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              Xəritədə Aç
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/az" replace />} />
      <Route path="/:lang" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/az" replace />} />
    </Routes>
  );
}
