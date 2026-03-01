'use client';

import { type Outfit } from '@/lib/outfits';
import { BoutiqueRenderer } from './BoutiqueRenderer';

export const BoutiqueLivePreview = ({
  brandProfile,
  featuredOutfit,
}: {
  brandProfile: any;
  featuredOutfit: Outfit | undefined;
}) => {
  
  const featuredOutfitSummary = featuredOutfit ? {
    id: featuredOutfit.id,
    title: featuredOutfit.title,
    imageUrl: featuredOutfit.cover?.imageUrl || null,
    description: featuredOutfit.storefrontDescription || null,
    itemCount: featuredOutfit.linkedRackItemIds.length,
    outfitClaim: featuredOutfit.outfitClaim || null
  } : null;

  return (
    <BoutiqueRenderer
      brandProfile={brandProfile}
      featuredOutfit={featuredOutfitSummary}
    />
  );
};
