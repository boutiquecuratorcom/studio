'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type PlatformFormat = 'IG_FEED' | 'IG_STORY' | 'FB_FEED';
type TemplateId = 'CLEAN_BOUTIQUE' | 'BOLD_DROP' | 'MINIMAL_LUXE' | 'COMMENT_SOLD_LIVE';

type BrandProfile = {
  brandName?: string;
  primaryFont?: string;
  secondaryFont?: string;
  brandColors?: string[];
};

interface PostPreviewProps {
  imageUrl: string;
  platformFormat: PlatformFormat;
  templateId: TemplateId;
  headline: string;
  subtext: string;
  cta: string;
  brandProfile?: BrandProfile | null;
}

const fontOptions: { name: string, family: string }[] = [
    { name: 'Inter', family: 'Inter, sans-serif' },
    { name: 'Playfair Display', family: "'Playfair Display', serif" },
    { name: 'Lora', family: "'Lora', serif" },
    { name: 'Montserrat', family: 'Montserrat, sans-serif' },
    { name: 'Lato', family: 'Lato, sans-serif' },
    { name: 'Raleway', family: 'Raleway, sans-serif' },
    { name: 'Poppins', family: 'Poppins, sans-serif' },
    { name: 'Open Sans', family: "'Open Sans', sans-serif" },
    { name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif" },
    { name: 'DM Serif Display', family: "'DM Serif Display', serif" },
    { name: 'Libre Baskerville', family: "'Libre Baskerville', serif" },
    { name: 'Dancing Script', family: "'Dancing Script', cursive" },
    { name: 'Great Vibes', family: "'Great Vibes', cursive" },
    { name: 'Pacifico', family: "'Pacifico', cursive" },
    { name: 'Lobster', family: "'Lobster', cursive" },
];

const getFontFamily = (fontName: string | undefined, defaultFont: string) => {
  return fontOptions.find(f => f.name === fontName)?.family || defaultFont;
};

const aspectRatios: Record<PlatformFormat, string> = {
  IG_FEED: 'aspect-[4/5]',
  IG_STORY: 'aspect-[9/16]',
  FB_FEED: 'aspect-[4/5]',
};

export const PostPreview = React.forwardRef<HTMLDivElement, PostPreviewProps>(
  ({ imageUrl, platformFormat, templateId, headline, subtext, cta, brandProfile }, ref) => {
    const primaryFont = getFontFamily(brandProfile?.primaryFont, "'Playfair Display', serif");
    const secondaryFont = getFontFamily(brandProfile?.secondaryFont, "'Inter', sans-serif");
    
    const primaryBrandColor = brandProfile?.brandColors?.[0] || '#212121';
    const ctaTextColor = '#FFFFFF';
    const headlineColor = '#FFFFFF';
    const subtextColor = '#FFFFFF';

    const headlineSizeClass = useMemo(() => {
        const len = headline.length;
        if (templateId === 'MINIMAL_LUXE') return len > 15 ? 'text-4xl' : 'text-5xl';
        if (len > 25) return 'text-5xl';
        if (len > 15) return 'text-6xl';
        if (len > 8) return 'text-7xl';
        return 'text-8xl';
    }, [headline, templateId]);
    
    const templateStyles = useMemo(() => ({
        CLEAN_BOUTIQUE: {
            topZone: 'justify-center text-center',
            headline: `font-bold uppercase tracking-wider ${headlineSizeClass}`,
            headlineStyle: { fontFamily: primaryFont, color: headlineColor, textShadow: '1px 1px 3px rgba(0,0,0,0.2)' },
            bottomZone: 'flex-col items-center justify-center gap-4 text-center',
            subtext: 'order-1 text-lg uppercase tracking-widest',
            subtextStyle: { fontFamily: secondaryFont, color: subtextColor, textShadow: '1px 1px 3px rgba(0,0,0,0.4)' },
            cta: 'order-2 text-lg font-bold py-3 px-8 rounded-lg uppercase',
            ctaStyle: { fontFamily: secondaryFont, backgroundColor: primaryBrandColor, color: ctaTextColor },
        },
        BOLD_DROP: {
            topZone: 'justify-start text-left',
            headline: `font-extrabold uppercase leading-none ${headlineSizeClass}`,
            headlineStyle: { fontFamily: primaryFont, color: headlineColor, mixBlendMode: 'difference' as const },
            bottomZone: 'flex-row items-end justify-between',
            subtext: 'text-left text-xl font-semibold',
            subtextStyle: { fontFamily: secondaryFont, color: subtextColor, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' },
            cta: 'text-lg font-bold py-3 px-6 rounded-md uppercase',
            ctaStyle: { fontFamily: secondaryFont, backgroundColor: primaryBrandColor, color: ctaTextColor },
        },
        MINIMAL_LUXE: {
            topZone: 'justify-center text-center',
            headline: `font-light uppercase tracking-[0.2em] ${headlineSizeClass}`,
            headlineStyle: { fontFamily: secondaryFont, color: headlineColor, textShadow: '1px 1px 3px rgba(0,0,0,0.2)' },
            bottomZone: 'flex-col items-center justify-center gap-3',
            subtext: 'order-2 text-base tracking-wider',
            subtextStyle: { fontFamily: secondaryFont, color: subtextColor, textShadow: '1px 1px 2px rgba(0,0,0,0.4)' },
            cta: 'order-1 text-sm font-semibold py-2 px-6 border rounded-full uppercase tracking-wider',
            ctaStyle: { fontFamily: secondaryFont, borderColor: headlineColor, color: headlineColor },
        },
        COMMENT_SOLD_LIVE: {
            topZone: 'justify-center text-center',
            headline: `font-black uppercase leading-none ${headlineSizeClass}`,
            headlineStyle: { fontFamily: primaryFont, color: headlineColor, textShadow: '2px 2px 8px rgba(0,0,0,0.7)' },
            bottomZone: 'flex-col items-center justify-center gap-4 text-center',
            subtext: 'order-2 text-2xl font-bold',
            subtextStyle: { fontFamily: secondaryFont, color: subtextColor, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' },
            cta: 'order-1 text-2xl font-black py-4 px-12 rounded-lg uppercase shadow-2xl animate-pulse',
            ctaStyle: { fontFamily: primaryFont, backgroundColor: primaryBrandColor, color: ctaTextColor },
        },
    }), [templateId, headlineSizeClass, primaryFont, secondaryFont, primaryBrandColor, headlineColor, subtextColor, ctaTextColor]);
    
    const styles = templateStyles[templateId];

    return (
      <div className="flex justify-center items-center bg-muted/20 p-4 rounded-2xl">
        <div
          ref={ref}
          className={cn(
            'relative w-full max-w-lg overflow-hidden bg-gray-800 shadow-2xl transition-all duration-300',
            aspectRatios[platformFormat]
          )}
        >
          <Image
            src={imageUrl}
            alt="Post preview"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col p-[60px]">
            <div className={cn('flex items-center', styles.topZone)}>
              <h1 className={cn(styles.headline)} style={styles.headlineStyle}>{headline}</h1>
            </div>
            
            <div className="flex-grow" />
            
            <div className={cn('flex', styles.bottomZone)}>
              <h2 className={cn(styles.subtext)} style={styles.subtextStyle}>{subtext}</h2>
              <div className={cn(styles.cta)} style={styles.ctaStyle}>{cta}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PostPreview.displayName = 'PostPreview';
