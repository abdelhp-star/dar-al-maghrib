import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useGetCoupons, useDeleteCoupon } from '@workspace/api-client-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCoupons() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) setLocation('/');
  }, [user, token, setLocation]);

  const { data: coupons, refetch } = useGetCoupons({
    query: { enabled: !!token && user?.role === 'admin' }
  });

  const deleteCoupon = useDeleteCoupon();

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteCoupon.mutateAsync({ id: deleteId });
      toast.success('Coupon deleted');
      refetch();
    } catch {
      toast.error('Failed to delete coupon');
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <AdminLayout title="Coupons">
      <div className="p-6 space-y-4">
        <h1 className="font-serif text-2xl font-bold">Coupons</h1>

        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
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
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue} MAD`}
                    </td>
                    <td className="p-4 text-sm">{coupon.minOrderAmount ? `${coupon.minOrderAmount} MAD` : '—'}</td>
                    <td className="p-4 text-sm">{coupon.usedCount} / {coupon.maxUses || '∞'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {coupon.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(coupon.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!coupons?.length && (
            <div className="p-8 text-center text-muted-foreground">No coupons yet.</div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={open => { if (!open) setDeleteId(null); }}
        title="Delete coupon?"
        description="This coupon will be permanently removed."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </AdminLayout>
  );
}
