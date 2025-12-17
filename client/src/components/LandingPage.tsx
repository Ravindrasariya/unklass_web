import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/Screenshot_2025-12-11_at_12.16.26_AM_1765392397522.png";
import studentImage from "@assets/Screenshot_2025-12-17_at_6.41.41_AM_1765934337756.png";
import classroom1 from "@assets/Screenshot_2025-12-17_at_2.54.23_PM_1765963603824.png";
import classroom2 from "@assets/Screenshot_2025-12-17_at_2.55.03_PM_1765963603824.png";

const classroomImages = [classroom1, classroom2];

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

  const nextClassroom = () => {
    setCurrentClassroom((prev) => (prev + 1) % classroomImages.length);
  };

  const prevClassroom = () => {
    setCurrentClassroom((prev) => (prev - 1 + classroomImages.length) % classroomImages.length);
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
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-gray-100 py-3 md:py-4 px-3 md:px-4 sticky top-0 z-50">
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
        <section className="relative bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 relative z-10">
            <div className="text-center">
              <div className="relative min-h-[80px] md:min-h-[100px] flex items-center justify-center">
                <div className="relative w-full">
                  {sliderContent.map((slide, index) => (
                    <div
                      key={index}
                      className={`transition-all duration-500 ${
                        currentSlide === index 
                          ? "opacity-100 translate-x-0" 
                          : "opacity-0 absolute top-0 left-0 right-0 translate-x-4"
                      }`}
                      data-testid={`slider-text-${index}`}
                    >
                      <p className="text-base md:text-lg lg:text-xl font-medium leading-relaxed">
                        {slide.author ? `"${slide.text}"` : slide.text}
                      </p>
                      {slide.author && (
                        <div className="mt-2 text-sm md:text-base">
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

              <div className="flex items-center justify-center gap-3 mt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevSlide}
                  className="bg-white/20 text-white border-0 h-8 w-8"
                  data-testid="button-prev-slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-2">
                  {sliderContent.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
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
                  className="bg-white/20 text-white border-0 h-8 w-8"
                  data-testid="button-next-slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-8 md:py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6">
              Our Classrooms
            </h2>
            <div className="relative">
              <div className="overflow-hidden rounded-xl">
                <div className="relative aspect-video">
                  {classroomImages.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Classroom ${index + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                        currentClassroom === index ? "opacity-100" : "opacity-0"
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
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 h-10 w-10 rounded-full shadow-md"
                data-testid="button-prev-classroom"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextClassroom}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 h-10 w-10 rounded-full shadow-md"
                data-testid="button-next-classroom"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <div className="flex justify-center gap-2 mt-4">
                {classroomImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentClassroom(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      currentClassroom === index ? "bg-sky-500" : "bg-gray-300"
                    }`}
                    data-testid={`classroom-dot-${index}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-6 flex justify-center">
          <img 
            src={studentImage} 
            alt="Student learning" 
            className="w-48 h-48 md:w-56 md:h-56 object-contain"
            data-testid="img-student"
          />
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
                  Prepare for 8th, 10th, and 12th board exams with Exam Important Quizzes
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
                  UNKLASS MP CPCT Exam Prep
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Prepare for Madhya Pradesh Computer Proficiency Certification Test
                </p>
                <Button 
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                  data-testid="button-cpct"
                >
                  Start Preparation
                </Button>
              </div>
            </div>
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
          
          <div className="border-t border-gray-800 mt-6 pt-6 text-center space-y-2">
            <p className="text-gray-400 text-sm font-medium">
              Vegaklass Learning Private Limited
            </p>
            <p className="text-gray-500 text-xs max-w-md mx-auto">
              Unit 101, Oxford Towers, 139, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560008
            </p>
            <p className="text-gray-500 text-xs">
              © 2025 Vegaklass Learning Private Limited. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
