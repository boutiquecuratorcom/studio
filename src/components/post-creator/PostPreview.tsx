'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { PlatformFormat, TemplateId, TextLayerStyle } from './PostCreatorClient';

type TextLayer = {
    text: string;
} & TextLayerStyle;

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
  headline: TextLayer;
  subtext: TextLayer;
  cta: TextLayer;
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
  FB_FEED: 'aspect-square',
};

const getTextColor = (mode: TextLayerStyle['textColorMode'], brandPrimary: string, brandAccent: string) => {
    switch(mode) {
        case 'light': return '#FFFFFF';
        case 'dark': return '#111111';
        case 'brandPrimary': return brandPrimary;
        case 'brandAccent': return brandAccent;
        case 'auto':
        default:
            return '#FFFFFF';
    }
}

// Simple contrast checker for badge text
const isColorDark = (hexColor: string) => {
    const color = hexColor.substring(1); // remove #
    const rgb = parseInt(color, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128;
}

const TextLayerComponent = ({ layer, type, brandProfile }: { layer: TextLayer, type: 'headline' | 'subtext' | 'cta', brandProfile?: BrandProfile | null}) => {
    const primaryFont = getFontFamily(brandProfile?.primaryFont, "'Playfair Display', serif");
    const secondaryFont = getFontFamily(brandProfile?.secondaryFont, "'Inter', sans-serif");
    const brandPrimary = brandProfile?.brandColors?.[0] || '#111111';
    const brandAccent = brandProfile?.brandColors?.[1] || '#22c55e';

    const { text, textColorMode, useBadge } = layer;

    const layerStyle: React.CSSProperties = {
        fontFamily: type === 'headline' ? primaryFont : secondaryFont,
        textShadow: textColorMode === 'auto' ? '0 2px 8px rgba(0,0,0,0.6)' : 'none',
    };
    
    let textColor = getTextColor(textColorMode, brandPrimary, brandAccent);
    let badgeBgColor = 'transparent';

    if (useBadge) {
        switch (textColorMode) {
            case 'light':
                badgeBgColor = 'rgba(17, 17, 17, 0.7)'; // #111111
                break;
            case 'dark':
                badgeBgColor = 'rgba(255, 255, 255, 0.8)';
                break;
            case 'brandPrimary':
                badgeBgColor = brandPrimary;
                textColor = isColorDark(brandPrimary) ? '#FFFFFF' : '#111111';
                break;
            case 'brandAccent':
                badgeBgColor = brandAccent;
                textColor = isColorDark(brandAccent) ? '#FFFFFF' : '#111111';
                break;
            case 'auto':
            default:
                badgeBgColor = 'rgba(17, 17, 17, 0.7)';
                textColor = '#FFFFFF';
        }
    }
    
    layerStyle.color = textColor;
    
    const badgeStyle: React.CSSProperties = {
        backgroundColor: badgeBgColor,
    };
    
    const headlineSizeClass = useMemo(() => {
        const len = text.length;
        if (len > 25) return 'text-5xl';
        if (len > 15) return 'text-6xl';
        if (len > 8) return 'text-7xl';
        return 'text-8xl';
    }, [text]);

    const baseClasses = 'w-full text-center transition-all duration-300';
    let typeClasses = '';
    
    switch(type) {
        case 'headline':
            typeClasses = `font-bold uppercase tracking-wider leading-tight ${headlineSizeClass}`;
            break;
        case 'subtext':
            typeClasses = 'text-lg uppercase tracking-widest';
            break;
        case 'cta':
            typeClasses = 'text-lg font-bold uppercase';
            break;
    }

    return (
        <div className={cn(baseClasses, typeClasses, useBadge && 'px-6 py-3 rounded-xl')} style={{...layerStyle, ...badgeStyle}}>
            {text}
        </div>
    )
};


export const PostPreview = React.forwardRef<HTMLDivElement, PostPreviewProps>(
  ({ imageUrl, platformFormat, headline, subtext, cta, brandProfile }, ref) => {
    
    const layers = { headline, subtext, cta };
    const topLayers = Object.entries(layers).filter(([, layer]) => layer.position === 'top');
    const centerLayers = Object.entries(layers).filter(([, layer]) => layer.position === 'center');
    const bottomLayers = Object.entries(layers).filter(([, layer]) => layer.position === 'bottom');

    return (
      <div className="flex justify-center items-start bg-muted/20 p-4 rounded-2xl">
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
          <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-10 lg:p-12">
            {/* Top Zone */}
            <div className="flex flex-col items-center gap-4">
                {topLayers.map(([key, layer]) => (
                    <TextLayerComponent key={key} layer={layer} type={key as 'headline' | 'subtext' | 'cta'} brandProfile={brandProfile} />
                ))}
            </div>

            {/* Center Zone */}
            <div className="flex flex-col items-center gap-4">
                {centerLayers.map(([key, layer]) => (
                    <TextLayerComponent key={key} layer={layer} type={key as 'headline' | 'subtext' | 'cta'} brandProfile={brandProfile} />
                ))}
            </div>

            {/* Bottom Zone */}
            <div className="flex flex-col items-center gap-4">
                {bottomLayers.map(([key, layer]) => (
                    <TextLayerComponent key={key} layer={layer} type={key as 'headline' | 'subtext' | 'cta'} brandProfile={brandProfile} />
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PostPreview.displayName = 'PostPreview';
