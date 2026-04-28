'use client';

import AttractionCheckInCard from './AttractionCheckInCard';
import QuizCard from './QuizCard';

interface Quiz {
  id: string;
  question: string;
  correctAnswer: string;
  points: number | null;
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
  quizzes?: Quiz[];
}

interface StationSitesListProps {
  sites: SiteData[];
}

export function StationSitesList({ sites }: StationSitesListProps) {
  return (
    <div className="space-y-4">
      {sites.map((site) => (
        <div key={site.id}>
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
          />
          {site.hasQuizChallenge && site.quizzes && site.quizzes.length > 0 && (
            <div className="pl-0">
              <QuizCard
                attractionId={site.id}
                attractionName={site.name}
                quizzes={site.quizzes}
                hasQuizChallenge={site.hasQuizChallenge}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
