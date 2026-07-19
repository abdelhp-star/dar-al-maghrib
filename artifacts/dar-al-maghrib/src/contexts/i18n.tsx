import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'fr' | 'ar';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.menu': 'Menu',
    'nav.offers': 'Offers',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.dashboard': 'Dashboard',
    'nav.admin': 'Admin',
    'nav.login': 'Log In',
    'nav.logout': 'Log Out',
    'hero.title': 'Dar Al Maghrib',
    'hero.subtitle': 'A Taste of Moroccan Royalty',
    'btn.order_now': 'Order Now',
    'btn.view_menu': 'View Menu',
    'about.hero_title': 'Our Story',
    'about.legacy_title': 'A Legacy of Flavor',
    'about.legacy_p1': 'Founded in 1998, Dar Al Maghrib began as a humble family kitchen, sharing the rich, complex flavors of Marrakech with our local community. Over two decades later, we continue to honor the timeless recipes passed down through generations.',
    'about.legacy_p2': 'Every dish we serve is a testament to the Moroccan culinary art—slow-cooked tagines, hand-rolled couscous, and signature spice blends roasted and ground in-house. We believe that true luxury lies in authenticity and patience.',
    'about.hours_title': 'Opening Hours',
    'about.hours_1': 'Mon – Thu: 11:00 AM – 10:00 PM',
    'about.hours_2': 'Fri – Sat: 11:00 AM – 11:00 PM',
    'about.hours_3': 'Sunday: 12:00 PM – 9:00 PM',
    'about.location_title': 'Location',
    'about.contact_title': 'Contact',
    'about.find_us': 'Find Us Here',
    'about.find_us_desc': 'Interactive map will load here',
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.menu': 'Menu',
    'nav.offers': 'Offres',
    'nav.about': 'À Propos',
    'nav.contact': 'Contact',
    'nav.dashboard': 'Tableau de bord',
    'nav.admin': 'Admin',
    'nav.login': 'Connexion',
    'nav.logout': 'Déconnexion',
    'hero.title': 'Dar Al Maghrib',
    'hero.subtitle': 'Un Goût de la Royauté Marocaine',
    'btn.order_now': 'Commander',
    'btn.view_menu': 'Voir le Menu',
    'about.hero_title': 'Notre Histoire',
    'about.legacy_title': 'Un Héritage de Saveurs',
    'about.legacy_p1': "Fondé en 1998, Dar Al Maghrib a débuté comme une modeste cuisine familiale, partageant les saveurs riches et complexes de Marrakech avec notre communauté locale. Plus de deux décennies plus tard, nous continuons d'honorer les recettes intemporelles transmises de génération en génération.",
    'about.legacy_p2': "Chaque plat que nous servons est un témoignage de l'art culinaire marocain — tajines mijotés lentement, couscous roulé à la main et mélanges d'épices emblématiques torréfiés et moulus sur place. Nous croyons que le vrai luxe réside dans l'authenticité et la patience.",
    'about.hours_title': "Horaires d'ouverture",
    'about.hours_1': 'Lun – Jeu : 11h00 – 22h00',
    'about.hours_2': 'Ven – Sam : 11h00 – 23h00',
    'about.hours_3': 'Dimanche : 12h00 – 21h00',
    'about.location_title': 'Emplacement',
    'about.contact_title': 'Contact',
    'about.find_us': 'Retrouvez-nous ici',
    'about.find_us_desc': 'La carte interactive se chargera ici',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.menu': 'القائمة',
    'nav.offers': 'العروض',
    'nav.about': 'معلومات عنا',
    'nav.contact': 'اتصل بنا',
    'nav.dashboard': 'لوحة القيادة',
    'nav.admin': 'إدارة',
    'nav.login': 'تسجيل الدخول',
    'nav.logout': 'تسجيل خروج',
    'hero.title': 'دار المغرب',
    'hero.subtitle': 'طعم الأصالة المغربية',
    'btn.order_now': 'اطلب الآن',
    'btn.view_menu': 'عرض القائمة',
    'about.hero_title': 'قصتنا',
    'about.legacy_title': 'إرث من النكهات',
    'about.legacy_p1': 'تأسست دار المغرب عام 1998 كمطبخ عائلي متواضع، يشارك النكهات الغنية والمعقدة لمراكش مع مجتمعنا المحلي. وبعد أكثر من عقدين، نواصل تكريم الوصفات الخالدة المتوارثة عبر الأجيال.',
    'about.legacy_p2': 'كل طبق نقدمه هو شهادة على فن الطهي المغربي — الطواجن المطبوخة على نار هادئة، الكسكس المحضَّر يدوياً، وخلطات التوابل المميزة المحمصة والمطحونة في المطبخ. نؤمن بأن الرفاهية الحقيقية تكمن في الأصالة والصبر.',
    'about.hours_title': 'ساعات العمل',
    'about.hours_1': 'الاثنين – الخميس: 11:00 ص – 10:00 م',
    'about.hours_2': 'الجمعة – السبت: 11:00 ص – 11:00 م',
    'about.hours_3': 'الأحد: 12:00 م – 9:00 م',
    'about.location_title': 'الموقع',
    'about.contact_title': 'تواصل معنا',
    'about.find_us': 'اعثر علينا هنا',
    'about.find_us_desc': 'سيتم تحميل الخريطة التفاعلية هنا',
  }
};

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
  dir: 'ltr',
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved || 'en';
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
