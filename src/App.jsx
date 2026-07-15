import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import duomoLogo from './assets/icons/logo_duomo_white.svg';
import { siteContent } from './data/site';
import { useBlogPost, useBlogPosts } from './hooks/useBlogPosts';
import { useBookingSlots, useCreateBooking } from './hooks/useBookings';
import { useReveal } from './hooks/useReveal';
import { useSiteContent } from './hooks/useSiteContent';
import { useTheme } from './hooks/useTheme';
import { normalizeBookingForm, validateBookingPayload } from './services/bookingService';
import { SUPPORTED_LANGUAGES } from './utils/constants';

function getLangPath(pathname, nextLang) {
  const parts = pathname.split('/').filter(Boolean);
  parts[0] = nextLang;
  return `/${parts.join('/') || nextLang}`;
}

function useLanguage() {
  const { lang } = useParams();

  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    return { invalid: true, lang: 'az', content: siteContent.az };
  }

  return { invalid: false, lang, content: siteContent[lang] };
}

function setPageMeta(lang, title, description) {
  document.documentElement.lang = lang;
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
}

function Flag({ code }) {
  const colors = {
    az: ['#00a3e0', '#ef3340', '#509e2f'],
    ru: ['#ffffff', '#244aa5', '#d52b1e'],
    en: ['#012169', '#ffffff', '#c8102e']
  }[code];

  return (
    <svg aria-hidden="true" className="flag" viewBox="0 0 24 16">
      <rect width="24" height="16" rx="2" fill={colors[0]} />
      <rect y="5.33" width="24" height="5.34" fill={colors[1]} />
      <rect y="10.67" width="24" height="5.33" fill={colors[2]} />
      {code === 'az' && <circle cx="12" cy="8" r="2.2" fill="#fff" opacity="0.92" />}
    </svg>
  );
}

function Icon({ name }) {
  const paths = {
    home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
    services: 'M4 6h16M4 12h16M4 18h10',
    booking: 'M7 3v4M17 3v4M4 8h16v13H4zM8 13h3M13 13h3M8 17h3',
    blog: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
    profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
    sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M18.4 5.6 17 7M7 17l-1.4 1.4M18.4 18.4 17 17M7 7 5.6 5.6M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    moon: 'M21 13.5A8.5 8.5 0 0 1 10.5 3 7 7 0 1 0 21 13.5Z',
    instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-.8h.01'
  };

  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      <path d={paths[name]} />
    </svg>
  );
}

function SiteHeader({ lang, content, theme, onThemeToggle }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const links = [
    { label: content.nav.services, to: `/${lang}#services` },
    { label: content.nav.blog, to: `/${lang}/blog` },
    { label: content.nav.media, to: `/${lang}/media-projects` },
    { label: content.nav.courses, to: `/${lang}#courses` }
  ];

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash, lang]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      menuRef.current?.querySelector('a,button')?.focus();
    }
  }, [open]);

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link to={`/${lang}`} className="brand" aria-label="DUOMO Records home">
          <img src={duomoLogo} alt="DUOMO Records" width="168" height="72" />
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map((link) => (
            <a key={link.to} href={link.to}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <div className="language-switcher" aria-label={content.labels.language}>
            {SUPPORTED_LANGUAGES.map((code) => (
              <Link
                key={code}
                to={getLangPath(location.pathname, code)}
                className={code === lang ? 'active' : ''}
                aria-current={code === lang ? 'true' : undefined}
              >
                <Flag code={code} />
                <span>{code.toUpperCase()}</span>
              </Link>
            ))}
          </div>

          <button type="button" className="icon-button" onClick={onThemeToggle} aria-label={content.labels.theme}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>

          <a href={`/${lang}#booking`} className="nav-booking">
            {content.nav.booking}
          </a>

          <button
            type="button"
            className="menu-toggle"
            aria-label={content.nav.menu}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${open ? 'open' : ''}`} ref={menuRef}>
        <a href={`/${lang}#services`}>{content.nav.services}</a>
        <Link to={`/${lang}/blog`}>{content.nav.blog}</Link>
        <Link to={`/${lang}/media-projects`}>{content.nav.media}</Link>
        <a href={`/${lang}#courses`}>{content.nav.courses}</a>
        <a href={`/${lang}#booking`}>{content.nav.booking}</a>
      </div>
    </header>
  );
}

