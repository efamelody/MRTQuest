import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/utils/auth';
import { prisma } from '@/utils/prisma';
import QuizCard from '@/components/QuizCard';

interface PageProps {
  params: Promise<{ attractionId: string }>;
}

export default async function QuizPage({ params }: PageProps) {
  const { attractionId } = await params;

  // Fetch attraction and quizzes in parallel using Prisma
  const [attraction, quizzes] = await Promise.all([
    prisma.attraction.findUnique({
      where: { id: attractionId },
      select: {
        id: true,
        name: true,
        has_quiz_challenge: true,
        stationId: true,
      },
    }),
    prisma.quiz.findMany({
      where: { siteId: attractionId },
      select: {
        id: true,
        siteId: true,
        question: true,
        correctAnswer: true,
        options: true,
        sortOrder: true,
        points: true,
      },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  if (!attraction || !attraction.has_quiz_challenge) {
    notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user has a geofence visit at this attraction (Session-based filter: "New RLS")
  const geofenceVisit = await prisma.visit.findFirst({
    where: {
      userId: session.user.id,  // ← userId from session (Better Auth)
      siteId: attractionId,
      verificationType: 'geofence',
    },
    select: { id: true },
  });

  // Map quiz data to component format
  const formattedQuizzes = quizzes.map((q) => ({
    id: q.id,
    question: q.question,
    correctAnswer: q.correctAnswer,
    options: (q.options as string[]) || [],
    sortOrder: q.sortOrder ?? 0,
    points: q.points,
  }));

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto">
      <div className="px-4 pt-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/station/${attraction.stationId}`}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Bonus Challenge</p>
            <h1 className="text-lg font-bold text-heading">{attraction.name}</h1>
          </div>
        </div>

        {!geofenceVisit ? (
          <div className="rounded-3xl bg-white/80 p-8 text-center border border-slate-200 shadow-sm">
            <p className="text-4xl mb-4">🔒</p>
            <p className="font-semibold text-slate-700 mb-1">Check In First</p>
            <p className="text-sm text-slate-500 mb-5">
              You need to check in at this location before taking the quiz.
            </p>
            <Link
              href={`/station/${attraction.stationId}`}
              className="inline-block rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white"
            >
              Go to Station
            </Link>
          </div>
        ) : (
          <QuizCard
            attractionId={attractionId}
            attractionName={attraction.name}
            quizzes={quizzes}
            hasQuizChallenge={true}
          />
        )}
      </div>
    </div>
  );
}
