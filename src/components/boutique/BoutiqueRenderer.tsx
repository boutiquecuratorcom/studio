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
import { computeRenderTokens, type BoutiqueRenderTokens } from '@/lib/boutique-design';
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
  logoContainer: string;
  nameClass: string;
  taglineClass: string;
  ctaWrap: string;
  cardWrap: string;
  footerWrap: string;
  overlayOpacityClass: string;
  ornaments: 'none' | 'editorial' | 'luxe' | 'pop' | 'minimal' | 'street' | 'vintage';
};

const getThemeLayout = (templateId: BoutiqueTemplateId): ThemeLayout => {
  switch (templateId) {
    case 'editorial':
      return {
        pagePadding: 'py-10 md:py-16',
        containerWidth: 'max-w-5xl',
        headerWrap: 'space-y-4 pt-2',
        logoContainer: 'h-24 w-full flex justify-center',
        nameClass: 'text-4xl md:text-5xl leading-tight tracking-tight font-semibold',
        taglineClass: 'text-base md:text-lg leading-relaxed',
        ctaWrap: 'pt-2',
        cardWrap: 'rounded-2xl overflow-hidden',
        footerWrap: 'pt-10',
        overlayOpacityClass: 'opacity-40',
        ornaments: 'editorial',
      };
    case 'soft-luxe':
      return {
        pagePadding: 'py-10 md:py-16',
        containerWidth: 'max-w-5xl',
        headerWrap: 'space-y-4 pt-2',
        logoContainer: 'h-24 w-full flex justify-center',
        nameClass: 'text-4xl md:text-5xl leading-tight tracking-tight font-semibold',
        taglineClass: 'text-base md:text-lg leading-relaxed',
        ctaWrap: 'pt-2',
        cardWrap: 'rounded-3xl overflow-hidden',
        footerWrap: 'pt-10',
        overlayOpacityClass: 'opacity-35',
        ornaments: 'luxe',
      };
    case 'playful-pop':
      return {
        pagePadding: 'py-8 md:py-12',
        containerWidth: 'max-w-5xl',
        headerWrap: 'space-y-3 pt-2',
        logoContainer: 'h-24 w-full flex justify-center',
        nameClass: 'text-4xl md:text-5xl leading-tight tracking-tight font-bold',
        taglineClass: 'text-base md:text-lg leading-relaxed',
        ctaWrap: 'pt-2',
        cardWrap: 'rounded-3xl overflow-hidden',
        footerWrap: 'pt-10',
        overlayOpacityClass: 'opacity-45',
        ornaments: 'pop',
      };
    case 'modern-minimal':
      return {
        pagePadding: 'py-10 md:py-16',
        containerWidth: 'max-w-5xl',
        headerWrap: 'space-y-4 pt-2',
        logoContainer: 'h-20 w-full flex justify-center',
        nameClass: 'text-3xl md:text-4xl leading-tight tracking-tight font-semibold',
        taglineClass: 'text-base leading-relaxed',
        ctaWrap: 'pt-3',
        cardWrap: 'rounded-2xl overflow-hidden',
        footerWrap: 'pt-10',
        overlayOpacityClass: 'opacity-25',
        ornaments: 'minimal',
      };
    case 'street-bold':
      return {
        pagePadding: 'py-8 md:py-12',
        containerWidth: 'max-w-5xl',
        headerWrap: 'space-y-3 pt-2',
        logoContainer: 'h-24 w-full flex justify-center',
        nameClass: 'text-4xl md:text-5xl leading-tight tracking-tight font-extrabold uppercase',
        taglineClass: 'text-sm md:text-base leading-relaxed uppercase tracking-wide',
        ctaWrap: 'pt-2',
        cardWrap: 'rounded-xl overflow-hidden',
        footerWrap: 'pt-10',
        overlayOpacityClass: 'opacity-25',
        ornaments: 'street',
      };
    case 'romantic-vintage':
      return {
        pagePadding: 'py-10 md:py-16',
        containerWidth: 'max-w-5xl',
        headerWrap: 'space-y-4 pt-2',
        logoContainer: 'h-24 w-full flex justify-center',
        nameClass: 'text-4xl md:text-5xl leading-tight tracking-tight font-semibold',
        taglineClass: 'text-base md:text-lg leading-relaxed italic',
        ctaWrap: 'pt-2',
        cardWrap: 'rounded-3xl overflow-hidden',
        footerWrap: 'pt-10',
        overlayOpacityClass: 'opacity-35',
        ornaments: 'vintage',
      };
  }
};

