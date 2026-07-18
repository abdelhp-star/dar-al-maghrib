import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useGetMenuItems, useDeleteMenuItem, useCreateMenuItem } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMenu() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) setLocation('/');
  }, [user, token, setLocation]);

  const { data: menuItems, refetch } = useGetMenuItems({}, {
    query: { enabled: !!token && user?.role === 'admin' }
  });

  const deleteItem = useDeleteMenuItem();

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem.mutateAsync({ id });
        toast.success('Item deleted');
        refetch();
      } catch (err) {
        toast.error('Failed to delete item');
      }
    }
  };

  return (
    <Layout>
      <div className="bg-card border-b border-border py-4 mb-8">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="font-serif text-2xl font-bold">Menu Management</h1>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-primary hover:underline text-sm font-medium">Back to Admin</Link>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add New Item
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-4 font-bold text-sm text-muted-foreground w-16">Image</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Name</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Category</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Price</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Status</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems?.map(item => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-4">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted"></div>
                      )}
                    </td>
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4 text-sm">{item.category?.name || item.categoryId}</td>
                    <td className="p-4 font-bold">{Math.round(item.price)} MAD</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.available ? 'Active' : 'Sold Out'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
