import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth';
import { useI18n } from '@/contexts/i18n';
import { useCartContext } from '@/contexts/cart';
import { Button } from '@/components/ui/button';
import { ShoppingBag, User, LogOut, Menu as MenuIcon, X, Globe, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from 'next-themes';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const { itemCount } = useCartContext();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  const toggleLang = () => {
    setLanguage(language === 'en' ? 'fr' : language === 'fr' ? 'ar' : 'en');
  };

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/menu', label: t('nav.menu') },
    { href: '/offers', label: t('nav.offers') },
    { href: '/about', label: t('nav.about') },
    { href: '/contact', label: t('nav.contact') },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-primary tracking-wide">
            {t('hero.title')}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`text-sm font-medium transition-colors hover:text-primary ${location === link.href ? 'text-primary' : 'text-muted-foreground'}`}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleLang}>
            <Globe className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Switch Language</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <Link href="/cart" className="relative group">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  {t('nav.dashboard')}
                </Button>
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="secondary" size="sm">
                    {t('nav.admin')}
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm">{t('nav.login')}</Button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <Link href="/cart" className="relative">
            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
          <button onClick={() => setIsOpen(!isOpen)} className="text-foreground">
            {isOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b shadow-lg py-4 px-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-lg font-medium text-foreground py-2 border-b border-border" onClick={() => setIsOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div className="flex gap-4 pt-2">
            <Button variant="outline" className="flex-1" onClick={toggleLang}>
              <Globe className="h-4 w-4 mr-2" />
              {language.toUpperCase()}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
          </div>
          {user ? (
            <div className="flex flex-col gap-2 mt-4">
              <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" /> {t('nav.dashboard')}
                </Button>
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" onClick={() => setIsOpen(false)}>
                  <Button variant="secondary" className="w-full justify-start">
                    {t('nav.admin')}
                  </Button>
                </Link>
              )}
              <Button variant="destructive" className="w-full justify-start" onClick={() => { logout(); setIsOpen(false); }}>
                <LogOut className="h-4 w-4 mr-2" /> {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <Link href="/login" onClick={() => setIsOpen(false)} className="mt-4">
              <Button className="w-full">{t('nav.login')}</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
