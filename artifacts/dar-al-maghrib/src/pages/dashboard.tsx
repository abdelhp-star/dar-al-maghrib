import { useGetOrders, useGetMe, useGetFavorites } from '@workspace/api-client-react';
import { useAuth } from '@/contexts/auth';
import { Layout } from '@/components/layout/Layout';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Package, Heart, User, Clock, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

export default function Dashboard() {
  const { token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) setLocation('/login');
  }, [token, setLocation]);

  const { data: user } = useGetMe({ query: { enabled: !!token } });
  const { data: orders } = useGetOrders({ query: { enabled: !!token } });
  const { data: favorites } = useGetFavorites({ query: { enabled: !!token } });

  if (!token) return null;

  return (
    <Layout>
      <div className="bg-primary text-primary-foreground pt-12 pb-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-primary-foreground/20 rounded-full flex items-center justify-center text-4xl font-serif">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="font-serif text-4xl mb-1">{user?.name}</h1>
              <p className="text-primary-foreground/80">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 mb-20">
        <div className="grid md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2 space-y-6">
            {/* Orders */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                  <Package className="text-primary" /> Recent Orders
                </h2>
              </div>
              
              {!orders || orders.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-xl">
                  No orders yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <Link key={order.id} href={`/orders/${order.id}`} className="block group">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary transition-colors bg-background group-hover:shadow-md">
                        <div>
                          <p className="font-bold text-lg mb-1">Order #{order.id}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4" /> {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-primary">${order.total.toFixed(2)}</p>
                            <span className="inline-block px-2 py-1 bg-muted text-xs rounded-full capitalize">{order.status.replace('_', ' ')}</span>
                          </div>
                          <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Favorites Summary */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-xl font-serif font-bold flex items-center gap-2 mb-4">
                <Heart className="text-accent" /> Saved Favorites
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                You have {favorites?.length || 0} items saved to your favorites.
              </p>
              <Link href="/menu">
                <Button variant="outline" className="w-full">Explore Menu</Button>
              </Link>
            </div>

            {/* Profile Info */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-xl font-serif font-bold flex items-center gap-2 mb-4">
                <User className="text-primary" /> Profile Info
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{user?.name}</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{user?.phone || 'Not set'}</span>
                </li>
                <li className="flex justify-between pb-2">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium truncate max-w-[150px]">{user?.address || 'Not set'}</span>
                </li>
              </ul>
              <Button className="w-full mt-4" variant="secondary">Edit Profile</Button>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
