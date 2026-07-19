import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  AudioWaveform,
  BookOpenCheck,
  CalendarCheck,
  Camera,
  ChevronDown,
  Clapperboard,
  GraduationCap,
  Home,
  ListMusic,
  Menu,
  Mic2,
  Moon,
  Music2,
  Newspaper,
  Palette,
  Radio,
  Sun,
  Video,
  X
} from 'lucide-react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import duomoLogo from './assets/icons/logo_duomo_white.svg';
import duomoLogoPng from './assets/icons/logo_duomo_white.png';
import duomoIntroVideo from './assets/media/logoAnimations/Duomo-animated.mp4';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { siteContent } from './data/site';
import { useBlogPost, useBlogPosts } from './hooks/useBlogPosts';
import { useCreateBooking } from './hooks/useBookings';
import { useReveal } from './hooks/useReveal';
import { useSiteContent } from './hooks/useSiteContent';
import { useTheme } from './hooks/useTheme';
import { normalizeBookingForm, validateBookingPayload } from './services/bookingService';
import { SUPPORTED_LANGUAGES } from './utils/constants';
import { getLocalizedValue } from './utils/localization';

const AdminApp = lazy(() => import('./pages/admin/AdminApp'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })));

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
  const flags = { az: '/flags/az.svg', ru: '/flags/ru.svg', en: '/flags/en.svg' };

  return (
    <img aria-hidden="true" className="flag" src={flags[code] || flags.az} alt="" width="36" height="24" />
  );
}

function Icon({ name }) {
  const icons = {
    home: Home,
    services: ListMusic,
    booking: CalendarCheck,
    blog: Newspaper,
    instagram: Camera
  };
  const Component = icons[name] || ListMusic;

  return <Component aria-hidden="true" className="icon" />;
}

function ServiceIcon({ id }) {
  const icons = {
    'music-production': Music2,
    'recording-mix-mastering': Mic2,
    'voice-over': Radio,
    'music-videos': Clapperboard,
    reels: Video,
    'graphic-design': Palette,
    courses: GraduationCap
  };
  const Component = icons[id] || AudioLines;

  return <Component aria-hidden="true" className="service-icon" />;
}

function getServiceStickerLabel(id, title) {
  const labels = {
    'music-production': 'PROD',
    'recording-mix-mastering': 'MIX',
    'voice-over': 'VO',
    'music-videos': 'CLIP',
    reels: 'REELS',
    'graphic-design': 'ART'
  };

  return labels[id] || title.slice(0, 4).toUpperCase();
}

function getDisplayPackages(packages = []) {
  const packagePrices = { economy: '150 AZN', standard: '200 AZN', premium: '250 AZN' };

  return packages.map((item) => ({
    ...item,
    price: packagePrices[item.id] || item.price,
    featured: item.id === 'premium'
  }));
}

