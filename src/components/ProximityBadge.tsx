interface ProximityBadgeProps {
  distance: number | null;
  checkInRadius?: number;
}

export function ProximityBadge({ distance, checkInRadius = 300 }: ProximityBadgeProps) {
  if (distance === null) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm px-4 py-3 border border-slate-200">
        <div className="h-3 w-3 rounded-full bg-slate-300 animate-pulse" />
        <span className="text-sm font-medium text-slate-600">Loading location...</span>
      </div>
    );
  }

  const isWithinRadius = distance <= checkInRadius;
  const percentageClose = Math.min((1 - distance / checkInRadius) * 100, 100);

  // Determine color based on proximity
  const statusColor = isWithinRadius ? 'text-emerald-600' : 'text-blue-600';
  const badgeColor = isWithinRadius ? 'bg-emerald-50' : 'bg-blue-50';
  const dotColor = isWithinRadius ? 'bg-emerald-500' : 'bg-blue-400';

  return (
    <div className={`flex items-center gap-3 rounded-full ${badgeColor} backdrop-blur-sm px-4 py-3 border border-slate-200`}>
      {/* Signal strength indicator - 3 bars */}
      <div className="flex items-end gap-1">
        <div className={`h-1 w-1 rounded-full ${distance <= checkInRadius * 0.33 ? dotColor : 'bg-slate-300'}`} />
        <div className={`h-1.5 w-1 rounded-full ${distance <= checkInRadius * 0.66 ? dotColor : 'bg-slate-300'}`} />
        <div className={`h-2 w-1 rounded-full ${isWithinRadius ? dotColor : 'bg-slate-300'}`} />
      </div>

      {/* Distance text */}
      <div>
        <p className={`text-sm font-semibold ${statusColor}`}>
          {distance}m away
        </p>
        <p className="text-xs text-slate-500">
        </p>
      </div>
    </div>
  );
}
