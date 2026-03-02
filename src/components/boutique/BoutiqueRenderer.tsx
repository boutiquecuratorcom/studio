
'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, ImageIcon, Facebook, Package, Shirt, Search } from 'lucide-react';
import type { PublicBoutiqueProfile } from '@/lib/boutique';
import type {
  BoutiquePatternId,
  BoutiqueTemplateId,
  BrandProfilePublicBits,
} from '@/lib/brand/brandPublicBits';
import { computeRenderTokens } from '@/lib/boutique-design';
import { cn } from '@/lib/utils';
import { PublicClaimButton } from './PublicClaimButton';
import type { InventoryItem } from '@/lib/inventory';
import type { Outfit } from '@/lib/outfits';
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { ItemQuickViewModal } from './ItemQuickViewModal';
import { OutfitQuickViewModal } from './OutfitQuickViewModal';

type Props = {
  brandProfile: Partial<BrandProfilePublicBits & PublicBoutiqueProfile> | null;
  featuredOutfit: PublicBoutiqueProfile['featuredOutfit'];
  templateId: BoutiqueTemplateId;
  patternId: BoutiquePatternId;
  rackItems: InventoryItem[] | null;
  outfits: Outfit[] | null;
  rackLoading: boolean;
  outfitsLoading: boolean;
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
        overlayOpacityClass: 'opacity-60',
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
        overlayOpacityClass: 'opacity-60', 
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
        overlayOpacityClass: 'opacity-75', 
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
        cardWrap: 'rounded-none overflow-hidden',
        footerWrap: 'pt-10',
        overlayOpacityClass: 'opacity-40',
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
        cardWrap: 'rounded-lg overflow-hidden',
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
        overlayOpacityClass: 'opacity-60', 
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

const EmptyState = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="text-center p-12 border-2 border-dashed rounded-2xl flex flex-col items-center">
    <div className="mb-4">{icon}</div>
    <h4 className="text-lg font-semibold" style={{ fontFamily: 'var(--boutique-font-heading)' }}>{title}</h4>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const SectionSkeleton = ({ cols = 3 }: { cols?: number }) => (
  <div className={`grid grid-cols-2 md:grid-cols-${cols > 2 ? 3 : 2} lg:grid-cols-${cols} gap-4 md:gap-6`}>
    {Array.from({ length: cols }).map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <Skeleton className="h-5 w-3/4 rounded" />
      </div>
    ))}
  </div>
);

