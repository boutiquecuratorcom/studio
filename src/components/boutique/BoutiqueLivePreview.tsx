'use client';

import type { Outfit } from '@/lib/outfits';
import { BoutiqueRenderer } from './BoutiqueRenderer';
import type {
  BrandProfilePublicBits,
  BoutiquePatternId,
  BoutiqueTemplateId,
} from '@/lib/brand/brandPublicBits';
import type { InventoryItem } from '@/lib/inventory';

export const BoutiqueLivePreview = ({
  brandProfile,
  featuredOutfit,
  templateId,
  patternId,
  rackItems,
  outfits,
  rackLoading,
  outfitsLoading,
}: {
  brandProfile: BrandProfilePublicBits | null;
  featuredOutfit: Outfit | undefined;
  templateId: BoutiqueTemplateId;
  patternId: BoutiquePatternId;
  rackItems: InventoryItem[] | null;
  outfits: Outfit[] | null;
  rackLoading: boolean;
  outfitsLoading: boolean;
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
      rackItems={rackItems}
      outfits={outfits}
      rackLoading={rackLoading}
      outfitsLoading={outfitsLoading}
    />
  );
};
