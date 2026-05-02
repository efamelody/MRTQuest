'use client';

import AttractionCard from './AttractionCard';
import type { Quiz } from '@/types/quiz';

interface SiteData {
  id: string;
  name: string;
  description: string;
  image?: string;
  rating?: number;
  googleMap?: string;
  latitude?: number | null;
  longitude?: number | null;
  checkInRadius?: number;
  hasQuizChallenge?: boolean;
  hasPhotoChallenge?: boolean;
  quizzes?: Quiz[];
}

interface StationSitesListProps {
  sites: SiteData[];
}

export function StationSitesList({ sites }: StationSitesListProps) {
  return (
    <div className="space-y-6">
      {sites.map((site) => (
        <AttractionCard
          key={site.id}
          id={site.id}
          name={site.name}
          description={site.description}
          image={site.image}
          rating={site.rating}
          googleMap={site.googleMap}
          latitude={site.latitude}
          longitude={site.longitude}
          checkInRadius={site.checkInRadius}
          hasPhotoChallenge={site.hasPhotoChallenge}
          hasQuizChallenge={site.hasQuizChallenge}
          quizzes={site.quizzes}
        />
      ))}
    </div>
  );
}
