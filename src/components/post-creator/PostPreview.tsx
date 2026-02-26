'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type PlatformFormat = 'IG_FEED' | 'IG_STORY' | 'FB_FEED';
type TemplateId = 'MODERN_CATALOG' | 'MINIMAL_LOOK' | 'BOLD_STATEMENT';
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
  FB_FEED: 'aspect-[1.91/1]',
};

export const PostPreview = React.forwardRef<HTMLDivElement, PostPreviewProps>(
  ({ imageUrl, platformFormat, templateId, headline, subtext, cta, brandProfile }, ref) => {
    const primaryFont = getFontFamily(brandProfile?.primaryFont, 'Playfair Display, serif');
    const secondaryFont = getFontFamily(brandProfile?.secondaryFont, 'Inter, sans-serif');
    const primaryColor = brandProfile?.brandColors?.[0] || '#FFFFFF';
    const secondaryColor = brandProfile?.brandColors?.[1] || '#FFFFFF';
    const accentColor = brandProfile?.brandColors?.[2] || '#C56A3D';

    const renderModernCatalog = () => (
      <>
        <div className="absolute top-8 left-8 right-8 text-left">
          <h1
            className="text-5xl md:text-7xl font-bold uppercase tracking-tighter"
            style={{ fontFamily: primaryFont, color: primaryColor, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}
          >
            {headline}
          </h1>
        </div>
        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
            <h2
                className="text-xl md:text-2xl font-semibold"
                style={{ fontFamily: secondaryFont, color: secondaryColor, textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}
            >
                {subtext}
            </h2>
             <div
                className="text-lg md:text-xl font-bold p-3 uppercase"
                style={{ fontFamily: secondaryFont, backgroundColor: accentColor, color: '#FFFFFF' }}
            >
                {cta}
            </div>
        </div>
      </>
    );
    
    // Stubbed templates
    const renderMinimalLook = () => (
         <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-black/20">
            <h1 className="text-4xl md:text-6xl font-light uppercase tracking-widest" style={{ fontFamily: secondaryFont, color: primaryColor }}>{headline}</h1>
            <h2 className="mt-4 text-lg md:text-xl" style={{ fontFamily: secondaryFont, color: secondaryColor }}>{subtext}</h2>
         </div>
    );
    const renderBoldStatement = () => (
        <div className="absolute inset-0 flex flex-col items-start justify-end text-left p-8">
            <h1 className="text-6xl md:text-8xl font-extrabold" style={{ fontFamily: primaryFont, color: primaryColor, mixBlendMode: 'overlay' }}>{headline.toUpperCase()}</h1>
            <div className="mt-4 text-lg md:text-xl font-bold p-3" style={{ fontFamily: secondaryFont, color: accentColor, backgroundColor: primaryColor }}>{cta}</div>
        </div>
    );

    const renderTemplate = () => {
        switch (templateId) {
            case 'MODERN_CATALOG': return renderModernCatalog();
            case 'MINIMAL_LOOK': return renderMinimalLook();
            case 'BOLD_STATEMENT': return renderBoldStatement();
            default: return renderModernCatalog();
        }
    }

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
          {renderTemplate()}
        </div>
      </div>
    );
  }
);

PostPreview.displayName = 'PostPreview';
