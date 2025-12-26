import { useQuery } from "@tanstack/react-query";
import { Crown, Medal, Trophy, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  rank: number;
  studentId: number;
  studentName: string;
  accuracy: number;
  totalScore: number;
  totalQuestions: number;
  testsCompleted: number;
}

interface LeaderboardData {
  weekStart: string;
  weekEnd: string;
  boardExam: LeaderboardEntry[];
  cpct: LeaderboardEntry[];
  navodaya: LeaderboardEntry[];
  chapterPractice: LeaderboardEntry[];
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
}

function getRankBgColor(rank: number) {
  if (rank === 1) return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
  if (rank === 2) return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
  if (rank === 3) return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200";
  return "bg-white border-gray-100";
}

function LeaderboardCard({ 
  title, 
  entries, 
  icon: Icon,
  accentColor 
}: { 
  title: string; 
  entries: LeaderboardEntry[];
  icon: typeof Trophy;
  accentColor: string;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden h-full" data-testid={`leaderboard-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className={`${accentColor} px-6 py-4 flex items-center gap-3`}>
        <div className="bg-white/20 p-2 rounded-lg">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-white/80 text-sm">Top Performers This Week</p>
        </div>
        <div className="ml-auto">
          <Flame className="w-8 h-8 text-orange-300 animate-pulse" />
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        {entries.map((entry) => (
          <div 
            key={entry.studentId}
            className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:shadow-md ${getRankBgColor(entry.rank)}`}
            data-testid={`leaderboard-entry-${entry.studentId}`}
          >
            <div className="flex-shrink-0">
              {getRankIcon(entry.rank)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{entry.studentName}</p>
              <p className="text-xs text-gray-500">{entry.testsCompleted} test{entry.testsCompleted > 1 ? 's' : ''} completed</p>
            </div>
            
            <div className="flex-shrink-0 text-right">
              <div className={`text-lg font-bold ${entry.accuracy >= 80 ? 'text-green-600' : entry.accuracy >= 60 ? 'text-yellow-600' : 'text-gray-600'}`}>
                {entry.accuracy}%
              </div>
              <p className="text-xs text-gray-400">accuracy</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CarouselDotsProps {
  selectedIndex: number;
  scrollSnaps: number[];
  onDotClick: (index: number) => void;
}

function CarouselDots({ selectedIndex, scrollSnaps, onDotClick }: CarouselDotsProps) {
  return (
    <div className="flex justify-center gap-2 mt-4">
      {scrollSnaps.map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            index === selectedIndex 
              ? 'bg-primary w-6' 
              : 'bg-gray-300 hover:bg-gray-400'
          }`}
          data-testid={`carousel-dot-${index}`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}

export default function WeeklyLeaderboard() {
  const { data, isLoading } = useQuery<LeaderboardData>({
    queryKey: ['/api/leaderboard/weekly'],
    refetchInterval: 60000,
  });

  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    loop: true,
  }, [autoplayPlugin.current]);
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const hasBoardExam = data?.boardExam && data.boardExam.length > 0;
  const hasCpct = data?.cpct && data.cpct.length > 0;
  const hasNavodaya = data?.navodaya && data.navodaya.length > 0;
  const hasChapterPractice = data?.chapterPractice && data.chapterPractice.length > 0;
  
  if (isLoading) {
    return (
      <section className="bg-gradient-to-b from-white to-gray-50 py-14 md:py-18">
        <div className="max-w-5xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="h-80 bg-gray-200 rounded-2xl"></div>
              <div className="h-80 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!hasBoardExam && !hasCpct && !hasNavodaya && !hasChapterPractice) {
    return null;
  }
  
  const activeCards = [
    hasBoardExam && { 
      title: "Board Exam Prep", 
      entries: data!.boardExam, 
      accentColor: "bg-gradient-to-r from-sky-500 to-blue-600" 
    },
    hasCpct && { 
      title: "CPCT Exam Prep", 
      entries: data!.cpct, 
      accentColor: "bg-gradient-to-r from-purple-500 to-indigo-600" 
    },
    hasNavodaya && { 
      title: "Navodaya Prep", 
      entries: data!.navodaya, 
      accentColor: "bg-gradient-to-r from-sky-500 to-sky-600" 
    },
    hasChapterPractice && { 
      title: "Chapter Practice", 
      entries: data!.chapterPractice, 
      accentColor: "bg-gradient-to-r from-violet-500 to-purple-600" 
    },
  ].filter(Boolean) as { title: string; entries: LeaderboardEntry[]; accentColor: string }[];

  const activeCount = activeCards.length;
  const useCarousel = activeCount > 2;

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-14 md:py-18 relative overflow-hidden" data-testid="section-weekly-leaderboard">
      <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-sky-100 rounded-full blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>
      
      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-amber-100 px-4 py-1.5 rounded-full text-sm text-amber-700 mb-4 border border-amber-200">
            <Trophy className="w-4 h-4" />
            <span>Weekly Champions</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Leaderboard
          </h2>
          <p className="text-gray-600">
            {data?.weekStart} - {data?.weekEnd}
          </p>
        </div>

        {useCarousel ? (
          <>
            {/* Mobile: Stack all cards */}
            <div className="md:hidden space-y-6">
              {activeCards.map((card) => (
                <LeaderboardCard 
                  key={card.title}
                  title={card.title} 
                  entries={card.entries} 
                  icon={Trophy}
                  accentColor={card.accentColor}
                />
              ))}
            </div>

            {/* Desktop: Carousel showing 2 at a time */}
            <div className="hidden md:block relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-6">
                  {activeCards.map((card) => (
                    <div 
                      key={card.title} 
                      className="flex-[0_0_calc(50%-12px)] min-w-0"
                    >
                      <LeaderboardCard 
                        title={card.title} 
                        entries={card.entries} 
                        icon={Trophy}
                        accentColor={card.accentColor}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation arrows */}
              <Button
                variant="outline"
                size="icon"
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg z-10 rounded-full ${!canScrollPrev ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                data-testid="carousel-prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg z-10 rounded-full ${!canScrollNext ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={scrollNext}
                disabled={!canScrollNext}
                data-testid="carousel-next"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>

              {/* Dots indicator */}
              <CarouselDots 
                selectedIndex={selectedIndex}
                scrollSnaps={scrollSnaps}
                onDotClick={scrollTo}
              />
            </div>
          </>
        ) : (
          /* 1-2 cards: Regular grid layout */
          <div className={`grid gap-6 ${activeCount === 2 ? 'md:grid-cols-2' : 'max-w-lg mx-auto'}`}>
            {activeCards.map((card) => (
              <LeaderboardCard 
                key={card.title}
                title={card.title} 
                entries={card.entries} 
                icon={Trophy}
                accentColor={card.accentColor}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
