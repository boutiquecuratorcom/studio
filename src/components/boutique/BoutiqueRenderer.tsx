
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, ImageIcon } from 'lucide-react';
import type { Outfit } from '@/lib/outfits';
import { type BoutiqueDesign, getFontFamily, getContrastingTextColor } from '@/lib/boutique-design';
import { PublicClaimButton } from './PublicClaimButton';
import type { PublicBoutiqueProfile } from '@/lib/boutique';
import { cn } from '@/lib/utils';

export const BoutiqueRenderer = ({
  brandProfile,
  featuredOutfit,
  design,
}: {
  brandProfile: any;
  featuredOutfit: PublicBoutiqueProfile['featuredOutfit'];
  design: Partial<BoutiqueDesign>;
}) => {
  const palette = design?.palette;
  const fonts = design?.fonts;
  const buttons = design?.buttons;

  const rootStyle = {
    '--boutique-bg': palette?.background || '#FDFCF9',
    '--boutique-surface': palette?.surface || '#FFFFFF',
    '--boutique-text': palette?.text || '#1F1C17',
    '--boutique-muted': palette?.muted || '#A8A29A',
    '--boutique-accent': palette?.accent || '#C6A15B',
    '--boutique-accent-text': palette?.accentText || '#FFFFFF',
    fontFamily: getFontFamily(fonts?.body, 'Inter, sans-serif'),
    backgroundColor: 'var(--boutique-bg)',
    color: 'var(--boutique-text)',
  } as React.CSSProperties;
  
  const headingStyle = {
    fontFamily: getFontFamily(fonts?.heading, 'Playfair Display, serif'),
  };
  
  const buttonStyle = {
    fontFamily: getFontFamily(fonts?.button, 'Inter, sans-serif'),
    backgroundColor: 'var(--boutique-accent)',
    color: 'var(--boutique-accent-text)',
  };

  const buttonRadiusClass = {
    'none': 'rounded-none',
    'sm': 'rounded-sm',
    'md': 'rounded-md',
    'lg': 'rounded-lg',
    'full': 'rounded-full',
  }[buttons?.radius || 'md'];

  return (
    <div style={rootStyle} className="min-h-screen">
      <div className="w-full max-w-md mx-auto p-4 relative">
        <div className="relative z-10 space-y-6">
          <header className="flex flex-col items-center text-center space-y-3 pt-8">
            {brandProfile?.logoUrl ? (
              <Image
                src={brandProfile.logoUrl}
                alt={`${brandProfile.brandName || 'Brand'} logo`}
                width={80}
                height={80}
                className="rounded-full object-cover h-20 w-20 border-4 shadow-md"
                style={{ borderColor: 'var(--boutique-surface)'}}
              />
            ) : (
              <div className="h-20 w-20 rounded-full flex items-center justify-center border" style={{ backgroundColor: 'var(--boutique-surface)'}}>
                <Store className="h-8 w-8" style={{ color: 'var(--boutique-muted)' }} />
              </div>
            )}
            <div>
              <h3 className="text-3xl font-bold tracking-tight" style={headingStyle}>
                {brandProfile?.brandName || 'Your Boutique Name'}
              </h3>
              <p className="text-md max-w-sm mx-auto" style={{ color: 'var(--boutique-muted)'}}>
                {brandProfile?.tagline || 'Your amazing tagline goes here.'}
              </p>
            </div>
            {featuredOutfit && (
              <PublicClaimButton
                outfitSummary={featuredOutfit}
                accentColor={palette?.accent || '#C6A15B'}
                buttonStyle={buttons?.style || 'solid'}
                className={buttonRadiusClass}
              />
            )}
          </header>

          <section>
            {featuredOutfit ? (
              <Card className="overflow-hidden" style={{ backgroundColor: 'var(--boutique-surface)'}}>
                <div className="relative aspect-video w-full">
                  <Image
                    src={featuredOutfit.imageUrl || 'https://picsum.photos/seed/boutique-fallback/600/400'}
                    alt={featuredOutfit.title || 'Featured Outfit'}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-semibold" style={headingStyle}>{featuredOutfit.title}</h4>
                  <p className="text-sm truncate" style={{ color: 'var(--boutique-muted)'}}>
                    {featuredOutfit.description || `${featuredOutfit.itemCount} items`}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="aspect-video w-full rounded-lg flex flex-col items-center justify-center text-center p-4" style={{ backgroundColor: 'var(--boutique-surface)'}}>
                <ImageIcon className="h-10 w-10 mb-2" style={{ color: 'var(--boutique-muted)'}}/>
                <p className="font-medium" style={{ color: 'var(--boutique-muted)'}}>
                  Your featured look will appear here
                </p>
              </div>
            )}
          </section>

          <footer className="text-center border-t pt-4" style={{ borderColor: 'var(--boutique-surface)'}}>
            <p className="text-xs" style={{ color: 'var(--boutique-muted)'}}>
              Powered by Boutique Curator
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};
