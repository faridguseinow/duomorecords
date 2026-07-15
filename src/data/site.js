export const supportedLanguages = ['az', 'ru', 'en'];

const shared = {
  packages: [
    {
      id: 'economy',
      name: 'Economy',
      price: '100 AZN',
      marker: '01',
      features: ['1 hour recording', 'Basic vocal cleanup', 'WAV + MP3', 'Up to 2 revisions']
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '150 AZN',
      marker: '02',
      featured: true,
      features: ['1 hour recording', 'Mix & mastering', 'Vocal effects', 'WAV + MP3', 'Up to 3 revisions']
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '200 AZN',
      marker: '03',
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
      profile: 'Profil',
      menu: 'Menyu'
    },
    hero: {
      eyebrow: 'MUSIC PRODUCTION STUDIO',
      title: 'Səsi ideyadan final relizə qədər dizayn edirik',
      text: 'DUOMO Records musiqi prodakşnı, recording, mix/mastering, klip, reels və vizual kontenti bir istehsal xəttində birləşdirir.',
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
      placeholder: 'Növbəti mərhələdə qoşulacaq'
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
      { id: 'courses', category: 'Academy', title: 'Courses', text: 'Prodakşn, səs rejissorluğu və aranjiman üzrə hazırlıq modulları.' }
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
      text: 'Kurs modulları üçün frontend yeri hazırdır. Auth, profil və ödəniş ayrı mərhələdə qoşulacaq.'
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
      title: 'Layihə üçün slot hazırlayın',
      text: 'Tarixi seçin, boş saatları görün və layihə zayavkasını DUOMO booking sisteminə göndərin.',
      service: 'Xidmət və ya paket',
      date: 'Tarix',
      time: 'Saat',
      name: 'Ad və soyad',
      phone: 'Telefon',
      description: 'Layihə haqqında',
      contact: 'Əlaqə üsulu',
      submit: 'Zayavkanı hazırla',
      ready: 'Zayavka qəbul edildi.',
      required: 'Zəhmət olmasa bütün məcburi xanaları doldurun.'
    },
    contacts: {
      whatsapp: '+994 99 340 03 40',
      instagram: '@duomorecords',
      address: '28 May, Jalə Plaza, Bakı, Azərbaycan'
    },
    profile: {
      title: 'Profil',
      text: 'Avtorizasiya və şəxsi kabinet növbəti mərhələdə Supabase ilə qoşulacaq.'
    }
  },
  ru: {
    meta: {
      title: 'Duomo Records',
      description: 'Duomo Records — музыкальный продакшн, запись, mix/mastering, медиа и креативные услуги.'
    },
    nav: { home: 'Главная', services: 'Услуги', projects: 'Проекты', media: 'Media', blog: 'Blog', courses: 'Курсы', booking: 'Бронь', profile: 'Профиль', menu: 'Меню' },
    hero: {
      eyebrow: 'MUSIC PRODUCTION STUDIO',
      title: 'Проектируем звук от идеи до финального релиза',
      text: 'DUOMO Records объединяет music production, запись, mix/mastering, клипы, reels и визуальный контент в одной продакшн-системе.',
      primary: 'Подготовить бронь',
      secondary: 'Смотреть проекты',
      scroll: 'Ниже'
    },
    labels: { theme: 'Переключить тему', language: 'Выбрать язык', readMore: 'Читать', book: 'Бронь', bookService: 'Выбрать услугу', bookPackage: 'Выбрать пакет', viewAll: 'Смотреть всё', share: 'Поделиться', backToBlog: 'Назад в блог', placeholder: 'Будет подключено позже' },
    sections: { services: 'Услуги', packages: 'Пакеты', portfolio: 'Портфолио', about: 'О студии', artists: 'Artists / Clients', partners: 'Partners', process: 'Процесс', courses: 'Courses preview', media: 'Media projects', blog: 'Blog', instagram: 'Instagram', booking: 'Booking', contacts: 'Контакты' },
    services: [
      { id: 'music-production', category: 'Studio', title: 'Music Production', text: 'Аранжировка, beat, topline и готовый к релизу музыкальный продакшн.' },
      { id: 'recording-mix-mastering', category: 'Audio', title: 'Запись + Mix & Mastering', text: 'Recording, editing, баланс и master для платформ.' },
      { id: 'voice-over', category: 'Media', title: 'Voice Over', text: 'Озвучивание для рекламы, видео, презентаций и social media.' },
      { id: 'music-videos', category: 'Video', title: 'Music Videos / Clips', text: 'Концепт, съёмка, монтаж и визуальный пакет релиза.' },
      { id: 'reels', category: 'Social', title: 'Reels', text: 'Короткий ритмичный видеоконтент для артистов и брендов.' },
      { id: 'graphic-design', category: 'Visual', title: 'Graphic Design', text: 'Cover art, logo, banner, promo и campaign visuals.' },
      { id: 'courses', category: 'Academy', title: 'Courses', text: 'Модули по продакшну, звукорежиссуре и аранжировке.' }
    ],
    packageIntro: 'Цены пока mock-данные и позже будут управляться через Supabase.',
    about: { lead: 'DUOMO — бакинская продакшн-студия, где звук, визуал и медиа-ритм собираются одной командой.', facts: ['Pop, R&B, EDM, hip-hop', 'Recording + post-production', 'Media и release support'] },
    artists: [{ name: 'Ayla', role: 'Vocal production' }, { name: 'RZ Project', role: 'Mix & mastering' }, { name: 'NOVA', role: 'Visual direction' }],
    process: ['Заявка', 'Brief и референсы', 'Запись / production', 'Mix & Master', 'Правки', 'Финальная передача / релиз'],
    courses: { title: 'DUOMO Academy', text: 'Место под курсы подготовлено. Auth, профиль и оплата подключаются отдельным этапом.' },
    mediaProjects: { title: 'Media Projects', text: 'Сессии, backstage, reels и специальные media-форматы.', items: ['Behind The Session', 'Live Vocal Direction', 'Clip Moodboard'] },
    blogPosts: [],
    booking: { title: 'Подготовить заявку на проект', text: 'Выберите дату, посмотрите доступные слоты и отправьте заявку в booking-систему DUOMO.', service: 'Услуга или пакет', date: 'Дата', time: 'Время', name: 'Имя и фамилия', phone: 'Телефон', description: 'Описание проекта', contact: 'Способ связи', submit: 'Отправить заявку', ready: 'Заявка принята.', required: 'Заполните обязательные поля.' },
    contacts: { whatsapp: '+994 99 340 03 40', instagram: '@duomorecords', address: '28 May, Jalə Plaza, Баку, Азербайджан' },
    profile: { title: 'Профиль', text: 'Авторизация и личный кабинет будут подключены на следующем этапе через Supabase.' }
  },
  en: {
    meta: {
      title: 'Duomo Records',
      description: 'Duomo Records — music production, recording, mix/mastering, media and creative services.'
    },
    nav: { home: 'Home', services: 'Services', projects: 'Projects', media: 'Media', blog: 'Blog', courses: 'Courses', booking: 'Booking', profile: 'Profile', menu: 'Menu' },
    hero: {
      eyebrow: 'MUSIC PRODUCTION STUDIO',
      title: 'Designing sound from first idea to final release',
      text: 'DUOMO Records combines music production, recording, mix/mastering, videos, reels, and release visuals in one production system.',
      primary: 'Prepare booking',
      secondary: 'View projects',
      scroll: 'Scroll'
    },
    labels: { theme: 'Toggle theme', language: 'Choose language', readMore: 'Read', book: 'Book', bookService: 'Choose service', bookPackage: 'Choose package', viewAll: 'View all', share: 'Share', backToBlog: 'Back to blog', placeholder: 'Coming next stage' },
    sections: { services: 'Services', packages: 'Packages', portfolio: 'Portfolio', about: 'About', artists: 'Artists / Clients', partners: 'Partners', process: 'Work process', courses: 'Courses preview', media: 'Media projects', blog: 'Blog', instagram: 'Instagram', booking: 'Booking', contacts: 'Contacts' },
    services: [
      { id: 'music-production', category: 'Studio', title: 'Music Production', text: 'Arrangement, beats, topline, and release-ready production.' },
      { id: 'recording-mix-mastering', category: 'Audio', title: 'Recording + Mix & Mastering', text: 'Recording, editing, balance, and streaming-ready masters.' },
      { id: 'voice-over', category: 'Media', title: 'Voice Over', text: 'Clean voice work for ads, video, presentations, and social media.' },
      { id: 'music-videos', category: 'Video', title: 'Music Videos / Clips', text: 'Concept, filming, editing, and release visual packages.' },
      { id: 'reels', category: 'Social', title: 'Reels', text: 'Short rhythmic video content for artists and brands.' },
      { id: 'graphic-design', category: 'Visual', title: 'Graphic Design', text: 'Cover art, logos, banners, promo and campaign visuals.' },
      { id: 'courses', category: 'Academy', title: 'Courses', text: 'Production, audio engineering, and arrangement modules.' }
    ],
    packageIntro: 'Prices are mock data and will become a Supabase-managed catalog later.',
    about: { lead: 'DUOMO is a Baku-based production studio connecting sound, visuals, and media cadence inside one team.', facts: ['Pop, R&B, EDM, hip-hop', 'Recording + post-production', 'Media and release support'] },
    artists: [{ name: 'Ayla', role: 'Vocal production' }, { name: 'RZ Project', role: 'Mix & mastering' }, { name: 'NOVA', role: 'Visual direction' }],
    process: ['Request', 'Brief and references', 'Recording / production', 'Mix & Master', 'Revisions', 'Final transfer / release'],
    courses: { title: 'DUOMO Academy', text: 'The frontend place for course modules is ready. Auth, profile, and payment come later.' },
    mediaProjects: { title: 'Media Projects', text: 'Sessions, backstage, reels, and special media formats.', items: ['Behind The Session', 'Live Vocal Direction', 'Clip Moodboard'] },
    blogPosts: [],
    booking: { title: 'Prepare a project request', text: 'Choose a date, review available slots, and send the request to the DUOMO booking system.', service: 'Service or package', date: 'Date', time: 'Time', name: 'Full name', phone: 'Phone', description: 'Project description', contact: 'Preferred contact', submit: 'Send request', ready: 'Booking request received.', required: 'Please fill in all required fields.' },
    contacts: { whatsapp: '+994 99 340 03 40', instagram: '@duomorecords', address: '28 May, Jalə Plaza, Baku, Azerbaijan' },
    profile: { title: 'Profile', text: 'Authorization and personal account will be connected with Supabase at the next stage.' }
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
