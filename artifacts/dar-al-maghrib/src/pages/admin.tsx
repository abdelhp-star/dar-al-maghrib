import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/auth';
import { useLocation, Link } from 'wouter';
import { useEffect } from 'react';
import { useGetStats } from '@workspace/api-client-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, DollarSign, ShoppingBag, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) setLocation('/');
  }, [user, token, setLocation]);

  const { data: stats, isLoading } = useGetStats({ query: { enabled: !!token && user?.role === 'admin' } });

  if (isLoading || !stats) {
    return (
      <AdminLayout title="Dashboard">
        <div className="p-20 text-center text-muted-foreground">Loading admin data…</div>
      </AdminLayout>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff6b6b'];

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6 space-y-6">
        <h1 className="font-serif text-2xl font-bold">Overview</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `${stats.totalRevenue.toFixed(2)} MAD`, icon: DollarSign, color: 'text-primary bg-primary/10' },
            { label: 'Total Orders',  value: stats.totalOrders,                        icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
            { label: 'Pending Orders',value: stats.pendingOrders,                      icon: Clock,       color: 'text-orange-600 bg-orange-50' },
            { label: 'Customers',     value: stats.totalCustomers,                     icon: Users,       color: 'text-green-600 bg-green-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card p-5 rounded-xl border border-border shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                  <h3 className="text-2xl font-bold">{value}</h3>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="font-bold text-base mb-4">Revenue Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueByDay}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="font-bold text-base mb-4">Orders by Status</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.ordersByStatus} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="count" nameKey="status">
                    {stats.ordersByStatus.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {stats.ordersByStatus.map((entry, index) => (
                <div key={entry.status} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="capitalize">{entry.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h3 className="font-bold text-base mb-3">Quick Links</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/orders"><Button variant="outline" size="sm">Manage Orders</Button></Link>
            <Link href="/admin/menu"><Button variant="outline" size="sm">Manage Menu</Button></Link>
            <Link href="/admin/categories"><Button variant="outline" size="sm">Categories</Button></Link>
            <Link href="/admin/customers"><Button variant="outline" size="sm">View Customers</Button></Link>
            <Link href="/admin/offers"><Button variant="outline" size="sm">Manage Offers</Button></Link>
            <Link href="/admin/coupons"><Button variant="outline" size="sm">Manage Coupons</Button></Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
