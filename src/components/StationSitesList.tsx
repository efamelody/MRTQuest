'use client';

import { AttractionCard } from '@/components/AttractionCard';

interface SiteData {
  id: string;
  name: string;
  description: string;
  image?: string;
  rating?: number;
  googleMap?: string;
}

interface StationSitesListProps {
  sites: SiteData[];
}

export function StationSitesList({ sites }: StationSitesListProps) {
  return (
    <div className="space-y-4">
      {sites.map((site) => (
        <AttractionCard
          key={site.id}
          {...site}
          onCheckIn={() => {
            console.log(`Checked in at ${site.name}`);
            // TODO: integrate with Supabase
          }}
          onGetDirections={() => {
            const directionUrl = site.googleMap ??
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.name)}`;

            console.log(`Opening directions to ${site.name}: ${directionUrl}`);
            window.open(directionUrl, '_blank', 'noopener,noreferrer');
          }}
          onCardClick={() => {
            console.log(`Viewing details for ${site.name}`);
          }}
        />
      ))}
    </div>
  );
}
