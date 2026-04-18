'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MRTMap } from '@/components/MRTMap';

const lineTabs = [
  { id: 'kajang', label: 'Kajang Line' },
  { id: 'putrajaya', label: 'Putrajaya Line' },
] as const;

type LineId = (typeof lineTabs)[number]['id'];

type Station = {
  id: string;
  name: string;
};

const lineMeta: Record<LineId, { label: string; colorClass: string; accentClass: string }> = {
  kajang: {
    label: 'Kajang Line',
    colorClass: 'from-emerald-400 to-emerald-600',
    accentClass: 'bg-emerald-500',
  },
  putrajaya: {
    label: 'Putrajaya Line',
    colorClass: 'from-amber-400 to-yellow-500',
    accentClass: 'bg-yellow-500',
  },
};

const supabase = createClient();

export default function ExplorePage() {
  const [activeLine, setActiveLine] = useState<LineId>('kajang');
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('stations')
        .select('id,name,sequence_order')
        .eq('line', activeLineMeta.label)
        .order('sequence_order', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setStations([]);
      } else {
        setStations(data ?? []);
      }

      setIsLoading(false);
    };

    fetchStations();
  }, [activeLine]);

  const activeLineMeta = lineMeta[activeLine];
  //TODO: CALL API FOR STATIONS TIME
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          <div className="inline-flex rounded-3xl bg-white/80 p-1 shadow-sm border border-white">
            {lineTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveLine(tab.id)}
                className={`px-4 py-3 text-sm font-semibold transition-all rounded-3xl ${
                  activeLine === tab.id
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* MRT Map */}
        <div className="px-4">
          <MRTMap
            selectedLine={activeLine}
            stations={stations}
            lineLabel={activeLineMeta.label}
            colorClass={activeLineMeta.colorClass}
            accentClass={activeLineMeta.accentClass}
          />
          {isLoading && (
            <p className="mt-4 text-sm text-slate-500">Loading stations…</p>
          )}
          {error && (
            <p className="mt-4 text-sm text-red-600">Unable to load stations: {error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
