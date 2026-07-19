export const supportedLanguages = ['az', 'ru', 'en'];

const shared = {
  packages: [
    {
      id: 'economy',
      name: 'Economy',
      price: '150 AZN',
      marker: '01',
      features: ['1 hour recording', 'Basic vocal cleanup', 'WAV + MP3', 'Up to 2 revisions']
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '200 AZN',
      marker: '02',
      features: ['1 hour recording', 'Mix & mastering', 'Vocal effects', 'WAV + MP3', 'Up to 3 revisions']
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '250 AZN',
      marker: '03',
      featured: true,
      features: ['2 hour recording', 'High-end mix & mastering', 'AutoTune / Melodyne', 'Sound design', 'Up to 5 revisions']
    }
  ],
  projects: [
    { id: 'qorxuram', title: 'Qorxuram', category: 'Pop Production', tone: 'orange', status: 'placeholder' },
    { id: 'susdum', title: 'Susdum', category: 'R&B Vocal Production', tone: 'graphite', status: 'placeholder' },
    { id: 'kaman-agla', title: 'Kaman Ağla', category: 'EDM Crossover', tone: 'sand', status: 'placeholder' },
    { id: 'midnight-session', title: 'Midnight Session', category: 'Studio Direction', tone: 'silver', status: 'placeholder' }
  ],
  partners: ['Studio Partner', 'Media Lab', 'Clip Unit', 'Visual Desk', 'Release Hub', 'Event Crew'],
  timeSlots: ['11:00', '12:30', '14:00', '16:00', '18:00'],
  instagram: [
    { id: 'ig-01', title: 'Studio session', href: 'https://instagram.com/duomorecords' },
    { id: 'ig-02', title: 'Vocal direction', href: 'https://instagram.com/duomorecords' },
    { id: 'ig-03', title: 'Mix detail', href: 'https://instagram.com/duomorecords' },
    { id: 'ig-04', title: 'Release visual', href: 'https://instagram.com/duomorecords' }
  ]
};

