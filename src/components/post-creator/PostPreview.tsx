'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { PlatformFormat, TemplateId, TextLayerStyle, FrameStyle } from './PostCreatorClient';
import { getFontByName } from '@/lib/fonts';

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
  frameStyle: FrameStyle;
  headline: TextLayer;
  subtext: TextLayer;
  cta: TextLayer;
  brandProfile?: BrandProfile | null;
}

const getFontFamily = (fontName: string | undefined, defaultFont: string) => {
  return getFontByName(fontName)?.cssFamily || defaultFont;
};

const aspectRatios: Record<PlatformFormat, string> = {
  IG_FEED: 'aspect-[4/5]',
  FB_FEED: 'aspect-square',
};

const isColorDark = (hexColor: string): boolean => {
  if (!hexColor || !hexColor.startsWith('#')) return false;
  const hex = hexColor.length === 4 ? `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}` : hexColor;
  if (hex.length !== 7) return false;
  
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 140; // Increased threshold for better contrast on mid-tones
};


const TextLayerComponent = ({ layer, type, templateId, brandProfile }: { layer: TextLayer, type: 'headline' | 'subtext' | 'cta', templateId: TemplateId, brandProfile?: BrandProfile | null}) => {
    const primaryFont = getFontFamily(brandProfile?.primaryFont, "Poppins, sans-serif");
    const secondaryFont = getFontFamily(brandProfile?.secondaryFont, "'Montserrat', sans-serif");
    const brandPrimary = brandProfile?.brandColors?.[0] || '#111111';
    const brandAccent = brandProfile?.brandColors?.[1] || '#22c55e';

    const { text, textColorMode, badgeColor } = layer;

    // --- Color & Style Resolution ---
    let resolvedTextColor: string;
    let resolvedBadgeColor: string = 'transparent';
    const badgeOpacity = 0.8;
    const hasBadge = badgeColor !== 'none';

    if (hasBadge) {
        resolvedTextColor = isColorDark(badgeColor) ? '#FFFFFF' : '#111111';
        
        // Convert hex to rgba for opacity
        const hex = badgeColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        resolvedBadgeColor = `rgba(${r}, ${g}, ${b}, ${badgeOpacity})`;

    } else {
         switch (textColorMode) {
            case 'light': resolvedTextColor = '#FFFFFF'; break;
            case 'dark': resolvedTextColor = '#111111'; break;
            case 'brandPrimary': resolvedTextColor = brandPrimary; break;
            case 'brandAccent': resolvedTextColor = brandAccent; break;
            case 'auto': default: resolvedTextColor = '#FFFFFF';
        }
    }

    const layerStyle: React.CSSProperties = {
        fontFamily: type === 'headline' ? primaryFont : secondaryFont,
        color: resolvedTextColor,
        textShadow: textColorMode === 'auto' && !hasBadge ? '0 2px 8px rgba(0,0,0,0.6)' : 'none',
    };
    
    const badgeStyle: React.CSSProperties = {
        backgroundColor: resolvedBadgeColor,
    };
    
    // --- Font Size & Class Resolution ---
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
            typeClasses = cn(
                'font-bold uppercase leading-tight',
                headlineSizeClass,
                {
                    'tracking-wider': templateId === 'CLEAN_BOUTIQUE',
                    'tracking-tighter': templateId === 'BOLD_DROP',
                }
            );
            break;
        case 'subtext':
            typeClasses = cn('uppercase', {
                'text-lg tracking-widest': templateId === 'CLEAN_BOUTIQUE' || templateId === 'MINIMAL_LUXE',
                'text-base tracking-wider': templateId === 'BOLD_DROP' || templateId === 'COMMENT_SOLD_LIVE',
            });
            break;
        case 'cta':
            typeClasses = cn('font-bold uppercase', {
                'text-lg': templateId === 'CLEAN_BOUTIQUE' || templateId === 'MINIMAL_LUXE',
                'text-xl tracking-wide': templateId === 'BOLD_DROP',
                'text-2xl animate-pulse': templateId === 'COMMENT_SOLD_LIVE',
            });
            break;
    }

    return (
        <div className={cn(baseClasses, typeClasses, hasBadge && 'px-6 py-3 rounded-lg')} style={{...layerStyle, ...badgeStyle}}>
            {text}
        </div>
    )
};


export const PostPreview = React.forwardRef<HTMLDivElement, PostPreviewProps>(
  ({ imageUrl, platformFormat, templateId, frameStyle, headline, subtext, cta, brandProfile }, ref) => {
    
    const layers = { headline, subtext, cta };
    const topLayers = Object.entries(layers).filter(([, layer]) => layer.position === 'top');
    const centerLayers = Object.entries(layers).filter(([, layer]) => layer.position === 'center');
    const bottomLayers = Object.entries(layers).filter(([, layer]) => layer.position === 'bottom');
    const brandAccent = brandProfile?.brandColors?.[1] || '#22c55e';

    return (
      <div className="flex justify-center items-start bg-muted/20 p-4 rounded-2xl">
        <div
          ref={ref}
           className={cn(
            'w-full max-w-lg transition-all duration-300',
            { // Frame Styles
              'p-4 pb-16 bg-white shadow-lg': frameStyle === 'polaroid',
              'p-3 bg-card shadow-xl rounded-2xl': frameStyle === 'shadowCard',
              'p-1.5 rounded-lg': frameStyle === 'accentStroke',
              'p-1 bg-card rounded-2xl shadow-lg': frameStyle === 'classicBorder',
            }
          )}
          style={frameStyle === 'accentStroke' ? { backgroundColor: brandAccent } : {}}
        >
            <div
                className={cn(
                    'relative w-full overflow-hidden bg-gray-800 shadow-inner',
                    aspectRatios[platformFormat],
                    { // Inner container rounding
                        'rounded-lg': frameStyle === 'shadowCard' || frameStyle === 'accentStroke',
                        'border-4 border-white': frameStyle === 'classicBorder',
                    }
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
                            <TextLayerComponent key={key} layer={layer} type={key as 'headline' | 'subtext' | 'cta'} templateId={templateId} brandProfile={brandProfile} />
                        ))}
                    </div>

                    {/* Center Zone */}
                    <div className="flex flex-col items-center gap-4">
                        {centerLayers.map(([key, layer]) => (
                            <TextLayerComponent key={key} layer={layer} type={key as 'headline' | 'subtext' | 'cta'} templateId={templateId} brandProfile={brandProfile} />
                        ))}
                    </div>

                    {/* Bottom Zone */}
                    <div className="flex flex-col items-center gap-4">
                        {bottomLayers.map(([key, layer]) => (
                            <TextLayerComponent key={key} layer={layer} type={key as 'headline' | 'subtext' | 'cta'} templateId={templateId} brandProfile={brandProfile} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }
);

PostPreview.displayName = 'PostPreview';
