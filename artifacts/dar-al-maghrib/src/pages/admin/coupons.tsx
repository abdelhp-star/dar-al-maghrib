import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useGetCoupons, useDeleteCoupon } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCoupons() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) setLocation('/');
  }, [user, token, setLocation]);

  const { data: coupons, refetch } = useGetCoupons({
    query: { enabled: !!token && user?.role === 'admin' }
  });

  const deleteCoupon = useDeleteCoupon();

  const handleDelete = async (id: number) => {
    if (confirm('Delete this coupon?')) {
      try {
        await deleteCoupon.mutateAsync({ id });
        toast.success('Coupon deleted');
        refetch();
      } catch (err) {
        toast.error('Failed to delete coupon');
      }
    }
  };

  return (
    <Layout>
      <div className="bg-card border-b border-border py-4 mb-8">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="font-serif text-2xl font-bold">Coupons</h1>
          <div className="flex gap-4 items-center">
            <Link href="/admin" className="text-primary hover:underline text-sm font-medium">Back to Admin</Link>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Coupon
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 font-bold text-sm text-muted-foreground">Code</th>
                <th className="p-4 font-bold text-sm text-muted-foreground">Discount</th>
                <th className="p-4 font-bold text-sm text-muted-foreground">Min Order</th>
                <th className="p-4 font-bold text-sm text-muted-foreground">Uses</th>
                <th className="p-4 font-bold text-sm text-muted-foreground">Status</th>
                <th className="p-4 font-bold text-sm text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons?.map(coupon => (
                <tr key={coupon.id} className="border-b border-border hover:bg-muted/30">
                  <td className="p-4 font-mono font-bold">{coupon.code}</td>
                  <td className="p-4">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                  </td>
                  <td className="p-4 text-sm">{coupon.minOrderAmount ? `$${coupon.minOrderAmount}` : 'None'}</td>
                  <td className="p-4 text-sm">{coupon.usedCount} / {coupon.maxUses || '∞'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {coupon.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(coupon.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
