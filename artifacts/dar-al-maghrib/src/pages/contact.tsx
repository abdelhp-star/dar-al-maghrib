import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Phone, Mail, Send, MapPin, Navigation, CheckCircle2 } from 'lucide-react';

const GMAPS_URL = 'https://maps.app.goo.gl/9F5eFoenw2R6Pwyf7';
const GMAPS_EMBED = 'https://maps.google.com/maps?q=32.2901579,-9.2321418&z=16&output=embed';

export default function Contact() {
  const [success, setSuccess] = useState(
    () => new URLSearchParams(window.location.search).get('success') === 'true'
  );

  useEffect(() => {
    if (success) {
      history.replaceState(null, '', window.location.pathname);
    }
  }, [success]);

  return (
    <Layout>
      <div className="bg-muted/30 py-12 border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">Get in Touch</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Whether you're planning a special event or have a question about our menu, we'd love to hear from you.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">

        {/* Success alert */}
        {success && (
          <div className="mb-10 flex items-start gap-4 rounded-2xl border border-green-200 bg-green-50 px-6 py-5 text-green-800 shadow-sm">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5 text-green-600" />
            <div>
              <p className="font-semibold text-base leading-snug">Message sent successfully!</p>
              <p className="text-sm mt-1 text-green-700">
                Thank you! Your message has been sent successfully. We'll contact you soon.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-16">
          <div className="w-full lg:w-1/3 space-y-10">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Phone</h3>
                    <p className="text-muted-foreground">+212 616-855779</p>
                    <p className="text-sm text-muted-foreground mt-1">Available during opening hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Address</h3>
                    <a
                      href={GMAPS_URL}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open location in Google Maps"
                      className="text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                    >
                      New Medina, Safi, Morocco
                    </a>
                    <div className="mt-2">
                      <a
                        href={GMAPS_URL}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Get directions to Dar Al Maghrib on Google Maps"
                      >
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-medium">
                          <Navigation className="w-3 h-3" />
                          Get Directions
                        </button>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Email</h3>
                    <p className="text-muted-foreground">hello@daralmaghrib.com</p>
                    <p className="text-sm text-muted-foreground mt-1">We aim to reply within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm text-center">
              <MessageSquare className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-serif text-2xl font-bold mb-2">WhatsApp Us</h3>
              <p className="text-muted-foreground mb-6">The fastest way to reach our support team.</p>
              <a href="https://wa.me/212512345678" target="_blank" rel="noreferrer">
                <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
                  Message on WhatsApp
                </Button>
              </a>
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            <div className="bg-card p-8 md:p-10 rounded-3xl border border-border shadow-md">
              <h2 className="font-serif text-3xl font-bold mb-8">Send a Message</h2>
              <form
                action="https://formsubmit.co/abdelhp@gmail.com"
                method="POST"
                className="space-y-6"
              >
                {/* FormSubmit hidden configuration fields */}
                <input type="hidden" name="_subject" value="New message from Dar Al Maghrib website" />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_template" value="table" />
                <input type="hidden" name="_next" value="https://dar-al-maghrib.netlify.app/contact?success=true" />

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    className="w-full min-h-[150px] p-3 rounded-md border border-input bg-transparent shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Type your message here..."
                  ></textarea>
                </div>

                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  Send Message <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
