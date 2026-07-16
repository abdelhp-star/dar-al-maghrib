import { Layout } from '@/components/layout/Layout';
import { MapPin, Clock, Phone, Mail } from 'lucide-react';

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=1600&auto=format&fit=crop')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/70"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white mb-4">Our Story</h1>
          <div className="w-20 h-1 bg-accent mx-auto"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row gap-16 items-center mb-24">
          <div className="w-full md:w-1/2">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl -z-10 transform -rotate-3"></div>
              <img 
                src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop" 
                alt="Moroccan spices" 
                className="w-full h-[500px] object-cover rounded-2xl shadow-lg border border-border"
              />
            </div>
          </div>
          <div className="w-full md:w-1/2 space-y-6">
            <h2 className="font-serif text-4xl text-primary font-bold">A Legacy of Flavor</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Founded in 1998, Dar Al Maghrib began as a humble family kitchen, sharing the rich, complex flavors of Marrakech with our local community. Over two decades later, we continue to honor the timeless recipes passed down through generations.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Every dish we serve is a testament to the Moroccan culinary art—slow-cooked tagines, hand-rolled couscous, and signature spice blends roasted and ground in-house. We believe that true luxury lies in authenticity and patience.
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-card p-8 rounded-2xl border border-border text-center shadow-sm">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold mb-4">Opening Hours</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>Mon - Thu: 11:00 AM - 10:00 PM</li>
              <li>Fri - Sat: 11:00 AM - 11:00 PM</li>
              <li>Sunday: 12:00 PM - 9:00 PM</li>
            </ul>
          </div>

          <div className="bg-card p-8 rounded-2xl border border-border text-center shadow-sm">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold mb-4">Location</h3>
            <p className="text-muted-foreground">
              123 Medina Street<br />
              Casablanca, 10000<br />
              Morocco
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border border-border text-center shadow-sm">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>+212 5 12 34 56 78</li>
              <li>hello@daralmaghrib.com</li>
            </ul>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="w-full h-96 bg-muted rounded-3xl border border-border overflow-hidden relative shadow-inner">
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-serif text-2xl font-bold">Find Us Here</h3>
              <p className="text-muted-foreground">Interactive map will load here</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
