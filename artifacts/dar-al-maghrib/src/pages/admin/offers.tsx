import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useGetOffers, useDeleteOffer } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminOffers() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) setLocation('/');
  }, [user, token, setLocation]);

  const { data: offers, refetch } = useGetOffers({
    query: { enabled: !!token && user?.role === 'admin' }
  });

  const deleteOffer = useDeleteOffer();

  const handleDelete = async (id: number) => {
    if (confirm('Delete this offer?')) {
      try {
        await deleteOffer.mutateAsync({ id });
        toast.success('Offer deleted');
        refetch();
      } catch (err) {
        toast.error('Failed to delete offer');
      }
    }
  };

  return (
    <Layout>
      <div className="bg-card border-b border-border py-4 mb-8">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="font-serif text-2xl font-bold">Offers & Promotions</h1>
          <div className="flex gap-4 items-center">
            <Link href="/admin" className="text-primary hover:underline text-sm font-medium">Back to Admin</Link>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Offer
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers?.map(offer => (
            <div key={offer.id} className="bg-card border border-border rounded-xl p-6 relative">
              <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(offer.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-bold text-xl mb-2">{offer.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{offer.description}</p>
              <div className="flex justify-between items-center mt-auto border-t border-border pt-4">
                <span className="font-bold text-accent">{offer.discountPercent}% OFF</span>
                <span className={`text-xs px-2 py-1 rounded font-bold ${offer.active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  {offer.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
