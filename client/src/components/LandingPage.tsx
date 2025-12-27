import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen, Monitor, GraduationCap, Shield, School, Bell, Library, User, LogOut, Award } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import WeeklyLeaderboard from "./WeeklyLeaderboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notice {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  isActive: boolean | null;
  priority: number | null;
  createdAt: string | null;
}

interface UnifiedStudent {
  id: number;
  name: string;
  fatherName: string | null;
  location: string | null;
  mobileNumber: string;
  schoolName?: string | null;
  dateOfBirth?: string | null;
  needsProfileCompletion?: boolean;
}
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
  onNavodayaClick: () => void;
  onChapterPracticeClick: () => void;
  unifiedStudent?: UnifiedStudent | null;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
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

export default function LandingPage({ 
  onBoardExamClick, 
  onCPCTClick, 
  onNavodayaClick, 
  onChapterPracticeClick,
  unifiedStudent,
  onLoginClick,
  onSignupClick,
  onProfileClick,
  onLogout
}: LandingPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentClassroom, setCurrentClassroom] = useState(0);

  const { data: notices } = useQuery<Notice[]>({
    queryKey: ["/api/notices"],
  });

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
  const [currentNoticeSlide, setCurrentNoticeSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonialImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate notices (show 2 at a time)
  const noticesPerSlide = 2;
  const totalNoticeSlides = notices ? Math.ceil(notices.length / noticesPerSlide) : 0;
  
  useEffect(() => {
    if (totalNoticeSlides > 1) {
      const timer = setInterval(() => {
        setCurrentNoticeSlide((prev) => (prev + 1) % totalNoticeSlides);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [totalNoticeSlides]);

  const nextNoticeSlide = () => {
    setCurrentNoticeSlide((prev) => (prev + 1) % totalNoticeSlides);
  };

  const prevNoticeSlide = () => {
    setCurrentNoticeSlide((prev) => (prev - 1 + totalNoticeSlides) % totalNoticeSlides);
  };

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
            
            {unifiedStudent ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="rounded-full bg-sky-100 text-sky-700"
                    data-testid="button-user-menu"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium text-gray-900">
                    {unifiedStudent.name}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onProfileClick}
                    className="cursor-pointer"
                    data-testid="menu-profile"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    data-testid="menu-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-700 font-medium text-xs sm:text-sm px-2 sm:px-3"
                  onClick={onLoginClick}
                  data-testid="button-login"
                >
                  Login
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="text-xs sm:text-sm px-2 sm:px-3"
                  onClick={onSignupClick}
                  data-testid="button-signup"
                >
                  Sign Up
                </Button>
              </div>
            )}
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

        {/* Notice Board Section */}
        {notices && notices.length > 0 && (
          <section className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 py-6 md:py-8 border-y border-amber-200/50">
            <div className="max-w-4xl mx-auto px-4">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Bell className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Notice Board</h3>
                </div>
                {totalNoticeSlides > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevNoticeSlide}
                      className="h-8 w-8 bg-amber-100 text-amber-700 rounded-full"
                      data-testid="button-prev-notice"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-amber-700 font-medium">
                      {currentNoticeSlide + 1}/{totalNoticeSlides}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextNoticeSlide}
                      className="h-8 w-8 bg-amber-100 text-amber-700 rounded-full"
                      data-testid="button-next-notice"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="relative overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentNoticeSlide * 100}%)` }}
                >
                  {Array.from({ length: totalNoticeSlides }).map((_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0">
                      <div className="grid gap-3 md:gap-4">
                        {notices
                          .slice(slideIndex * noticesPerSlide, (slideIndex + 1) * noticesPerSlide)
                          .map((notice) => (
                            <div
                              key={notice.id}
                              className="bg-white/80 backdrop-blur-sm rounded-xl p-4 md:p-5 shadow-sm border border-amber-100 transition-all hover:shadow-md hover:bg-white"
                              data-testid={`notice-display-${notice.id}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-1 h-full min-h-[40px] bg-gradient-to-b from-amber-400 to-orange-400 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-base md:text-lg">{notice.title}</h4>
                                  {notice.subtitle && (
                                    <p className="text-sm text-amber-700 font-medium mt-0.5">{notice.subtitle}</p>
                                  )}
                                  {notice.description && (
                                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{notice.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {totalNoticeSlides > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {Array.from({ length: totalNoticeSlides }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentNoticeSlide(index)}
                      className={`transition-all duration-300 rounded-full ${
                        currentNoticeSlide === index 
                          ? "bg-amber-500 w-6 h-2" 
                          : "bg-amber-300 w-2 h-2 hover:bg-amber-400"
                      }`}
                      data-testid={`notice-dot-${index}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

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

            <div className="grid md:grid-cols-2 gap-6 items-stretch">
              {/* 1. Board Exam - Light Violet */}
              <div 
                className="bg-white border border-violet-200 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-violet-100 hover:-translate-y-1 cursor-pointer group relative overflow-hidden flex flex-col"
                onClick={onBoardExamClick}
                data-testid="card-board-exam"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-100 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10 flex flex-col flex-1">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-100 to-violet-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <BookOpen className="w-8 h-8 text-violet-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                    UNKLASS Board Exam Prep
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 flex-1">
                    Prepare for 8th and 10th board exams with Exam Important Quizzes
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-medium py-5 rounded-xl shadow-lg shadow-violet-200 transition-all group-hover:shadow-xl mt-auto"
                    data-testid="button-board-exam"
                  >
                    Start Preparation
                  </Button>
                </div>
              </div>

              {/* 2. Chapter Practice - Coming Soon */}
              <div 
                className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center relative overflow-hidden flex flex-col opacity-75"
                data-testid="card-chapter-practice"
              >
                <div className="absolute top-3 right-3 z-20">
                  <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col flex-1">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-100 rounded-2xl flex items-center justify-center shadow-sm">
                    <Library className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-500 mb-1">
                    UNKLASS Chapter Practice - NCERT
                  </h3>
                  <p className="text-gray-400 text-xs font-medium mb-2">
                    6th to 10th Grade
                  </p>
                  <p className="text-gray-400 text-sm mb-4 flex-1">
                    Practice chapter-wise questions from NCERT textbooks
                  </p>
                  <Button 
                    className="w-full bg-gray-300 text-gray-500 font-medium py-5 rounded-xl cursor-not-allowed mt-auto"
                    disabled
                    data-testid="button-chapter-practice"
                  >
                    Coming Soon
                  </Button>
                </div>
              </div>

              {/* 3. CPCT - Blue */}
              <div 
                className="bg-white border border-sky-100 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-sky-100 hover:-translate-y-1 cursor-pointer group relative overflow-hidden flex flex-col"
                onClick={onCPCTClick}
                data-testid="card-cpct"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-100 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10 flex flex-col flex-1">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sky-100 to-sky-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Monitor className="w-8 h-8 text-sky-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                    UNKLASS MP CPCT Exam Prep
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 flex-1">
                    Prepare for Madhya Pradesh Computer Proficiency Certification Test
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-medium py-5 rounded-xl shadow-lg shadow-sky-200 transition-all group-hover:shadow-xl mt-auto"
                    data-testid="button-cpct"
                  >
                    Start Preparation
                  </Button>
                </div>
              </div>

              {/* 4. Navodaya - Blue */}
              <div 
                className="bg-white border border-sky-100 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-sky-100 hover:-translate-y-1 cursor-pointer group relative overflow-hidden flex flex-col"
                onClick={onNavodayaClick}
                data-testid="card-navodaya"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-100 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10 flex flex-col flex-1">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sky-100 to-sky-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <School className="w-8 h-8 text-sky-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                    UNKLASS Navodaya Exam Prep
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 flex-1">
                    Prepare for Jawahar Navodaya Vidyalaya entrance examinations
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-medium py-5 rounded-xl shadow-lg shadow-sky-200 transition-all group-hover:shadow-xl mt-auto"
                    data-testid="button-navodaya"
                  >
                    Start Preparation
                  </Button>
                </div>
              </div>

              {/* 5. Olympiad - Coming Soon */}
              <div 
                className="bg-white border border-amber-200 rounded-2xl p-6 text-center relative overflow-hidden flex flex-col opacity-75"
                data-testid="card-olympiad"
              >
                <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full z-20">
                  Coming Soon
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col flex-1">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center shadow-sm">
                    <Award className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
                    UNKLASS Olympiad Exam Prep
                  </h3>
                  <p className="text-amber-600 text-xs font-medium mb-2">
                    3rd to 12th Grade
                  </p>
                  <p className="text-gray-600 text-sm mb-4 flex-1">
                    Prepare for Science, Math & other Olympiad competitions
                  </p>
                  <Button 
                    className="w-full bg-gray-300 text-gray-500 font-medium py-5 rounded-xl cursor-not-allowed mt-auto"
                    disabled
                    data-testid="button-olympiad"
                  >
                    Coming Soon
                  </Button>
                </div>
              </div>

              {/* 6. MP Police - Coming Soon */}
              <div 
                className="bg-white border border-amber-200 rounded-2xl p-6 text-center relative overflow-hidden flex flex-col opacity-75"
                data-testid="card-police"
              >
                <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full z-20">
                  Coming Soon
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col flex-1">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center shadow-sm">
                    <Shield className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                    UNKLASS MP Police Exam Prep
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 flex-1">
                    Prepare for Madhya Pradesh Police recruitment examinations
                  </p>
                  <Button 
                    className="w-full bg-gray-300 text-gray-500 font-medium py-5 rounded-xl cursor-not-allowed mt-auto"
                    disabled
                    data-testid="button-police"
                  >
                    Coming Soon
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <WeeklyLeaderboard />

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

        <section className="bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 py-14 md:py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(0,0,0,0.1)_0%,transparent_50%)]"></div>
          <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Interested in Learning More?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
              Book a free demo class and experience our teaching methodology firsthand
            </p>
            <Link href="/contact">
              <Button 
                className="bg-white text-sky-600 hover:bg-gray-100 font-semibold px-8 py-6 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105"
                data-testid="button-book-demo"
              >
                Contact Us to Book a Demo
              </Button>
            </Link>
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
