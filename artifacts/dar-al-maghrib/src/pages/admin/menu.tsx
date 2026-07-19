import { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/auth';
import {
  useGetMenuItems, useGetCategories,
  useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
} from '@workspace/api-client-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Search, Upload, Link as LinkIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

const SPICE_LEVELS = ['none', 'mild', 'medium', 'hot', 'very_hot'];

const emptyForm = {
  name: '', nameAr: '', nameFr: '',
  description: '', descriptionAr: '', descriptionFr: '',
  price: '', categoryId: '', spiceLevel: 'none',
  preparationTime: '20', calories: '', ingredients: '',
  isPopular: false, isFeatured: false, isTodaySpecial: false,
  available: true, imageUrl: '',
};

type FormState = typeof emptyForm;

export default function AdminMenu() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [page, setPage] = useState(1);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageTab, setImageTab] = useState<'url' | 'upload'>('url');
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Delete
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) setLocation('/');
  }, [user, token, setLocation]);

  const { data: menuItems, refetch } = useGetMenuItems(
    { available: 'false' as any },
    { query: { enabled: !!token && user?.role === 'admin' } }
  );

  const { data: categories } = useGetCategories({
    query: { enabled: !!token && user?.role === 'admin' }
  });

  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  // Filtering
  const filtered = useMemo(() => {
    let items = menuItems ?? [];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.nameAr?.includes(q));
    }
    if (categoryFilter) items = items.filter(i => String(i.categoryId) === categoryFilter);
    if (statusFilter === 'available')   items = items.filter(i => i.available);
    if (statusFilter === 'unavailable') items = items.filter(i => !i.available);
    return items;
  }, [menuItems, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, categoryFilter, statusFilter]);

  // Open create modal
  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setImageTab('url');
    setModalOpen(true);
  };

  // Open edit modal
  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      name: item.name ?? '',
      nameAr: item.nameAr ?? '',
      nameFr: item.nameFr ?? '',
      description: item.description ?? '',
      descriptionAr: item.descriptionAr ?? '',
      descriptionFr: item.descriptionFr ?? '',
      price: String(item.price ?? ''),
      categoryId: String(item.categoryId ?? ''),
      spiceLevel: item.spiceLevel ?? 'none',
      preparationTime: String(item.preparationTime ?? '20'),
      calories: String(item.calories ?? ''),
      ingredients: item.ingredients ?? '',
      isPopular: item.isPopular ?? false,
      isFeatured: item.isFeatured ?? false,
      isTodaySpecial: item.isTodaySpecial ?? false,
      available: item.available ?? true,
      imageUrl: item.imageUrl ?? '',
    });
    setImageTab('url');
    setModalOpen(true);
  };

  // Upload file
  const handleFileUpload = async (file: File) => {
    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      setForm(f => ({ ...f, imageUrl: url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  // Inline toggle available
  const handleToggleAvailable = async (item: any) => {
    try {
      await updateItem.mutateAsync({ id: item.id, data: { available: !item.available } as any });
      refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Save (create or update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) {
      toast.error('Name, price, and category are required');
      return;
    }
    setSaving(true);
    const payload: any = {
      name: form.name, nameAr: form.nameAr, nameFr: form.nameFr,
      description: form.description, descriptionAr: form.descriptionAr, descriptionFr: form.descriptionFr,
      price: parseFloat(form.price),
      categoryId: parseInt(form.categoryId),
      spiceLevel: form.spiceLevel,
      preparationTime: parseInt(form.preparationTime) || 20,
      calories: form.calories ? parseInt(form.calories) : null,
      ingredients: form.ingredients,
      isPopular: form.isPopular, isFeatured: form.isFeatured, isTodaySpecial: form.isTodaySpecial,
      available: form.available,
      imageUrl: form.imageUrl || null,
    };
    try {
      if (editId !== null) {
        await updateItem.mutateAsync({ id: editId, data: payload });
        toast.success('Item updated');
      } else {
        await createItem.mutateAsync({ data: payload });
        toast.success('Item created');
      }
      setModalOpen(false);
      refetch();
    } catch {
      toast.error('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteItem.mutateAsync({ id: deleteId });
      toast.success('Item deleted');
      refetch();
    } catch {
      toast.error('Failed to delete');
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
    <AdminLayout title="Menu Items">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-serif text-2xl font-bold">Menu Items</h1>
          <Button size="sm" className="gap-2 flex-shrink-0" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter || 'all'} onValueChange={v => setCategoryFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories?.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground self-center">{filtered.length} items</span>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-4 font-bold text-sm text-muted-foreground w-14">Img</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Name</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Category</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Price</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Status</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(item => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-4">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded object-cover" />
                        : <div className="w-10 h-10 rounded bg-muted" />}
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.nameAr}</p>
                    </td>
                    <td className="p-4 text-sm">{(item as any).category?.name || item.categoryId}</td>
                    <td className="p-4 font-semibold text-sm">{Number(item.price).toFixed(0)} MAD</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleAvailable(item)}
                        className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer
                          ${item.available
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {item.available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => openEdit(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginated.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No items found.</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId !== null ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-5">
            {/* Image */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Image</label>
              <div className="flex gap-2 mb-2">
                <button type="button"
                  onClick={() => setImageTab('url')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors
                    ${imageTab === 'url' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
                  <LinkIcon className="w-3 h-3" /> URL
                </button>
                <button type="button"
                  onClick={() => setImageTab('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors
                    ${imageTab === 'upload' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
                  <Upload className="w-3 h-3" /> Upload
                </button>
              </div>
              {imageTab === 'url' ? (
                <Input placeholder="https://… or /dishes/name.jpg" {...field('imageUrl')} />
              ) : (
                <div className="flex gap-2">
                  <input type="file" ref={fileRef} accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                  <Button type="button" variant="outline" disabled={uploadLoading}
                    onClick={() => fileRef.current?.click()}>
                    {uploadLoading ? 'Uploading…' : 'Choose file'}
                  </Button>
                  {form.imageUrl && <span className="text-xs text-muted-foreground self-center truncate max-w-xs">{form.imageUrl}</span>}
                </div>
              )}
              {form.imageUrl && (
                <img src={form.imageUrl} alt="preview" className="w-24 h-24 rounded-lg object-cover border border-border" />
              )}
            </div>

            {/* Name */}
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Name (EN) *</label>
                <Input required {...field('name')} placeholder="Harira" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Name (AR)</label>
                <Input {...field('nameAr')} placeholder="الحريرة" dir="rtl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Name (FR)</label>
                <Input {...field('nameFr')} placeholder="Harira" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Description (EN)</label>
              <textarea className="w-full p-2 rounded-md border border-input bg-transparent text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={2} {...field('description')} placeholder="Description…" />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Description (AR)</label>
                <textarea className="w-full p-2 rounded-md border border-input bg-transparent text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={2} {...field('descriptionAr')} dir="rtl" placeholder="وصف…" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Description (FR)</label>
                <textarea className="w-full p-2 rounded-md border border-input bg-transparent text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={2} {...field('descriptionFr')} placeholder="Description…" />
              </div>
            </div>

            {/* Price + Category + Spice */}
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Price (MAD) *</label>
                <Input type="number" step="0.01" min="0" required {...field('price')} placeholder="35" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Category *</label>
                <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Spice Level</label>
                <Select value={form.spiceLevel} onValueChange={v => setForm(f => ({ ...f, spiceLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPICE_LEVELS.map(s => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prep time + Calories + Ingredients */}
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Prep Time (min)</label>
                <Input type="number" min="1" {...field('preparationTime')} placeholder="20" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Calories</label>
                <Input type="number" min="0" {...field('calories')} placeholder="280" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Ingredients</label>
                <Input {...field('ingredients')} placeholder="Tomatoes, chickpeas…" />
              </div>
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-4">
              {([
                ['isPopular',     'Popular'],
                ['isFeatured',    'Featured'],
                ['isTodaySpecial','Today Special'],
                ['available',     'Available'],
              ] as [keyof FormState, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form[key] as boolean}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-primary" />
                  {label}
                </label>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editId !== null ? 'Save Changes' : 'Create Item'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={open => { if (!open) setDeleteId(null); }}
        title="Delete menu item?"
        description="This item will be permanently removed from the menu."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </AdminLayout>
  );
}
