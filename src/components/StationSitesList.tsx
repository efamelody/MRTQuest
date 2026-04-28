'use client';

import AttractionCheckInCard from '@/components/AttractionCheckInCard';

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
}

interface StationSitesListProps {
  sites: SiteData[];
}

export function StationSitesList({ sites }: StationSitesListProps) {
  return (
    <div className="space-y-4">
      {sites.map((site) => (
        <AttractionCheckInCard
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
        />
      ))}
    </div>
  );
}
