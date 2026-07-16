import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGetMe } from '@workspace/api-client-react';
import { setAuthTokenGetter } from '@workspace/api-client-react';

type UserRole = 'customer' | 'admin';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem('token'));
  }, []);

  const { data: user, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setAuthTokenGetter(() => newToken);
    refetch();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setAuthTokenGetter(() => null);
  };

  const isLoading = !!token && isUserLoading;

  return (
    <AuthContext.Provider value={{ token, user: user as User | null, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