function MobileBottomNav({ lang, content }) {
  const items = [
    { label: content.nav.home, to: `/${lang}`, icon: 'home' },
    { label: content.nav.services, to: `/${lang}#services`, icon: 'services' },
    { label: content.nav.booking, to: `/${lang}#booking`, icon: 'booking' },
    { label: content.nav.blog, to: `/${lang}/blog`, icon: 'blog' },
    { label: content.nav.profile, to: `/${lang}/profile`, icon: 'profile' }
  ];

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {items.map((item) =>
        item.to.includes('#') ? (
          <a key={item.to} href={item.to}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </a>
        ) : (
          <NavLink key={item.to} to={item.to} end={item.to === `/${lang}`}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        )
      )}
    </nav>
  );
}

function ProjectVisual({ title, tone }) {
  return (
    <div className={`project-visual tone-${tone}`} role="img" aria-label={`${title} visual placeholder`}>
      <span>{title.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

function SectionIntro({ eyebrow, title, text }) {
  return (
    <div className="section-intro">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      {text && <span>{text}</span>}
    </div>
  );
}

function StateMessage({ tone = 'muted', children }) {
  return <p className={`state-message ${tone}`}>{children}</p>;
}

function SkeletonRows({ count = 3 }) {
  return (
    <div className="skeleton-stack" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function HomePage({ theme, onThemeToggle }) {
  const { invalid, lang, content } = useLanguage();
  const { data: homepage, loading: homepageLoading, error: homepageError } = useSiteContent(lang);
  const { posts: previewPosts, loading: blogPreviewLoading } = useBlogPosts(lang);
  useReveal();

  useEffect(() => {
    if (!invalid) {
      setPageMeta(lang, content.meta.title, content.meta.description);
    }
  }, [content, invalid, lang]);

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  const firstPost = previewPosts[0];
  const services = homepage.services || [];
  const packages = homepage.packages || [];
  const projects = homepage.projects || [];
  const mediaProjects = homepage.mediaProjects || [];
  const artists = homepage.artists || [];
  const partners = homepage.partners || [];
  const processSteps = homepage.processSteps || [];
  const instagramPosts = homepage.instagramPosts || [];
  const hasContentWarning = homepageError || Object.values(homepage.errors || {}).some(Boolean);

  return (
    <div className="app-shell">
      <SiteHeader lang={lang} content={content} theme={theme} onThemeToggle={onThemeToggle} />
      <main>
        <section className="hero-section" data-reveal>
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">{content.hero.eyebrow}</p>
              <h1>{content.hero.title}</h1>
              <p>{content.hero.text}</p>
              <div className="hero-actions">
                <a href="#booking" className="button primary">{content.hero.primary}</a>
                <a href="#portfolio" className="button ghost">{content.hero.secondary}</a>
              </div>
            </div>
            <div className="hero-mark" aria-hidden="true">
              <img src={duomoLogo} alt="" width="420" height="180" />
              <div className="signal-line" />
            </div>
          </div>
          <a href="#services" className="scroll-cue">{content.hero.scroll}</a>
        </section>

        <section id="services" className="wide-section services-section" data-reveal>
          <SectionIntro eyebrow="SERVICES" title={content.sections.services} />
          {homepageLoading && <SkeletonRows />}
          {hasContentWarning && <StateMessage>Some live content is temporarily unavailable. Fallback content is shown where needed.</StateMessage>}
          <div className="service-list">
            {services.map((service, index) => (
              <article className="service-row" key={service.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p>{service.category}</p>
                  <h3>{service.title}</h3>
                </div>
                <p>{service.text}</p>
                <a href={`/${lang}?service=${service.id}#booking`} className="row-cta">
                  {content.labels.bookService}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="wide-section packages-section" data-reveal>
          <SectionIntro eyebrow="PACKAGES" title={content.sections.packages} text={content.packageIntro} />
          <div className="package-stack">
            {packages.map((item) => (
              <article className={`package-row ${item.featured ? 'featured' : ''}`} key={item.id}>
                <strong>{item.marker}</strong>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.price}</p>
                </div>
                <ul>
                  {item.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <a href={`/${lang}?package=${item.id}#booking`} className="button compact">
                  {content.labels.bookPackage}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="portfolio" className="wide-section project-section" data-reveal>
          <SectionIntro eyebrow="PROJECTS" title={content.sections.portfolio} />
          <div className="project-track" aria-label="Project previews">
            {projects.map((project) => (
              <article className="project-panel" key={project.id}>
                <ProjectVisual title={project.title} tone={project.tone} />
                <div>
                  <p>{project.category}</p>
                  <h3>{project.title}</h3>
                  <span>{project.status}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="wide-section about-section" data-reveal>
          <SectionIntro eyebrow="ABOUT" title={content.sections.about} />
          <div className="about-grid">
            <p>{content.about.lead}</p>
            <div>
              {content.about.facts.map((fact) => <span key={fact}>{fact}</span>)}
            </div>
          </div>
        </section>

        <section className="wide-section split-section" data-reveal>
          <div>
            <SectionIntro eyebrow="CLIENTS" title={content.sections.artists} />
            <div className="people-grid">
              {artists.map((artist) => (
                <article className="person-tile" key={artist.name}>
                  <ProjectVisual title={artist.name} tone="silver" />
                  <h3>{artist.name}</h3>
                  <p>{artist.role}</p>
                </article>
              ))}
            </div>
          </div>
          <div>
            <SectionIntro eyebrow="NETWORK" title={content.sections.partners} />
            <div className="partner-grid">
              {partners.map((partner) => <span key={partner.id || partner.name}>{partner.name || partner}</span>)}
            </div>
          </div>
        </section>

        <section className="wide-section process-section" data-reveal>
          <SectionIntro eyebrow="PROCESS" title={content.sections.process} />
          <ol className="process-list">
            {processSteps.map((step, index) => (
              <li key={step.id || step.title}>
                <span>{String(step.stepNumber || index + 1).padStart(2, '0')}</span>
                <p>{step.title || step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="courses" className="wide-section courses-section" data-reveal>
          <SectionIntro eyebrow="ACADEMY" title={content.courses.title} text={content.courses.text} />
          <span className="technical-note">{content.labels.placeholder}</span>
        </section>

        <section id="media" className="wide-section media-preview-section" data-reveal>
          <SectionIntro eyebrow="MEDIA" title={content.mediaProjects.title} text={content.mediaProjects.text} />
          <div className="media-grid">
            {mediaProjects.map((item, index) => (
              <article className="media-card" key={item.id || item.title}>
                <ProjectVisual title={item.title} tone={item.tone || projects[index]?.tone || 'orange'} />
                <h3>{item.title}</h3>
              </article>
            ))}
          </div>
          <Link to={`/${lang}/media-projects`} className="text-link">{content.labels.viewAll}</Link>
        </section>

        <section className="wide-section blog-preview-section" data-reveal>
          <SectionIntro eyebrow="BLOG" title={content.sections.blog} />
          {blogPreviewLoading && <SkeletonRows count={2} />}
          {!blogPreviewLoading && !firstPost && <StateMessage>No published posts yet.</StateMessage>}
          {firstPost && (
            <div className="blog-feature">
              <article>
                <p>{firstPost.category}</p>
                <h3>{firstPost.title}</h3>
                <span>{firstPost.excerpt}</span>
                <Link to={`/${lang}/blog/${firstPost.slug}`} className="button compact">{content.labels.readMore}</Link>
              </article>
              <div className="blog-mini-list">
                {previewPosts.slice(1, 4).map((post) => (
                  <Link to={`/${lang}/blog/${post.slug}`} key={post.slug}>
                    <span>{post.category}</span>
                    <strong>{post.title}</strong>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="wide-section instagram-section" data-reveal>
          <SectionIntro eyebrow="SOCIAL" title={content.sections.instagram} />
          <div className="instagram-grid">
            {instagramPosts.map((post) => (
              <a href={post.href} target="_blank" rel="noopener noreferrer" key={post.id} aria-label={post.title}>
                <ProjectVisual title={post.title} tone="graphite" />
                <span><Icon name="instagram" /> {post.title}</span>
              </a>
            ))}
          </div>
        </section>

        <BookingSection lang={lang} content={content} services={services} packages={packages} fallbackSlots={homepage.timeSlots} bookingSettings={homepage.bookingSettings} />

        <ContactFooter lang={lang} content={content} />
      </main>
      <MobileBottomNav lang={lang} content={content} />
    </div>
  );
}

function BookingSection({ lang, content, services, packages, fallbackSlots, bookingSettings }) {
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const today = new Date().toISOString().split('T')[0];
  const selectedService = searchParams.get('service');
  const selectedPackage = searchParams.get('package');
  const selected = selectedService ? `service:${selectedService}` : selectedPackage ? `package:${selectedPackage}` : '';
  const slotsState = useBookingSlots(selectedDate, fallbackSlots || []);
  const createBooking = useCreateBooking();
  const maximumAdvanceDays = bookingSettings?.maximum_advance_days || 90;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = normalizeBookingForm(formData, lang);
    const selectedServiceItem = services.find((service) => service.id === payload.serviceId);
    const selectedPackageItem = packages.find((item) => item.id === payload.packageId);
    const validationErrors = validateBookingPayload(payload, slotsState.slots, maximumAdvanceDays);

    if (Object.keys(validationErrors).length > 0) {
      setStatus({ type: 'error', message: content.booking.required });
      return;
    }

    const result = await createBooking.submit({
      ...payload,
      serviceDbId: selectedServiceItem?.dbId || null,
      packageDbId: selectedPackageItem?.dbId || null
    });

    if (result.ok) {
      setStatus({
        type: 'ready',
        message: `${content.booking.ready} ${result.booking?.booking_number ? `#${result.booking.booking_number}` : ''}`
      });
      form.reset();
      setSelectedDate('');
      return;
    }

    if (result.code === 'slot_conflict') {
      await slotsState.refetch();
      setStatus({ type: 'error', message: 'This slot was just booked. Choose another available time.' });
      return;
    }

    setStatus({ type: 'error', message: result.message || content.booking.required });
  }

  return (
    <section id="booking" className="wide-section booking-section" data-reveal>
      <SectionIntro eyebrow="BOOKING" title={content.booking.title} text={content.booking.text} />
      <form className="booking-form" onSubmit={handleSubmit} noValidate>
        <label>
          {content.booking.service}
          <select name="selectedOption" defaultValue={selected} required>
            <option value="">---</option>
            <optgroup label="Services">
              {services.map((service) => <option key={service.id} value={`service:${service.id}`}>{service.title}</option>)}
            </optgroup>
            <optgroup label="Packages">
              {packages.map((item) => <option key={item.id} value={`package:${item.id}`}>{item.name} · {item.price}</option>)}
            </optgroup>
          </select>
        </label>
        <label>
          {content.booking.date}
          <input
            name="bookingDate"
            type="date"
            min={today}
            required
            aria-describedby="booking-status"
            onChange={(event) => {
              setSelectedDate(event.target.value);
              setStatus({ type: 'idle', message: '' });
            }}
          />
        </label>
        <label>
          {content.booking.time}
          <select name="bookingTime" required aria-describedby="booking-status">
            <option value="">{slotsState.loading ? 'Loading...' : '---'}</option>
            {slotsState.slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
          </select>
        </label>
        {selectedDate && !slotsState.loading && slotsState.slots.length === 0 && (
          <p className="field-note">No available slots for this date.</p>
        )}
        <label>
          {content.booking.name}
          <input name="customerName" type="text" required aria-describedby="booking-status" />
        </label>
        <label>
          Email
          <input name="customerEmail" type="email" aria-describedby="booking-status" />
        </label>
        <label>
          {content.booking.phone}
          <input name="phone" type="tel" required aria-describedby="booking-status" />
        </label>
        <label className="field-wide">
          {content.booking.description}
          <textarea name="projectDescription" rows="5" />
        </label>
        <label>
          {content.booking.contact}
          <select name="preferredContact" required aria-describedby="booking-status">
            <option value="">---</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone</option>
            <option value="instagram">Instagram</option>
            <option value="telegram">Telegram</option>
            <option value="email">Email</option>
          </select>
        </label>
        <button className="button primary" type="submit" disabled={createBooking.loading}>
          {createBooking.loading ? 'Sending...' : content.booking.submit}
        </button>
        <p id="booking-status" className={`form-status ${status.type}`} aria-live="polite">
          {status.message}
          {slotsState.error && ' Live availability is unavailable; fallback slots are shown.'}
        </p>
      </form>
    </section>
  );
}

function ContactFooter({ lang, content }) {
  return (
    <footer id="contact" className="site-footer" data-reveal>
      <div>
        <p className="eyebrow">CONTACT</p>
        <h2>{content.sections.contacts}</h2>
      </div>
      <address>
        <a href={`https://wa.me/${content.contacts.whatsapp.replace(/\D/g, '')}`}>{content.contacts.whatsapp}</a>
        <a href="https://instagram.com/duomorecords" target="_blank" rel="noopener noreferrer">{content.contacts.instagram}</a>
        <span>{content.contacts.address}</span>
      </address>
      <Link to={`/${lang}/profile`} className="text-link">{content.nav.profile}</Link>
    </footer>
  );
}

function BlogPage({ theme, onThemeToggle }) {
  const { invalid, lang, content } = useLanguage();
  const { posts, loading, error } = useBlogPosts(lang);
  useReveal();

  useEffect(() => {
    if (!invalid) {
      setPageMeta(lang, `${content.nav.blog} | Duomo Records`, content.meta.description);
    }
  }, [content, invalid, lang]);

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  return (
    <div className="app-shell">
      <SiteHeader lang={lang} content={content} theme={theme} onThemeToggle={onThemeToggle} />
      <main className="page-main">
        <section className="page-hero" data-reveal>
          <p className="eyebrow">BLOG</p>
          <h1>{content.nav.blog}</h1>
        </section>
        <section className="blog-grid" data-reveal>
          {loading && <SkeletonRows count={4} />}
          {error && <StateMessage>Live blog data is temporarily unavailable. Fallback posts are shown when available.</StateMessage>}
          {!loading && posts.length === 0 && <StateMessage>No published posts yet.</StateMessage>}
          {posts.map((post) => (
            <article className="blog-card" key={post.slug}>
              <ProjectVisual title={post.category} tone="sand" />
              <p>{post.category} · {post.readingTime}</p>
              <h2>{post.title}</h2>
              <span>{post.excerpt}</span>
              <Link to={`/${lang}/blog/${post.slug}`} className="text-link">{content.labels.readMore}</Link>
            </article>
          ))}
        </section>
      </main>
      <MobileBottomNav lang={lang} content={content} />
    </div>
  );
}

function BlogArticlePage({ theme, onThemeToggle }) {
  const { slug } = useParams();
  const { invalid, lang, content } = useLanguage();
  const { post, relatedPosts, loading } = useBlogPost(lang, slug);
  useReveal();

  useEffect(() => {
    if (!invalid && post) {
      setPageMeta(lang, post.seoTitle, post.seoDescription);
    }
  }, [invalid, lang, post]);

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  if (!loading && !post) {
    return <Navigate to={`/${lang}/blog`} replace />;
  }

  return (
    <div className="app-shell">
      <SiteHeader lang={lang} content={content} theme={theme} onThemeToggle={onThemeToggle} />
      <main className="article-main" data-reveal>
        {loading && <SkeletonRows count={4} />}
        {post && (
          <>
            <nav className="breadcrumbs" aria-label="Breadcrumbs">
              <Link to={`/${lang}`}>{content.nav.home}</Link>
              <Link to={`/${lang}/blog`}>{content.nav.blog}</Link>
              <span>{post.title}</span>
            </nav>
            <article className="article-body">
              <p className="eyebrow">{post.category} · {post.publishedAt} · {post.readingTime}</p>
              <h1>{post.title}</h1>
              <p className="article-lead">{post.excerpt}</p>
              <ProjectVisual title={post.title} tone="orange" />
              {post.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <div className="share-row" aria-label={content.labels.share}>
                <button type="button" className="button compact" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                  {content.labels.share}
                </button>
              </div>
            </article>
            <section className="related-posts">
              {relatedPosts.map((item) => (
                <Link to={`/${lang}/blog/${item.slug}`} key={item.slug}>
                  <span>{item.category}</span>
                  <strong>{item.title}</strong>
                </Link>
              ))}
            </section>
            <Link to={`/${lang}/blog`} className="text-link">{content.labels.backToBlog}</Link>
          </>
        )}
      </main>
      <MobileBottomNav lang={lang} content={content} />
    </div>
  );
}

function MediaProjectsPage({ theme, onThemeToggle }) {
  const { invalid, lang, content } = useLanguage();
  const { data: homepage, loading } = useSiteContent(lang);
  useReveal();

  useEffect(() => {
    if (!invalid) {
      setPageMeta(lang, `${content.mediaProjects.title} | Duomo Records`, content.mediaProjects.text);
    }
  }, [content, invalid, lang]);

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  return (
    <div className="app-shell">
      <SiteHeader lang={lang} content={content} theme={theme} onThemeToggle={onThemeToggle} />
      <main className="page-main">
        <section className="page-hero" data-reveal>
          <p className="eyebrow">MEDIA</p>
          <h1>{content.mediaProjects.title}</h1>
          <p>{content.mediaProjects.text}</p>
        </section>
        <section className="media-grid page-grid" data-reveal>
          {loading && <SkeletonRows count={3} />}
          {!loading && homepage.mediaProjects.length === 0 && <StateMessage>No media projects published yet.</StateMessage>}
          {homepage.mediaProjects.map((item, index) => (
            <article className="media-card" key={item.id || `${item.title}-${index}`}>
              <ProjectVisual title={item.title} tone={item.tone || 'orange'} />
              <h2>{item.title}</h2>
            </article>
          ))}
        </section>
      </main>
      <MobileBottomNav lang={lang} content={content} />
    </div>
  );
}

function ProfilePage({ theme, onThemeToggle }) {
  const { invalid, lang, content } = useLanguage();
  useReveal();

  useEffect(() => {
    if (!invalid) {
      setPageMeta(lang, `${content.profile.title} | Duomo Records`, content.profile.text);
    }
  }, [content, invalid, lang]);

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  return (
    <div className="app-shell">
      <SiteHeader lang={lang} content={content} theme={theme} onThemeToggle={onThemeToggle} />
      <main className="page-main">
        <section className="page-hero" data-reveal>
          <p className="eyebrow">ACCOUNT</p>
          <h1>{content.profile.title}</h1>
          <p>{content.profile.text}</p>
        </section>
      </main>
      <MobileBottomNav lang={lang} content={content} />
    </div>
  );
}

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/az" replace />} />
      <Route path="/:lang" element={<HomePage theme={theme} onThemeToggle={toggleTheme} />} />
      <Route path="/:lang/media-projects" element={<MediaProjectsPage theme={theme} onThemeToggle={toggleTheme} />} />
      <Route path="/:lang/blog" element={<BlogPage theme={theme} onThemeToggle={toggleTheme} />} />
      <Route path="/:lang/blog/:slug" element={<BlogArticlePage theme={theme} onThemeToggle={toggleTheme} />} />
      <Route path="/:lang/profile" element={<ProfilePage theme={theme} onThemeToggle={toggleTheme} />} />
      <Route path="*" element={<Navigate to="/az" replace />} />
    </Routes>
  );
}
