'use client';

import { type Outfit } from '@/lib/outfits';
import { type BoutiqueDesign } from '@/lib/boutique-design';
import { BoutiqueRenderer } from './BoutiqueRenderer';

export const BoutiqueLivePreview = ({
  brandProfile,
  featuredOutfit,
  design,
}: {
  brandProfile: any;
  featuredOutfit: Outfit | undefined;
  design: Partial<BoutiqueDesign>;
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
      design={design}
    />
  );
};
