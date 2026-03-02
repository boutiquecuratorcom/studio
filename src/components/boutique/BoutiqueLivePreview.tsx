'use client';

import type { Outfit } from '@/lib/outfits';
import { BoutiqueRenderer } from './BoutiqueRenderer';
import type {
  BrandProfilePublicBits,
  BoutiquePatternId,
  BoutiqueTemplateId,
} from '@/lib/brand/brandPublicBits';

export const BoutiqueLivePreview = ({
  brandProfile,
  featuredOutfit,
  templateId,
  patternId,
}: {
  brandProfile: BrandProfilePublicBits | null;
  featuredOutfit: Outfit | undefined;
  templateId: BoutiqueTemplateId;
  patternId: BoutiquePatternId;
}) => {
  const featuredOutfitSummary = featuredOutfit
    ? {
        id: featuredOutfit.id,
        title: featuredOutfit.title ?? null,
        imageUrl: featuredOutfit.cover?.imageUrl || null,
        description: featuredOutfit.storefrontDescription || null,
        itemCount: Array.isArray(featuredOutfit.linkedRackItemIds)
          ? featuredOutfit.linkedRackItemIds.length
          : 0,
        outfitClaim: featuredOutfit.outfitClaim || null,
      }
    : null;

  return (
    <BoutiqueRenderer
      brandProfile={brandProfile}
      featuredOutfit={featuredOutfitSummary}
      templateId={templateId}
      patternId={patternId}
    />
  );
};