function Ornaments({ kind }: { kind: ThemeLayout['ornaments'] }) {
  switch (kind) {
    case 'editorial': return <div className="absolute left-6 right-6 top-8 h-px bg-foreground/10" />;
    case 'luxe': return <div className="absolute inset-5 rounded-[28px] border border-foreground/10 pointer-events-none" />;
    case 'pop': return <div className="absolute left-10 right-10 top-[148px] h-px bg-foreground/10" />;
    case 'minimal': return <><div className="absolute left-6 top-6 h-4 w-4 border-l border-t border-foreground/10" /><div className="absolute right-6 top-6 h-4 w-4 border-r border-t border-foreground/10" /><div className="absolute left-6 bottom-6 h-4 w-4 border-l border-b border-foreground/10" /><div className="absolute right-6 bottom-6 h-4 w-4 border-r border-b border-foreground/10" /></>;
    case 'street': return <><div className="absolute left-0 top-10 h-1.5 w-16" style={{ backgroundColor: 'var(--boutique-accent)', opacity: 0.9 }} /><div className="absolute right-0 top-10 h-1.5 w-24" style={{ backgroundColor: 'var(--boutique-accent)', opacity: 0.6 }} /></>;
    case 'vintage': return <><div className="absolute inset-0 pointer-events-none"><div className="absolute inset-0 rounded-[36px] border border-foreground/10" /><div className="absolute inset-6 rounded-[30px] border border-foreground/8" /></div></>;
    default: return null;
  }
}

