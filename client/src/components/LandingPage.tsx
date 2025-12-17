import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import logoImage from "@assets/Screenshot_2025-12-11_at_12.16.26_AM_1765392397522.png";
import studentImage from "@assets/Screenshot_2025-12-17_at_6.41.41_AM_1765934337756.png";

interface LandingPageProps {
  onBoardExamClick: () => void;
  onCPCTClick: () => void;
}

const sliderContent = [
  {
    text: "Enabling quality education with the help of technology in remotest part of the India",
    lang: "en",
  },
  {
    text: "भारत के सुदूर क्षेत्रों में प्रौद्योगिकी की मदद से गुणवत्तापूर्ण शिक्षा को सक्षम बनाना",
    lang: "hi",
  },
];

export default function LandingPage({ onBoardExamClick, onCPCTClick }: LandingPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderContent.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-gray-100 py-3 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img 
              src={logoImage} 
              alt="Unklass" 
              className="h-8"
              data-testid="img-logo-header"
            />
            <span className="text-sm text-gray-600 tracking-tight">Learning Beyond Classroom</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="relative bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="relative min-h-[120px] flex items-center justify-center md:justify-start">
                  <div className="relative w-full">
                    {sliderContent.map((slide, index) => (
                      <p
                        key={index}
                        className={`text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed transition-all duration-500 ${
                          currentSlide === index 
                            ? "opacity-100 translate-x-0" 
                            : "opacity-0 absolute top-0 left-0 right-0 translate-x-4"
                        }`}
                        data-testid={`slider-text-${index}`}
                      >
                        {slide.text}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-4 mt-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevSlide}
                    className="bg-white/20 text-white border-0"
                    data-testid="button-prev-slide"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex gap-2">
                    {sliderContent.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          currentSlide === index ? "bg-white" : "bg-white/40"
                        }`}
                        data-testid={`slider-dot-${index}`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextSlide}
                    className="bg-white/20 text-white border-0"
                    data-testid="button-next-slide"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-shrink-0">
                <img 
                  src={studentImage} 
                  alt="Student learning" 
                  className="w-64 h-64 md:w-80 md:h-80 object-contain"
                  data-testid="img-student"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 bg-white py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Choose Your Learning Path
              </h2>
              <p className="text-gray-600">
                Select a program to begin your journey towards success
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div 
                className="bg-white border-2 border-sky-200 rounded-xl p-6 text-center transition-all hover:border-sky-400 hover:shadow-lg cursor-pointer group"
                onClick={onBoardExamClick}
                data-testid="card-board-exam"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-sky-100 rounded-full flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                  <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  UNKLASS Board Exam Prep
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Prepare for 8th, 10th, and 12th board exams with AI-powered quizzes
                </p>
                <Button 
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                  data-testid="button-board-exam"
                >
                  Start Preparation
                </Button>
              </div>

              <div 
                className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center transition-all hover:border-sky-400 hover:shadow-lg cursor-pointer group"
                onClick={onCPCTClick}
                data-testid="card-cpct"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                  <svg className="w-8 h-8 text-gray-600 group-hover:text-sky-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  MP CPCT
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Prepare for Madhya Pradesh Computer Proficiency Certification Test
                </p>
                <Button 
                  variant="outline"
                  className="w-full border-sky-500 text-sky-600 hover:bg-sky-50"
                  data-testid="button-cpct"
                >
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img 
              src={logoImage} 
              alt="Unklass" 
              className="h-6 invert"
              data-testid="img-logo-footer"
            />
            <span className="text-sm text-gray-400 tracking-tight">Learning Beyond Classroom</span>
          </div>
          <p className="text-gray-500 text-sm">
            Empowering students across India with quality education
          </p>
        </div>
      </footer>
    </div>
  );
}
