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

type Props = {
  brandProfile: Partial<BrandProfilePublicBits> | null;
  featuredOutfit: PublicBoutiqueProfile['featuredOutfit'];
  templateId: BoutiqueTemplateId;
  patternId: BoutiquePatternId;
};

type ThemeLayout = {
  pagePadding: string;
  containerWidth: string;
  headerWrap: string;
  logoWrap: string;
  nameClass: string;
  taglineClass: string;
  ctaWrap: string;
  cardWrap: string;
  footerWrap: string;
  overlayOpacityClass: string;

  // “Unique elements” per theme (extra ornaments beyond patterns)
  ornaments: 'none' | 'editorial' | 'luxe' | 'pop' | 'minimal' | 'street' | 'vintage';
};

const getThemeLayout = (templateId: BoutiqueTemplateId): ThemeLayout => {
  switch (templateId) {
    case 'editorial':
      return {
        pagePadding: 'py-10',
        containerWidth: 'max-w-md',
        headerWrap: 'space-y-4 pt-2',
        logoWrap: 'h-20 w-20 border border-border/60 shadow-sm',
        nameClass: 'text-[34px] leading-tight tracking-tight font-semibold',
        taglineClass: 'text-[15px] leading-relaxed',
        ctaWrap: 'pt-2',
        cardWrap: 'rounded-2xl overflow-hidden',
        footerWrap: 'pt-6',
        overlayOpacityClass: 'opacity-40',
        ornaments: 'editorial',
      };

    case 'soft-luxe':
      return {
        pagePadding: 'py-10',
        containerWidth: 'max-w-md',
        headerWrap: 'space-y-4 pt-2',
        logoWrap: 'h-20 w-20 border border-border/40 shadow-md',
        nameClass: 'text-[34px] leading-tight tracking-tight font-semibold',
        taglineClass: 'text-[15px] leading-relaxed',
        ctaWrap: 'pt-2',
        cardWrap: 'rounded-3xl overflow-hidden',
        footerWrap: 'pt-6',
        overlayOpacityClass: 'opacity-35',
        ornaments: 'luxe',
      };

    case 'playful-pop':
      return {
        pagePadding: 'py-8',
        containerWidth: 'max-w-md',
        headerWrap: 'space-y-3 pt-2',
        logoWrap: 'h-[86px] w-[86px] border border-border/40 shadow-md',
        nameClass: 'text-[32px] leading-tight tracking-tight font-bold',
        taglineClass: 'text-[15px] leading-relaxed',
        ctaWrap: 'pt-2',
        cardWrap: 'rounded-3xl overflow-hidden',
        footerWrap: 'pt-6',
        overlayOpacityClass: 'opacity-45',
        ornaments: 'pop',
      };

    case 'modern-minimal':
      return {
        pagePadding: 'py-10',
        containerWidth: 'max-w-md',
        headerWrap: 'space-y-4 pt-2',
        logoWrap: 'h-20 w-20 border border-border/30 shadow-none',
        nameClass: 'text-[30px] leading-tight tracking-tight font-semibold',
        taglineClass: 'text-[14px] leading-relaxed',
        ctaWrap: 'pt-3',
        cardWrap: 'rounded-2xl overflow-hidden',
        footerWrap: 'pt-6',
        overlayOpacityClass: 'opacity-25',
        ornaments: 'minimal',
      };

    case 'street-bold':
      return {
        pagePadding: 'py-8',
        containerWidth: 'max-w-md',
        headerWrap: 'space-y-3 pt-2',
        logoWrap: 'h-20 w-20 border-2 border-border shadow-sm',
        nameClass:
          'text-[34px] leading-tight tracking-tight font-extrabold uppercase',
        taglineClass: 'text-[14px] leading-relaxed uppercase tracking-wide',
        ctaWrap: 'pt-2',
        cardWrap: 'rounded-xl overflow-hidden',
        footerWrap: 'pt-6',
        overlayOpacityClass: 'opacity-45',
        ornaments: 'street',
      };

    case 'romantic-vintage':
      return {
        pagePadding: 'py-10',
        containerWidth: 'max-w-md',
        headerWrap: 'space-y-4 pt-2',
        logoWrap: 'h-20 w-20 border border-border/40 shadow-sm',
        nameClass: 'text-[34px] leading-tight tracking-tight font-semibold',
        taglineClass: 'text-[15px] leading-relaxed italic',
        ctaWrap: 'pt-2',
        cardWrap: 'rounded-3xl overflow-hidden',
        footerWrap: 'pt-6',
        overlayOpacityClass: 'opacity-35',
        ornaments: 'vintage',
      };
  }
};

