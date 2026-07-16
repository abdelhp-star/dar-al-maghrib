import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useAdminGetCustomers } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { useLocation, Link } from 'wouter';

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
    <Layout>
      <div className="bg-card border-b border-border py-4 mb-8">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="font-serif text-2xl font-bold">Customers</h1>
          <Link href="/admin" className="text-primary hover:underline text-sm font-medium">Back to Admin</Link>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
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
                    <td className="p-4 font-medium text-muted-foreground">#{customer.id}</td>
                    <td className="p-4 font-bold">{customer.name}</td>
                    <td className="p-4 text-sm">{customer.email}</td>
                    <td className="p-4 text-sm">{customer.phone || 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(customer.createdAt).toLocaleDateString()}</td>
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
