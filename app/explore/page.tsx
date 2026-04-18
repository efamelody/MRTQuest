import { MRTMap } from '@/components/MRTMap';
import { TabBar } from '@/components/TabBar';

export default function ExplorePage() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          <h1 className="text-3xl mb-2">Where am I exploring today? 🗺️</h1>
          <p className="text-slate-600">Tap any station to discover heritage sites</p>
        </div>

        {/* MRT Map */}
        <div className="px-4">
          <MRTMap />
        </div>

        {/* Fun Stats */}
        <div className="px-6 mt-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-sm border-2 border-white">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="text-3xl mb-1">🏛️</div>
                <div className="text-2xl font-bold text-[#00A959]">24</div>
                <div className="text-xs text-slate-600">Sites</div>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-3xl mb-1">🚇</div>
                <div className="text-2xl font-bold text-[#FFD520]">16</div>
                <div className="text-xs text-slate-600">Stations</div>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-3xl mb-1">✨</div>
                <div className="text-2xl font-bold text-purple-500">2</div>
                <div className="text-xs text-slate-600">Lines</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TabBar />
    </div>
  );
}
