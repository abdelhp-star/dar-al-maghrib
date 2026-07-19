import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useCartContext } from '@/contexts/cart';
import { useAuth } from '@/contexts/auth';
import { useCreateOrder, useGetMenuItems, OrderInputOrderType, OrderInputPaymentMethod } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Banknote, MapPin, Phone, User, FileText, CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useI18n } from '@/contexts/i18n';

/** Must match DELIVERY_FEE in api-server/src/routes/orders.ts */
const DELIVERY_FEE = 15;

export default function Checkout() {
  const { items, subtotal, clearCart, isLoading } = useCartContext();
  const { user, token } = useAuth();
  const { language } = useI18n();
  const [, setLocation] = useLocation();
  const createOrder = useCreateOrder();

  // Fetch menu-item details so we can display names & images in the summary
  const { data: menuItems } = useGetMenuItems();

  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryNotes: '',
  });

  // Sync name once user context resolves
  useEffect(() => {
    if (user?.name && !formData.customerName) {
      setFormData(f => ({ ...f, customerName: user.name }));
    }
  }, [user?.name]);

  // Must be logged in — the API requires authentication
  useEffect(() => {
    if (!isLoading && !token) {
      setLocation('/login');
    }
  }, [token, isLoading]);

  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getLocalized = (obj: any, field: string) => {
    if (!obj) return '';
    const key =
      language === 'en'
        ? field
        : `${field}${language.charAt(0).toUpperCase() + language.slice(1)}`;
    return obj[key] || obj[field] || '';
  };

  // For guest-cart items (menuItemId only) pull details from the menu-items list
  const cartItemsWithDetails = items.map((item: any) => {
    if (item.menuItem) return item;
    const found = menuItems?.find((m: any) => m.id === item.menuItemId) ?? null;
    return { ...item, menuItem: found };
  });

  const calculatedSubtotal =
    subtotal ||
    cartItemsWithDetails.reduce(
      (acc: number, item: any) => acc + (item.menuItem?.price ?? 0) * item.quantity,
      0,
    );

  const total = calculatedSubtotal + DELIVERY_FEE;

  // ── Order confirmed screen ─────────────────────────────────────────────────
  if (confirmedOrderId !== null) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-28 text-center max-w-lg">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h1 className="font-serif text-4xl font-bold mb-2 text-foreground">Order Confirmed!</h1>
          <p className="text-muted-foreground text-lg mb-4">
            Thank you{formData.customerName ? `, ${formData.customerName}` : ''}. Your Moroccan feast is on its way.
          </p>

          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-bold text-xl px-6 py-3 rounded-2xl mb-4 border border-primary/20">
            Order #{confirmedOrderId}
          </div>

          <p className="text-sm text-muted-foreground mb-10">
            Payment is due upon delivery —{' '}
            <span className="font-medium text-foreground">Cash on Delivery</span>.
            Our team will contact you at <span className="font-medium text-foreground">{formData.customerPhone}</span>.
          </p>

          <div className="space-y-3">
            <Button onClick={() => setLocation('/orders')} className="w-full" size="lg">
              Track My Order
            </Button>
            <Button variant="outline" onClick={() => setLocation('/menu')} className="w-full" size="lg">
              Continue Shopping
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Empty-cart guard ───────────────────────────────────────────────────────
  if (!isLoading && items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-3xl mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some Moroccan delights before placing an order.
          </p>
          <Link href="/menu">
            <Button size="lg" className="w-full">
              Explore the Menu
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        data: {
          orderType: OrderInputOrderType.delivery,
          paymentMethod: OrderInputPaymentMethod.cash_on_delivery,
          customerName: formData.customerName,
          customerEmail: user?.email ?? '',
          customerPhone: formData.customerPhone,
          deliveryAddress: formData.deliveryAddress,
          deliveryNotes: formData.deliveryNotes || undefined,
        },
      });
      await clearCart();
      setConfirmedOrderId(order.id);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        err?.message ??
        'Failed to place order. Please try again.';
      toast.error(msg);
    }
  };

  // ── Checkout form ──────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b border-border mb-8">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Link href="/cart" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            ← Back to Cart
          </Link>
          <h1 className="font-serif text-4xl font-bold text-primary">Checkout</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-10">

          {/* ── Left: form fields ── */}
          <div className="flex-1 space-y-6">

            {/* Contact */}
            <section className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <h2 className="text-xl font-bold">Contact Details</h2>

              <div className="space-y-2">
                <label htmlFor="customerName" className="text-sm font-medium">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                  <Input
                    id="customerName"
                    required
                    placeholder="Your full name"
                    className="pl-10"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="customerPhone" className="text-sm font-medium">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                  <Input
                    id="customerPhone"
                    required
                    type="tel"
                    placeholder="+212 6..."
                    className="pl-10"
                    value={formData.customerPhone}
                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* Delivery address */}
            <section className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <h2 className="text-xl font-bold">Delivery Address</h2>
              <div className="space-y-2">
                <label htmlFor="deliveryAddress" className="text-sm font-medium">
                  Full address <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-muted-foreground w-4 h-4 pointer-events-none" />
                  <textarea
                    id="deliveryAddress"
                    required
                    rows={3}
                    className="w-full p-3 pl-10 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    placeholder="Street, neighbourhood, city…"
                    value={formData.deliveryAddress}
                    onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* Notes */}
            <section className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <h2 className="text-xl font-bold">
                Order Notes{' '}
                <span className="text-muted-foreground font-normal text-base">(optional)</span>
              </h2>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-muted-foreground w-4 h-4 pointer-events-none" />
                <textarea
                  id="deliveryNotes"
                  rows={3}
                  className="w-full p-3 pl-10 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  placeholder="Allergies, special requests, gate code…"
                  value={formData.deliveryNotes}
                  onChange={e => setFormData({ ...formData, deliveryNotes: e.target.value })}
                />
              </div>
            </section>

            {/* Payment — COD only */}
            <section className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary bg-primary/5 cursor-default select-none">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-primary">Cash on Delivery</p>
                  <p className="text-sm text-muted-foreground">Pay in cash when your order arrives</p>
                </div>
                {/* Selected indicator */}
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                </div>
              </div>
            </section>

          </div>

          {/* ── Right: order summary ── */}
          <div className="w-full lg:w-[360px]">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-24 space-y-6">
              <h2 className="font-serif text-2xl font-bold">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 border-b border-border pb-4">
                {cartItemsWithDetails.map((item: any) => {
                  const name =
                    getLocalized(item.menuItem, 'name') || `Item #${item.menuItemId}`;
                  const lineTotal = Math.round(
                    (item.menuItem?.price ?? 0) * item.quantity,
                  );
                  return (
                    <div key={item.menuItemId} className="flex items-center gap-3 text-sm">
                      {item.menuItem?.imageUrl ? (
                        <img
                          src={item.menuItem.imageUrl}
                          alt={name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-tight truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                      </div>
                      <span className="font-semibold flex-shrink-0 tabular-nums">
                        {lineTotal} MAD
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium tabular-nums">{Math.round(calculatedSubtotal)} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium tabular-nums">{DELIVERY_FEE} MAD</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="font-bold text-base">Total</span>
                  <span className="font-bold text-2xl text-primary tabular-nums">
                    {Math.round(total)} MAD
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={createOrder.isPending || items.length === 0}
              >
                {createOrder.isPending ? (
                  'Placing Order…'
                ) : (
                  <span className="flex items-center gap-2">
                    Place Order <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By placing your order you agree to pay{' '}
                <strong>{Math.round(total)} MAD</strong> cash upon delivery.
              </p>
            </div>
          </div>

        </form>
      </div>
    </Layout>
  );
}
