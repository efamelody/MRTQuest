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
}

export default async function StationPage({ params }: PageProps) {
  const { stationId } = await params;
  const supabase = createClient();

  const [{ data: stationData }, { data: siteData }] = await Promise.all([
    supabase.from('stations').select('name').eq('id', stationId).single(),
    supabase
      .from('attractions')
      .select('id,name,description,image_url,google_map')
      .eq('station_id', stationId)
      .order('name', { ascending: true }),
  ]);

  const stationName = stationData?.name ??
    (stationId
      ? stationId
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'Unknown Station');

  const attractions = (siteData ?? []).map((site: AttractionRow) => ({
    id: site.id,
    name: site.name,
    description: site.description ?? 'No description available.',
    image: site.image_url ?? undefined,
    googleMap: site.google_map ?? undefined,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto pb-20">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b-2 border-white px-4 py-4 sticky top-0 z-10 flex items-center justify-between">
        <Link
          href="/explore"
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
