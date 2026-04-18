'use client';

import { useRouter } from 'next/navigation';

const stations = [
  { id: 'kajang-1', name: 'Kajang', line: 'Kajang Line', lat: 2.7167, lng: 101.8333 },
  { id: 'kajang-2', name: 'Serdang', line: 'Kajang Line', lat: 2.7333, lng: 101.8167 },
  { id: 'putrajaya-1', name: 'Putrajaya Sentral', line: 'Putrajaya Line', lat: 2.7263, lng: 101.6964 },
  { id: 'putrajaya-2', name: 'Putrajaya Station', line: 'Putrajaya Line', lat: 2.7297, lng: 101.6877 },
];

export function MRTMap() {
  const router = useRouter();

  const handleStationClick = (stationId: string) => {
    router.push(`/station/${stationId}`);
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-sm border-2 border-white min-h-96">
      <div className="grid grid-cols-2 gap-4">
        {stations.map((station) => (
          <button
            key={station.id}
            onClick={() => handleStationClick(station.id)}
            className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 hover:shadow-md hover:scale-105 transition-all border-2 border-blue-200"
          >
            <div className="text-3xl mb-2">🚇</div>
            <div className="font-bold text-slate-800">{station.name}</div>
            <div className="text-xs text-slate-600">{station.line}</div>
          </button>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-slate-600">
        Tap a station to see heritage sites
      </div>
    </div>
  );
}
