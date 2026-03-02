'use client';

import type { Outfit } from '@/lib/outfits';
import { BoutiqueRenderer } from './BoutiqueRenderer';
import type {
  BrandProfilePublicBits,
  BoutiquePatternId,
  BoutiqueTemplateId,
} from '@/lib/brand/brandPublicBits';

type BannerSettings = {
    enabled: boolean;
    height: 'sm' | 'md' | 'lg';
    opacity: number;
}

export const BoutiqueLivePreview = ({
  brandProfile,
  featuredOutfit,
  templateId,
  patternId,
  bannerSettings
}: {
  brandProfile: BrandProfilePublicBits | null;
  featuredOutfit: Outfit | undefined;
  templateId: BoutiqueTemplateId;
  patternId: BoutiquePatternId;
  bannerSettings: BannerSettings;
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

    const liveProfile = {
        ...(brandProfile || {}),
        bannerEnabled: bannerSettings.enabled,
        bannerHeight: bannerSettings.height,
        bannerOpacity: bannerSettings.opacity,
    };

  return (
    <BoutiqueRenderer
      brandProfile={liveProfile}
      featuredOutfit={featuredOutfitSummary}
      templateId={templateId}
      patternId={patternId}
    />
  );
};
