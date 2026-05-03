'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDistance } from 'geolib';
import { useSession } from '@/utils/auth-client';

export type VerificationPhase = 'outside' | 'inside' | 'checked-in';

interface UseAttractionVerificationProps {
  attractionId: string;
  latitude?: number | null;
  longitude?: number | null;
  checkInRadius?: number;
}

interface UseAttractionVerificationReturn {
  currentPhase: VerificationPhase;
  distance: number | null;
  isLoadingLocation: boolean;
  isCheckedIn: boolean;
  isPhotoVerified: boolean;
  canCheckIn: boolean;
  statusMessage: string;
  error: string | null;
  refreshLocation: () => void;
  setIsCheckedIn: (value: boolean) => void;
  setIsPhotoVerified: (value: boolean) => void;
  coords: GeolocationCoordinates | null;
}

export function useAttractionVerification({
  attractionId,
  latitude,
  longitude,
  checkInRadius = 300,
}: UseAttractionVerificationProps): UseAttractionVerificationReturn {
  const { data: session } = useSession();
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isPhotoVerified, setIsPhotoVerified] = useState(false);
  const [isCheckingVerificationStatus, setIsCheckingVerificationStatus] = useState(true);

  const hasLocationData = latitude !== undefined && longitude !== undefined;

  // Check if user has already verified this attraction (persisted state)
  useEffect(() => {
    if (!session?.user?.id || !attractionId) {
      setIsCheckingVerificationStatus(false);
      return;
    }

    const checkVerificationStatus = async () => {
      try {
        const response = await fetch('/api/visits/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attractionId }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsCheckedIn(data.isCheckedIn || false);
          setIsPhotoVerified(data.isPhotoVerified || false);
        }
      } catch (err) {
        console.error('Failed to check verification status:', err);
      } finally {
        setIsCheckingVerificationStatus(false);
      }
    };

    checkVerificationStatus();
  }, [session?.user?.id, attractionId]);

  // Retrieve initial geolocation
  useEffect(() => {
    if (!hasLocationData) {
      setIsCheckingVerificationStatus(false);
      return;
    }

    if (!navigator?.geolocation) {
      setError('Geolocation is not supported in this browser.');
      setIsCheckingVerificationStatus(false);
      return;
    }

    setIsLoadingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(position.coords);
        setIsLoadingLocation(false);
      },
      (geoError) => {
        setError('Location permission is required. Please enable location access.');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      },
    );
  }, [hasLocationData]);

  // Calculate distance when coordinates change
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

      setDistance(Math.round(meters));
      return;
    }

    if (!hasLocationData) {
      setError('Attraction location data is unavailable.');
      return;
    }
  }, [coords, latitude, longitude, hasLocationData]);

  // Determine if user can check in
  const canCheckIn = useMemo(() => {
    return (
      !!session?.user?.id &&
      latitude !== undefined &&
      longitude !== undefined &&
      distance !== null &&
      distance <= checkInRadius &&
      !isCheckedIn
    );
  }, [session, latitude, longitude, distance, checkInRadius, isCheckedIn]);

  // Determine current phase
  const currentPhase = useMemo(() => {
    if (isCheckedIn) return 'checked-in';
    if (!hasLocationData || distance === null) return 'outside';
    if (distance <= checkInRadius) return 'inside';
    return 'outside';
  }, [isCheckedIn, hasLocationData, distance, checkInRadius]);

  // Generate status message
  const statusMessage = useMemo(() => {
    if (!session?.user?.id) return 'Sign in to enable check-in.';
    if (!hasLocationData) return 'Attraction location data is unavailable.';
    if (isLoadingLocation || isCheckingVerificationStatus) return 'Loading your location...';
    if (error) return error;
    if (isCheckedIn) return 'Checked in! Complete bonus challenges below.';
    if (distance === null) return 'Getting your location...';
    if (distance <= checkInRadius) return `Within ${checkInRadius}m. Ready to check in.`;
    return `You are ${distance}m away. Move closer to check in.`;
  }, [session, hasLocationData, isLoadingLocation, isCheckingVerificationStatus, error, isCheckedIn, distance, checkInRadius]);

  const refreshLocation = () => {
    if (!navigator?.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setIsLoadingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(position.coords);
        setIsLoadingLocation(false);
      },
      (geoError) => {
        setError('Location permission is required. Please enable location access.');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      },
    );
  };

  return {
    currentPhase,
    distance,
    isLoadingLocation: isLoadingLocation || isCheckingVerificationStatus,
    isCheckedIn,
    isPhotoVerified,
    canCheckIn,
    statusMessage,
    error,
    refreshLocation,
    setIsCheckedIn,
    setIsPhotoVerified,
    coords,
  };
}
