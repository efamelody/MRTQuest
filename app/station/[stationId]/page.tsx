import { ArrowLeft, MapPin, Map } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/utils/prisma';
import { StationSitesList } from '@/components/StationSitesList';

interface PageProps {
  params: Promise<{ stationId: string }>;
}

export default async function StationPage({ params }: PageProps) {
  const { stationId } = await params;

  // Fetch station, attractions, and quizzes in parallel using Prisma
  const [station, attractions, quizzes] = await Promise.all([
    prisma.station.findUnique({
      where: { id: stationId },
      select: { name: true },
    }),
    prisma.attraction.findMany({
      where: {
        stationId,
        isVerified: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        googleMap: true,
        latitude: true,
        longitude: true,
        checkInRadius: true,
        has_quiz_challenge: true,
        has_photo_challenge: true,
        ai_prompt: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.quiz.findMany({
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

  const stationName = station?.name ??
    (stationId
      ? stationId
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'Unknown Station');

  // Group quizzes by siteId for easy lookup
  const quizzesByAttraction = quizzes.reduce(
    (acc, quiz) => {
      if (!acc[quiz.siteId]) {
        acc[quiz.siteId] = [];
      }
      acc[quiz.siteId].push({
        id: quiz.id,
        question: quiz.question,
        correctAnswer: quiz.correctAnswer,
        options: quiz.options || [],
        sortOrder: quiz.sortOrder || 0,
        points: quiz.points,
      });
      return acc;
    },
    {} as Record<string, Array<{
      id: string;
      question: string;
      correctAnswer: string;
      options: string[];
      sortOrder: number;
      points: number | null;
    }>>
  );

  const attractionsList = attractions.map((site) => ({
    id: site.id,
    name: site.name,
    description: site.description ?? 'No description available.',
    image: site.imageUrl ?? undefined,
    googleMap: site.googleMap ?? undefined,
    latitude: site.latitude ?? undefined,
    longitude: site.longitude ?? undefined,
    checkInRadius: site.checkInRadius ?? 300,
    hasQuizChallenge: site.has_quiz_challenge ?? false,
    hasPhotoChallenge: site.has_photo_challenge ?? false,
    photoPrompt: site.ai_prompt ?? undefined,
    quizzes: quizzesByAttraction[site.id] ?? [],
  }));

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto pb-20">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b-2 border-white px-4 py-4 sticky top-0 z-10 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-700 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Map</span>
        </Link>
        <p className="text-lg text-heading flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {stationName}
        </p>
      </div>

      {/* Attractions */}
      <div className="flex-1 px-4 py-6">
        <div className="mb-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <MapPin className="w-10 h-7 text-heading" />
              <h1 className="text-3xl font-serif text-heading">
                {stationName}
              </h1>
            </div>
          </div>
        </div>

        <StationSitesList sites={attractionsList} />

        {attractionsList.length === 0 && (
          <div className="text-center py-12">
            <Map className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No attractions found nearby</p>
            <p className="text-sm text-slate-500 mt-2">Check back soon for updates!</p>
          </div>
        )}
      </div>
    </div>
  );
}