function Ornaments({
  kind,
}: {
  kind: ThemeLayout['ornaments'];
}) {
  // These are pure decoration layers (no layout impact).
  // All are scoped inside BoutiqueRenderer only.
  switch (kind) {
    case 'editorial':
      return (
        <>
          {/* top hairline */}
          <div className="absolute left-6 right-6 top-8 h-px bg-foreground/10" />
          {/* corner frame */}
          <div className="absolute left-6 top-6 h-10 w-10 border-l border-t border-foreground/10" />
          <div className="absolute right-6 top-6 h-10 w-10 border-r border-t border-foreground/10" />
        </>
      );

    case 'luxe':
      return (
        <>
          {/* soft glow */}
          <div
            className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl"
            style={{ backgroundColor: 'var(--boutique-accent)', opacity: 0.12 }}
          />
          {/* subtle frame */}
          <div className="absolute inset-5 rounded-[28px] border border-foreground/10 pointer-events-none" />
        </>
      );

    case 'pop':
      return (
        <>
          {/* “sticker” corner blobs */}
          <div
            className="absolute -left-10 -top-10 h-28 w-28 rounded-full blur-2xl"
            style={{ backgroundColor: 'var(--boutique-accent)', opacity: 0.18 }}
          />
          <div
            className="absolute -right-10 -top-12 h-28 w-28 rounded-full blur-2xl"
            style={{ backgroundColor: 'var(--boutique-accent)', opacity: 0.14 }}
          />
          {/* playful underline */}
          <div className="absolute left-10 right-10 top-[132px] h-px bg-foreground/10" />
        </>
      );

    case 'minimal':
      return (
        <>
          {/* minimal corner marks */}
          <div className="absolute left-6 top-6 h-4 w-4 border-l border-t border-foreground/10" />
          <div className="absolute right-6 top-6 h-4 w-4 border-r border-t border-foreground/10" />
          <div className="absolute left-6 bottom-6 h-4 w-4 border-l border-b border-foreground/10" />
          <div className="absolute right-6 bottom-6 h-4 w-4 border-r border-b border-foreground/10" />
        </>
      );

    case 'street':
      return (
        <>
          {/* bold bars */}
          <div
            className="absolute left-0 top-10 h-[6px] w-16"
            style={{ backgroundColor: 'var(--boutique-accent)', opacity: 0.9 }}
          />
          <div
            className="absolute right-0 top-10 h-[6px] w-24"
            style={{ backgroundColor: 'var(--boutique-accent)', opacity: 0.6 }}
          />
          {/* diagonal slash */}
          <div
            className="absolute -right-20 top-24 h-[2px] w-56 rotate-[-18deg]"
            style={{ backgroundColor: 'var(--boutique-accent)', opacity: 0.35 }}
          />
        </>
      );

    case 'vintage':
      return (
        <>
          {/* “paper” vignette */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 rounded-[36px] border border-foreground/10" />
            <div className="absolute inset-6 rounded-[30px] border border-foreground/8" />
          </div>
          {/* tiny crest dot */}
          <div
            className="absolute left-1/2 top-10 h-2 w-2 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: 'var(--boutique-accent)', opacity: 0.6 }}
          />
        </>
      );

    case 'none':
    default:
      return null;
  }
}

export const BoutiqueRenderer = ({
  brandProfile,
  featuredOutfit,
  templateId,
  patternId,
}: Props) => {
  const renderTokens = useMemo(
    () => computeRenderTokens(brandProfile ?? null, templateId, patternId),
    [brandProfile, templateId, patternId]
  );

  const theme = useMemo(() => getThemeLayout(templateId), [templateId]);

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
    // Slightly “premium” by default: solid / outline / ghost from tokens
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
      className={cn(
        'min-h-screen text-foreground relative overflow-hidden',
        theme.pagePadding
      )}
      style={{
        ...rootVars,
        backgroundColor: 'var(--boutique-bg)',
        fontFamily: 'var(--boutique-font-body)',
      }}
    >
      {/* Pattern overlay (scoped) */}
      <div
        className={cn('absolute inset-0 pointer-events-none', theme.overlayOpacityClass)}
        style={rootVars}
      />

      {/* Theme ornaments (scoped) */}
      <div className="absolute inset-0 pointer-events-none">
        <Ornaments kind={theme.ornaments} />
      </div>

      <div
        className={cn(
          'w-full mx-auto px-4 relative',
          theme.containerWidth
        )}
      >
        <div className="relative z-10 space-y-6">
          <header
            className={cn(
              'flex flex-col items-center text-center',
              theme.headerWrap,
              renderTokens.headerClass
            )}
          >
            {brandProfile?.logoUrl ? (
              <Image
                src={brandProfile.logoUrl}
                alt={`${brandProfile.brandName || 'Brand'} logo`}
                width={96}
                height={96}
                className={cn(
                  'rounded-full object-cover',
                  theme.logoWrap
                )}
              />
            ) : (
              <div
                className={cn(
                  'rounded-full flex items-center justify-center bg-card',
                  theme.logoWrap
                )}
              >
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            <div className="space-y-2">
              <h3
                className={cn(theme.nameClass)}
                style={{ fontFamily: 'var(--boutique-font-heading)' }}
              >
                {brandProfile?.brandName || 'Your Boutique Name'}
              </h3>
              <p className={cn('max-w-sm mx-auto text-muted-foreground', theme.taglineClass)}>
                {brandProfile?.tagline || 'Your amazing tagline goes here.'}
              </p>
            </div>

            {/* CTA */}
            <div className={cn(theme.ctaWrap)}>
              {featuredOutfit && <ClaimButton />}
            </div>
          </header>

          <section className={cn(renderTokens.bodyClass)}>
            {featuredOutfit ? (
              <Card className={cn(theme.cardWrap, renderTokens.cardClass)}>
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
                  {/* Subtle accent edge (premium detail) */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-1"
                    style={{ backgroundColor: 'var(--boutique-accent)', opacity: 0.65 }}
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
              <div className="aspect-video w-full rounded-2xl flex flex-col items-center justify-center text-center p-4 bg-card border border-border/40">
                <ImageIcon className="h-10 w-10 mb-2 text-muted-foreground" />
                <p className="font-medium text-muted-foreground">
                  Your featured look will appear here
                </p>
              </div>
            )}
          </section>

          <footer className={cn('text-center border-t pt-4 border-border/40', theme.footerWrap)}>
            <p className="text-xs text-muted-foreground">
              Powered by Boutique Curator
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};
