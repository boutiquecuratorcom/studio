'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, ImageIcon } from 'lucide-react';
import type { PublicBoutiqueProfile } from '@/lib/boutique';
import type { BoutiqueRenderTokens, BrandProfilePublicBits } from '@/lib/brand/brandPublicBits';
import { cn } from '@/lib/utils';

export const BoutiqueRenderer = ({
  brandProfile,
  featuredOutfit,
  renderTokens
}: {
  brandProfile: Partial<BrandProfilePublicBits> | null;
  featuredOutfit: PublicBoutiqueProfile['featuredOutfit'];
  renderTokens: BoutiqueRenderTokens;
}) => {
  const claimMode = featuredOutfit?.outfitClaim?.mode || 'individual';
  const outfitClaimUrl = featuredOutfit?.outfitClaim?.claim?.url;
  const outfitClaimLabel = featuredOutfit?.outfitClaim?.claim?.label || 'Claim Now';

  const dynamicStyles: React.CSSProperties = {
    '--boutique-accent': renderTokens.accentColor,
    '--boutique-accent-text': renderTokens.accentTextColor,
    '--boutique-bg': renderTokens.backgroundColor,
    '--boutique-font-heading': renderTokens.headingFontFamily,
    '--boutique-font-body': renderTokens.bodyFontFamily,
    '--boutique-font-button': renderTokens.buttonFontFamily,
    ...renderTokens.patternStyles
  } as React.CSSProperties;

  const ClaimButton = () => {
    const buttonProps = {
      size: "lg" as const,
      style: { 
        backgroundColor: renderTokens.buttonStyle === 'solid' ? 'var(--boutique-accent)' : 'transparent',
        borderColor: renderTokens.buttonStyle === 'outline' ? 'var(--boutique-accent)' : 'transparent',
        color: renderTokens.buttonStyle === 'solid' ? 'var(--boutique-accent-text)' : 'var(--boutique-accent)',
        fontFamily: 'var(--boutique-font-button)',
      },
      variant: renderTokens.buttonStyle === 'outline' ? 'outline' : 'default',
    };

    if (claimMode === 'outfit' && outfitClaimUrl) {
      return (
        <Button {...buttonProps} asChild>
          <a href={outfitClaimUrl} target="_blank" rel="noopener noreferrer">
            {outfitClaimLabel}
          </a>
        </Button>
      );
    } else {
      return (
        <Button {...buttonProps} className="pointer-events-none">
          Claim a Look
        </Button>
      );
    }
  };

  return (
    <div 
        className="min-h-screen text-foreground font-[var(--boutique-font-body)]"
        style={{ backgroundColor: 'var(--boutique-bg)' }}
    >
        <div 
            className="absolute inset-0 opacity-50" 
            style={{ ...dynamicStyles, color: 'var(--pattern-color)' }}
        />
        <div className="w-full max-w-md mx-auto p-4 relative" style={dynamicStyles}>
            <div className="relative z-10 space-y-6">
            <header className="flex flex-col items-center text-center space-y-3 pt-8">
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
                <h3 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--boutique-font-heading)' }}>
                    {brandProfile?.brandName || 'Your Boutique Name'}
                </h3>
                <p className="text-md max-w-sm mx-auto text-muted-foreground">
                    {brandProfile?.tagline || 'Your amazing tagline goes here.'}
                </p>
                </div>

                <ClaimButton />
            </header>

            <section>
                {featuredOutfit ? (
                <Card className={cn("overflow-hidden", renderTokens.cardClass)}>
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
                    <h4 className="font-semibold" style={{ fontFamily: 'var(--boutique-font-heading)' }}>{featuredOutfit.title}</h4>
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
