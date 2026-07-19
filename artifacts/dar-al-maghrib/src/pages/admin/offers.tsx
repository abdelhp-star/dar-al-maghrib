import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useQuery } from '@tanstack/react-query';
import { useCreateOffer, useUpdateOffer, useDeleteOffer } from '@workspace/api-client-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface Offer {
  id: number;
  title: string;
  titleAr: string;
  titleFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  imageUrl: string | null;
  discountPercent: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const emptyForm = {
  title: '', titleAr: '', titleFr: '',
  description: '', descriptionAr: '', descriptionFr: '',
  imageUrl: '', discountPercent: '', active: true,
  expiresAt: '',
};
type FormState = typeof emptyForm;

export default function AdminOffers() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) setLocation('/');
  }, [user, token, setLocation]);

  // Fetch ALL offers (including inactive) for admin
  const { data: offers, refetch } = useQuery<Offer[]>({
    queryKey: ['admin-offers'],
    queryFn: async () => {
      const res = await fetch('/api/offers?all=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch offers');
      return res.json();
    },
    enabled: !!token && user?.role === 'admin',
  });

  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setEditId(offer.id);
    setForm({
      title: offer.title ?? '',
      titleAr: offer.titleAr ?? '',
      titleFr: offer.titleFr ?? '',
      description: offer.description ?? '',
      descriptionAr: offer.descriptionAr ?? '',
      descriptionFr: offer.descriptionFr ?? '',
      imageUrl: offer.imageUrl ?? '',
      discountPercent: String(offer.discountPercent ?? ''),
      active: offer.active ?? true,
      expiresAt: offer.expiresAt ? offer.expiresAt.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.discountPercent) {
      toast.error('Title and discount % are required');
      return;
    }
    setSaving(true);
    const payload: any = {
      title: form.title, titleAr: form.titleAr, titleFr: form.titleFr,
      description: form.description, descriptionAr: form.descriptionAr, descriptionFr: form.descriptionFr,
      imageUrl: form.imageUrl || null,
      discountPercent: parseInt(form.discountPercent as string),
      active: form.active,
      expiresAt: form.expiresAt || null,
    };
    try {
      if (editId !== null) {
        await updateOffer.mutateAsync({ id: editId, data: payload });
        toast.success('Offer updated');
      } else {
        await createOffer.mutateAsync({ data: payload });
        toast.success('Offer created');
      }
      setModalOpen(false);
      refetch();
    } catch {
      toast.error('Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteOffer.mutateAsync({ id: deleteId });
      toast.success('Offer deleted');
      refetch();
    } catch {
      toast.error('Failed to delete offer');
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const field = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });

  return (
    <AdminLayout title="Offers">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold">Offers & Promotions</h1>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Offer
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers?.map(offer => (
            <div key={offer.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 relative">
              {offer.imageUrl && (
                <img src={offer.imageUrl} alt={offer.title} className="w-full h-32 object-cover rounded-lg" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{offer.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{offer.description}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(offer)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(offer.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 mt-auto">
                <span className="font-bold text-lg text-primary">{offer.discountPercent}% OFF</span>
                <button
                  onClick={async () => {
                    try {
                      await updateOffer.mutateAsync({ id: offer.id, data: { active: !offer.active } as any });
                      refetch();
                    } catch { toast.error('Failed to update'); }
                  }}
                  className={`text-xs px-2 py-1 rounded font-bold transition-colors cursor-pointer
                    ${offer.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {offer.active ? 'Active' : 'Inactive'}
                </button>
              </div>
              {offer.expiresAt && (
                <p className="text-xs text-muted-foreground">Expires: {new Date(offer.expiresAt).toLocaleDateString()}</p>
              )}
            </div>
          ))}
          {!offers?.length && (
            <div className="col-span-full p-12 text-center text-muted-foreground">No offers yet.</div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId !== null ? 'Edit Offer' : 'Add Offer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Title (EN) *</label>
                <Input required {...field('title')} placeholder="Ramadan Special" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Title (AR)</label>
                <Input {...field('titleAr')} dir="rtl" placeholder="عرض خاص" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Title (FR)</label>
                <Input {...field('titleFr')} placeholder="Offre spéciale" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Description (EN)</label>
              <textarea className="w-full p-2 rounded-md border border-input bg-transparent text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={2} {...field('description')} placeholder="Description…" />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Description (AR)</label>
                <textarea className="w-full p-2 rounded-md border border-input bg-transparent text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={2} {...field('descriptionAr')} dir="rtl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Description (FR)</label>
                <textarea className="w-full p-2 rounded-md border border-input bg-transparent text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={2} {...field('descriptionFr')} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Discount % *</label>
                <Input type="number" min="1" max="100" required {...field('discountPercent')} placeholder="20" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Expires At</label>
                <Input type="date" {...field('expiresAt')} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Image URL</label>
              <Input {...field('imageUrl')} placeholder="https://…" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 accent-primary" />
              Active (visible to customers)
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editId !== null ? 'Save Changes' : 'Create Offer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={open => { if (!open) setDeleteId(null); }}
        title="Delete offer?"
        description="This promotion will be permanently removed."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </AdminLayout>
  );
}
