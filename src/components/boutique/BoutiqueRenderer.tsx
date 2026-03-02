'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, ImageIcon } from 'lucide-react';
import type { PublicBoutiqueProfile } from '@/lib/boutique';
import type {
  BoutiquePatternId,
  BoutiqueTemplateId,
  BrandProfilePublicBits,
} from '@/lib/brand/brandPublicBits';
import { computeRenderTokens } from '@/lib/boutique-design';
import { cn } from '@/lib/utils';

export const BoutiqueRenderer = ({
  brandProfile,
  featuredOutfit,
  templateId,
  patternId,
}: {
  brandProfile: Partial<BrandProfilePublicBits> | null;
  featuredOutfit: PublicBoutiqueProfile['featuredOutfit'];
  templateId: BoutiqueTemplateId;
  patternId: BoutiquePatternId;
}) => {
  const renderTokens = useMemo(
    () => computeRenderTokens(brandProfile ?? null, templateId, patternId),
    [brandProfile, templateId, patternId]
  );

  const claimMode = featuredOutfit?.outfitClaim?.mode || 'individual';
  const outfitClaimUrl = featuredOutfit?.outfitClaim?.claim?.url;
  const outfitClaimLabel = featuredOutfit?.outfitClaim?.claim?.label || 'Claim Now';

  const rootVars: React.CSSProperties = {
    ['--boutique-accent' as any]: renderTokens.accentColor,
    ['--boutique-accent-text' as any]: renderTokens.accentTextColor,
    ['--boutique-bg' as any]: renderTokens.backgroundColor,
    ['--boutique-font-heading' as any]: renderTokens.headingFontFamily,
    ['--boutique-font-body' as any]: renderTokens.bodyFontFamily,
    ['--boutique-font-button' as any]: renderTokens.buttonFontFamily,
    ...renderTokens.patternStyles,
  };

  const ClaimButton = () => {
    const style: React.CSSProperties = {
      backgroundColor:
        renderTokens.buttonStyle === 'solid' ? 'var(--boutique-accent)' : 'transparent',
      borderColor:
        renderTokens.buttonStyle === 'outline' ? 'var(--boutique-accent)' : 'transparent',
      color:
        renderTokens.buttonStyle === 'solid'
          ? 'var(--boutique-accent-text)'
          : 'var(--boutique-accent)',
      fontFamily: 'var(--boutique-font-button)',
    };

    const variant = renderTokens.buttonStyle === 'outline' ? 'outline' : 'default';

    if (claimMode === 'outfit' && outfitClaimUrl) {
      return (
        <Button size="lg" style={style} variant={variant} asChild>
          <a href={outfitClaimUrl} target="_blank" rel="noopener noreferrer">
            {outfitClaimLabel}
          </a>
        </Button>
      );
    }

    return (
      <Button size="lg" style={style} variant={variant} className="pointer-events-none">
        Claim a Look
      </Button>
    );
  };

  return (
    <div
      className="min-h-screen text-foreground"
      style={{
        ...rootVars,
        backgroundColor: 'var(--boutique-bg)',
        fontFamily: 'var(--boutique-font-body)',
      }}
    >
      {/* Pattern overlay (scoped) */}
      <div className="absolute inset-0 opacity-50 pointer-events-none" style={rootVars} />

      <div className="w-full max-w-md mx-auto p-4 relative">
        <div className="relative z-10 space-y-6">
          <header className={cn('flex flex-col items-center text-center space-y-3 pt-8', renderTokens.headerClass)}>
            {brandProfile?.logoUrl ? (
              <Image
                src={brandProfile.logoUrl}
                alt={`${brandProfile.brandName || 'Brand'} logo`}
                width={80}
                height={80}
                className="rounded-full object-cover h-20 w-20 border-4 border-card shadow-md"
              />
            ) : (
              <div className="h-20 w-20 rounded-full flex items-center justify-center border bg-card">
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            <div>
              <h3
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--boutique-font-heading)' }}
              >
                {brandProfile?.brandName || 'Your Boutique Name'}
              </h3>
              <p className="text-md max-w-sm mx-auto text-muted-foreground">
                {brandProfile?.tagline || 'Your amazing tagline goes here.'}
              </p>
            </div>

            {featuredOutfit && <ClaimButton />}
          </header>

          <section className={cn(renderTokens.bodyClass)}>
            {featuredOutfit ? (
              <Card className={cn('overflow-hidden', renderTokens.cardClass)}>
                <div className="relative aspect-video w-full">
                  <Image
                    src={
                      featuredOutfit.imageUrl ||
                      'https://picsum.photos/seed/boutique-fallback/600/400'
                    }
                    alt={featuredOutfit.title || 'Featured Outfit'}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h4
                    className="font-semibold"
                    style={{ fontFamily: 'var(--boutique-font-heading)' }}
                  >
                    {featuredOutfit.title}
                  </h4>
                  <p className="text-sm truncate text-muted-foreground">
                    {featuredOutfit.description || `${featuredOutfit.itemCount} items`}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="aspect-video w-full rounded-lg flex flex-col items-center justify-center text-center p-4 bg-card">
                <ImageIcon className="h-10 w-10 mb-2 text-muted-foreground" />
                <p className="font-medium text-muted-foreground">
                  Your featured look will appear here
                </p>
              </div>
            )}
          </section>

          <footer className="text-center border-t pt-4 border-card">
            <p className="text-xs text-muted-foreground">Powered by Boutique Curator</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

    