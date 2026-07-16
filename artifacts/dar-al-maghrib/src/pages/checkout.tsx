import { useState } from 'react';
import { useLocation } from 'wouter';
import { useCartContext } from '@/contexts/cart';
import { useAuth } from '@/contexts/auth';
import { useCreateOrder } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CreditCard, Banknote, MapPin, Phone, User, Mail, FileText, CheckCircle2, ShoppingBag } from 'lucide-react';
import { OrderInputOrderType, OrderInputPaymentMethod } from '@workspace/api-client-react';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCartContext();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const createOrder = useCreateOrder();

  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryNotes: '',
  });

  const [orderType, setOrderType] = useState<OrderInputOrderType>(OrderInputOrderType.delivery);
  const [paymentMethod, setPaymentMethod] = useState<OrderInputPaymentMethod>(OrderInputPaymentMethod.cash_on_delivery);
  const [success, setSuccess] = useState(false);

  const deliveryFee = orderType === OrderInputOrderType.delivery ? 5.00 : 0;
  // If guest, recalculate roughly since we don't have server subtotal accurately without a fetch here, but let's assume it's passed somehow or we just use 0 visually.
  // Realistically we'd rely on Cart logic.
  
  if (success) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center max-w-lg">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="font-serif text-4xl mb-4 text-foreground">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Thank you for your order. We are preparing your delicious Moroccan feast.
          </p>
          <div className="space-y-4">
            {user ? (
              <Button onClick={() => setLocation('/orders')} className="w-full" size="lg">Track Order</Button>
            ) : null}
            <Button variant="outline" onClick={() => setLocation('/')} className="w-full" size="lg">Return Home</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      await createOrder.mutateAsync({
        data: {
          ...formData,
          orderType,
          paymentMethod,
        }
      });
      clearCart();
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b border-border mb-8">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl font-bold text-primary">Checkout</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-8">
            
            {/* Order Type */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <h2 className="text-xl font-bold mb-4">Dining Method</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setOrderType(OrderInputOrderType.delivery)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${orderType === OrderInputOrderType.delivery ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  <MapPin className="w-6 h-6" />
                  <span className="font-bold">Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType(OrderInputOrderType.pickup)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${orderType === OrderInputOrderType.pickup ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  <ShoppingBag className="w-6 h-6" />
                  <span className="font-bold">Pickup</span>
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <h2 className="text-xl font-bold mb-2">Contact Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input required placeholder="John Doe" className="pl-10" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input required type="email" placeholder="john@example.com" className="pl-10" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input required placeholder="+212 5..." className="pl-10" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            {orderType === OrderInputOrderType.delivery && (
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
                <h2 className="text-xl font-bold mb-2">Delivery Address</h2>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Street Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                    <textarea 
                      required
                      className="w-full min-h-[100px] p-3 pl-10 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Enter your full address..."
                      value={formData.deliveryAddress}
                      onChange={e => setFormData({...formData, deliveryAddress: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <h2 className="text-xl font-bold mb-2">Order Notes (Optional)</h2>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                <textarea 
                  className="w-full min-h-[80px] p-3 pl-10 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Any allergies or special requests?"
                  value={formData.deliveryNotes}
                  onChange={e => setFormData({...formData, deliveryNotes: e.target.value})}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(OrderInputPaymentMethod.cash_on_delivery)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${paymentMethod === OrderInputPaymentMethod.cash_on_delivery ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="font-bold">Cash on Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod(OrderInputPaymentMethod.online)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${paymentMethod === OrderInputPaymentMethod.online ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="font-bold">Card Online</span>
                </button>
              </div>
            </div>

          </div>

          <div className="w-full lg:w-96">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-24">
              <h2 className="font-serif text-2xl font-bold mb-6">Review Order</h2>
              
              <div className="border-b border-border pb-4 mb-4 space-y-3">
                {items.map(item => (
                  <div key={item.menuItemId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.quantity}x Item #{item.menuItemId}</span>
                    {/* Realistically, names are populated if fetched. We'll leave minimal here */}
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${(subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold text-base">Total</span>
                  <span className="font-bold text-2xl text-primary">${((subtotal || 0) + deliveryFee).toFixed(2)}</span>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full text-lg" disabled={createOrder.isPending}>
                {createOrder.isPending ? 'Processing...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
