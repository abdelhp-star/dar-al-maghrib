import { motion } from 'framer-motion';
import { madToAed } from '@/lib/price';
import { Link } from 'wouter';
import { useI18n } from '@/contexts/i18n';
import { useGetFeaturedItems, useGetOffers, useGetReviews } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Star, Clock, Flame, ArrowRight, MessageSquare } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

export default function Home() {
  const { t, language } = useI18n();
  const { data: featured } = useGetFeaturedItems();
  const { data: offers } = useGetOffers();
  const { data: reviews } = useGetReviews();

  const getLocalized = (obj: any, field: string) => {
    if (!obj) return '';
    const key = language === 'en' ? field : `${field}${language.charAt(0).toUpperCase() + language.slice(1)}`;
    return obj[key] || obj[field];
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80"></div>
        </div>
        
        <div className="container relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-wide">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-medium">
              {t('hero.subtitle')}
            </p>
            <div className="w-24 h-1 bg-accent mx-auto my-8"></div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/menu">
                <Button size="lg" className="text-lg px-8 py-6 rounded-none bg-primary hover:bg-primary/90 text-white w-full sm:w-auto">
                  {t('btn.order_now')}
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-none border-white text-white hover:bg-white/10 hover:text-white w-full sm:w-auto bg-transparent">
                  Our Story
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="moroccan-divider"></div>

      {/* Featured Items */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-primary mb-4">Today's Specials</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Discover the rich, complex flavors of authentic Moroccan cuisine, prepared with generations-old recipes and the finest spices.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured?.todaySpecials?.slice(0, 3).map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={item.imageUrl || `https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop`} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold shadow-md text-center">
                    <div>{Math.round(item.price)} MAD</div>
                    <div className="text-xs font-normal opacity-90">{madToAed(item.price)} AED</div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-2xl font-bold text-foreground">{getLocalized(item, 'name')}</h3>
                    <div className="flex items-center gap-1 text-accent">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium text-foreground">{item.avgRating?.toFixed(1) || '4.5'}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 mb-4 h-12">
                    {getLocalized(item, 'description')}
                  </p>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {item.preparationTime}m</span>
                      {item.spiceLevel !== 'none' && (
                        <span className="flex items-center gap-1 text-destructive"><Flame className="w-4 h-4" /></span>
                      )}
                    </div>
                    <Link href={`/menu/${item.id}`}>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                        Details <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/menu">
              <Button variant="outline" size="lg" className="rounded-full px-8 border-primary text-primary hover:bg-primary hover:text-white">
                View Full Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Offers Section */}
      {offers && offers.filter(o => o.active).length > 0 && (
        <section className="py-20 bg-muted/50 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="font-serif text-4xl text-primary mb-2">Special Offers</h2>
                <p className="text-muted-foreground">Limited time deals on your favorite dishes</p>
              </div>
              <Link href="/offers" className="hidden sm:flex text-primary hover:underline items-center gap-2 font-medium">
                See all offers <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offers.filter(o => o.active).slice(0, 2).map((offer, idx) => (
                <motion.div 
                  key={offer.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-card rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-center border border-border shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full -z-10"></div>
                  <div className="flex-1 space-y-4">
                    <div className="inline-block bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-bold">
                      {offer.discountPercent}% OFF
                    </div>
                    <h3 className="font-serif text-2xl font-bold">{getLocalized(offer, 'title')}</h3>
                    <p className="text-muted-foreground">{getLocalized(offer, 'description')}</p>
                    <Link href="/menu">
                      <Button className="mt-2">Claim Offer</Button>
                    </Link>
                  </div>
                  {offer.imageUrl && (
                    <div className="w-full sm:w-48 h-48 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={offer.imageUrl} alt={getLocalized(offer, 'title')} className="w-full h-full object-cover" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews/Testimonials */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-primary mb-4">Guest Experiences</h2>
            <div className="w-16 h-1 bg-accent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews?.slice(0, 3).map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-muted p-8 rounded-2xl relative"
              >
                <MessageSquare className="absolute top-6 right-6 w-8 h-8 text-border opacity-50" />
                <div className="flex gap-1 text-accent mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'fill-current' : 'text-muted-foreground opacity-30'}`} />
                  ))}
                </div>
                <p className="text-foreground italic mb-6">"{review.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                    {review.userName?.charAt(0).toUpperCase() || 'G'}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{review.userName || 'Guest'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-4xl mb-6">Experience the Magic of Morocco</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">Book a table for an unforgettable evening, or order online to bring the feast home.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/menu">
              <Button size="lg" variant="secondary" className="px-8 py-6 text-lg rounded-full">
                Order Delivery
              </Button>
            </Link>
            <a href="https://wa.me/212512345678" target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-full border-white text-white hover:bg-white hover:text-primary bg-transparent">
                WhatsApp Us
              </Button>
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
