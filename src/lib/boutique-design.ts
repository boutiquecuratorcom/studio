'use client';

import type { BrandProfile } from '@/ai/flows/schemas';
import { DEFAULT_FONTS, getFontByName, isButtonSafeFont } from '@/lib/fonts';

// --- Interfaces ---

export interface BoutiquePalette {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
}

export interface BoutiqueFonts {
  heading: string;
  body: string;
  button: string;
}

export interface BoutiqueDesign {
  palette: BoutiquePalette;
  fonts: BoutiqueFonts;
  buttons: {
    radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    style: 'solid' | 'outline' | 'ghost';
  };
  frames: {
    outfitFrameStyle: 'none' | 'soft-border' | 'shadow' | 'thick-border';
  };
  background: {
    patternId: 'none' | 'subtle-dots' | 'geometric-lines' | 'sparkle' | 'flowers' | 'hearts' | 'linen' | 'grid';
    intensity: number; // 0 to 1
  };
  welcomeMessage: string | null;
  updatedAt?: any;
}


// --- Helper Functions ---

export const getFontFamily = (fontName: string | undefined, defaultFont: string) => {
  return getFontByName(fontName)?.cssFamily || defaultFont;
};

export const getContrastingTextColor = (bgHex: string): string => {
    if (!bgHex || !bgHex.startsWith('#')) return '#111827';
    const hex = bgHex.replace('#', '');
    if (hex.length !== 3 && hex.length !== 6) return '#111827';
    
    let r, g, b;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else {
        r = parseInt(hex.substring(0,2), 16);
        g = parseInt(hex.substring(2,4), 16);
        b = parseInt(hex.substring(4,6), 16);
    }
    
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 140 ? '#111827' : '#FFFFFF';
}

export const defaultDesign: Omit<BoutiqueDesign, 'updatedAt'> = {
  palette: {
      background: '#f8f6f2',
      surface: '#ffffff',
      text: '#111111',
      muted: '#A8A29A',
      accent: '#d4af37',
      accentText: '#111111',
  },
  fonts: { 
    heading: DEFAULT_FONTS.heading, 
    body: DEFAULT_FONTS.body, 
    button: DEFAULT_FONTS.button 
  },
  buttons: { radius: 'md', style: 'solid' },
  frames: { outfitFrameStyle: 'soft-border' },
  background: { patternId: 'none', intensity: 0 },
  welcomeMessage: null,
};

export const getBoutiqueDesignDefaults = (brandProfile?: BrandProfile | null): Omit<BoutiqueDesign, 'updatedAt'> => {
  const accentColor = (brandProfile?.brandColors && brandProfile.brandColors[0]) || defaultDesign.palette.accent;
  
  const secondaryFont = brandProfile?.secondaryFont || DEFAULT_FONTS.body;
  const buttonFont = isButtonSafeFont(secondaryFont) ? secondaryFont : DEFAULT_FONTS.button;

  return {
    ...defaultDesign,
    palette: {
        ...defaultDesign.palette,
        accent: accentColor,
        accentText: getContrastingTextColor(accentColor),
    },
    fonts: {
        heading: brandProfile?.primaryFont || DEFAULT_FONTS.heading,
        body: secondaryFont,
        button: buttonFont,
    },
  };
};
