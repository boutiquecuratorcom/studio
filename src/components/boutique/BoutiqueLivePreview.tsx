'use client';

import { type Outfit } from '@/lib/outfits';
import { BoutiqueRenderer } from './BoutiqueRenderer';
import type { BrandProfilePublicBits, BoutiqueRenderTokens } from '@/lib/brand/brandPublicBits';

export const BoutiqueLivePreview = ({
  brandProfile,
  featuredOutfit,
  renderTokens,
}: {
  brandProfile: BrandProfilePublicBits | null;
  featuredOutfit: Outfit | undefined;
  renderTokens: BoutiqueRenderTokens;
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
      renderTokens={renderTokens}
    />
  );
};
