import { useEffect } from 'react';
import { useRoute } from 'wouter';
import { useGetOrder } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Package, ChefHat, Truck, Home, CheckCircle } from 'lucide-react';

export default function OrderTracking() {
  const [, params] = useRoute('/orders/:id');
  const id = Number(params?.id);

  const { data: order, isLoading } = useGetOrder(id, {
    query: {
      enabled: !!id,
      refetchInterval: 10000 // Poll every 10s for status updates
    }
  });

  const statuses = [
    { id: 'pending', label: 'Received', icon: Package },
    { id: 'accepted', label: 'Confirmed', icon: CheckCircle },
    { id: 'preparing', label: 'Preparing', icon: ChefHat },
    { id: 'out_for_delivery', label: 'On the Way', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: Home },
  ];

  if (isLoading) return <Layout><div className="p-20 text-center">Loading...</div></Layout>;
  if (!order) return <Layout><div className="p-20 text-center">Order not found</div></Layout>;

  // Cancelled handles differently
  if (order.status === 'cancelled') {
    return (
      <Layout>
        <div className="container mx-auto py-20 text-center">
          <h1 className="text-3xl text-destructive font-bold mb-4">Order Cancelled</h1>
          <p>This order has been cancelled.</p>
        </div>
      </Layout>
    );
  }

  const currentIndex = statuses.findIndex(s => s.id === order.status);

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">Track Order #{order.id}</h1>
          <p className="text-muted-foreground">Estimated delivery: {order.estimatedDeliveryTime || 45} mins</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Timeline */}
        <div className="relative mb-20 px-4 sm:px-10">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 -z-10 rounded-full hidden sm:block"></div>
          
          {/* Progress Bar Fill */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 -z-10 rounded-full hidden sm:block transition-all duration-1000"
            style={{ width: `${Math.max(0, (currentIndex / (statuses.length - 1)) * 100)}%` }}
          ></div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-0">
            {statuses.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              
              return (
                <div key={step.id} className="flex flex-col items-center relative">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-4 bg-background transition-colors duration-500
                      ${isActive ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}
                      ${isCurrent ? 'shadow-[0_0_20px_rgba(var(--primary),0.4)] scale-110' : ''}
                    `}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <p className={`mt-3 font-bold text-sm sm:text-base whitespace-nowrap sm:absolute sm:-bottom-8 transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card p-6 rounded-2xl border border-border">
            <h2 className="font-serif text-2xl font-bold mb-4">Order Items</h2>
            <div className="space-y-4 mb-6">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <div className="flex gap-3">
                    <span className="font-bold text-muted-foreground">{item.quantity}x</span>
                    <span>{item.menuItemName}</span>
                  </div>
                  <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Delivery</span>
                <span>${(order.deliveryFee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-border">
              <h2 className="font-serif text-xl font-bold mb-4">Delivery Details</h2>
              <p className="text-sm text-muted-foreground mb-1">Address</p>
              <p className="font-medium mb-4">{order.deliveryAddress || 'N/A'}</p>
              
              <p className="text-sm text-muted-foreground mb-1">Customer</p>
              <p className="font-medium">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
            </div>
            
            <div className="bg-card p-6 rounded-2xl border border-border">
              <h2 className="font-serif text-xl font-bold mb-4">Payment</h2>
              <div className="flex justify-between items-center">
                <span className="capitalize text-muted-foreground">{order.paymentMethod.replace('_', ' ')}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
