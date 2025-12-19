import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen, Monitor, Sparkles, GraduationCap } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/Screenshot_2025-12-11_at_12.16.26_AM_1765392397522.png";
import studentImage from "@assets/Screenshot_2025-12-17_at_6.41.41_AM_1765934337756.png";
import classroom1 from "@assets/Screenshot_2025-12-17_at_2.54.23_PM_1765963603824.png";
import classroom2 from "@assets/Screenshot_2025-12-17_at_2.55.03_PM_1765963603824.png";
import testimonial1 from "@assets/Screenshot_2025-12-17_at_3.03.57_PM_1765964212063.png";
import testimonial2 from "@assets/Screenshot_2025-12-17_at_3.05.27_PM_1765964212063.png";
import testimonial3 from "@assets/Screenshot_2025-12-17_at_3.05.43_PM_1765964212063.png";

const classroomImages = [classroom1, classroom2];
const testimonialImages = [testimonial1, testimonial2, testimonial3];

interface LandingPageProps {
  onBoardExamClick: () => void;
  onCPCTClick: () => void;
}

const sliderContent = [
  {
    text: "Empowering the remotest parts of India with quality education through technology",
    lang: "en",
    author: null,
  },
  {
    text: "प्रौद्योगिकी के माध्यम से भारत के सबसे दूरदराज़ क्षेत्रों को गुणवत्तापूर्ण शिक्षा से सशक्त बनाना।",
    lang: "hi",
    author: null,
  },
  {
    text: "Developed India will be a network of prosperous villages empowered with various connectivity with both physical and virtual",
    lang: "en",
    author: "Dr. APJ Abdul Kalam",
    title: "Hon'ble Former President of India",
  },
];

