import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useQuery } from '@tanstack/react-query';
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@workspace/api-client-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
  nameAr: string;
  nameFr: string;
  icon: string;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  itemCount?: number;
}

const emptyForm = {
  name: '', nameAr: '', nameFr: '',
  icon: '', sortOrder: '0', active: true,
};
type FormState = typeof emptyForm;

export default function AdminCategories() {
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

  // Fetch ALL categories including inactive
  const { data: categories, refetch } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories?all=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    enabled: !!token && user?.role === 'admin',
  });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setForm({
      name: cat.name ?? '',
      nameAr: cat.nameAr ?? '',
      nameFr: cat.nameFr ?? '',
      icon: cat.icon ?? '',
      sortOrder: String(cat.sortOrder ?? 0),
      active: cat.active ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.nameAr || !form.nameFr || !form.icon) {
      toast.error('Name (EN/AR/FR) and icon are required');
      return;
    }
    setSaving(true);
    const payload: any = {
      name: form.name, nameAr: form.nameAr, nameFr: form.nameFr,
      icon: form.icon,
      sortOrder: parseInt(form.sortOrder) || 0,
      active: form.active,
    };
    try {
      if (editId !== null) {
        await updateCategory.mutateAsync({ id: editId, data: payload });
        toast.success('Category updated');
      } else {
        await createCategory.mutateAsync({ data: payload });
        toast.success('Category created');
      }
      setModalOpen(false);
      refetch();
    } catch {
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteCategory.mutateAsync({ id: deleteId });
      toast.success('Category deleted');
      refetch();
    } catch {
      toast.error('Failed to delete category');
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const field = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });

  return (
    <AdminLayout title="Categories">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold">Categories</h1>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-4 font-bold text-sm text-muted-foreground w-12">Icon</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Name</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Name (AR)</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Name (FR)</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground text-center">Order</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Status</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories?.map(cat => (
                  <tr key={cat.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-4 text-2xl text-center">{cat.icon}</td>
                    <td className="p-4 font-semibold">{cat.name}</td>
                    <td className="p-4 text-sm" dir="rtl">{cat.nameAr}</td>
                    <td className="p-4 text-sm">{cat.nameFr}</td>
                    <td className="p-4 text-sm text-center text-muted-foreground">{cat.sortOrder}</td>
                    <td className="p-4">
                      <button
                        onClick={async () => {
                          try {
                            await updateCategory.mutateAsync({ id: cat.id, data: { active: !cat.active } as any });
                            refetch();
                          } catch { toast.error('Failed to update'); }
                        }}
                        className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer
                          ${cat.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {cat.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => openEdit(cat)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(cat.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!categories?.length && (
            <div className="p-8 text-center text-muted-foreground">No categories yet.</div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId !== null ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium">Name (English) *</label>
                <Input required {...field('name')} placeholder="Soups" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Name (Arabic) *</label>
                <Input required {...field('nameAr')} dir="rtl" placeholder="شوربات" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Name (French) *</label>
                <Input required {...field('nameFr')} placeholder="Soupes" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Icon (emoji) *</label>
                <Input required {...field('icon')} placeholder="🍲" className="text-2xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Sort Order</label>
                <Input type="number" min="0" {...field('sortOrder')} placeholder="0" />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 accent-primary" />
              Active (visible on the menu)
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editId !== null ? 'Save Changes' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={open => { if (!open) setDeleteId(null); }}
        title="Delete category?"
        description="All menu items in this category will lose their category assignment."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </AdminLayout>
  );
}
