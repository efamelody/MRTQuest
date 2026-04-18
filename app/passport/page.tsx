export default function PassportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          <h1 className="text-3xl mb-2">Your Passport 📔</h1>
          <p className="text-slate-600">Track your heritage exploration journey</p>
        </div>

        {/* Stats Section */}
        <div className="px-6 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-sm border-2 border-white">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🏛️</div>
                <div className="text-2xl font-bold text-[#00A959]">5</div>
                <div className="text-xs text-slate-600">Visited</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-2xl font-bold text-[#FFD520]">12</div>
                <div className="text-xs text-slate-600">Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🏅</div>
                <div className="text-2xl font-bold text-purple-500">3</div>
                <div className="text-xs text-slate-600">Badges</div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="px-6 mb-6">
          <h2 className="text-xl font-bold mb-3">Badges Earned 🏅</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border-2 border-yellow-200">
              <div className="text-4xl mb-2">✨</div>
              <div className="text-sm font-bold">Explorer</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border-2 border-blue-200">
              <div className="text-4xl mb-2">📖</div>
              <div className="text-sm font-bold">Learner</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border-2 border-purple-200">
              <div className="text-4xl mb-2">🌟</div>
              <div className="text-sm font-bold">Collector</div>
            </div>
          </div>
        </div>

        {/* Recent Visits */}
        <div className="px-6">
          <h2 className="text-xl font-bold mb-3">Recent Visits 📍</h2>
          <div className="space-y-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border-2 border-white">
              <div className="font-bold">Putrajaya Mosque</div>
              <div className="text-sm text-slate-600">Visited 2 days ago</div>
              <div className="flex gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-[#FFD520]">⭐</span>
                ))}
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border-2 border-white">
              <div className="font-bold">Ujana Mosque</div>
              <div className="text-sm text-slate-600">Visited 5 days ago</div>
              <div className="flex gap-1 mt-2">
                {[...Array(4)].map((_, i) => (
                  <span key={i} className="text-[#FFD520]">⭐</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
