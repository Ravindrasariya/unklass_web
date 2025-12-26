import { useQuery } from "@tanstack/react-query";
import { Crown, Medal, Trophy, Flame } from "lucide-react";

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
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden" data-testid={`leaderboard-${title.toLowerCase().replace(/\s+/g, '-')}`}>
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

export default function WeeklyLeaderboard() {
  const { data, isLoading } = useQuery<LeaderboardData>({
    queryKey: ['/api/leaderboard/weekly'],
    refetchInterval: 60000,
  });

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
  
  const activeCount = [hasBoardExam, hasCpct, hasNavodaya, hasChapterPractice].filter(Boolean).length;

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

        <div className={`grid gap-6 ${activeCount >= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : activeCount === 3 ? 'md:grid-cols-3' : activeCount === 2 ? 'md:grid-cols-2' : 'max-w-lg mx-auto'}`}>
          {hasBoardExam && (
            <LeaderboardCard 
              title="Board Exam Prep" 
              entries={data!.boardExam} 
              icon={Trophy}
              accentColor="bg-gradient-to-r from-sky-500 to-blue-600"
            />
          )}
          {hasCpct && (
            <LeaderboardCard 
              title="CPCT Exam Prep" 
              entries={data!.cpct} 
              icon={Trophy}
              accentColor="bg-gradient-to-r from-purple-500 to-indigo-600"
            />
          )}
          {hasNavodaya && (
            <LeaderboardCard 
              title="Navodaya Prep" 
              entries={data!.navodaya} 
              icon={Trophy}
              accentColor="bg-gradient-to-r from-sky-500 to-sky-600"
            />
          )}
          {hasChapterPractice && (
            <LeaderboardCard 
              title="Chapter Practice" 
              entries={data!.chapterPractice} 
              icon={Trophy}
              accentColor="bg-gradient-to-r from-violet-500 to-purple-600"
            />
          )}
        </div>
      </div>
    </section>
  );
}
