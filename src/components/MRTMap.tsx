'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Train, MapPin } from 'lucide-react';

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
  colorClass?: string;
  accentClass?: string;
  isActiveOnly: boolean;
  onToggle: (isActiveOnly: boolean) => void;
}

const stationCodes: Record<string, string> = {
  "kwasa-damansara": "KG01",
  "kampung-selamat": "KG02",
  "sungai-buloh": "KG03",
  "semantan": "KG04",
  "muzium-negara": "KG05",
  "pasar-seni": "KG06",
  "bukit-bintang": "KG07",
  "tun-razak-ex": "KG08",
  "tun-razak": "KG08",
  "kwasa-sentral": "PY01",
  "kota-damansara": "PY02",
  "bandar-utama": "PY03",
  "sentul-west": "PY04",
  "titiwangsa": "PY05",
  "maluri": "PY06",
  "putrajaya-sentral": "PY07",
};

const stationsWithQuests = new Set(["sungai-buloh", "pasar-seni", "bukit-bintang", "bandar-utama", "maluri"]);

const lineMeta: Record<LineId, { color: string; bg: string; border: string; glow: string; label: string }> = {
  kajang: {
    color: '#0D9488',
    bg: 'rgba(13,148,136,0.08)',
    border: 'rgba(13,148,136,0.25)',
    glow: 'rgba(13,148,136,0.5)',
    label: 'KAJANG LINE',
  },
  putrajaya: {
    color: '#FFB300',
    bg: 'rgba(255,179,0,0.08)',
    border: 'rgba(255,179,0,0.25)',
    glow: 'rgba(255,179,0,0.5)',
    label: 'PUTRAJAYA LINE',
  },
};

export function MRTMap({ selectedLine, stations, lineLabel, isActiveOnly, onToggle }: MRTMapProps) {
  const router = useRouter();
  const meta = lineMeta[selectedLine];

  const displayStations = useMemo(() => {
    if (isActiveOnly) return stations.filter((s) => s.active);
    return stations;
  }, [stations, isActiveOnly]);

  const handleStationClick = (stationId: string) => {
    router.push(`/station/${stationId}`);
  };

  const activeCount = stations.filter((s) => s.active).length;

  return (
    <div className="bg-white rounded-2xl border-[1.5px] border-[#0F172A] shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all">
      {/* ── Header with shimmer ── */}
      <div
        className="px-5 py-4 flex items-center justify-between border-b-[1.5px] border-[#0F172A]"
        style={{ background: meta.bg }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: meta.color, boxShadow: `0 0 8px ${meta.glow}` }}
          />
          <h3 className="font-fredoka text-base" style={{ color: meta.color }}>
            {lineLabel}
          </h3>
          <span
            className="font-fredoka text-[11px] px-2 py-0.5 rounded-md"
            style={{ color: meta.color, background: `${meta.color}15` }}
          >
            {activeCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-[#8B7E74]">Active</span>
          <button
            onClick={() => onToggle(!isActiveOnly)}
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
            style={{ background: isActiveOnly ? meta.color : '#E8E0D6' }}
          >
            <span
              className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm"
              style={{ transform: isActiveOnly ? 'translateX(20px)' : 'translateX(2px)' }}
            />
          </button>
        </div>
      </div>

      {/* ── Station List ── */}
      <div className="px-5 py-3">
        {displayStations.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#8B7E74] font-fredoka">
            No stations found
          </div>
        ) : (
          <div className="relative">
            {/* Vertical track line */}
            <div
              className="absolute left-[18px] top-3 bottom-3 w-[5px] rounded-full"
              style={{ background: `linear-gradient(180deg, ${meta.color}80, ${meta.color}40)` }}
            />

            <div className="space-y-1">
              {displayStations.map((station, idx) => {
                const code = stationCodes[station.id] || '';
                const isActive = station.active;
                const hasQuest = stationsWithQuests.has(station.id);

                return (
                  <button
                    key={station.id}
                    onClick={() => isActive && handleStationClick(station.id)}
                    disabled={!isActive}
                    className="relative w-full flex items-center gap-4 py-2.5 pl-[34px] pr-3 rounded-xl transition-all duration-200 group"
                    style={{
                      animation: `station-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 60}ms both`,
                      cursor: isActive ? 'pointer' : 'default',
                    }}
                    onMouseEnter={(e) => {
                      if (isActive) {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.background = meta.bg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.background = '';
                    }}
                  >
                    {/* Station dot on line */}
                    <div
                      className="absolute left-[18px] -translate-x-1/2 rounded-full transition-all duration-300"
                      style={{
                        width: isActive ? '18px' : '10px',
                        height: isActive ? '18px' : '10px',
                        background: isActive ? meta.color : '#D4CCC2',
                        border: `2px solid ${isActive ? meta.color : '#D4CCC2'}`,
                        boxShadow: isActive
                          ? `0 0 0 4px ${meta.bg}, 0 0 14px ${meta.glow}`
                          : 'none',
                        animation: isActive
                          ? selectedLine === 'kajang'
                            ? 'station-glow-teal 2.5s ease-in-out infinite'
                            : 'station-glow-gold 2.5s ease-in-out infinite'
                          : 'none',
                      }}
                    >
                      {/* Stamped checkpoint inner ring */}
                      {isActive && (
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            border: '2px solid rgba(255,255,255,0.75)',
                            margin: '3px',
                          }}
                        />
                      )}
                      {/* Quest blinking dot */}
                      {isActive && hasQuest && (
                        <div
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full anim-blink-dot"
                          style={{ background: '#FF6B6B', boxShadow: '0 0 6px rgba(255,107,107,0.6)' }}
                        />
                      )}
                    </div>

                    {/* Station code pill */}
                    <span
                      className="font-fredoka text-[11px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 transition-all"
                      style={{
                        color: isActive ? meta.color : '#B8ADA3',
                        background: isActive ? `${meta.color}12` : 'transparent',
                        border: `1px solid ${isActive ? meta.border : 'transparent'}`,
                      }}
                    >
                      {code}
                    </span>

                    {/* Station name */}
                    <span
                      className="font-medium text-sm truncate transition-all"
                      style={{
                        color: isActive ? '#2D3250' : '#C4BAB0',
                      }}
                    >
                      {station.name}
                    </span>

                    {/* Inactive badge */}
                    {!isActive && (
                      <span className="ml-auto text-[9px] text-[#C4BAB0] font-fredoka shrink-0">
                        Coming soon
                      </span>
                    )}

                    {/* Quest badge */}
                    {isActive && hasQuest && (
                      <span className="ml-auto flex items-center gap-1 text-[9px] text-[#FF6B6B] font-fredoka shrink-0 anim-blink-dot">
                        ● Quest
                      </span>
                    )}

                    {/* Arrow indicator on hover */}
                    {isActive && (
                      <span
                        className="ml-1 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        style={{ color: meta.color }}
                      >
                        →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="px-5 py-3 border-t-[1.5px] border-[#0F172A] flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: meta.color, boxShadow: `0 0 6px ${meta.glow}` }}
          />
          <span className="font-fredoka text-[10px] text-[#8B7E74]">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D4CCC2]" />
          <span className="font-fredoka text-[10px] text-[#8B7E74]">Inactive</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full anim-blink-dot"
            style={{ background: '#FF6B6B', boxShadow: '0 0 4px rgba(255,107,107,0.6)' }}
          />
          <span className="font-fredoka text-[10px] text-[#8B7E74]">Quest</span>
        </div>
      </div>
    </div>
  );
}
