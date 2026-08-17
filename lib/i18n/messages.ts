import type { Locale } from './config'

/**
 * The app message catalog.
 *
 * Arabic is the source of truth: the `Messages` type is derived from the `ar`
 * tree, so the `en` tree fails to compile the moment it is missing a key or
 * gains one Arabic does not have. That is deliberate — a half-translated
 * dictionary should be a build error, not a string of Arabic leaking into an
 * English dashboard at runtime.
 *
 * Keys are grouped by surface. When migrating a component, move its literals
 * here rather than inventing new phrasing: the Arabic side must stay
 * byte-identical to what shipped, so this is a refactor and not a rewrite.
 */

const ar = {
  nav: {
    workspace: 'مساحة العمل',
    dashboard: 'لوحة التحكم',
    home: 'الرئيسية',
    sites: 'المواقع',
    gallery: 'المعرض',
    analytics: 'التحليلات',
    seo: 'السيو',
    domains: 'النطاقات',
    bookings: 'الحجوزات',
    billing: 'الفوترة',
    settings: 'الإعدادات',
    account: 'الحساب',
    admin: 'الإدارة',
    newSite: 'موقع جديد',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    accountMenu: 'قائمة الحساب',
    yourAccount: 'حسابك',
    notifications: 'الإشعارات',
    noNotifications: 'لا إشعارات جديدة',
  },
  accounts: {
    title: 'الحساب',
    chooseAccount: 'اختر حسابك',
    continueToDashboard: 'تابع إلى لوحة التحكم بالحساب الذي تريده.',
    signInAnother: 'الدخول بحساب آخر',
    signOut: 'تسجيل الخروج',
    signingOut: 'جارٍ تسجيل الخروج…',
    zenyaUser: 'مستخدم زينيا',
  },
  launchPlan: {
    title: 'خطة الإطلاق',
    createSite: 'أنشئ موقعك',
    customize: 'خصّص محتواك',
    publish: 'انشُر موقعك',
    connectDomain: 'اربط نطاقك',
    setupSeo: 'هيّئ السيو',
    recheck: 'إعادة التحقق',
    recheckShort: 'إعادة',
    /** {step} is the step label. */
    undoStep: 'تراجع عن {step}',
    /** {step} is the step label. */
    markStepDone: 'تحديد {step} كمكتمل',
  },
  tour: {
    close: 'إغلاق',
    finish: 'إنهاء',
    finishTour: 'إنهاء الجولة',
    next: 'التالي',
    previous: 'السابق',
    skip: 'تخطّي',
    welcomeTitle: 'أهلًا بك في زينيا 👋',
    welcomeBody: 'هل تريد جولة سريعة نُريك فيها أين تجد كل صفحة في لوحة التحكم؟',
    welcomeYes: 'نعم، عرّفني على زينيا',
    welcomeNo: 'لا، شكرًا',
    dashboardBody: 'مركزك الرئيسي — كل مواقعك وأرقامك وإجراءاتك السريعة في مكان واحد.',
    sitesBody: 'كل موقع أنشأته — من هنا تحرّره أو تنشره أو تصدّره.',
    analyticsBody:
      'تعرف كم زائرًا وصلك ومن أين جاؤوا وما الذي يتفاعلون معه — وشاهد زوّارك لحظيًا من تبويب «الزوّار».',
    seoBody: 'اضبط كيف يظهر موقعك في نتائج جوجل ليعثر عليك المزيد من العملاء.',
    domainsBody: 'اربط نطاقك الخاص (مجاني لسنة مع Pro) لهوية أكثر احترافية.',
    bookingsBody: 'استقبل حجوزات عملائك مباشرة من موقعك وتابعها كلها هنا (ميزة Pro).',
  },
  common: {
    language: 'اللغة',
    switchToArabic: 'التبديل إلى العربية',
    switchToEnglish: 'التبديل إلى الإنجليزية',
  },
} as const

/** Shape every locale must satisfy, derived from Arabic. */
export type Messages = {
  [Section in keyof typeof ar]: { [Key in keyof (typeof ar)[Section]]: string }
}

const en: Messages = {
  nav: {
    workspace: 'Workspace',
    dashboard: 'Dashboard',
    home: 'Home',
    sites: 'Sites',
    gallery: 'Gallery',
    analytics: 'Analytics',
    seo: 'SEO',
    domains: 'Domains',
    bookings: 'Bookings',
    billing: 'Billing',
    settings: 'Settings',
    account: 'Account',
    admin: 'Admin',
    newSite: 'New site',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    accountMenu: 'Account menu',
    yourAccount: 'Your account',
    notifications: 'Notifications',
    noNotifications: 'No new notifications',
  },
  accounts: {
    title: 'Account',
    chooseAccount: 'Choose your account',
    continueToDashboard: 'Continue to the dashboard with the account you want.',
    signInAnother: 'Sign in with another account',
    signOut: 'Sign out',
    signingOut: 'Signing out…',
    zenyaUser: 'Zenya user',
  },
  launchPlan: {
    title: 'Launch plan',
    createSite: 'Create your site',
    customize: 'Customise your content',
    publish: 'Publish your site',
    connectDomain: 'Connect your domain',
    setupSeo: 'Set up SEO',
    recheck: 'Check again',
    recheckShort: 'Again',
    undoStep: 'Undo {step}',
    markStepDone: 'Mark {step} as done',
  },
  tour: {
    close: 'Close',
    finish: 'Finish',
    finishTour: 'Finish the tour',
    next: 'Next',
    previous: 'Back',
    skip: 'Skip',
    welcomeTitle: 'Welcome to Zenya 👋',
    welcomeBody: 'Would you like a quick tour showing where every page in the dashboard lives?',
    welcomeYes: 'Yes, show me around',
    welcomeNo: 'No thanks',
    dashboardBody: 'Your home base. Every site, every number, and your quick actions in one place.',
    sitesBody: 'Every site you have created. Edit, publish, or export from here.',
    analyticsBody:
      'See how many visitors arrived, where they came from, and what they engage with. The Visitors tab shows them in real time.',
    seoBody: 'Control how your site appears in Google results so more customers can find you.',
    domainsBody: 'Connect your own domain (free for a year on Pro) for a more professional identity.',
    bookingsBody: 'Take reservations straight from your site and manage them all here (a Pro feature).',
  },
  common: {
    language: 'Language',
    switchToArabic: 'Switch to Arabic',
    switchToEnglish: 'Switch to English',
  },
}

export const MESSAGES: Record<Locale, Messages> = { ar, en }