export const siteContent = {
  az: {
    meta: {
      title: 'Duomo Records',
      description: 'Duomo Records — musiqi prodakşnı, səsyazma, mix/mastering, media və kreativ xidmətlər.'
    },
    nav: {
      home: 'Əsas',
      services: 'Xidmətlər',
      projects: 'Layihələr',
      media: 'Media',
      blog: 'Blog',
      courses: 'Kurslar',
      booking: 'Bron',
      menu: 'Menyu'
    },
    hero: {
      eyebrow: 'MUSIC PRODUCTION STUDIO',
      title: 'Səsi ideyadan final relizə qədər dizayn edirik',
      text: 'DUOMO Records artistlər və brendlər üçün ideyanı hazır səsə, vizuala və reliz kontentinə çevirir.',
      primary: 'Bron yarat',
      secondary: 'Layihələrə bax',
      scroll: 'Aşağı'
    },
    labels: {
      theme: 'Tema dəyiş',
      language: 'Dil seç',
      readMore: 'Oxu',
      book: 'Bron et',
      bookService: 'Bu xidməti seç',
      bookPackage: 'Paketi seç',
      viewAll: 'Hamısına bax',
      share: 'Paylaş',
      backToBlog: 'Bloga qayıt',
      placeholder: 'Növbəti mərhələdə qoşulacaq',
      bestSeller: 'Best seller',
      learnMore: 'Daha ətraflı',
      bookAcademy: 'Academy kursuna yazıl'
    },
    sections: {
      services: 'Xidmətlər',
      packages: 'Paketlər',
      portfolio: 'Portfolio',
      about: 'Haqqımızda',
      artists: 'Artists / Clients',
      partners: 'Partners',
      process: 'İş prosesi',
      courses: 'Courses preview',
      media: 'Media projects',
      blog: 'Blog',
      instagram: 'Instagram',
      booking: 'Booking',
      contacts: 'Kontaktlar'
    },
    services: [
      { id: 'music-production', category: 'Studio', title: 'Music Production', text: 'Aranjiman, beat, topline və relizə hazır musiqi prodakşnı.' },
      { id: 'recording-mix-mastering', category: 'Audio', title: 'Səs yazma + Mix & Mastering', text: 'Vokal recording, editing, tonal balans və platformalara hazır master.' },
      { id: 'voice-over', category: 'Media', title: 'Voice Over', text: 'Reklam, video, təqdimat və sosial media üçün təmiz səsləndirmə.' },
      { id: 'music-videos', category: 'Video', title: 'Music Videos / Clips', text: 'Klip konsepti, çəkiliş, montaj və release üçün vizual paket.' },
      { id: 'reels', category: 'Social', title: 'Reels', text: 'Artist və brendlər üçün qısa formatlı, ritmik video kontent.' },
      { id: 'graphic-design', category: 'Visual', title: 'Graphic Design', text: 'Cover art, logo, banner, promo və kampaniya vizualları.' },
      { id: 'courses', category: 'Academy', title: 'DUOMO Academy', text: 'Prodakşn, səs yazma, mix və aranjiman üzrə praktik kurslar.' }
    ],
    packageIntro: 'Qiymətlər mock-datadır və Supabase mərhələsində idarə olunan kataloqa çevriləcək.',
    about: {
      lead: 'DUOMO səsi, vizualı və media ritmini bir komanda içində birləşdirən Bakı əsaslı prodakşn studiyasıdır.',
      facts: ['Pop, R&B, EDM, hip-hop', 'Recording + post-production', 'Media və release support']
    },
    artists: [
      { name: 'Ayla', role: 'Vocal production' },
      { name: 'RZ Project', role: 'Mix & mastering' },
      { name: 'NOVA', role: 'Visual direction' }
    ],
    process: ['Zəng / müraciət', 'Brief və referenslər', 'Recording / production', 'Mix & Master', 'Düzəlişlər', 'Final transfer / release'],
    courses: {
      title: 'DUOMO Academy',
      text: 'Səs yazma, prodakşn, aranjiman və mix/mastering üzrə praktik dərslər. Kurslar studiya workflow-u üzərində qurulur və real layihə tapşırıqları ilə tamamlanır.'
    },
    mediaProjects: {
      title: 'Media Projects',
      text: 'Sessiyalar, backstage, reels və xüsusi media formatları üçün lokal preview.',
      items: ['Behind The Session', 'Live Vocal Direction', 'Clip Moodboard']
    },
    blogPosts: [
      {
        slug: 'recording-before-studio',
        title: 'Studiyaya gəlməzdən əvvəl vokalı necə hazırlamaq olar',
        excerpt: 'Recording günündə daha az stress və daha təmiz take üçün praktik hazırlıq.',
        category: 'Recording',
        publishedAt: '2026-07-01',
        readingTime: '4 min',
        seoTitle: 'Vokal recording hazırlığı | DUOMO Records',
        seoDescription: 'Studiyaya gəlməzdən əvvəl vokal və material hazırlığı üçün qısa bələdçi.',
        content: ['Mətn, tonallıq və referenslər əvvəlcədən hazır olmalıdır.', 'Demo versiya və istədiyiniz sound nümunələri prodüserlə işi sürətləndirir.']
      },
      {
        slug: 'mix-mastering-difference',
        title: 'Mix və mastering arasındakı fərq',
        excerpt: 'İki mərhələnin məqsədi fərqlidir: biri balans, digəri final yayım hazırlığıdır.',
        category: 'Mixing',
        publishedAt: '2026-06-20',
        readingTime: '5 min',
        seoTitle: 'Mix və mastering fərqi | DUOMO Records',
        seoDescription: 'Mix və mastering proseslərinin nə üçün ayrı mərhələ olduğunu izah edirik.',
        content: ['Mix trek daxilində elementlərin balansıdır.', 'Mastering isə final faylı platformalar və sistemlər üçün sabitləşdirir.']
      },
      {
        slug: 'release-visual-system',
        title: 'Reliz üçün vizual sistem niyə vacibdir',
        excerpt: 'Cover, reels və klip eyni dilə sahib olanda reliz daha güclü görünür.',
        category: 'Visual',
        publishedAt: '2026-06-04',
        readingTime: '3 min',
        seoTitle: 'Reliz vizual sistemi | DUOMO Records',
        seoDescription: 'Musiqi relizində vizual ardıcıllığın rolu.',
        content: ['Vizual sistem dinləyicinin layihəni xatırlamasına kömək edir.', 'Qısa formatlar cover və klip estetikası ilə bağlı olmalıdır.']
      },
      {
        slug: 'first-production-brief',
        title: 'İlk prodakşn brief-i necə yazılır',
        excerpt: 'Janr, mood, referens və məqsəd prodakşn qərarlarını aydınlaşdırır.',
        category: 'Production',
        publishedAt: '2026-05-18',
        readingTime: '4 min',
        seoTitle: 'Prodakşn brief necə yazılır | DUOMO Records',
        seoDescription: 'Musiqi prodakşnı üçün sadə və effektiv brief strukturu.',
        content: ['Brief layihənin istiqamətini qoruyur.', 'Referenslər hiss, temp, vokal yanaşması və mix gözləntisini aydın edir.']
      }
    ],
    booking: {
      title: 'Layihə üçün zayavka göndərin',
      text: 'Xidməti seçin, əlaqə məlumatlarını yazın. Komandamız sizinlə əlaqə saxlayıb uyğun tarixi və saatı təsdiqləyəcək.',
      service: 'Xidmət və ya paket',
      name: 'Ad və soyad',
      email: 'Email (istəyə bağlı)',
      phone: 'Telefon',
      description: 'Nə etmək istəyirsiniz?',
      descriptionPlaceholder: 'Layihə, mahnı, referenslər, istədiyiniz xidmət və vacib detallar haqqında yazın.',
      contact: 'Əlaqə üsulu',
      call: 'Zəng',
      submit: 'Göndər',
      ready: 'Zayavka göndərildi.',
      required: 'Zəhmət olmasa bütün məcburi xanaları doldurun.'
    },
    contacts: {
      whatsapp: '+994 99 340 03 40',
      instagram: '@duomorecords',
      address: '28 May, Jalə Plaza, Bakı, Azərbaycan'
    }
  },
  ru: {
    meta: {
      title: 'Duomo Records',
      description: 'Duomo Records — музыкальный продакшн, запись, mix/mastering, медиа и креативные услуги.'
    },
    nav: { home: 'Главная', services: 'Услуги', projects: 'Проекты', media: 'Media', blog: 'Blog', courses: 'Курсы', booking: 'Бронь', menu: 'Меню' },
    hero: {
      eyebrow: 'MUSIC PRODUCTION STUDIO',
      title: 'Проектируем звук от идеи до финального релиза',
      text: 'DUOMO Records помогает артистам и брендам превращать идею в готовый звук, визуал и релизный контент.',
      primary: 'Подготовить бронь',
      secondary: 'Смотреть проекты',
      scroll: 'Ниже'
    },
    labels: { theme: 'Переключить тему', language: 'Выбрать язык', readMore: 'Читать', book: 'Бронь', bookService: 'Выбрать услугу', bookPackage: 'Выбрать пакет', viewAll: 'Смотреть всё', share: 'Поделиться', backToBlog: 'Назад в блог', placeholder: 'Будет подключено позже', bestSeller: 'Best seller', learnMore: 'Подробнее', bookAcademy: 'Записаться в Academy' },
    sections: { services: 'Услуги', packages: 'Пакеты', portfolio: 'Портфолио', about: 'О студии', artists: 'Artists / Clients', partners: 'Partners', process: 'Процесс', courses: 'Courses preview', media: 'Media projects', blog: 'Blog', instagram: 'Instagram', booking: 'Booking', contacts: 'Контакты' },
    services: [
      { id: 'music-production', category: 'Studio', title: 'Music Production', text: 'Аранжировка, beat, topline и готовый к релизу музыкальный продакшн.' },
      { id: 'recording-mix-mastering', category: 'Audio', title: 'Запись + Mix & Mastering', text: 'Recording, editing, баланс и master для платформ.' },
      { id: 'voice-over', category: 'Media', title: 'Voice Over', text: 'Озвучивание для рекламы, видео, презентаций и social media.' },
      { id: 'music-videos', category: 'Video', title: 'Music Videos / Clips', text: 'Концепт, съёмка, монтаж и визуальный пакет релиза.' },
      { id: 'reels', category: 'Social', title: 'Reels', text: 'Короткий ритмичный видеоконтент для артистов и брендов.' },
      { id: 'graphic-design', category: 'Visual', title: 'Graphic Design', text: 'Cover art, logo, banner, promo и campaign visuals.' },
      { id: 'courses', category: 'Academy', title: 'DUOMO Academy', text: 'Практические курсы по продакшну, записи, миксу и аранжировке.' }
    ],
    packageIntro: 'Цены пока mock-данные и позже будут управляться через Supabase.',
    about: { lead: 'DUOMO — бакинская продакшн-студия, где звук, визуал и медиа-ритм собираются одной командой.', facts: ['Pop, R&B, EDM, hip-hop', 'Recording + post-production', 'Media и release support'] },
    artists: [{ name: 'Ayla', role: 'Vocal production' }, { name: 'RZ Project', role: 'Mix & mastering' }, { name: 'NOVA', role: 'Visual direction' }],
    process: ['Заявка', 'Brief и референсы', 'Запись / production', 'Mix & Master', 'Правки', 'Финальная передача / релиз'],
    courses: { title: 'DUOMO Academy', text: 'Практические занятия по записи, продакшну, аранжировке и mix/mastering. Обучение построено вокруг студийного workflow и реальных проектных заданий.' },
    mediaProjects: { title: 'Media Projects', text: 'Сессии, backstage, reels и специальные media-форматы.', items: ['Behind The Session', 'Live Vocal Direction', 'Clip Moodboard'] },
    blogPosts: [],
    booking: { title: 'Отправить заявку на проект', text: 'Выберите услугу и оставьте контакты. Команда свяжется с вами, уточнит детали и сама назначит удобное время.', service: 'Услуга или пакет', name: 'Имя и фамилия', email: 'Email (необязательно)', phone: 'Телефон', description: 'Что вы хотите сделать?', descriptionPlaceholder: 'Опишите проект, трек, референсы, нужную услугу и важные детали.', contact: 'Как с вами связаться', call: 'Позвонить', submit: 'Отправить', ready: 'Заявка отправлена.', required: 'Заполните обязательные поля.' },
    contacts: { whatsapp: '+994 99 340 03 40', instagram: '@duomorecords', address: '28 May, Jalə Plaza, Баку, Азербайджан' }
  },
  en: {
    meta: {
      title: 'Duomo Records',
      description: 'Duomo Records — music production, recording, mix/mastering, media and creative services.'
    },
    nav: { home: 'Home', services: 'Services', projects: 'Projects', media: 'Media', blog: 'Blog', courses: 'Courses', booking: 'Booking', menu: 'Menu' },
    hero: {
      eyebrow: 'MUSIC PRODUCTION STUDIO',
      title: 'Designing sound from first idea to final release',
      text: 'DUOMO Records helps artists and brands turn ideas into finished sound, visuals, and release content.',
      primary: 'Prepare booking',
      secondary: 'View projects',
      scroll: 'Scroll'
    },
    labels: { theme: 'Toggle theme', language: 'Choose language', readMore: 'Read', book: 'Book', bookService: 'Choose service', bookPackage: 'Choose package', viewAll: 'View all', share: 'Share', backToBlog: 'Back to blog', placeholder: 'Coming next stage', bestSeller: 'Best seller', learnMore: 'Learn more', bookAcademy: 'Book Academy course' },
    sections: { services: 'Services', packages: 'Packages', portfolio: 'Portfolio', about: 'About', artists: 'Artists / Clients', partners: 'Partners', process: 'Work process', courses: 'Courses preview', media: 'Media projects', blog: 'Blog', instagram: 'Instagram', booking: 'Booking', contacts: 'Contacts' },
    services: [
      { id: 'music-production', category: 'Studio', title: 'Music Production', text: 'Arrangement, beats, topline, and release-ready production.' },
      { id: 'recording-mix-mastering', category: 'Audio', title: 'Recording + Mix & Mastering', text: 'Recording, editing, balance, and streaming-ready masters.' },
      { id: 'voice-over', category: 'Media', title: 'Voice Over', text: 'Clean voice work for ads, video, presentations, and social media.' },
      { id: 'music-videos', category: 'Video', title: 'Music Videos / Clips', text: 'Concept, filming, editing, and release visual packages.' },
      { id: 'reels', category: 'Social', title: 'Reels', text: 'Short rhythmic video content for artists and brands.' },
      { id: 'graphic-design', category: 'Visual', title: 'Graphic Design', text: 'Cover art, logos, banners, promo and campaign visuals.' },
      { id: 'courses', category: 'Academy', title: 'DUOMO Academy', text: 'Hands-on courses in production, recording, mixing, and arrangement.' }
    ],
    packageIntro: 'Prices are mock data and will become a Supabase-managed catalog later.',
    about: { lead: 'DUOMO is a Baku-based production studio connecting sound, visuals, and media cadence inside one team.', facts: ['Pop, R&B, EDM, hip-hop', 'Recording + post-production', 'Media and release support'] },
    artists: [{ name: 'Ayla', role: 'Vocal production' }, { name: 'RZ Project', role: 'Mix & mastering' }, { name: 'NOVA', role: 'Visual direction' }],
    process: ['Request', 'Brief and references', 'Recording / production', 'Mix & Master', 'Revisions', 'Final transfer / release'],
    courses: { title: 'DUOMO Academy', text: 'Hands-on lessons for recording, production, arrangement, and mix/mastering. The course flow follows a real studio workflow with practical project tasks.' },
    mediaProjects: { title: 'Media Projects', text: 'Sessions, backstage, reels, and special media formats.', items: ['Behind The Session', 'Live Vocal Direction', 'Clip Moodboard'] },
    blogPosts: [],
    booking: { title: 'Send a project request', text: 'Choose a service and leave your contacts. The team will call you back, clarify the details, and schedule the right time.', service: 'Service or package', name: 'Full name', email: 'Email (optional)', phone: 'Phone', description: 'What do you want to do?', descriptionPlaceholder: 'Describe the project, track, references, needed service, and important details.', contact: 'Preferred contact', call: 'Call', submit: 'Send', ready: 'Request sent.', required: 'Please fill in all required fields.' },
    contacts: { whatsapp: '+994 99 340 03 40', instagram: '@duomorecords', address: '28 May, Jalə Plaza, Baku, Azerbaijan' }
  }
};

siteContent.ru.blogPosts = siteContent.az.blogPosts.map((post) => ({
  ...post,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content
}));

siteContent.en.blogPosts = siteContent.az.blogPosts.map((post) => ({
  ...post,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content
}));

export const packages = shared.packages;
export const projects = shared.projects;
export const partners = shared.partners;
export const timeSlots = shared.timeSlots;
export const instagramPosts = shared.instagram;
