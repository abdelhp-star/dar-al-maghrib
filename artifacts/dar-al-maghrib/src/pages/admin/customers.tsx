import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useAdminGetCustomers } from '@workspace/api-client-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLocation } from 'wouter';

export default function AdminCustomers() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) setLocation('/');
  }, [user, token, setLocation]);

  const { data: customers } = useAdminGetCustomers({
    query: { enabled: !!token && user?.role === 'admin' }
  });

  return (
    <AdminLayout title="Customers">
      <div className="p-6 space-y-4">
        <h1 className="font-serif text-2xl font-bold">Customers</h1>

        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-4 font-bold text-sm text-muted-foreground">ID</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Name</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Email</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Phone</th>
                  <th className="p-4 font-bold text-sm text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers?.map(customer => (
                  <tr key={customer.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-4 text-sm text-muted-foreground">#{customer.id}</td>
                    <td className="p-4 font-semibold">{customer.name}</td>
                    <td className="p-4 text-sm">{customer.email}</td>
                    <td className="p-4 text-sm">{customer.phone || '—'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(customer.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!customers?.length && (
            <div className="p-8 text-center text-muted-foreground">No customers yet.</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
