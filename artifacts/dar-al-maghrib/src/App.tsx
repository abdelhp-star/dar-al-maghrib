import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/auth';
import { I18nProvider } from '@/contexts/i18n';
import { CartProvider } from '@/contexts/cart';

// Import Pages
import Home from '@/pages/home';
import Menu from '@/pages/menu';
import MenuItemDetail from '@/pages/menu-item';
import Cart from '@/pages/cart';
import Checkout from '@/pages/checkout';
import Login from '@/pages/login';
import Register from '@/pages/register';
import Dashboard from '@/pages/dashboard';
import Orders from '@/pages/orders';
import OrderTracking from '@/pages/order-tracking';
import Offers from '@/pages/offers';
import About from '@/pages/about';
import Contact from '@/pages/contact';

// Admin Pages
import AdminDashboard from '@/pages/admin';
import AdminOrders from '@/pages/admin/orders';
import AdminMenu from '@/pages/admin/menu';
import AdminCustomers from '@/pages/admin/customers';
import AdminCoupons from '@/pages/admin/coupons';
import AdminOffers from '@/pages/admin/offers';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/menu" component={Menu} />
      <Route path="/menu/:id" component={MenuItemDetail} />
      <Route path="/offers" component={Offers} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/:id" component={OrderTracking} />
      
      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/menu" component={AdminMenu} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/coupons" component={AdminCoupons} />
      <Route path="/admin/offers" component={AdminOffers} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <I18nProvider>
            <CartProvider>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </CartProvider>
          </I18nProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
