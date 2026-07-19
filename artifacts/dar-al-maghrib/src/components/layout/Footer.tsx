import { useI18n } from '@/contexts/i18n';
import { Facebook, Instagram, MapPin, Mail } from 'lucide-react';
import { Link } from 'wouter';
import { WhatsAppIcon } from '@/components/WhatsAppButton';

const WA_URL = 'https://wa.me/212616855779?text=Hello%20Dar%20Al%20Maghrib!%20I%20would%20like%20to%20place%20an%20order.';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold text-primary">{t('hero.title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Experience the authentic taste of Morocco in every bite. Our chefs bring generations of tradition to your table.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/menu" className="hover:text-primary transition-colors">Menu</Link></li>
              <li><Link href="/offers" className="hover:text-primary transition-colors">Offers</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                New Medina, Safi, Morocco
              </li>
              <li className="flex items-center gap-2">
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp +212 616-855779"
                  className="inline-flex items-center gap-2 hover:text-[#25D366] transition-colors"
                >
                  <WhatsAppIcon className="h-4 w-4 text-[#25D366] flex-shrink-0" />
                  +212 616-855779
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                hello@daralmaghrib.com
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground">Opening Hours</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex justify-between"><span>Mon - Thu</span> <span>11:00 AM - 10:00 PM</span></li>
              <li className="flex justify-between"><span>Fri - Sat</span> <span>11:00 AM - 11:00 PM</span></li>
              <li className="flex justify-between"><span>Sunday</span> <span>12:00 PM - 9:00 PM</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground flex flex-col items-center">
          <div className="w-16 h-1 bg-primary mb-6 opacity-50"></div>
          <p>&copy; {new Date().getFullYear()} Dar Al Maghrib. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
