import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Users, School, BookOpen, BarChart3 } from "lucide-react";
import logoImage from "@assets/Screenshot_2025-12-11_at_12.16.26_AM_1765392397522.png";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-gray-100 py-4 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col items-start">
            <Link href="/">
              <img 
                src={logoImage} 
                alt="UNKLASS" 
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
              <Button variant="ghost" className="text-sky-600 font-medium bg-sky-50" data-testid="nav-about">
                About Us
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" className="text-gray-700 font-medium" data-testid="nav-contact">
                Contact Us
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 text-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Bridging the Urban–Rural Education Gap
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
              Bringing quality, structured, and affordable learning to students in rural and semi-urban India
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                UNKLASS is an education initiative focused on bringing quality, structured, and affordable learning to students in rural and semi-urban India. We believe that a child's learning outcomes should not be determined by their geography.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Across rural India, millions of students face a common challenge—lack of subject-expert teachers, limited academic support, and minimal exposure to competitive exam preparation. UNKLASS was created to solve this problem using technology, strong academic design, and local learning infrastructure.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              What We Do
            </h2>
            <p className="text-gray-700 text-lg mb-8 text-center">
              UNKLASS partners with schools, communities, and learning centers to deliver:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-sky-100">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-sky-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Expert Teaching</h3>
                  <p className="text-gray-600 text-sm">
                    High-quality teaching by expert educators with deep subject knowledge
                  </p>
                </CardContent>
              </Card>

              <Card className="border-sky-100">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-sky-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Curriculum-Aligned Support</h3>
                  <p className="text-gray-600 text-sm">
                    Academic support aligned with CBSE & State Boards for seamless learning
                  </p>
                </CardContent>
              </Card>

              <Card className="border-sky-100">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
                    <School className="w-6 h-6 text-sky-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Structured Preparation</h3>
                  <p className="text-gray-600 text-sm">
                    Preparation for school exams and competitive exams with proven methodologies
                  </p>
                </CardContent>
              </Card>

              <Card className="border-sky-100">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-sky-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Technology-Enabled</h3>
                  <p className="text-gray-600 text-sm">
                    Learning without requiring students to migrate to cities
                  </p>
                </CardContent>
              </Card>
            </div>

            <p className="text-gray-700 text-lg mt-8 text-center">
              Our model combines centralized expert teaching with local access points, ensuring consistency in quality while remaining affordable and accessible.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Our Learning Model
            </h2>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Rural Learning Centers</h3>
                  <p className="text-gray-600">
                    After-school learning hubs where students access expert teaching and structured guidance.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">School Partnerships</h3>
                  <p className="text-gray-600">
                    Supporting schools with teaching expertise, academic planning, and digital tools.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Standardized Content</h3>
                  <p className="text-gray-600">
                    Carefully designed lesson plans, assessments, and revision material aligned with national and state curricula.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Data-Driven Monitoring</h3>
                  <p className="text-gray-600">
                    Regular assessments to track learning progress and improve outcomes.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 bg-sky-50 rounded-xl text-center">
              <p className="text-gray-700 text-lg font-medium">
                This hybrid approach allows us to deliver big-city quality education in village and small-town settings.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 bg-sky-500 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="mb-6 text-white/90">Join thousands of students already learning with UNKLASS</p>
            <Link href="/">
              <Button className="bg-white text-sky-600 hover:bg-gray-100" data-testid="button-start-learning">
                Start Learning Now
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
                alt="UNKLASS" 
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
