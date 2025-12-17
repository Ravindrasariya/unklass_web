import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/Screenshot_2025-12-11_at_12.16.26_AM_1765392397522.png";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message Sent",
      description: "Thank you for contacting us. We'll get back to you soon!",
    });
    
    setName("");
    setEmail("");
    setMessage("");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-gray-100 py-4 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col items-start">
            <Link href="/">
              <img 
                src={logoImage} 
                alt="Unklass" 
                className="h-12 md:h-14 cursor-pointer"
                data-testid="img-logo-header"
              />
            </Link>
            <span className="text-xs md:text-sm text-gray-600 tracking-tight mt-1">Learning Beyond Classroom</span>
          </div>
          <nav className="flex items-center gap-2 md:gap-4">
            <Link href="/">
              <Button variant="ghost" className="text-gray-700 font-medium" data-testid="nav-home">
                Home
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost" className="text-gray-700 font-medium" data-testid="nav-about">
                About Us
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" className="text-sky-600 font-medium bg-sky-50" data-testid="nav-contact">
                Contact Us
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 text-white py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Have questions or want to partner with us? We'd love to hear from you.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                <p className="text-gray-600 mb-8">
                  Whether you're a school looking to partner, a student seeking information, or just curious about our work, we're here to help.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                      <p className="text-gray-600">contact@unklass.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                      <p className="text-gray-600">+91 98765 43210</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                      <p className="text-gray-600">
                        Madhya Pradesh, India
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                        data-testid="input-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        required
                        data-testid="input-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="How can we help you?"
                        rows={4}
                        required
                        className="resize-none"
                        data-testid="input-message"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-sky-500 hover:bg-sky-600"
                      disabled={isSubmitting}
                      data-testid="button-send"
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Partner With Us</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Are you a school, learning center, or community organization? Partner with UnKlass to bring quality education to your students.
            </p>
            <Link href="/about">
              <Button variant="outline" className="border-sky-500 text-sky-600 hover:bg-sky-50" data-testid="button-learn-more">
                Learn More About Us
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start">
              <img 
                src={logoImage} 
                alt="Unklass" 
                className="h-10 invert"
                data-testid="img-logo-footer"
              />
              <span className="text-sm text-gray-400 tracking-tight mt-2">Learning Beyond Classroom</span>
            </div>
            
            <nav className="flex items-center gap-6">
              <Link href="/">
                <span className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm" data-testid="footer-home">
                  Home
                </span>
              </Link>
              <Link href="/about">
                <span className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm" data-testid="footer-about">
                  About Us
                </span>
              </Link>
              <Link href="/contact">
                <span className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm" data-testid="footer-contact">
                  Contact Us
                </span>
              </Link>
            </nav>
          </div>
          
          <div className="border-t border-gray-800 mt-6 pt-6 text-center">
            <p className="text-gray-500 text-sm">
              Empowering students across India with quality education
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