export function BoutiqueRenderer({ brandProfile, featuredOutfit, templateId, patternId, rackItems, outfits, rackLoading, outfitsLoading }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'items' | 'outfits'>('all');
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [activeOutfit, setActiveOutfit] = useState<Outfit | null>(null);

  const renderTokens = useMemo(() => computeRenderTokens(brandProfile, templateId, patternId), [brandProfile, templateId, patternId]);
  const theme = useMemo(() => getThemeLayout(templateId), [templateId]);
  
  const lowerCaseSearchTerm = searchTerm.toLowerCase();

  const filteredItems = useMemo(() => {
    if (!rackItems || (filter !== 'all' && filter !== 'items')) return [];
    if (!lowerCaseSearchTerm) return rackItems;
    return rackItems.filter(item => 
      item.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      item.type.toLowerCase().includes(lowerCaseSearchTerm) ||
      item.sizes.some(s => s.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (item.searchKeywords || []).some(k => k.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [rackItems, lowerCaseSearchTerm, filter]);

  const filteredOutfits = useMemo(() => {
    if (!outfits || (filter !== 'all' && filter !== 'outfits')) return [];
    if (!lowerCaseSearchTerm) return outfits;
    return outfits.filter(outfit => 
      outfit.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      (outfit.storefrontDescription || '').toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [outfits, lowerCaseSearchTerm, filter]);

  const logoStyle = brandProfile?.logoStyle ?? 'auto';
  const logoIsStyled = logoStyle === 'circle' || logoStyle === 'rounded';

  const bannerEnabled = brandProfile?.bannerEnabled ?? true;
  const bannerHeightValue = brandProfile?.bannerHeight ?? 'md';
  const bannerOpacity = brandProfile?.bannerOpacity ?? 0.18;
  const bannerAccentColor = renderTokens.accentColor.startsWith('#') ? renderTokens.accentColor : '#EAE6E4';

  const bannerHeightClass = {
    sm: 'h-32',
    md: 'h-44',
    lg: 'h-56',
  }[bannerHeightValue];
  
  const bannerStyle: React.CSSProperties = {
    background: `linear-gradient(180deg, ${renderTokens.hexToRgba(bannerAccentColor, 1)} 0%, transparent 100%)`
  };


  const rootVars: React.CSSProperties = {
    ['--boutique-accent' as any]: renderTokens.accentColor,
    ['--boutique-accent-text' as any]: renderTokens.accentTextColor,
    ['--boutique-bg' as any]: renderTokens.backgroundColor,
    ['--boutique-font-heading' as any]: renderTokens.headingFontFamily,
    ['--boutique-font-body' as any]: renderTokens.bodyFontFamily,
    ['--boutique-font-button' as any]: renderTokens.buttonFontFamily,
  };
  
  const quickLinks = brandProfile?.quickLinks;
  const social = brandProfile?.social;
  const footer = brandProfile?.footer;
  
  return (
    <>
    <ItemQuickViewModal item={activeItem} onOpenChange={(isOpen) => !isOpen && setActiveItem(null)} theme={renderTokens} />
    <OutfitQuickViewModal outfit={activeOutfit} onOpenChange={(isOpen) => !isOpen && setActiveOutfit(null)} theme={renderTokens} />

    <div 
      className={cn(
        'min-h-screen relative overflow-x-hidden', 
        theme.pagePadding, 
        templateId === 'street-bold' ? 'text-white' : 'text-foreground'
      )} 
      style={{ ...rootVars, background: 'var(--boutique-bg)', fontFamily: 'var(--boutique-font-body)' }}
    >
      {bannerEnabled && (
        <div 
            className={cn(
                'absolute top-0 left-0 right-0 w-full',
                bannerHeightClass
            )}
            style={{...bannerStyle, opacity: bannerOpacity }}
        />
      )}
      <div className={cn('absolute inset-0 pointer-events-none', theme.overlayOpacityClass)} style={renderTokens.patternStyles} />
      <div className="absolute inset-0 pointer-events-none"><Ornaments kind={theme.ornaments} /></div>
      
       {social?.facebookEnabled && social.facebookUrl && (
        <a 
          href={social.facebookUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className={cn(
            'fixed bottom-4 z-50 h-14 w-14 rounded-full flex items-center justify-center shadow-lg',
            social.position === 'left' ? 'left-4' : 'right-4'
          )}
          style={{ backgroundColor: 'var(--boutique-accent)', color: 'var(--boutique-accent-text)' }}
        >
          <Facebook className="h-7 w-7" />
        </a>
      )}

      <div className={cn('w-full mx-auto px-4 md:px-6 relative z-10', theme.containerWidth)}>
        
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
            <h1 className={cn(
                theme.nameClass,
                templateId === 'street-bold' && 'text-white'
            )} style={{ fontFamily: 'var(--boutique-font-heading)' }}>
              {brandProfile?.brandName || 'Your Boutique Name'}
            </h1>
            <p className={cn('max-w-2xl mx-auto', templateId === 'street-bold' ? 'text-white/80' : 'text-muted-foreground', theme.taglineClass)}>
              {brandProfile?.tagline || 'Your amazing tagline goes here.'}
            </p>
          </div>
        </header>
        
        <main className="space-y-16 md:space-y-24">
          <section>
            {featuredOutfit ? (
                <div className="flex flex-col items-center gap-6 md:gap-8">
                    <div className="w-full max-w-xl">
                        <Card className={cn('w-full overflow-hidden group', theme.cardWrap, renderTokens.cardClass)}>
                            <div className="relative aspect-[4/5] w-full">
                                <Image src={featuredOutfit.imageUrl || 'https://picsum.photos/seed/boutique-fallback/800/1000'} alt={featuredOutfit.title || 'Featured Outfit'} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>
                        </Card>
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <h2 className={cn("text-sm uppercase tracking-widest mb-2", templateId === 'street-bold' ? 'text-white/60' : 'text-muted-foreground')}>Featured Look</h2>
                        <h3 className={cn(
                            "text-3xl md:text-4xl font-semibold leading-tight",
                             templateId === 'street-bold' ? 'text-white' : 'text-foreground'
                        )} style={{ fontFamily: 'var(--boutique-font-heading)' }}>
                            {featuredOutfit.title}
                        </h3>
                        <p className={cn("mt-4 max-w-md text-lg", templateId === 'street-bold' ? 'text-white/80' : 'text-muted-foreground')}>
                            {featuredOutfit.description || `${featuredOutfit.itemCount} curated items to create the perfect look.`}
                        </p>
                        <div className={cn("mt-6", theme.ctaWrap)}>
                            <PublicClaimButton 
                                outfitSummary={featuredOutfit} 
                                accentColor={renderTokens.accentColor} 
                                buttonStyle={renderTokens.buttonStyle} 
                                style={{ fontFamily: 'var(--boutique-font-button)' }}
                                className="px-8 py-6 text-base"
                            />
                        </div>
                    </div>
                </div>
            ) : (
              <div className={cn("aspect-video w-full rounded-2xl flex flex-col items-center justify-center text-center p-4 border", renderTokens.cardClass)}>
                <ImageIcon className="h-10 w-10 mb-2 text-muted-foreground" />
                <p className="font-medium text-muted-foreground">Your featured look will appear here</p>
              </div>
            )}
          </section>

          {quickLinks?.enabled && quickLinks.items && quickLinks.items.length > 0 && (
            <section className="text-center">
                <div className="flex flex-wrap items-center justify-center gap-4">
                    {quickLinks.items.map(item => {
                        const style: React.CSSProperties = { fontFamily: 'var(--boutique-font-button)'};
                        let variant: 'default' | 'outline' | 'ghost' = 'default';

                        if (item.style === 'primary') {
                            style.backgroundColor = renderTokens.accentColor;
                            style.color = renderTokens.accentTextColor;
                        } else if (item.style === 'secondary') {
                            variant = 'outline';
                            style.borderColor = renderTokens.accentColor;
                            style.color = renderTokens.accentColor;
                        } else {
                            variant = 'ghost';
                            style.color = renderTokens.accentColor;
                        }
                        
                        return (
                            <Button key={item.id} asChild variant={variant} style={style}>
                                <a href={item.url} target="_blank" rel="noopener noreferrer">{item.label}</a>
                            </Button>
                        )
                    })}
                </div>
            </section>
          )}

          <div className="space-y-4">
            <h2 className={cn("text-3xl font-semibold text-center", templateId === 'street-bold' && 'text-white')} style={{ fontFamily: 'var(--boutique-font-heading)' }}>Search My Boutique</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="relative flex-grow max-w-lg mx-auto sm:mx-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by keyword, type, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="items">Items</TabsTrigger>
                  <TabsTrigger value="outfits">Outfits</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {(filter === 'all' || filter === 'items') && (
            <section>
                <div className="text-center">
                    <h2 className={cn("text-3xl font-semibold", templateId === 'street-bold' && 'text-white')} style={{ fontFamily: 'var(--boutique-font-heading)' }}>From My Rack</h2>
                    <p className={cn("mt-2", templateId === 'street-bold' ? 'text-white/80' : 'text-muted-foreground')}>Curated items from the collection.</p>
                </div>
                <div className="mt-8">
                    {rackLoading ? <SectionSkeleton cols={4} />
                      : !filteredItems || filteredItems.length === 0 ? <EmptyState icon={<Shirt className="h-12 w-12 text-muted-foreground/50" />} title={searchTerm ? "No Matching Items" : "Rack is Empty"} description={searchTerm ? "Try a different search." : "Items added to 'My Rack' will appear here."} />
                      : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                          {filteredItems.map(item => (
                            <Card key={item.id} onClick={() => setActiveItem(item)} className={cn("overflow-hidden group cursor-pointer", renderTokens.cardClass)}>
                              <div className="relative aspect-square w-full">
                                <Image src={item.image.thumbUrl || 'https://picsum.photos/seed/item-fallback/400/400'} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                              </div>
                              <div className="p-3">
                                <h4 className="font-semibold truncate text-sm" style={{fontFamily: 'var(--boutique-font-heading)'}}>{item.title}</h4>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                </div>
            </section>
          )}

          {(filter === 'all' || filter === 'outfits') && (
            <section>
                <div className="text-center">
                    <h2 className={cn("text-3xl font-semibold", templateId === 'street-bold' && 'text-white')} style={{ fontFamily: 'var(--boutique-font-heading)' }}>My Outfits</h2>
                    <p className={cn("mt-2", templateId === 'street-bold' ? 'text-white/80' : 'text-muted-foreground')}>Styled looks ready to share.</p>
                </div>
                <div className="mt-8">
                  {outfitsLoading ? <SectionSkeleton cols={3} />
                    : !filteredOutfits || filteredOutfits.length === 0 ? <EmptyState icon={<Package className="h-12 w-12 text-muted-foreground/50" />} title={searchTerm ? "No Matching Outfits" : "No Outfits Yet"} description={searchTerm ? "Try a different search." : "Styled outfits will appear here once they are created."} />
                    : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {filteredOutfits.map(outfit => (
                          <Card key={outfit.id} onClick={() => setActiveOutfit(outfit)} className={cn("overflow-hidden group cursor-pointer", renderTokens.cardClass)}>
                            <div className="relative aspect-video w-full">
                              <Image src={outfit.cover?.thumbUrl || 'https://picsum.photos/seed/outfit-fallback/600/400'} alt={outfit.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                            </div>
                            <div className="p-4">
                              <h4 className="font-semibold" style={{fontFamily: 'var(--boutique-font-heading)'}}>{outfit.title}</h4>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                </div>
            </section>
          )}
        </main>

        {footer?.enabled && (
            <section className="mt-16 md:mt-24 border-t pt-12 md:pt-16" style={{ borderColor: 'var(--boutique-accent)' }}>
                {footer.layout === 'minimal' && (
                    <div className="text-center">
                        <p className={cn("text-sm", templateId === 'street-bold' ? 'text-white/80' : 'text-muted-foreground')}>{footer.message || brandProfile?.brandName}</p>
                    </div>
                )}
                {footer.layout === 'centered' && (
                    <div className="text-center max-w-xl mx-auto">
                        <h3 className={cn("text-2xl font-semibold", templateId === 'street-bold' && 'text-white')} style={{fontFamily: 'var(--boutique-font-heading)'}}>{footer.headline || 'Join Our Community'}</h3>
                        <p className={cn("mt-2 text-lg", templateId === 'street-bold' ? 'text-white/80' : 'text-muted-foreground')}>{footer.message || 'Stay up to date with the latest drops and sales.'}</p>
                        {footer.ctaLabel && footer.ctaUrl && (
                            <div className="mt-6">
                                <Button size="lg" asChild style={{ backgroundColor: 'var(--boutique-accent)', color: 'var(--boutique-accent-text)' }}>
                                    <a href={footer.ctaUrl} target="_blank" rel="noopener noreferrer">{footer.ctaLabel}</a>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
                {footer.layout === 'split' && (
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left">
                            <h3 className={cn("text-2xl font-semibold", templateId === 'street-bold' && 'text-white')} style={{fontFamily: 'var(--boutique-font-heading)'}}>{footer.headline}</h3>
                            <p className={cn("mt-1", templateId === 'street-bold' ? 'text-white/80' : 'text-muted-foreground')}>{footer.message}</p>
                        </div>
                        {footer.ctaLabel && footer.ctaUrl && (
                             <Button size="lg" asChild style={{ backgroundColor: 'var(--boutique-accent)', color: 'var(--boutique-accent-text)' }} className="flex-shrink-0">
                                <a href={footer.ctaUrl} target="_blank" rel="noopener noreferrer">{footer.ctaLabel}</a>
                            </Button>
                        )}
                    </div>
                )}
            </section>
        )}

        <footer className={cn('text-center border-t mt-16 md:mt-24 pt-8', templateId === 'street-bold' ? 'border-white/20' : 'border-border/40', theme.footerWrap)}>
          <p className={cn("text-xs", templateId === 'street-bold' ? 'text-white/60' : 'text-muted-foreground')}>Powered by Boutique Curator</p>
        </footer>
      </div>
    </div>
    </>
  );
};
