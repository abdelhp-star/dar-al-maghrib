import { useGetOffers } from '@workspace/api-client-react';
import { useI18n } from '@/contexts/i18n';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function Offers() {
  const { t, language } = useI18n();
  const { data: offers, isLoading } = useGetOffers();

  const getLocalized = (obj: any, field: string) => {
    if (!obj) return '';
    const key = language === 'en' ? field : `${field}${language.charAt(0).toUpperCase() + language.slice(1)}`;
    return obj[key] || obj[field];
  };

  const activeOffers = offers?.filter(o => o.active) || [];

  return (
    <Layout>
      <div className="bg-muted/30 py-12 border-b border-border mb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">Current Offers</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Enjoy special discounts and exclusive deals on our authentic Moroccan cuisine.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map(i => (
              <div key={i} className="bg-card rounded-2xl h-64 border border-border animate-pulse p-6"></div>
            ))}
          </div>
        ) : activeOffers.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <h2 className="text-2xl font-bold mb-2">No active offers right now</h2>
            <p className="text-muted-foreground mb-6">Check back later for new promotions and deals.</p>
            <Link href="/menu">
              <Button>Explore Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeOffers.map((offer, idx) => (
              <motion.div 
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center border border-border shadow-md relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex-1 space-y-4">
                  <div className="inline-block bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                    {offer.discountPercent}% OFF
                  </div>
                  <h3 className="font-serif text-3xl font-bold">{getLocalized(offer, 'title')}</h3>
                  <p className="text-muted-foreground leading-relaxed">{getLocalized(offer, 'description')}</p>
                  <p className="text-sm font-medium text-foreground">
                    Valid until: {offer.expiresAt ? new Date(offer.expiresAt).toLocaleDateString() : 'No expiration'}
                  </p>
                  <Link href="/menu">
                    <Button size="lg" className="mt-4 rounded-full w-full sm:w-auto">Order Now</Button>
                  </Link>
                </div>
                {offer.imageUrl && (
                  <div className="w-full md:w-56 h-56 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-border/50">
                    <img src={offer.imageUrl} alt={getLocalized(offer, 'title')} className="w-full h-full object-cover" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