export const BoutiqueRenderer = ({ brandProfile, featuredOutfit, templateId, patternId }: Props) => {
  const renderTokens = useMemo(() => computeRenderTokens(brandProfile, templateId, patternId), [brandProfile, templateId, patternId]);
  const theme = useMemo(() => getThemeLayout(templateId), [templateId]);
  
  const claimMode = featuredOutfit?.outfitClaim?.mode || 'individual';
  const outfitClaimUrl = featuredOutfit?.outfitClaim?.claim?.url;
  const outfitClaimLabel = featuredOutfit?.outfitClaim?.claim?.label || 'Claim Now';
  const logoStyle = brandProfile?.logoStyle ?? 'auto';
  const logoIsStyled = logoStyle === 'circle' || logoStyle === 'rounded';

  const rootVars: React.CSSProperties = {
    ['--boutique-accent' as any]: renderTokens.accentColor,
    ['--boutique-accent-text' as any]: renderTokens.accentTextColor,
    ['--boutique-bg' as any]: renderTokens.backgroundColor,
    ['--boutique-font-heading' as any]: renderTokens.headingFontFamily,
    ['--boutique-font-body' as any]: renderTokens.bodyFontFamily,
    ['--boutique-font-button' as any]: renderTokens.buttonFontFamily,
  };
  
  const bannerEnabled = false;

  const ClaimButton = () => {
    const style: React.CSSProperties = {
      backgroundColor: renderTokens.buttonStyle === 'solid' ? 'var(--boutique-accent)' : 'transparent',
      borderColor: renderTokens.buttonStyle === 'outline' ? 'var(--boutique-accent)' : 'transparent',
      color: renderTokens.buttonStyle === 'solid' ? 'var(--boutique-accent-text)' : 'var(--boutique-accent)',
      fontFamily: 'var(--boutique-font-button)',
    };
    const variant = renderTokens.buttonStyle === 'outline' ? 'outline' : 'default';
    if (claimMode === 'outfit' && outfitClaimUrl) {
      return (
        <Button size="lg" style={style} variant={variant} asChild className="px-8 py-6 text-base">
          <a href={outfitClaimUrl} target="_blank" rel="noopener noreferrer">{outfitClaimLabel}</a>
        </Button>
      );
    }
    return (
      <Button size="lg" style={style} variant={variant} className="pointer-events-none px-8 py-6 text-base">
        Claim a Look
      </Button>
    );
  };

  return (
    <div className={cn('min-h-screen text-foreground relative overflow-x-hidden', theme.pagePadding)} style={{ ...rootVars, backgroundColor: 'var(--boutique-bg)', fontFamily: 'var(--boutique-font-body)' }}>
      <div className={cn('absolute inset-0 pointer-events-none', theme.overlayOpacityClass)} style={renderTokens.patternStyles} />
      <div className="absolute inset-0 pointer-events-none"><Ornaments kind={theme.ornaments} /></div>
      
      <div className={cn('w-full mx-auto px-4 md:px-6 relative z-10', theme.containerWidth)}>
        
        {bannerEnabled && (
          <section className="h-40 bg-muted/50 rounded-xl mb-8">
            {/* Banner Content (disabled by default) */}
          </section>
        )}

        <header className={cn('flex flex-col items-center text-center mb-12 md:mb-16', theme.headerWrap, renderTokens.headerClass)}>
          <div className={cn('relative mb-4', theme.logoContainer)}>
            {brandProfile?.logoUrl ? (
              <div
                className={cn(
                  'relative',
                  logoIsStyled
                    ? 'h-24 w-24 overflow-hidden border-2 border-card shadow-inner'
                    : 'h-full w-full',
                  logoStyle === 'circle' && 'rounded-full',
                  logoStyle === 'rounded' && 'rounded-2xl'
                )}
              >
                <Image
                  src={brandProfile.logoUrl}
                  alt={`${brandProfile.brandName || 'Brand'} logo`}
                  fill
                  className={cn(
                    logoIsStyled ? 'object-cover' : 'object-contain'
                  )}
                />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-lg flex items-center justify-center bg-card border">
                <Store className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <h1 className={cn(theme.nameClass)} style={{ fontFamily: 'var(--boutique-font-heading)' }}>
              {brandProfile?.brandName || 'Your Boutique Name'}
            </h1>
            <p className={cn('max-w-2xl mx-auto text-muted-foreground', theme.taglineClass)}>
              {brandProfile?.tagline || 'Your amazing tagline goes here.'}
            </p>
          </div>
        </header>
        
        <main className="space-y-16 md:space-y-24">
          <section>
            {featuredOutfit ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                <Card className={cn('w-full overflow-hidden group', theme.cardWrap, renderTokens.cardClass)}>
                  <div className="relative aspect-[4/5] w-full">
                    <Image src={featuredOutfit.imageUrl || 'https://picsum.photos/seed/boutique-fallback/800/1000'} alt={featuredOutfit.title || 'Featured Outfit'} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>
                </Card>
                <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
                  <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Featured Look</h2>
                  <h3 className={cn("text-3xl md:text-4xl font-semibold leading-tight", theme.nameClass)} style={{ fontFamily: 'var(--boutique-font-heading)' }}>
                    {featuredOutfit.title}
                  </h3>
                  <p className="mt-4 max-w-md text-lg text-muted-foreground">
                    {featuredOutfit.description || `${featuredOutfit.itemCount} curated items to create the perfect look.`}
                  </p>
                  <div className={cn("mt-6", theme.ctaWrap)}>
                    <ClaimButton />
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full rounded-2xl flex flex-col items-center justify-center text-center p-4 bg-card border border-border/40">
                <ImageIcon className="h-10 w-10 mb-2 text-muted-foreground" />
                <p className="font-medium text-muted-foreground">Your featured look will appear here</p>
              </div>
            )}
          </section>

          {/* Placeholder for My Rack */}
          <section>
              <div className="text-center">
                  <h2 className="text-3xl font-semibold" style={{ fontFamily: 'var(--boutique-font-heading)' }}>From My Rack</h2>
                  <p className="text-muted-foreground mt-2">Curated items from the collection.</p>
              </div>
              <div className="mt-8 text-center p-12 bg-card/50 border-2 border-dashed rounded-2xl">
                  <p className="text-muted-foreground">Rack items will be displayed here soon.</p>
              </div>
          </section>

          {/* Placeholder for Links */}
           <section>
              <div className="text-center">
                  <h2 className="text-3xl font-semibold" style={{ fontFamily: 'var(--boutique-font-heading)' }}>Quick Links</h2>
              </div>
              <div className="mt-8 text-center p-12 bg-card/50 border-2 border-dashed rounded-2xl">
                  <p className="text-muted-foreground">Important links and calls-to-action will appear here.</p>
              </div>
          </section>
        </main>

        <footer className={cn('text-center border-t mt-16 md:mt-24 pt-8 border-border/40', theme.footerWrap)}>
          <p className="text-xs text-muted-foreground">Powered by Boutique Curator</p>
        </footer>
      </div>
    </div>
  );
};
