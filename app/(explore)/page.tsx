'use client';

import { useEffect, useState } from 'react';
import { MRTMap } from '@/components/MRTMap';
import { SuggestionForm } from '@/components/SuggestionForm';
import { Lightbulb, PlusCircle } from 'lucide-react';

// import Button from '@/components/Button';

const lineTabs = [
  { id: 'kajang', label: 'Kajang Line' },
  { id: 'putrajaya', label: 'Putrajaya Line' },
] as const;

type LineId = (typeof lineTabs)[number]['id'];

type Station = {
  id: string;
  name: string;
  active: boolean;
  line: string;
  sequenceOrder: number | null;
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

export default function ExplorePage() {
  const [activeLine, setActiveLine] = useState<LineId>('kajang');
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuggestionFormOpen, setIsSuggestionFormOpen] = useState(false);
  const [isActiveOnly, setIsActiveOnly] = useState(true);

  useEffect(() => {
    const fetchStations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/stations');
        if (!response.ok) throw new Error('Failed to fetch stations');
        const data = await response.json();
        
        // Filter by active line and sort
        const lineLabel = lineMeta[activeLine].label;
        const filtered = (data.stations ?? [])
          .filter((s: Station) => s.line === lineLabel)
          .sort((a: Station, b: Station) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));
        
        setStations(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStations([]);
      }

      setIsLoading(false);
    };

    fetchStations();
  }, [activeLine]);

  const activeLineMeta = lineMeta[activeLine];
  const filteredStations = isActiveOnly
    ? stations.filter((s) => s.active)
    : stations;
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
            stations={filteredStations}
            lineLabel={activeLineMeta.label}
            colorClass={activeLineMeta.colorClass}
            accentClass={activeLineMeta.accentClass}
            isActiveOnly={isActiveOnly}
            onToggle={setIsActiveOnly}
          />
          {isLoading && (
            <p className="mt-4 text-sm text-slate-500">Loading stations…</p>
          )}
          {error && (
            <p className="mt-4 text-sm text-red-600">Unable to load stations: {error}</p>
          )}
        </div>

        {/* Suggestion Button */}
        <div className="justify-end px-6 mt-6 pb-4">
          <button
            onClick={() => setIsSuggestionFormOpen(true)}
            className="ml-auto flex-1 mt-6 border-2 border-dashed border-slate-300 bg-white/40 p-4 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:border-primary hover:text-primary transition-all active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="font-semibold">Suggest a hidden gem</span>
          </button>
        </div>
      </div>

      {/* Suggestion Form Modal */}
      <SuggestionForm
        isOpen={isSuggestionFormOpen}
        onClose={() => setIsSuggestionFormOpen(false)}
        onSuccess={() => {
          // Refresh stations list after successful suggestion
          setActiveLine(activeLine);
        }}
      />
    </div>
  );
}
