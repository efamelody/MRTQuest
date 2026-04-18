import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import { HeritageSite } from '@/components/HeritageSite';
import { TabBar } from '@/components/TabBar';

// Mock heritage sites by station
const stationHeritageSites: { [key: string]: any[] } = {
  'kajang-1': [
    {
      id: '1',
      name: 'Ujana Mosque',
      description: 'Historic mosque with traditional architecture',
      image: '🕌',
      rating: 4,
    },
    {
      id: '2',
      name: 'Kajang Plaza',
      description: 'Historic trading center',
      image: '🏛️',
      rating: 3,
    },
  ],
  'putrajaya-1': [
    {
      id: '3',
      name: 'Putrajaya Mosque',
      description: 'Grand modern Islamic architecture',
      image: '🕌',
      rating: 5,
    },
    {
      id: '4',
      name: 'Prime Minister\'s Office',
      description: 'Administrative landmark',
      image: '🏢',
      rating: 4,
    },
  ],
};

interface PageProps {
  params: Promise<{ stationId: string }>;
}

export default async function StationPage({ params }: PageProps) {
  const { stationId } = await params;
  const sites = stationHeritageSites[stationId] || [];

  const stationName = stationId
    ?.split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto pb-20">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b-2 border-white px-4 py-4 sticky top-0 z-10">
        <Link
          href="/explore"
          className="flex items-center gap-2 text-slate-700 hover:text-[#00A959] transition-colors mb-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Map</span>
        </Link>
        <h1 className="text-2xl">Heritage Sites Near</h1>
        <p className="text-lg text-[#00A959] flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {stationName} 🚇
        </p>
      </div>

      {/* Heritage Sites */}
      <div className="flex-1 px-4 py-6">
        <div className="space-y-4">
          {sites.map((site) => (
            <HeritageSite
              key={site.id}
              {...site}
              onCheckIn={() => {
                console.log(`Checked in at ${site.name}`);
                // TODO: integrate with Supabase
              }}
              onGetDirections={() => {
                console.log(`Opening directions to ${site.name}`);
                // TODO: integrate with Google Maps API
              }}
              onCardClick={() => {
                console.log(`Viewing details for ${site.name}`);
              }}
            />
          ))}
        </div>

        {sites.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-slate-600">No heritage sites found nearby</p>
            <p className="text-sm text-slate-500 mt-2">Check back soon for updates!</p>
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
}
