'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDistance } from 'geolib';
import Card from '@/components/Card';
import PhotoCaptureButton from '@/components/PhotoCaptureButton';
import { createClient } from '@/utils/supabase/client';
import { useSession } from '@/utils/auth-client';

interface AttractionCheckInCardProps {
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
}

export default function AttractionCheckInCard({
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
}: AttractionCheckInCardProps) {
  const { data: session } = useSession();
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Allow location to enable check-in.');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState(0);

  const canCheckIn = useMemo(() => {
    return (
      !!session?.user?.id &&
      latitude !== undefined &&
      longitude !== undefined &&
      distance !== null &&
      distance <= checkInRadius
    );
  }, [session, latitude, longitude, distance, checkInRadius]);

  const hasLocationData = latitude !== undefined && longitude !== undefined;

  const photoLockReason = useMemo(() => {
    if (!session?.user?.id) {
      return 'Sign in to enable photo verification.';
    }

    if (!hasLocationData || distance === null) {
      return 'Refreshing your location before enabling photo capture.';
    }

    if (distance > checkInRadius) {
      return `Move ${distance - checkInRadius}m closer to unlock the Take photo button.`;
    }

    return undefined;
  }, [session, hasLocationData, distance, checkInRadius]);

  useEffect(() => {
    if (!hasLocationData) {
      setStatusMessage('This attraction does not have a check-in location.');
      return;
    }

    if (!navigator?.geolocation) {
      setError('Geolocation is not supported in this browser.');
      setStatusMessage('Enable geolocation to check in.');
      return;
    }

    setIsLoadingLocation(true);
    setError(null);
    setSuccessMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(position.coords);
        setIsLoadingLocation(false);
      },
      (geoError) => {
        setError('Location permission is required to check in.');
        setStatusMessage('Allow location access and refresh.');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      },
    );
  }, [hasLocationData]);

  useEffect(() => {
    if (coords && hasLocationData) {
      const meters = getDistance(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        {
          latitude: latitude as number,
          longitude: longitude as number,
        },
      );

      setDistance(meters);
      if (meters <= checkInRadius) {
        setStatusMessage(`Within ${checkInRadius}m. Ready to check in.`);
      } else {
        setStatusMessage(`You are ${meters}m away. Move closer to check in.`);
      }
      return;
    }

    if (!hasLocationData) {
      return;
    }

    if (!error) {
      setStatusMessage('Getting your location...');
    }
  }, [coords, latitude, longitude, hasLocationData, checkInRadius, error]);

  const refreshLocation = () => {
    if (!navigator?.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setIsLoadingLocation(true);
    setError(null);
    setSuccessMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(position.coords);
        setIsLoadingLocation(false);
      },
      (geoError) => {
        setError('Location permission is required to check in.');
        setStatusMessage('Allow location access and refresh.');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      },
    );
  };

  const handleCheckIn = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!session?.user?.id) {
      setError('Sign in to check in and save your visit.');
      return;
    }

    if (!hasLocationData) {
      setError('Attraction location data is unavailable.');
      return;
    }

    if (distance === null) {
      setError('Location data is not ready yet.');
      return;
    }

    if (distance > checkInRadius) {
      setError('You are too far from the attraction to check in.');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    const { error: insertError } = await supabase.from('visits').insert([
      {
        user_id: session.user.id,
        site_id: id,
        verification_type: 'geofence',
      },
    ]);

    setIsSubmitting(false);

    if (insertError) {
      setError(`Failed to record check-in: ${insertError.message}`);
      return;
    }

    setSuccessMessage('Check-in recorded! Your visit has been saved.');
  };

  return (
    <div className="space-y-3">
      <Card
        id={id}
        name={name}
        description={description}
        image={image}
        rating={rating}
        onGetDirections={() => {
          const directionUrl = googleMap ??
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
          window.open(directionUrl, '_blank', 'noopener,noreferrer');
        }}
        showCheckInButton={false}
        showActions={true}
      />

      <div className="rounded-3xl bg-white/80 border border-slate-200 px-4 py-3 text-sm text-slate-600 shadow-sm">
        <p className="mb-2 font-medium text-slate-800">Check-in status</p>
        <p>{statusMessage}</p>
        {distance !== null && hasLocationData && (
          <p className="mt-2 text-xs text-slate-500">
            Distance to attraction: {distance}m · Radius: {checkInRadius}m
          </p>
        )}
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        {successMessage && <p className="mt-2 text-sm text-emerald-700">{successMessage}</p>}
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={refreshLocation}
              className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Refresh location
            </button>
            <button
              type="button"
              disabled={!canCheckIn || isSubmitting || isLoadingLocation}
              className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
              onClick={handleCheckIn}
            >
              {isSubmitting ? 'Checking in…' : 'Check in now'}
            </button>
          </div>

          {hasPhotoChallenge && coords && (
            <PhotoCaptureButton
              attractionId={id}
              attractionName={name}
              userLatitude={coords.latitude}
              userLongitude={coords.longitude}
              canTakePhoto={canCheckIn}
              lockReason={photoLockReason}
              onSuccess={() => {
                setSuccessMessage('Photo verified! Check-in complete.');
                setVisitCount(visitCount + 1);
              }}
              onError={(errorMsg) => {
                setError(errorMsg);
              }}
            />
          )}
        </div>
        {!session?.user?.id && (
          <p className="mt-2 text-xs text-slate-500">Sign in on the passport page to save your check-in.</p>
        )}
      </div>
    </div>
  );
}
