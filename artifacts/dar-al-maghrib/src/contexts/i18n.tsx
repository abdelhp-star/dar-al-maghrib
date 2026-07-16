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
