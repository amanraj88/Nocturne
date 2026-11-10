import React from 'react';
import { Noc01Shibuya } from './Noc01Shibuya';
import { Noc02Reykjavik } from './Noc02Reykjavik';
import { Noc03Kreuzberg } from './Noc03Kreuzberg';

interface ArtworkRendererProps {
  artworkId?: 'noc-01' | 'noc-02' | 'noc-03' | string;
  className?: string;
}

export const ArtworkRenderer: React.FC<ArtworkRendererProps> = ({ artworkId, className = 'w-full h-full' }) => {
  switch (artworkId) {
    case 'noc-02':
      return <Noc02Reykjavik className={className} />;
    case 'noc-03':
      return <Noc03Kreuzberg className={className} />;
    case 'noc-01':
    default:
      return <Noc01Shibuya className={className} />;
  }
};