export default function LandingPage({ onBoardExamClick, onCPCTClick }: LandingPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentClassroom, setCurrentClassroom] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderContent.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClassroom((prev) => (prev + 1) % classroomImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonialImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextClassroom = () => {
    setCurrentClassroom((prev) => (prev + 1) % classroomImages.length);
  };

  const prevClassroom = () => {
    setCurrentClassroom((prev) => (prev - 1 + classroomImages.length) % classroomImages.length);
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonialImages.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonialImages.length) % testimonialImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderContent.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderContent.length) % sliderContent.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 py-3 md:py-4 px-3 md:px-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 md:gap-4">
          <div className="flex flex-col items-start flex-shrink-0">
            <img 
              src={logoImage} 
              alt="UNKLASS" 
              className="h-8 sm:h-10 md:h-12 w-auto object-contain"
              data-testid="img-logo-header"
            />
            <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 tracking-tight mt-1 pl-1">Learning Beyond Classroom</span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-700 font-medium text-xs sm:text-sm px-2 sm:px-3" data-testid="nav-home">
                Home
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost" size="sm" className="text-gray-700 font-medium text-xs sm:text-sm px-2 sm:px-3" data-testid="nav-about">
                About Us
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm" className="text-gray-700 font-medium text-xs sm:text-sm px-2 sm:px-3" data-testid="nav-contact">
                Contact Us
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="relative bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.1)_0%,transparent_50%)]"></div>
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-400/20 rounded-full blur-3xl"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 py-10 md:py-14 relative z-10">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-6 border border-white/20">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Learning Platform</span>
              </div>
              <div className="relative min-h-[100px] md:min-h-[120px] flex items-center justify-center">
                <div className="relative w-full">
                  {sliderContent.map((slide, index) => (
                    <div
                      key={index}
                      className={`transition-all duration-700 ease-out ${
                        currentSlide === index 
                          ? "opacity-100 translate-y-0" 
                          : "opacity-0 absolute top-0 left-0 right-0 translate-y-4"
                      }`}
                      data-testid={`slider-text-${index}`}
                    >
                      <p className="text-lg md:text-xl lg:text-2xl font-medium leading-relaxed drop-shadow-sm">
                        {slide.author ? `"${slide.text}"` : slide.text}
                      </p>
                      {slide.author && (
                        <div className="mt-4 text-sm md:text-base">
                          <p className="font-semibold">{slide.author}</p>
                          {'title' in slide && slide.title && (
                            <p className="text-white/80 text-xs md:text-sm">{slide.title}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevSlide}
                  className="bg-white/20 backdrop-blur-sm text-white border border-white/20 h-9 w-9 rounded-full transition-all hover:bg-white/30 hover:scale-105"
                  data-testid="button-prev-slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex gap-2">
                  {sliderContent.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`transition-all duration-300 rounded-full ${
                        currentSlide === index 
                          ? "bg-white w-6 h-2" 
                          : "bg-white/40 w-2 h-2 hover:bg-white/60"
                      }`}
                      data-testid={`slider-dot-${index}`}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextSlide}
                  className="bg-white/20 backdrop-blur-sm text-white border border-white/20 h-9 w-9 rounded-full transition-all hover:bg-white/30 hover:scale-105"
                  data-testid="button-next-slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
        </section>

        <section className="bg-gray-50 py-10 md:py-14 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.05)_0%,transparent_50%)]"></div>
          <div className="max-w-2xl mx-auto px-4 relative z-10">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded-full mb-3">Our Learning Spaces</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Our Classrooms
              </h2>
            </div>
            <div className="relative group">
              <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-gray-200">
                <div className="relative aspect-video">
                  {classroomImages.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Classroom ${index + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                        currentClassroom === index ? "opacity-100 scale-100" : "opacity-0 scale-105"
                      }`}
                      data-testid={`img-classroom-${index}`}
                    />
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevClassroom}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 h-11 w-11 rounded-full shadow-lg ring-1 ring-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                data-testid="button-prev-classroom"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextClassroom}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 h-11 w-11 rounded-full shadow-lg ring-1 ring-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                data-testid="button-next-classroom"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              <div className="flex justify-center gap-2 mt-5">
                {classroomImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentClassroom(index)}
                    className={`transition-all duration-300 rounded-full ${
                      currentClassroom === index 
                        ? "bg-sky-500 w-6 h-2.5" 
                        : "bg-gray-300 w-2.5 h-2.5 hover:bg-gray-400"
                    }`}
                    data-testid={`classroom-dot-${index}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-8 flex justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white"></div>
          <div className="relative z-10 animate-bounce-slow">
            <img 
              src={studentImage} 
              alt="Student learning" 
              className="w-48 h-48 md:w-60 md:h-60 object-contain drop-shadow-lg"
              data-testid="img-student"
            />
          </div>
        </section>

        <section className="flex-1 bg-white py-14 md:py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-sky-50 px-4 py-1.5 rounded-full text-sm text-sky-700 mb-4">
                <GraduationCap className="w-4 h-4" />
                <span>Start Your Journey</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Choose Your Learning Path
              </h2>
              <p className="text-gray-600 text-lg max-w-xl mx-auto">
                Select a program to begin your journey towards success
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div 
                className="bg-white border border-sky-100 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-sky-100 hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
                onClick={onBoardExamClick}
                data-testid="card-board-exam"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-100 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-sky-100 to-sky-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <BookOpen className="w-10 h-10 text-sky-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    UNKLASS Board Exam Prep
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Prepare for 8th, 10th, and 12th board exams with Exam Important Quizzes
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-medium py-6 rounded-xl shadow-lg shadow-sky-200 transition-all group-hover:shadow-xl"
                    data-testid="button-board-exam"
                  >
                    Start Preparation
                  </Button>
                </div>
              </div>

              <div 
                className="bg-white border border-gray-100 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-gray-100 hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
                onClick={onCPCTClick}
                data-testid="card-cpct"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-sky-100 group-hover:to-sky-50 transition-all duration-300 shadow-sm">
                    <Monitor className="w-10 h-10 text-gray-600 group-hover:text-sky-600 transition-colors duration-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    UNKLASS MP CPCT Exam Prep
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Prepare for Madhya Pradesh Computer Proficiency Certification Test
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-medium py-6 rounded-xl shadow-lg shadow-sky-200 transition-all group-hover:shadow-xl"
                    data-testid="button-cpct"
                  >
                    Start Preparation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-sky-50 to-sky-100/50 py-14 md:py-18 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(14,165,233,0.1)_0%,transparent_50%)]"></div>
          <div className="max-w-3xl mx-auto px-4 relative z-10">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-white text-sky-700 text-xs font-medium rounded-full mb-3 shadow-sm">Student Love</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                UNKLASS is liked by its current students
              </h2>
            </div>
            <div className="relative group">
              <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-sky-200/50">
                <div className="relative aspect-[16/9]">
                  {testimonialImages.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Student testimonial ${index + 1}`}
                      className={`absolute inset-0 w-full h-full object-contain bg-gradient-to-br from-sky-400 to-sky-600 transition-all duration-700 ${
                        currentTestimonial === index ? "opacity-100 scale-100" : "opacity-0 scale-105"
                      }`}
                      data-testid={`img-testimonial-${index}`}
                    />
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevTestimonial}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 h-11 w-11 rounded-full shadow-lg ring-1 ring-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                data-testid="button-prev-testimonial"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextTestimonial}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 h-11 w-11 rounded-full shadow-lg ring-1 ring-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                data-testid="button-next-testimonial"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              <div className="flex justify-center gap-2 mt-5">
                {testimonialImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`transition-all duration-300 rounded-full ${
                      currentTestimonial === index 
                        ? "bg-sky-500 w-6 h-2.5" 
                        : "bg-gray-300 w-2.5 h-2.5 hover:bg-gray-400"
                    }`}
                    data-testid={`testimonial-dot-${index}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start">
              <img 
                src={logoImage} 
                alt="UNKLASS" 
                className="h-10 invert brightness-200"
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
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center space-y-3">
            <p className="text-gray-300 text-sm font-medium">
              Vegaklass Learning Private Limited
            </p>
            <p className="text-gray-500 text-xs max-w-md mx-auto">
              Unit 101, Oxford Towers, 139, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560008
            </p>
            <p className="text-gray-600 text-xs">
              © 2025 Vegaklass Learning Private Limited. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
