import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useAdminGetOrders, useAdminUpdateOrderStatus } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { useLocation, Link } from 'wouter';
import { OrderStatusUpdateStatus } from '@workspace/api-client-react';
import { toast } from 'sonner';

export default function AdminOrders() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) setLocation('/');
  }, [user, token, setLocation]);

  const { data: orders, refetch } = useAdminGetOrders(filter ? { status: filter } : {}, {
    query: { enabled: !!token && user?.role === 'admin' }
  });

  const updateStatus = useAdminUpdateOrderStatus();

  const handleStatusChange = async (id: number, status: OrderStatusUpdateStatus) => {
    try {
      await updateStatus.mutateAsync({ id, data: { status } });
      toast.success(`Order #${id} marked as ${status.replace('_', ' ')}`);
      refetch();
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const statusOptions = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'] as OrderStatusUpdateStatus[];

  return (
    <Layout>
      <div className="bg-card border-b border-border py-4 mb-8">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="font-serif text-2xl font-bold">Order Management</h1>
          <Link href="/admin" className="text-primary hover:underline text-sm font-medium">Back to Admin</Link>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button 
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${filter === '' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}
          >
            All Orders
          </button>
          {statusOptions.map(status => (
            <button 
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap capitalize ${filter === status ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-4 font-bold text-sm text-muted-foreground">Order ID</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Date</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Customer</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Total</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Payment</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders?.map(order => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-4 font-medium">#{order.id}</td>
                    <td className="p-4 text-sm">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      <p className="font-medium text-sm">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                    </td>
                    <td className="p-4 font-bold text-primary">${order.total.toFixed(2)}</td>
                    <td className="p-4 text-sm capitalize">{order.paymentMethod.replace('_', ' ')}</td>
                    <td className="p-4 text-center">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatusUpdateStatus)}
                        className="bg-transparent border border-input rounded p-1 text-sm capitalize font-medium cursor-pointer focus:ring-1 focus:ring-ring"
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No orders found.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
