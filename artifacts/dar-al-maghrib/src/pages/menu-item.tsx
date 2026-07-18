import { useEffect, useState } from 'react';
import { madToAed } from '@/lib/price';
import { useRoute, useLocation } from 'wouter';
import { useGetMenuItem, useGetReviews, useAddToCart } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/i18n';
import { useCartContext } from '@/contexts/cart';
import { Star, Clock, Flame, ChevronLeft, Minus, Plus, ShoppingBag, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function MenuItemDetail() {
  const [, params] = useRoute('/menu/:id');
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { language } = useI18n();
  const { addToCart } = useCartContext();
  
  const [quantity, setQuantity] = useState(1);

  const { data: item, isLoading, isError } = useGetMenuItem(id, {
    query: { enabled: !!id }
  });

  const { data: reviews } = useGetReviews({ menuItemId: id }, {
    query: { enabled: !!id }
  });

  if (isError) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Item not found</h2>
          <Button onClick={() => setLocation('/menu')}>Back to Menu</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading || !item) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="animate-pulse flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 h-96 bg-muted rounded-2xl"></div>
            <div className="w-full md:w-1/2 space-y-4">
              <div className="h-10 bg-muted w-3/4 rounded"></div>
              <div className="h-6 bg-muted w-1/4 rounded"></div>
              <div className="h-24 bg-muted w-full rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const getLocalized = (obj: any, field: string) => {
    if (!obj) return '';
    const key = language === 'en' ? field : `${field}${language.charAt(0).toUpperCase() + language.slice(1)}`;
    return obj[key] || obj[field];
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(item.id, quantity);
      toast.success(`${quantity} x ${getLocalized(item, 'name')} added to cart`);
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <Layout>
      <div className="bg-muted/30 border-b border-border py-4">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="text-muted-foreground -ml-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-10 lg:gap-16">
          {/* Image */}
          <div className="w-full md:w-1/2">
            <div className="rounded-3xl overflow-hidden border-2 border-border shadow-lg sticky top-24">
              <img 
                src={item.imageUrl || `https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop`} 
                alt={item.name}
                className="w-full aspect-square object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="mb-2">
              <span className="text-sm font-bold text-accent tracking-wider uppercase">{item.category?.name || 'Category'}</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
              {getLocalized(item, 'name')}
            </h1>
            
            <div className="flex items-center gap-6 mb-6">
              <div className="leading-tight">
                <div className="text-3xl font-bold text-foreground">{Math.round(item.price)} MAD</div>
                <div className="text-sm text-muted-foreground">{madToAed(item.price)} AED</div>
              </div>
              {item.avgRating && (
                <div className="flex items-center gap-1 bg-accent/10 px-3 py-1 rounded-full text-accent font-bold">
                  <Star className="w-4 h-4 fill-current" /> {item.avgRating.toFixed(1)} ({item.reviewCount || 0})
                </div>
              )}
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {getLocalized(item, 'description')}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3">
                <Clock className="text-muted-foreground w-5 h-5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Prep Time</p>
                  <p className="font-medium">{item.preparationTime} mins</p>
                </div>
              </div>
              <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3">
                <Flame className="text-muted-foreground w-5 h-5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Spice Level</p>
                  <p className="font-medium capitalize">{item.spiceLevel.replace('_', ' ')}</p>
                </div>
              </div>
              {item.calories && (
                <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3 col-span-2 sm:col-span-1">
                  <Info className="text-muted-foreground w-5 h-5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Calories</p>
                    <p className="font-medium">{item.calories} kcal</p>
                  </div>
                </div>
              )}
            </div>

            {item.ingredients && (
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-2">Ingredients</h3>
                <p className="text-muted-foreground">{item.ingredients}</p>
              </div>
            )}

            <div className="mt-auto border-t border-border pt-8">
              <div className="flex items-center gap-6">
                <div className="flex items-center border border-input rounded-full bg-card">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button 
                  size="lg" 
                  className="flex-1 rounded-full text-lg h-12"
                  disabled={!item.available}
                  onClick={handleAddToCart}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  {item.available ? `Add to Cart - ${Math.round(item.price * quantity)} MAD` : 'Sold Out'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews && reviews.length > 0 && (
          <div className="mt-20 pt-10 border-t border-border">
            <h2 className="font-serif text-3xl mb-8">Customer Reviews</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map(review => (
                <div key={review.id} className="bg-card p-6 rounded-2xl border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {review.userName?.charAt(0).toUpperCase() || 'G'}
                      </div>
                      <span className="font-bold">{review.userName || 'Guest'}</span>
                    </div>
                    <div className="flex text-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-muted-foreground opacity-30'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
