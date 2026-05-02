'use client';

import React from 'react';
import { Navigation, Camera, CheckCircle2, RefreshCw, Star } from 'lucide-react';
import StarRating from './StarRating';
import PhotoCaptureButton from './PhotoCaptureButton';
import QuizCard from './QuizCard';
import { useAttractionVerification } from '@/utils/useAttractionVerification';
import { useSession } from '@/utils/auth-client';
import { createClient } from '@/utils/supabase/client';
import type { Quiz } from '@/types/quiz';

interface AttractionCardProps {
  id: string;
  name: string;
  description: string;
  image?: string;
  rating?: number;
  googleMap?: string;
  latitude?: number | null;
  longitude?: number | null;
  checkInRadius?: number;
  hasPhotoChallenge?: boolean;
  hasQuizChallenge?: boolean;
  quizzes?: Quiz[];
  onRate?: (rating: number) => void;
}

export default function AttractionCard({
  id,
  name,
  description,
  image,
  rating,
  googleMap,
  latitude,
  longitude,
  checkInRadius = 300,
  hasPhotoChallenge = false,
  hasQuizChallenge = false,
  quizzes = [],
  onRate,
}: AttractionCardProps) {
  const { data: session } = useSession();
  const {
    currentPhase,
    distance,
    isLoadingLocation,
    isVerified,
    canCheckIn,
    refreshLocation,
    setIsVerified,
    coords,
  } = useAttractionVerification({
    attractionId: id,
    latitude,
    longitude,
    checkInRadius,
  });

  const handleGetDirections = () => {
    const directionUrl = googleMap ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
    window.open(directionUrl, '_blank', 'noopener,noreferrer');
  };

  // Render the primary button based on current journey state
  const renderActionHub = () => {
    if (isLoadingLocation) {
      return (
        <div className="w-full h-12 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-sm">
          Searching for your location...
        </div>
      );
    }

    if (isVerified) {
      return (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          <div>
            <p className="font-bold text-emerald-800 text-sm">Visit Confirmed</p>
            <p className="text-xs text-emerald-600">You've unlocked this site's challenges.</p>
          </div>
          <button onClick={refreshLocation} className="ml-auto p-2 text-slate-400 hover:text-slate-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      );
    }

    if (currentPhase === 'inside') {
      return (
        <div className="space-y-3 p-1">
          <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 px-1">You have arrived!</p>
          <div className="flex gap-2">
            {hasPhotoChallenge ? (
              <button
                onClick={() => document.getElementById(`photo-btn-${id}`)?.click()}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white h-12 rounded-xl font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Camera className="w-5 h-5" />
                Verify Landmark
              </button>
            ) : (
              <button
                onClick={async () => {
                   const supabase = createClient();
                   await supabase.from('visits').insert([{ user_id: session?.user?.id, site_id: id, verification_type: 'geofence' }]);
                   setIsVerified(true);
                }}
                className="flex-1 bg-primary text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                Check In Now
              </button>
            )}
            <button onClick={handleGetDirections} className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <button
          onClick={handleGetDirections}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition"
        >
          <Navigation className="w-5 h-5" />
          Get Directions
        </button>
        {distance !== null && (
          <p className="text-center text-xs text-slate-400">
            Approximately <span className="font-bold text-slate-600">{distance}m</span> away
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="group rounded-[2rem] bg-white border-2 border-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* 1. Visual Anchor */}
      <div className="relative h-48 overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">No Image</div>
        )}
        {/* Floating Star Badge */}
        {rating && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-slate-700">{rating}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <h3 className="absolute bottom-4 left-4 text-white font-bold text-xl drop-shadow-md">{name}</h3>
      </div>

      {/* 2. Content & Action Hub */}
      <div className="p-5 space-y-5">
        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* The Journey Hub (Dynamic Section) */}
        <div className="pt-2 border-t border-slate-50">
          {renderActionHub()}
        </div>

        {/* 3. Discovery Zone (Locked Content) */}
        {hasQuizChallenge && (
          <div className={`transition-all duration-500 overflow-hidden ${isVerified ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <div className="pt-4 border-t-2 border-dashed border-slate-100">
              <QuizCard attractionId={id} attractionName={name} quizzes={quizzes} hasQuizChallenge={hasQuizChallenge} />
            </div>
          </div>
        )}

        {!isVerified && hasQuizChallenge && (
           <div className="flex items-center justify-center gap-2 py-2 text-slate-300">
             <div className="h-[1px] flex-1 bg-slate-100" />
             <span className="text-[10px] font-bold uppercase tracking-widest">🔒 Quiz Locked</span>
             <div className="h-[1px] flex-1 bg-slate-100" />
           </div>
        )}
      </div>

      {/* Hidden Functional Trigger */}
      <div className="hidden">
        {coords && (
          <PhotoCaptureButton
            attractionId={id}
            attractionName={name}
            userLatitude={coords.latitude}
            userLongitude={coords.longitude}
            canTakePhoto={canCheckIn}
            onSuccess={() => setIsVerified(true)}
            onError={(err) => console.error(err)}
          />
        )}
        <button id={`photo-btn-${id}`} />
      </div>
    </div>
  );
}