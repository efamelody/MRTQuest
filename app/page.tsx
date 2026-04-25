export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          <h1 className="text-4xl font-bold mb-2">🚇 MRTQuest</h1>
          <p className="text-slate-600">Discover hidden attractions along MRT lines</p>
        </div>

        {/* Hero Banner */}
        <div className="px-6 mb-6">
          <div className="bg-linear-to-br from-purple-400 via-pink-300 to-blue-400 rounded-3xl p-6 text-white shadow-md">
              <div className="text-5xl mb-4">📍</div>
              <h2 className="text-2xl font-bold mb-2">Explore Hidden MRT Attractions</h2>
              <p className="text-sm">Tap on a station to uncover cafes, viewpoints, and local culture along your commute.</p>
          </div>
        </div>

        {/* Fun Stats */}
        <div className="px-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 shadow-sm border-2 border-white">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="text-3xl mb-1">🏛️</div>
                <div className="text-2xl font-bold text-primary">24</div>
                <div className="text-xs text-slate-600">Sites</div>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-3xl mb-1">🚇</div>
                <div className="text-2xl font-bold text-accent">16</div>
                <div className="text-xs text-slate-600">Stations</div>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-3xl mb-1">✨</div>
                <div className="text-2xl font-bold text-accent">2</div>
                <div className="text-xs text-slate-600">Lines</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}