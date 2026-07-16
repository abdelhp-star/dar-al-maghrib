import { useEffect } from 'react';
import { useGetOrders } from '@workspace/api-client-react';
import { useAuth } from '@/contexts/auth';
import { Layout } from '@/components/layout/Layout';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Package, Clock, ChevronRight } from 'lucide-react';

export default function Orders() {
  const { token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) setLocation('/login');
  }, [token, setLocation]);

  const { data: orders, isLoading } = useGetOrders({ query: { enabled: !!token } });

  if (!token) return null;

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">My Orders</h1>
          <p className="text-muted-foreground">View and track your previous orders</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-card rounded-xl animate-pulse border border-border"></div>
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border max-w-2xl mx-auto">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Looks like you haven't placed any orders.</p>
            <Link href="/menu">
              <Button size="lg">Explore Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl border border-border hover:border-primary transition-colors bg-card group-hover:shadow-md gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-bold text-xl">Order #{order.id}</p>
                      <span className="inline-block px-3 py-1 bg-muted text-xs font-bold rounded-full capitalize">
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">{order.items.length} items</p>
                      <p className="font-bold text-2xl text-primary">${order.total.toFixed(2)}</p>
                    </div>
                    <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors w-6 h-6" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