function SiteHeader({ lang, content, theme, onThemeToggle, onBookingOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageLoading, setLanguageLoading] = useState(false);
  const menuRef = useRef(null);
  const languageRef = useRef(null);

  const links = [
    { label: content.sections.portfolio, to: `/${lang}/portfolio`, kind: 'route' },
    { label: content.nav.blog, to: `/${lang}/blog`, kind: 'route' },
    { label: content.nav.media, to: `/${lang}/media-projects`, kind: 'route' },
    { label: content.nav.courses, to: `/${lang}/academy`, kind: 'route' }
  ];
  const activeLanguage = SUPPORTED_LANGUAGES.find((code) => code === lang) || 'az';

  useEffect(() => {
    setOpen(false);
    setLanguageOpen(false);
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
    function onPointerDown(event) {
      if (!languageRef.current?.contains(event.target)) {
        setLanguageOpen(false);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    if (open) {
      menuRef.current?.querySelector('a,button')?.focus();
    }
  }, [open]);

  const handleLanguageSelect = (event, code) => {
    event.preventDefault();
    if (code === lang) {
      setLanguageOpen(false);
      return;
    }

    setLanguageOpen(false);
    setLanguageLoading(true);
    window.setTimeout(() => navigate(getLangPath(location.pathname, code)), 650);
    window.setTimeout(() => setLanguageLoading(false), 1500);
  };

  return (
    <header className="site-header">
      {languageLoading && (
        <div className="intro-overlay language-loading" aria-hidden="true">
          <video src={duomoIntroVideo} autoPlay muted playsInline preload="auto" />
        </div>
      )}
      <div className="nav-shell">
        <Link to={`/${lang}`} className="brand" aria-label="DUOMO Records home">
          <span className="brand-mark">
            <img src={duomoLogo} alt="" width="34" height="34" />
          </span>
          <span className="brand-text">
            <strong>DUOMO</strong>
            <span>Records</span>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map((link) =>
            link.kind === 'route' ? (
              <NavLink key={link.to} to={link.to}>
                {link.label}
              </NavLink>
            ) : (
              <a key={link.to} href={link.to}>
                {link.label}
              </a>
            )
          )}
        </nav>

        <div className="nav-actions">
          <div className="language-switcher" ref={languageRef}>
            <button
              type="button"
              className="language-trigger"
              aria-label={content.labels.language}
              aria-expanded={languageOpen}
              onClick={() => setLanguageOpen((current) => !current)}
            >
              <Flag code={activeLanguage} />
              <span>{activeLanguage.toUpperCase()}</span>
              <ChevronDown aria-hidden="true" className="icon tiny" />
            </button>
            <div className={`language-menu ${languageOpen ? 'open' : ''}`}>
              {SUPPORTED_LANGUAGES.map((code) => (
                <button
                  key={code}
                  type="button"
                  className={code === lang ? 'active' : ''}
                  aria-current={code === lang ? 'true' : undefined}
                  onClick={(event) => handleLanguageSelect(event, code)}
                >
                  <Flag code={code} />
                  <span>{code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="icon-button" onClick={onThemeToggle} aria-label={content.labels.theme}>
            {theme === 'dark' ? <Sun aria-hidden="true" className="icon" /> : <Moon aria-hidden="true" className="icon" />}
          </button>

          {onBookingOpen ? (
            <button type="button" className="nav-booking" onClick={onBookingOpen}>
              {content.nav.booking}
            </button>
          ) : (
            <Link to={`/${lang}`} className="nav-booking">
              {content.nav.booking}
            </Link>
          )}

          <button
            type="button"
            className="menu-toggle"
            aria-label={content.nav.menu}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X aria-hidden="true" className="icon" /> : <Menu aria-hidden="true" className="icon" />}
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${open ? 'open' : ''}`} ref={menuRef}>
        <Link to={`/${lang}/portfolio`}>{content.sections.portfolio}</Link>
        <Link to={`/${lang}/blog`}>{content.nav.blog}</Link>
        <Link to={`/${lang}/media-projects`}>{content.nav.media}</Link>
        <Link to={`/${lang}/academy`}>{content.nav.courses}</Link>
        {onBookingOpen ? (
          <button type="button" onClick={onBookingOpen}>{content.nav.booking}</button>
        ) : (
          <Link to={`/${lang}`}>{content.nav.booking}</Link>
        )}
      </div>
    </header>
  );
}

function MobileBottomNav({ lang, content, onBookingOpen }) {
  const items = [
    { label: content.nav.home, to: `/${lang}`, icon: 'home', kind: 'route' },
    { label: content.nav.services, to: `/${lang}#services`, icon: 'services', kind: 'anchor' },
    { label: content.nav.booking, to: `/${lang}`, icon: 'booking', kind: 'booking' },
    { label: content.nav.blog, to: `/${lang}/blog`, icon: 'blog', kind: 'route' }
  ];

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => {
        if (item.kind === 'booking' && onBookingOpen) {
          return (
            <button key={item.label} type="button" onClick={onBookingOpen}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          );
        }

        return item.kind === 'anchor' ? (
          <a key={item.to} href={item.to}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </a>
        ) : (
          <NavLink key={item.to} to={item.to} end={item.to === `/${lang}`}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function ProjectVisual({ title, tone }) {
  return (
    <div className={`project-visual tone-${tone}`} role="img" aria-label={`${title} visual`}>
      <span>{title.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

function SectionIntro({ title, text }) {
  return (
    <div className="section-intro">
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

function CardSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <article className="content-card skeleton-card" key={index} aria-hidden="true">
          <div className="skeleton-visual" />
          <span />
          <span />
        </article>
      ))}
    </>
  );
}

function HomePage({ theme, onThemeToggle }) {
  const { invalid, lang, content } = useLanguage();
  const { data: homepage, loading: homepageLoading, error: homepageError } = useSiteContent(lang);
  const { posts: previewPosts, loading: blogPreviewLoading } = useBlogPosts(lang);
  const [bookingModal, setBookingModal] = useState({ open: false, selected: '' });
  const [heroReady, setHeroReady] = useState(false);
  useReveal();

  useEffect(() => {
    if (!invalid) {
      setPageMeta(lang, content.meta.title, content.meta.description);
    }
  }, [content, invalid, lang]);

  useEffect(() => {
    setHeroReady(false);
    const fallback = window.setTimeout(() => setHeroReady(true), 3600);
    return () => window.clearTimeout(fallback);
  }, [lang]);

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  const firstPost = previewPosts[0];
  const services = homepage.services || [];
  const serviceCards = services.filter((service) => service.id !== 'courses').slice(0, 6);
  const academyService = services.find((service) => service.id === 'courses') || content.services.find((service) => service.id === 'courses');
  const packages = getDisplayPackages(homepage.packages || []);
  const projects = homepage.projects || [];
  const mediaProjects = homepage.mediaProjects || [];
  const artists = homepage.artists || [];
  const partners = homepage.partners || [];
  const processSteps = homepage.processSteps || [];
  const instagramPosts = homepage.instagramPosts || [];
  const hasContentWarning = homepageError || Object.values(homepage.errors || {}).some(Boolean);
  const sectionMap = Object.fromEntries((homepage.sections || []).map((section) => [section.section_key, section]));
  const isSectionVisible = (key) => !homepage.sections?.length || sectionMap[key]?.is_visible !== false;
  const sectionTitle = (key, fallback) => getLocalizedValue(sectionMap[key]?.title, lang) || fallback;
  const processDetails = processSteps.map((step, index) => {
    const title = step.title || step;
    const descriptions = {
      az: [
        'Layihə məqsədini, formatı və uyğun tarixi dəqiqləşdiririk.',
        'Referenslər, janr, vokal yanaşması və texniki ehtiyaclar toplanır.',
        'Studio session, prodakşn və materialların ilkin işlənməsi aparılır.',
        'Balans, effektlər, mastering və platformaya hazır final hazırlanır.',
        'Dinləmə sonrası düzəlişlər toplanır və final versiya cilalanır.',
        'Fayllar, vizuallar və release üçün lazım olan materiallar ötürülür.'
      ],
      ru: [
        'Уточняем цель проекта, формат и удобное время.',
        'Собираем референсы, жанр, вокальный подход и технические детали.',
        'Проводим studio session, production и первичную обработку материала.',
        'Готовим баланс, эффекты, mastering и финал под платформы.',
        'Собираем правки после прослушивания и доводим версию до финала.',
        'Передаём файлы, визуалы и материалы для релиза.'
      ],
      en: [
        'We clarify the goal, format, and suitable timing.',
        'References, genre, vocal direction, and technical needs are collected.',
        'Studio session, production, and first material cleanup happen here.',
        'Balance, effects, mastering, and platform-ready finals are prepared.',
        'Review notes are collected and the final version is polished.',
        'Files, visuals, and release-ready assets are delivered.'
      ]
    };

    return {
      id: step.id || title,
      number: String(step.stepNumber || index + 1).padStart(2, '0'),
      title,
      text: descriptions[lang]?.[index] || descriptions.az[index] || ''
    };
  });
  const openBookingModal = (selected = '') => {
    setBookingModal({ open: true, selected });
  };
  const closeBookingModal = () => {
    setBookingModal((current) => ({ ...current, open: false }));
  };
  const selectService = (serviceId) => {
    openBookingModal(`service:${serviceId}`);
  };
  const onServiceKeyDown = (event, serviceId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectService(serviceId);
    }
  };

  return (
    <div className={`app-shell ${heroReady ? 'site-ready' : 'site-intro-active'}`}>
      {!heroReady && (
        <div className="intro-overlay" aria-hidden="true" onAnimationEnd={() => setHeroReady(true)}>
          <video
            src={duomoIntroVideo}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={() => setHeroReady(true)}
            onError={() => setHeroReady(true)}
          />
        </div>
      )}
      <SiteHeader lang={lang} content={content} theme={theme} onThemeToggle={onThemeToggle} onBookingOpen={() => openBookingModal()} />
      <main>
        <section className={`hero-section ${heroReady ? 'ready' : ''}`}>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>{content.hero.title}</h1>
              <p>{content.hero.text}</p>
              <div className="hero-actions">
                <button type="button" className="button primary" onClick={() => openBookingModal()}>
                  {content.hero.primary}
                </button>
                <a href="#portfolio" className="button ghost">{content.hero.secondary}</a>
              </div>
            </div>
            <div className="hero-record-wrap" aria-hidden="true">
              <div className="vinyl-record">
                <div className="record-label">
                  <img src={duomoLogoPng} alt="" width="112" height="112" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {isSectionVisible('services') && <section id="services" className="wide-section services-section" data-reveal>
          <SectionIntro title={sectionTitle('services', content.sections.services)} />
          {homepageLoading && <SkeletonRows />}
          {hasContentWarning && <StateMessage>Some live content is temporarily unavailable. Fallback content is shown where needed.</StateMessage>}
          <div className="service-grid">
            {serviceCards.map((service) => (
              <article
                className="service-card"
                key={service.id}
                role="button"
                tabIndex={0}
                onClick={() => selectService(service.id)}
                onKeyDown={(event) => onServiceKeyDown(event, service.id)}
                aria-label={`${content.labels.bookService}: ${service.title}`}
              >
                <div className="service-card-copy">
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </div>
                <div className="service-card-visual" data-label={getServiceStickerLabel(service.id, service.title)}>
                  <ServiceIcon id={service.id} />
                </div>
                <button
                  type="button"
                  className="row-cta"
                  onClick={(event) => {
                    event.stopPropagation();
                    selectService(service.id);
                  }}
                >
                  {content.labels.bookService}
                </button>
              </article>
            ))}
          </div>
          {academyService && (
            <article className="academy-card" id="courses">
              <div>
                <h3>{content.courses.title}</h3>
                <p>{content.courses.text}</p>
                <div className="academy-actions">
                  <button type="button" className="button primary" onClick={() => openBookingModal('service:courses')}>
                    {content.labels.bookAcademy}
                  </button>
                  <Link to={`/${lang}/academy`} className="button ghost">
                    {content.labels.learnMore}
                  </Link>
                </div>
              </div>
              <div className="academy-visual" aria-hidden="true">
                <GraduationCap />
                <AudioWaveform />
                <Mic2 />
              </div>
            </article>
          )}
        </section>}

        {isSectionVisible('work_process') && <section className="wide-section process-section" data-reveal>
          <SectionIntro title={sectionTitle('work_process', content.sections.process)} />
          <ol className="process-list">
            {processDetails.map((step) => (
              <li key={step.id}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>}

        {isSectionVisible('packages') && <section id="pricing" className="wide-section packages-section" data-reveal>
          <SectionIntro title={sectionTitle('packages', content.sections.packages)} text={content.packageIntro} />
          <div className="package-stack">
            {packages.map((item) => (
              <article className={`package-row ${item.featured ? 'featured' : ''}`} key={item.id}>
                <div className="package-head">
                  {item.featured && <span>{content.labels.bestSeller}</span>}
                  <h3>{item.name}</h3>
                  <p>{item.price}</p>
                </div>
                <ul>
                  {item.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <button type="button" className="button compact" onClick={() => openBookingModal(`package:${item.id}`)}>
                  {content.labels.bookPackage}
                </button>
              </article>
            ))}
          </div>
        </section>}

        {isSectionVisible('portfolio') && <section id="portfolio" className="wide-section project-section" data-reveal>
          <SectionIntro title={sectionTitle('portfolio', content.sections.portfolio)} />
          <div className="preview-grid" aria-label="Project previews">
            {projects.slice(0, 3).map((project) => (
              <article className="project-panel content-card" key={project.id}>
                <ProjectVisual title={project.title} tone={project.tone} />
                <div>
                  <h3>{project.title}</h3>
                </div>
              </article>
            ))}
          </div>
          <Link to={`/${lang}/portfolio`} className="section-more">
            {content.labels.learnMore}
            <ArrowRight aria-hidden="true" className="icon" />
          </Link>
        </section>}

        {(isSectionVisible('artists') || isSectionVisible('partners')) && <section className="wide-section split-section" data-reveal>
          <div>
            <SectionIntro title={sectionTitle('artists', content.sections.artists)} />
            <div className="people-grid">
              {artists.slice(0, 3).map((artist) => (
                <article className="person-tile content-card" key={artist.name}>
                  <ProjectVisual title={artist.name} tone="silver" />
                  <h3>{artist.name}</h3>
                  <p>{artist.role}</p>
                </article>
              ))}
            </div>
          </div>
          <div>
            <SectionIntro title={sectionTitle('partners', content.sections.partners)} />
            <div className="partner-grid">
              {partners.slice(0, 6).map((partner) => <span key={partner.id || partner.name}>{partner.name || partner}</span>)}
            </div>
          </div>
          <Link to={`/${lang}/artists-partners`} className="section-more">
            {content.labels.learnMore}
            <ArrowRight aria-hidden="true" className="icon" />
          </Link>
        </section>}

        {isSectionVisible('media_projects') && <section id="media" className="wide-section media-preview-section" data-reveal>
          <SectionIntro title={sectionTitle('media_projects', content.mediaProjects.title)} text={content.mediaProjects.text} />
          <div className="media-grid">
            {mediaProjects.slice(0, 3).map((item, index) => (
              <article className="media-card content-card" key={item.id || item.title}>
                <ProjectVisual title={item.title} tone={item.tone || projects[index]?.tone || 'orange'} />
                <h3>{item.title}</h3>
              </article>
            ))}
          </div>
          <Link to={`/${lang}/media-projects`} className="section-more">
            {content.labels.learnMore}
            <ArrowRight aria-hidden="true" className="icon" />
          </Link>
        </section>}

        {isSectionVisible('blog') && <section className="wide-section blog-preview-section" data-reveal>
          <SectionIntro title={sectionTitle('blog', content.sections.blog)} />
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
        </section>}

        {isSectionVisible('instagram') && <section className="wide-section instagram-section" data-reveal>
          <SectionIntro title={sectionTitle('instagram', content.sections.instagram)} />
          <div className="instagram-grid">
            {instagramPosts.map((post) => (
              <a href={post.href} target="_blank" rel="noopener noreferrer" key={post.id} aria-label={post.title}>
                <ProjectVisual title={post.title} tone="graphite" />
                <span><Icon name="instagram" /> {post.title}</span>
              </a>
            ))}
          </div>
        </section>}

        {isSectionVisible('contacts') && <ContactFooter lang={lang} content={content} />}
      </main>
      <BookingModal
        open={bookingModal.open}
        onClose={closeBookingModal}
        initialSelected={bookingModal.selected}
        lang={lang}
        content={content}
        services={services}
        packages={packages}
      />
      <MobileBottomNav lang={lang} content={content} onBookingOpen={() => openBookingModal()} />
    </div>
  );
}

function BookingModal({ open, onClose, initialSelected, lang, content, services, packages }) {
  const dialogRef = useRef(null);
  const [selectedOption, setSelectedOption] = useState(initialSelected || '');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const createBooking = useCreateBooking();

  useEffect(() => {
    if (open) {
      setSelectedOption(initialSelected || '');
      setStatus({ type: 'idle', message: '' });
      document.body.classList.add('modal-open');
      window.setTimeout(() => dialogRef.current?.querySelector('select, input, textarea, button')?.focus(), 0);
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => document.body.classList.remove('modal-open');
  }, [initialSelected, open]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = normalizeBookingForm(formData, lang);
    const selectedServiceItem = services.find((service) => service.id === payload.serviceId);
    const selectedPackageItem = packages.find((item) => item.id === payload.packageId);
    const validationErrors = validateBookingPayload(payload);

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
      setSelectedOption('');
      return;
    }

    setStatus({ type: 'error', message: result.message || content.booking.required });
  }

  if (!open) {
    return null;
  }

  return (
    <div className="booking-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title" ref={dialogRef}>
        <div className="booking-modal-head">
          <div>
            <h2 id="booking-modal-title">{content.booking.title}</h2>
            <p>{content.booking.text}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close booking">
            <X aria-hidden="true" className="icon" />
          </button>
        </div>
        <form className="booking-form" onSubmit={handleSubmit} noValidate>
          <label>
            {content.booking.service}
            <select name="selectedOption" value={selectedOption} onChange={(event) => setSelectedOption(event.target.value)} required>
              <option value="">---</option>
              <optgroup label={content.sections.services}>
                {services.map((service) => <option key={service.id} value={`service:${service.id}`}>{service.title}</option>)}
              </optgroup>
              <optgroup label={content.sections.packages}>
                {packages.map((item) => <option key={item.id} value={`package:${item.id}`}>{item.name} · {item.price}</option>)}
              </optgroup>
            </select>
          </label>
          <label>
            {content.booking.name}
            <input name="customerName" type="text" required aria-describedby="booking-status" />
          </label>
          <label>
            {content.booking.email}
            <input name="customerEmail" type="email" aria-describedby="booking-status" />
          </label>
          <label>
            {content.booking.phone}
            <input name="phone" type="tel" required aria-describedby="booking-status" />
          </label>
          <label>
            {content.booking.contact}
            <select name="preferredContact" required aria-describedby="booking-status">
              <option value="">---</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">{content.booking.call}</option>
            </select>
          </label>
          <label className="field-wide">
            {content.booking.description}
            <textarea name="projectDescription" rows="6" placeholder={content.booking.descriptionPlaceholder} />
          </label>
          <button className="button primary" type="submit" disabled={createBooking.loading}>
            {createBooking.loading ? 'Sending...' : content.booking.submit}
          </button>
          <p id="booking-status" className={`form-status ${status.type}`} aria-live="polite">
            {status.message}
          </p>
        </form>
      </section>
    </div>
  );
}

function ContactFooter({ lang, content }) {
  return (
    <footer id="contact" className="site-footer" data-reveal>
      <div>
        <h2>{content.sections.contacts}</h2>
      </div>
      <address>
        <a href={`https://wa.me/${content.contacts.whatsapp.replace(/\D/g, '')}`}>{content.contacts.whatsapp}</a>
        <a href="https://instagram.com/duomorecords" target="_blank" rel="noopener noreferrer">{content.contacts.instagram}</a>
        <span>{content.contacts.address}</span>
      </address>
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
          <h1>{content.nav.blog}</h1>
        </section>
        <section className="blog-grid" data-reveal>
          {loading ? <CardSkeleton count={6} /> : (
            <>
              {error && <StateMessage>Live blog data is temporarily unavailable. Fallback posts are shown when available.</StateMessage>}
              {posts.length === 0 && <StateMessage>No published posts yet.</StateMessage>}
              {posts.map((post) => (
            <article className="blog-card content-card" key={post.slug}>
              <ProjectVisual title={post.category} tone="sand" />
              <p>{post.category} · {post.readingTime}</p>
              <h2>{post.title}</h2>
              <span>{post.excerpt}</span>
              <Link to={`/${lang}/blog/${post.slug}`} className="text-link">{content.labels.readMore}</Link>
            </article>
              ))}
            </>
          )}
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
          <h1>{content.mediaProjects.title}</h1>
          <p>{content.mediaProjects.text}</p>
        </section>
        <section className="media-grid page-grid" data-reveal>
          {loading ? <CardSkeleton count={6} /> : (
            <>
              {homepage.mediaProjects.length === 0 && <StateMessage>No media projects published yet.</StateMessage>}
              {homepage.mediaProjects.map((item, index) => (
            <article className="media-card content-card" key={item.id || `${item.title}-${index}`}>
              <ProjectVisual title={item.title} tone={item.tone || 'orange'} />
              <h2>{item.title}</h2>
            </article>
              ))}
            </>
          )}
        </section>
      </main>
      <MobileBottomNav lang={lang} content={content} />
    </div>
  );
}

function PortfolioPage({ theme, onThemeToggle }) {
  const { invalid, lang, content } = useLanguage();
  const { data: homepage, loading } = useSiteContent(lang);
  useReveal();

  useEffect(() => {
    if (!invalid) {
      setPageMeta(lang, `${content.sections.portfolio} | Duomo Records`, content.meta.description);
    }
  }, [content, invalid, lang]);

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  return (
    <div className="app-shell">
      <SiteHeader lang={lang} content={content} theme={theme} onThemeToggle={onThemeToggle} />
      <main className="page-main">
        <section className="page-hero compact" data-reveal>
          <h1>{content.sections.portfolio}</h1>
          <p>{content.about.lead}</p>
        </section>
        <section className="preview-grid page-grid" data-reveal>
          {loading ? <CardSkeleton count={6} /> : (
            <>
              {homepage.projects.length === 0 && <StateMessage>No projects published yet.</StateMessage>}
              {homepage.projects.map((project) => (
            <article className="project-panel content-card" key={project.id}>
              <ProjectVisual title={project.title} tone={project.tone} />
              <div>
                <h2>{project.title}</h2>
              </div>
            </article>
              ))}
            </>
          )}
        </section>
      </main>
      <MobileBottomNav lang={lang} content={content} />
    </div>
  );
}

function ArtistsPartnersPage({ theme, onThemeToggle }) {
  const { invalid, lang, content } = useLanguage();
  const { data: homepage, loading } = useSiteContent(lang);
  useReveal();

  useEffect(() => {
    if (!invalid) {
      setPageMeta(lang, `${content.sections.artists} | Duomo Records`, content.meta.description);
    }
  }, [content, invalid, lang]);

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  return (
    <div className="app-shell">
      <SiteHeader lang={lang} content={content} theme={theme} onThemeToggle={onThemeToggle} />
      <main className="page-main">
        <section className="page-hero compact" data-reveal>
          <h1>{content.sections.artists}</h1>
          <p>{content.about.lead}</p>
        </section>
        <section className="split-section detail-split" data-reveal>
          <div>
            <SectionIntro title={content.sections.artists} />
            <div className="people-grid">
              {loading ? <CardSkeleton count={6} /> : homepage.artists.map((artist) => (
                <article className="person-tile content-card" key={artist.id || artist.name}>
                  <ProjectVisual title={artist.name} tone="silver" />
                  <h3>{artist.name}</h3>
                  <p>{artist.role}</p>
                </article>
              ))}
            </div>
          </div>
          <div>
            <SectionIntro title={content.sections.partners} />
            <div className="partner-grid">
              {homepage.partners.map((partner) => <span key={partner.id || partner.name}>{partner.name || partner}</span>)}
            </div>
          </div>
        </section>
      </main>
      <MobileBottomNav lang={lang} content={content} />
    </div>
  );
}

function AcademyPage({ theme, onThemeToggle }) {
  const { invalid, lang, content } = useLanguage();
  const { data: homepage } = useSiteContent(lang);
  const [bookingModal, setBookingModal] = useState({ open: false, selected: '' });
  const services = homepage.services || [];
  const packages = getDisplayPackages(homepage.packages || []);
  useReveal();

  useEffect(() => {
    if (!invalid) {
      setPageMeta(lang, `${content.courses.title} | Duomo Records`, content.courses.text);
    }
  }, [content, invalid, lang]);

  if (invalid) {
    return <Navigate to="/az" replace />;
  }

  const openBookingModal = (selected = 'service:courses') => {
    setBookingModal({ open: true, selected });
  };

  return (
    <div className="app-shell">
      <SiteHeader lang={lang} content={content} theme={theme} onThemeToggle={onThemeToggle} onBookingOpen={() => openBookingModal()} />
      <main className="page-main">
        <section className="academy-page-hero" data-reveal>
          <div>
            <h1>{content.courses.title}</h1>
            <p>{content.courses.text}</p>
            <button type="button" className="button primary" onClick={() => openBookingModal('service:courses')}>
              {content.labels.bookAcademy}
            </button>
          </div>
          <div className="academy-visual large" aria-hidden="true">
            <GraduationCap />
            <AudioWaveform />
            <Mic2 />
          </div>
        </section>
        <section className="academy-modules" data-reveal>
          {['Recording', 'Production', 'Mix & Mastering', 'Arrangement'].map((module) => (
            <article key={module}>
              <BookOpenCheck aria-hidden="true" className="icon" />
              <h2>{module}</h2>
              <p>{content.courses.text}</p>
            </article>
          ))}
        </section>
      </main>
      <BookingModal
        open={bookingModal.open}
        onClose={() => setBookingModal((current) => ({ ...current, open: false }))}
        initialSelected={bookingModal.selected}
        lang={lang}
        content={content}
        services={services}
        packages={packages}
      />
      <MobileBottomNav lang={lang} content={content} onBookingOpen={() => openBookingModal()} />
    </div>
  );
}

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/az" replace />} />
        <Route path="/:lang" element={<HomePage theme={theme} onThemeToggle={toggleTheme} />} />
        <Route path="/:lang/portfolio" element={<PortfolioPage theme={theme} onThemeToggle={toggleTheme} />} />
        <Route path="/:lang/artists-partners" element={<ArtistsPartnersPage theme={theme} onThemeToggle={toggleTheme} />} />
        <Route path="/:lang/academy" element={<AcademyPage theme={theme} onThemeToggle={toggleTheme} />} />
        <Route path="/:lang/media-projects" element={<MediaProjectsPage theme={theme} onThemeToggle={toggleTheme} />} />
        <Route path="/:lang/blog" element={<BlogPage theme={theme} onThemeToggle={toggleTheme} />} />
        <Route path="/:lang/blog/:slug" element={<BlogArticlePage theme={theme} onThemeToggle={toggleTheme} />} />
        <Route
          path="/:lang/admin/login"
          element={
            <AdminAuthProvider>
              <Suspense fallback={<div className="admin-auth-screen">Loading...</div>}>
                <AdminLoginPage />
              </Suspense>
            </AdminAuthProvider>
          }
        />
        <Route
          path="/:lang/admin/*"
          element={
            <AdminAuthProvider>
              <AdminProtectedRoute>
                <Suspense fallback={<div className="admin-auth-screen">Loading...</div>}>
                  <AdminApp />
                </Suspense>
              </AdminProtectedRoute>
            </AdminAuthProvider>
          }
        />
        <Route path="*" element={<Navigate to="/az" replace />} />
      </Routes>
    </>
  );
}
