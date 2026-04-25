'use client';

import { useRouter } from 'next/navigation';

type LineId = 'kajang' | 'putrajaya';

interface Station {
  id: string;
  name: string;
  active: boolean;
}

interface MRTMapProps {
  selectedLine: LineId;
  stations: Station[];
  lineLabel: string;
  colorClass: string;
  accentClass: string;
  isActiveOnly: boolean;
  onToggle: (isActiveOnly: boolean) => void;
}

export function MRTMap({ selectedLine, stations, lineLabel, colorClass, accentClass, isActiveOnly, onToggle }: MRTMapProps) {
  const router = useRouter();

  const handleStationClick = (stationId: string) => {
    router.push(`/station/${stationId}`);
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-sm border-2 border-white min-h-104">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Line map</p>
            <h2 className="text-2xl font-bold text-slate-900">{lineLabel}</h2>
          </div>
          <div className={`rounded-full px-3 py-1 text-sm font-semibold text-white ${accentClass}`}>
            {lineLabel}
          </div>
        </div>
        <div className="flex items-center justify-between w-full p-2">
          <span className="text-sm font-medium text-slate-600">Show verified stops</span>
          
          <button
            onClick={() => onToggle(!isActiveOnly)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              isActiveOnly ? 'bg-pink-300' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isActiveOnly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="relative py-10">
          <div className={`absolute top-8 left-10 h-full w-2 rounded-full bg-linear-to-b ${colorClass}`} />

          {stations.length > 0 ? (
            <div className="relative flex flex-col items-start gap-8 px-6">
              {stations.map((station) => {
                const isDisabled = !station.active;

                return (
                  <div key={station.id} className="flex items-center gap-4 w-full max-w-xl mx-auto pl-10">
                    {/*Line dot with accent */}
                    <div className="relative flex items-center justify-center w-10">
                      {/*round dot on the line */}
                      <span
                        className={`absolute top-1/2 -translate-x-10 -translate-y-1/2 h-5 w-5 rounded-full transition-transform ${isDisabled ? 'bg-slate-300' : `${accentClass} opacity-90`} ${isDisabled ? '' : 'hover:scale-110'}`}
                      />
                    </div>
                    {/* // Station button */}
                    <button
                      type="button"
                      onClick={() => !isDisabled && handleStationClick(station.id)}
                      disabled={isDisabled}
                      className={`flex-1 rounded-xl -translate-x-10 bg-white/90 px-4 py-3 shadow-sm border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 text-left overflow-hidden transition ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                    >
                      <span className={`text-sm font-medium truncate ${isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>
                        {station.name}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pt-12 text-center text-sm text-slate-500">
              No stations found for this line.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
