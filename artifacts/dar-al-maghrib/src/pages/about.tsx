import { Layout } from '@/components/layout/Layout';
import { MapPin, Clock, Phone, Navigation } from 'lucide-react';
import { useI18n } from '@/contexts/i18n';

const GMAPS_URL = 'https://maps.app.goo.gl/9F5eFoenw2R6Pwyf7';
const GMAPS_EMBED = 'https://maps.google.com/maps?q=32.2901579,-9.2321418&z=16&output=embed';

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
            <a
              href={GMAPS_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Open location in Google Maps"
              className="text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              {t('about.address')}
            </a>
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

        {/* Map Section */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              {t('about.find_us')}
            </h3>
            <a
              href={GMAPS_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Get directions to Dar Al Maghrib on Google Maps"
            >
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium shadow-sm">
                <Navigation className="w-4 h-4" />
                {t('about.get_directions')}
              </button>
            </a>
          </div>
          <div className="w-full h-96 rounded-3xl border border-border overflow-hidden shadow-inner">
            <iframe
              title="Dar Al Maghrib — New Medina, Safi, Morocco"
              aria-label="Google Maps showing Dar Al Maghrib restaurant in New Medina, Safi, Morocco"
              src={GMAPS_EMBED}
              width="100%"
              height="100%"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="border-0 w-full h-full"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
