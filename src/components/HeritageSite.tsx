'use client';

import { Navigation, MapPin, Star } from 'lucide-react';

interface HeritageSiteProps {
  id: string;
  name: string;
  description: string;
  image?: string;
  rating?: number;
  googleMap?: string;
  onCheckIn: () => void;
  onGetDirections: () => void;
  onCardClick: () => void;
}

export function HeritageSite({
  name,
  description,
  image,
  rating,
  onCheckIn,
  onGetDirections,
  onCardClick,
}: HeritageSiteProps) {
  return (
    <div
      onClick={onCardClick}
      className="bg-white/70 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm border-2 border-white hover:shadow-md transition cursor-pointer"
    >
      {image && (
        <div className="h-40 bg-gradient-to-br from-purple-200 to-blue-200 overflow-hidden">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <h3 className="text-fuchsia-300 font-bold text-lg mb-2">{name}</h3>
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{description}</p>

        {rating && (
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < rating
                    ? 'fill-[#FFD520] text-[#FFD520]'
                    : 'text-slate-300'
                }`}
              />
            ))}
            <span className="text-xs text-slate-600 ml-2">{rating}/5</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCheckIn();
            }}
            className="flex-1 bg-[#00A959] text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition"
          >
            Check In ✓
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGetDirections();
            }}
            className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition flex items-center justify-center gap-1"
          >
            <Navigation className="w-4 h-4" />
            Directions
          </button>
        </div>
      </div>
    </div>
  );
}
