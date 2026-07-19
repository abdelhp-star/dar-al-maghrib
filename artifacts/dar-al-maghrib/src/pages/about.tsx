import { Layout } from '@/components/layout/Layout';
import { MapPin, Clock, Phone } from 'lucide-react';
import { useI18n } from '@/contexts/i18n';

export default function About() {
  const { t, dir } = useI18n();

  return (
    <Layout>
      {/* Hero */}
      <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/dishes/about-hero-medina.jpg')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/70"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white mb-4">{t('about.hero_title')}</h1>
          <div className="w-20 h-1 bg-accent mx-auto"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20" dir={dir}>
        {/* Legacy section */}
        <div className="flex flex-col md:flex-row gap-16 items-center mb-24">
          <div className="w-full md:w-1/2">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl -z-10 transform -rotate-3"></div>
              <img
                src="/dishes/about-legacy.jpg"
                alt="Traditional Moroccan dish"
                className="w-full h-[500px] object-cover rounded-2xl shadow-lg border border-border"
              />
            </div>
          </div>
          <div className="w-full md:w-1/2 space-y-6">
            <h2 className="font-serif text-4xl text-primary font-bold">{t('about.legacy_title')}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">{t('about.legacy_p1')}</p>
            <p className="text-lg text-muted-foreground leading-relaxed">{t('about.legacy_p2')}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-card p-8 rounded-2xl border border-border text-center shadow-sm">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold mb-4">{t('about.hours_title')}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>{t('about.hours_1')}</li>
              <li>{t('about.hours_2')}</li>
              <li>{t('about.hours_3')}</li>
            </ul>
          </div>

          <div className="bg-card p-8 rounded-2xl border border-border text-center shadow-sm">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold mb-4">{t('about.location_title')}</h3>
            <p className="text-muted-foreground">{t('about.address')}</p>
          </div>

          <div className="bg-card p-8 rounded-2xl border border-border text-center shadow-sm">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold mb-4">{t('about.contact_title')}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>+212 616-855779</li>
              <li>hello@daralmaghrib.com</li>
            </ul>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="w-full h-96 bg-muted rounded-3xl border border-border overflow-hidden relative shadow-inner">
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-serif text-2xl font-bold">{t('about.find_us')}</h3>
              <p className="text-muted-foreground">{t('about.find_us_desc')}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
