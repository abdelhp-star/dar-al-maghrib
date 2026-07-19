import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { WhatsAppFloat } from '@/components/WhatsAppButton';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground relative overflow-hidden">
      {/* Subtle Moroccan background pattern */}
      <div className="absolute inset-0 z-0 moroccan-pattern pointer-events-none opacity-20 dark:opacity-5"></div>
      
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>

      {/* Floating WhatsApp button — public pages only (admin uses AdminLayout) */}
      <WhatsAppFloat />
    </div>
  );
}
