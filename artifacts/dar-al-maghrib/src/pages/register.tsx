import { useState } from 'react';
import { useRegister } from '@workspace/api-client-react';
import { useAuth } from '@/contexts/auth';
import { Link, useLocation } from 'wouter';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const registerMutation = useRegister();
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await registerMutation.mutateAsync({ data: { name, email, password, phone } });
      login(res.token);
      toast.success('Account created successfully!');
      setLocation('/');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10"></div>
          
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl text-primary mb-2">Join Dar Al Maghrib</h1>
            <p className="text-muted-foreground">Create an account to order and save favorites.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input 
                required 
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input 
                type="email" 
                required 
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number (Optional)</label>
              <Input 
                type="tel" 
                placeholder="+212..."
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input 
                type="password" 
                required 
                placeholder="••••••••"
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
