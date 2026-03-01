'use client';

import type { BrandProfile } from '@/ai/flows/schemas';

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
  const fontOptions: { name: string, family: string }[] = [
    { name: 'Playfair Display', family: "'Playfair Display', serif" },
    { name: 'Montserrat', family: 'Montserrat, sans-serif' },
    { name: 'Poppins', family: 'Poppins, sans-serif' },
    { name: 'DM Sans', family: "'DM Sans', sans-serif" },
    { name: 'Lora', family: "'Lora', serif" },
    { name: 'Oswald', family: 'Oswald, sans-serif' },
    { name: 'Libre Baskerville', family: "'Libre Baskerville', serif" },
    { name: 'Raleway', family: 'Raleway, sans-serif' },
    { name: 'Inter', family: 'Inter, sans-serif' },
    { name: 'Nunito', family: 'Nunito, sans-serif' },
    { name: 'Quicksand', family: 'Quicksand, sans-serif' },
    { name: 'Cinzel', family: "'Cinzel', serif" },
    { name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif" },
    { name: 'Josefin Sans', family: "'Josefin Sans', sans-serif" },
    { name: 'Merriweather', family: "'Merriweather', serif" },
    { name: 'Abril Fatface', family: "'Abril Fatface', cursive" },
    { name: 'Urbanist', family: 'Urbanist, sans-serif' },
    { name: 'Manrope', family: 'Manrope, sans-serif' },
    { name: 'Tenor Sans', family: "'Tenor Sans', sans-serif" },
    { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif" },
    { name: 'Lato', family: 'Lato, sans-serif' },
    { name: 'Open Sans', family: "'Open Sans', sans-serif" },
    { name: 'DM Serif Display', family: "'DM Serif Display', serif" },
    { name: 'Dancing Script', family: "'Dancing Script', cursive" },
    { name: 'Work Sans', family: "'Work Sans', sans-serif" },
    { name: 'Figtree', family: "'Figtree', sans-serif" },
    { name: 'Caveat', family: "'Caveat', cursive" },
    { name: 'Source Sans 3', family: "'Source Sans 3', sans-serif" },
    { name: 'Roboto Slab', family: "'Roboto Slab', serif" },
  ];
  return fontOptions.find(f => f.name === fontName)?.family || defaultFont;
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
  fonts: { heading: 'Playfair Display', body: 'Inter', button: 'Inter' },
  buttons: { radius: 'md', style: 'solid' },
  frames: { outfitFrameStyle: 'soft-border' },
  background: { patternId: 'none', intensity: 0 },
  welcomeMessage: null,
};

export const getBoutiqueDesignDefaults = (brandProfile?: BrandProfile | null): Omit<BoutiqueDesign, 'updatedAt'> => {
  const accentColor = (brandProfile?.brandColors && brandProfile.brandColors[0]) || defaultDesign.palette.accent;

  return {
    ...defaultDesign,
    palette: {
        ...defaultDesign.palette,
        accent: accentColor,
        accentText: getContrastingTextColor(accentColor),
    },
    fonts: {
        heading: brandProfile?.primaryFont || defaultDesign.fonts.heading,
        body: brandProfile?.secondaryFont || defaultDesign.fonts.body,
        button: brandProfile?.secondaryFont || defaultDesign.fonts.button,
    },
  };
};
