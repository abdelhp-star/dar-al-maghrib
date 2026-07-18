import { useState, useMemo } from 'react';
import { madToAed } from '@/lib/price';
import { useGetCategories, useGetMenuItems, useAddToCart } from '@workspace/api-client-react';
import { useI18n } from '@/contexts/i18n';
import { useCartContext } from '@/contexts/cart';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Search, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { toast } from 'sonner';

export default function Menu() {
  const { t, language } = useI18n();
  const { addToCart } = useCartContext();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  
  // Use debounced search or just fetch all and filter client side if small. 
  // We'll fetch by category if selected, and filter search client side for snappiness.
  const { data: menuItems, isLoading: menuLoading } = useGetMenuItems(
    selectedCategory ? { categoryId: selectedCategory } : {}
  );

  const getLocalized = (obj: any, field: string) => {
    if (!obj) return '';
    const key = language === 'en' ? field : `${field}${language.charAt(0).toUpperCase() + language.slice(1)}`;
    return obj[key] || obj[field];
  };

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    if (!search) return menuItems;
    const lowerSearch = search.toLowerCase();
    return menuItems.filter(item => 
      getLocalized(item, 'name').toLowerCase().includes(lowerSearch) ||
      getLocalized(item, 'description').toLowerCase().includes(lowerSearch)
    );
  }, [menuItems, search, language]);

  const handleAddToCart = async (e: React.MouseEvent, itemId: number) => {
    e.preventDefault(); // Prevent link click if wrapped
    setAddingToCart(itemId);
    try {
      await addToCart(itemId, 1);
      toast.success('Added to cart');
    } catch (err) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">Our Menu</h1>
          <p className="text-muted-foreground max-w-2xl">Explore our authentic Moroccan dishes, crafted with traditional recipes and premium ingredients.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Categories */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search dishes..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <h3 className="font-bold text-lg p-4 border-b border-border bg-muted/50">Categories</h3>
                <div className="flex flex-col">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/10 ${selectedCategory === null ? 'bg-accent/10 text-primary border-l-2 border-primary' : 'text-foreground'}`}
                  >
                    All Menu
                  </button>
                  {categoriesLoading ? (
                    <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-5 w-5 text-primary" /></div>
                  ) : categories?.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/10 ${selectedCategory === cat.id ? 'bg-accent/10 text-primary border-l-2 border-primary' : 'text-foreground'}`}
                    >
                      {getLocalized(cat, 'name')}
                      <span className="float-right text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{cat.itemCount || 0}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Menu Grid */}
          <main className="flex-1">
            {menuLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-card rounded-2xl h-80 border border-border animate-pulse p-4 flex flex-col justify-between">
                    <div className="w-full h-40 bg-muted rounded-xl mb-4"></div>
                    <div className="h-6 w-3/4 bg-muted rounded mb-2"></div>
                    <div className="h-4 w-full bg-muted rounded mb-4"></div>
                    <div className="flex justify-between mt-auto">
                      <div className="h-8 w-16 bg-muted rounded"></div>
                      <div className="h-8 w-24 bg-muted rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-2xl border border-border">
                <p className="text-xl text-muted-foreground">No dishes found matching your criteria.</p>
                <Button variant="link" onClick={() => { setSearch(''); setSelectedCategory(null); }}>Clear filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all flex flex-col relative"
                    >
                      {!item.available && (
                        <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="bg-destructive text-destructive-foreground px-4 py-1 rounded-full font-bold shadow-lg">Sold Out</span>
                        </div>
                      )}
                      <Link href={`/menu/${item.id}`} className="block relative h-48 overflow-hidden flex-shrink-0">
                        <img 
                          src={item.imageUrl || `https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop`} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {item.spiceLevel === 'hot' && (
                          <div className="absolute top-2 left-2 bg-destructive/90 text-white text-[10px] uppercase px-2 py-0.5 rounded font-bold">Spicy</div>
                        )}
                      </Link>
                      <div className="p-5 flex flex-col flex-1">
                        <Link href={`/menu/${item.id}`} className="hover:text-primary transition-colors">
                          <h3 className="font-serif text-xl font-bold mb-1">{getLocalized(item, 'name')}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                          {getLocalized(item, 'description')}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="leading-tight">
                            <div className="text-lg font-bold text-primary">{Math.round(item.price)} MAD</div>
                            <div className="text-xs text-muted-foreground">{madToAed(item.price)} AED</div>
                          </div>
                          <Button 
                            size="sm" 
                            className="rounded-full px-4"
                            disabled={!item.available || addingToCart === item.id}
                            onClick={(e) => handleAddToCart(e, item.id)}
                          >
                            {addingToCart === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Add</>}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
