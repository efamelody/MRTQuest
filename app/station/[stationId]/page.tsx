import { ArrowLeft, MapPin, Map } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { StationSitesList } from '@/components/StationSitesList';

interface PageProps {
  params: Promise<{ stationId: string }>;
}

interface AttractionRow {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  google_map: string | null;
  latitude: number | null;
  longitude: number | null;
  check_in_radius: number | null;
  has_quiz_challenge: boolean | null;
  has_photo_challenge: boolean | null;
}

interface QuizRow {
  id: string;
  site_id: string;
  question: string;
  correct_answer: string;
  options: string[];
  sort_order: number | null;
  points: number | null;
}

export default async function StationPage({ params }: PageProps) {
  const { stationId } = await params;
  const supabase = createClient();

  const [{ data: stationData }, { data: siteData }, { data: quizData }] = await Promise.all([
    supabase.from('stations').select('name').eq('id', stationId).single(),
    supabase
      .from('attractions')
      .select('id,name,description,image_url,google_map,latitude,longitude,check_in_radius,has_quiz_challenge,has_photo_challenge')
      .eq('station_id', stationId)
      .eq('is_verified', true)
      .order('name', { ascending: true }),
    supabase
      .from('quizzes')
      .select('id,site_id,question,correct_answer,options,sort_order,points')
      .order('sort_order', { ascending: true }),
  ]);

  const stationName = stationData?.name ??
    (stationId
      ? stationId
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'Unknown Station');

  // Group quizzes by site_id for easy lookup
  const quizzesByAttraction = (quizData ?? []).reduce(
    (acc, quiz: QuizRow) => {
      if (!acc[quiz.site_id]) {
        acc[quiz.site_id] = [];
      }
      acc[quiz.site_id].push({
        id: quiz.id,
        question: quiz.question,
        correctAnswer: quiz.correct_answer,
        options: quiz.options || [],
        sortOrder: quiz.sort_order || 0,
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

  const attractions = (siteData ?? []).map((site: AttractionRow) => ({
    id: site.id,
    name: site.name,
    description: site.description ?? 'No description available.',
    image: site.image_url ?? undefined,
    googleMap: site.google_map ?? undefined,
    latitude: site.latitude ?? undefined,
    longitude: site.longitude ?? undefined,
    checkInRadius: site.check_in_radius ?? 300,
    hasQuizChallenge: site.has_quiz_challenge ?? false,
    hasPhotoChallenge: site.has_photo_challenge ?? false,
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

        <StationSitesList sites={attractions} />

        {attractions.length === 0 && (
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
