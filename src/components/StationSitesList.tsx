'use client';

import AttractionCheckInCard from './AttractionCheckInCard';
import QuizCard from './QuizCard';

interface Quiz {
  id: string;
  question: string;
  correctAnswer: string;
  options: string[];
  points: number | null;
  sortOrder?: number;
}

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
        <div key={site.id} className="space-y-2">
          <AttractionCheckInCard
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
          />
          {site.hasQuizChallenge && site.quizzes && site.quizzes.length > 0 && (
            <QuizCard
              attractionId={site.id}
              attractionName={site.name}
              quizzes={site.quizzes}
              hasQuizChallenge={site.hasQuizChallenge}
            />
          )}
        </div>
      ))}
    </div>
  );
}
