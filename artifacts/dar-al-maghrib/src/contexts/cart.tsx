import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGetCart, useAddToCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '@workspace/api-client-react';
import { useAuth } from './auth';

interface LocalCartItem {
  menuItemId: number;
  quantity: number;
}

interface CartContextType {
  items: any[];
  subtotal: number;
  total: number;
  itemCount: number;
  addToCart: (menuItemId: number, quantity: number) => Promise<void>;
  updateQuantity: (menuItemId: number, quantity: number) => Promise<void>;
  removeItem: (menuItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  
  // Local cart for unauthenticated users
  const [localCart, setLocalCart] = useState<LocalCartItem[]>(() => {
    const saved = localStorage.getItem('guestCart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (!token) {
      localStorage.setItem('guestCart', JSON.stringify(localCart));
    }
  }, [localCart, token]);

  const { data: serverCart, isLoading: isLoadingServer, refetch } = useGetCart({
    query: {
      enabled: !!token,
    }
  });

  const addToCartMutation = useAddToCart();
  const updateCartMutation = useUpdateCartItem();
  const removeCartMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();

  // If token is present and we have items in localCart, we might want to sync them.
  // For simplicity, we just clear local cart when they log in and rely on server cart.
  useEffect(() => {
    if (token && localCart.length > 0) {
      // Simplification: clear guest cart on login. In a real app we'd merge.
      setLocalCart([]);
      localStorage.removeItem('guestCart');
    }
  }, [token, localCart]);

  const addToCart = async (menuItemId: number, quantity: number) => {
    if (token) {
      await addToCartMutation.mutateAsync({ data: { menuItemId, quantity } });
      refetch();
    } else {
      setLocalCart(prev => {
        const existing = prev.find(i => i.menuItemId === menuItemId);
        if (existing) {
          return prev.map(i => i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + quantity } : i);
        }
        return [...prev, { menuItemId, quantity }];
      });
    }
  };

  const updateQuantity = async (menuItemId: number, quantity: number) => {
    if (token) {
      await updateCartMutation.mutateAsync({ menuItemId, data: { quantity } });
      refetch();
    } else {
      setLocalCart(prev => prev.map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i));
    }
  };

  const removeItem = async (menuItemId: number) => {
    if (token) {
      await removeCartMutation.mutateAsync({ menuItemId });
      refetch();
    } else {
      setLocalCart(prev => prev.filter(i => i.menuItemId !== menuItemId));
    }
  };

  const clearCart = async () => {
    if (token) {
      await clearCartMutation.mutateAsync();
      refetch();
    } else {
      setLocalCart([]);
    }
  };

  // We don't have menu item details for local cart right away unless we fetch them or store them.
  // This is a limitation of a pure local cart. Let's just return item counts for local cart 
  // or return serverCart if logged in.
  
  const isAuth = !!token;
  const items = isAuth ? (serverCart?.items || []) : localCart; // Realistically localCart needs hydration. We'll handle this in Cart page.
  const itemCount = isAuth ? items.reduce((acc, item) => acc + item.quantity, 0) : localCart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = isAuth ? (serverCart?.subtotal || 0) : 0;
  const total = isAuth ? (serverCart?.total || 0) : 0;

  return (
    <CartContext.Provider value={{
      items,
      subtotal,
      total,
      itemCount,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      isLoading: isAuth ? isLoadingServer : false
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCartContext must be used within CartProvider");
  return context;
};
