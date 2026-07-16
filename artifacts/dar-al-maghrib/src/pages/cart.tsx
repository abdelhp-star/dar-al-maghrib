import { Layout } from '@/components/layout/Layout';
import { useCartContext } from '@/contexts/cart';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useI18n } from '@/contexts/i18n';
import { useGetMenuItems } from '@workspace/api-client-react';

export default function Cart() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCartContext();
  const { language } = useI18n();
  const [, setLocation] = useLocation();

  // If items only have menuItemId (guest cart), we need the details. 
  // For authenticated cart, `menuItem` is populated. 
  // To handle guest cart properly without complex hydration, we'll fetch all items 
  // (or specific ones) to display. For simplicity, just fetch all menu items.
  const { data: menuItems } = useGetMenuItems();

  const getLocalized = (obj: any, field: string) => {
    if (!obj) return '';
    const key = language === 'en' ? field : `${field}${language.charAt(0).toUpperCase() + language.slice(1)}`;
    return obj[key] || obj[field];
  };

  const cartItemsWithDetails = items.map(item => {
    if (item.menuItem) return item; // auth cart
    const found = menuItems?.find(m => m.id === item.menuItemId);
    return { ...item, menuItem: found || null };
  });

  const calculatedSubtotal = subtotal || cartItemsWithDetails.reduce((acc, item) => {
    return acc + ((item.menuItem?.price || 0) * item.quantity);
  }, 0);

  const deliveryFee = 5.00;
  const total = calculatedSubtotal + (calculatedSubtotal > 0 ? deliveryFee : 0);

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-3xl mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Looks like you haven't added any Moroccan delights to your cart yet.</p>
          <Link href="/menu">
            <Button size="lg" className="w-full">Explore the Menu</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b border-border mb-8">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl font-bold text-primary">Your Cart</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <h2 className="text-lg font-bold">{items.length} Items</h2>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={clearCart}>
                Clear Cart
              </Button>
            </div>

            <div className="space-y-6">
              {cartItemsWithDetails.map((item) => (
                <div key={item.menuItemId} className="flex gap-4 items-center bg-card p-4 rounded-xl border border-border shadow-sm">
                  {item.menuItem?.imageUrl && (
                    <img src={item.menuItem.imageUrl} alt={item.menuItem.name} className="w-24 h-24 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{getLocalized(item.menuItem, 'name')}</h3>
                    <p className="text-primary font-bold mt-1">${item.menuItem?.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-input rounded-full bg-background">
                      <button 
                        onClick={() => item.quantity > 1 ? updateQuantity(item.menuItemId, item.quantity - 1) : removeItem(item.menuItemId)}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.menuItemId)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="w-full lg:w-96">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-24">
              <h2 className="font-serif text-2xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${calculatedSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold text-base">Total</span>
                  <span className="font-bold text-2xl text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button size="lg" className="w-full text-lg" onClick={() => setLocation('/checkout')}>
                Proceed to Checkout <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
