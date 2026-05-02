'use client';

import React, { useState } from 'react';
import { Navigation, Camera, CheckCircle2, RefreshCw, Star, BookOpen } from 'lucide-react';
import StarRating from './StarRating';
import PhotoCaptureButton from './PhotoCaptureButton';
import { useAttractionVerification } from '@/utils/useAttractionVerification';
import { useRouter } from 'next/navigation';
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
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const router = useRouter();

  const {
    currentPhase,
    distance,
    isLoadingLocation,
    isCheckedIn,
    isPhotoVerified,
    canCheckIn,
    refreshLocation,
    setIsCheckedIn,
    setIsPhotoVerified,
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

    if (isCheckedIn) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800 text-sm">Visit Confirmed</p>
              <p className="text-xs text-emerald-600">You've earned your stamp for this stop.</p>
            </div>
            <button onClick={refreshLocation} className="ml-auto p-2 text-slate-400 hover:text-slate-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {(hasPhotoChallenge || hasQuizChallenge) && (
            <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-amber-600">⭐ Bonus Challenges</p>

              {hasPhotoChallenge && (
                isPhotoVerified ? (
                  <div className="w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 text-sm bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" /> Photo Verified — +8 pts
                  </div>
                ) : isPhotoOpen ? (
                  <PhotoCaptureButton
                    attractionId={id}
                    attractionName={name}
                    userLatitude={coords!.latitude}
                    userLongitude={coords!.longitude}
                    canTakePhoto={true}
                    onSuccess={() => { setIsPhotoVerified(true); setIsPhotoOpen(false); }}
                    onError={(err) => console.error(err)}
                  />
                ) : (
                  <button
                    onClick={() => setIsPhotoOpen(true)}
                    className="w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 text-sm bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-sm active:scale-95 transition"
                  >
                    <Camera className="w-5 h-5" /> Verify Landmark (+8 pts)
                  </button>
                )
              )}

              {hasQuizChallenge && (
                <button
                  onClick={() => router.push(`/quiz/${id}`)}
                  className="w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 text-sm bg-violet-500 hover:bg-violet-600 text-white shadow-sm active:scale-95 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  Start Quiz Challenge
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    if (currentPhase === 'inside') {
      return (
        <div className="space-y-3 p-1">
          <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 px-1">You have arrived!</p>
          <div className="flex gap-2">
            <button
                onClick={async () => {
                  const res = await fetch('/api/visits/checkin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ attractionId: id }),
                  });
                  if (res.ok) {
                    setIsCheckedIn(true);
                  }
                }}
                className="flex-1 bg-primary text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                Check In Now
            </button>
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

        {/* 3. Discovery Zone — quiz locked indicator */}
        {!isCheckedIn && hasQuizChallenge && (
           <div className="flex items-center justify-center gap-2 py-2 text-slate-300">
             <div className="h-px flex-1 bg-slate-100" />
             <span className="text-[10px] font-bold uppercase tracking-widest">🔒 Quiz Locked</span>
             <div className="h-px flex-1 bg-slate-100" />
           </div>
        )}
      </div>

      {/* Hidden Functional Trigger */}
      <div className="hidden">
        <button id={`photo-btn-${id}`} />
      </div>
    </div>
  );
}