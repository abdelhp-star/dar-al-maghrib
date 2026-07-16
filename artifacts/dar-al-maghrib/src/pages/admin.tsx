import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { useGetStats } from '@workspace/api-client-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, DollarSign, ShoppingBag, Clock, Link } from 'lucide-react';
import { Button } from 'react-day-picker';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) {
      setLocation('/');
    }
  }, [user, token, setLocation]);

  const { data: stats, isLoading } = useGetStats({ query: { enabled: !!token && user?.role === 'admin' } });

  if (isLoading || !stats) {
    return <Layout><div className="p-20 text-center">Loading admin data...</div></Layout>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff6b6b'];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold mb-8">Admin Overview</h1>

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                <h3 className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</h3>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-1">Total Orders</p>
                <h3 className="text-3xl font-bold">{stats.totalOrders}</h3>
              </div>
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-1">Pending Orders</p>
                <h3 className="text-3xl font-bold">{stats.pendingOrders}</h3>
              </div>
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-1">Customers</p>
                <h3 className="text-3xl font-bold">{stats.totalCustomers}</h3>
              </div>
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="font-bold text-lg mb-6">Revenue Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueByDay}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => `${value}`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="font-bold text-lg mb-6">Orders by Status</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.ordersByStatus}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {stats.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {stats.ordersByStatus.map((entry, index) => (
                <div key={entry.status} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="capitalize">{entry.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="font-bold text-lg mb-4">Quick Management Links</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/admin/orders"><Button variant="outline">Manage Orders</Button></Link>
            <Link href="/admin/menu"><Button variant="outline">Manage Menu</Button></Link>
            <Link href="/admin/customers"><Button variant="outline">View Customers</Button></Link>
            <Link href="/admin/offers"><Button variant="outline">Manage Offers</Button></Link>
            <Link href="/admin/coupons"><Button variant="outline">Manage Coupons</Button></Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
