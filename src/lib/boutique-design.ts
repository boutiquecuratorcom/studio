'use client';

import { doc, serverTimestamp, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { useMemo } from 'react';
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
  id: string;
  templateId: 'editorial-chic' | 'modern-minimal' | 'soft-feminine' | 'bold-luxury' | 'playful-boutique';
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


// --- Templates Definition ---

export const boutiqueTemplates: Record<BoutiqueDesign['templateId'], Omit<BoutiqueDesign, 'id' | 'updatedAt' | 'welcomeMessage'>> = {
  'editorial-chic': {
    templateId: 'editorial-chic',
    palette: {
      background: '#FDFCF9',
      surface: '#FFFFFF',
      text: '#1F1C17',
      muted: '#A8A29A',
      accent: '#C6A15B',
      accentText: '#FFFFFF',
    },
    fonts: { heading: 'Playfair Display', body: 'Inter', button: 'Inter' },
    buttons: { radius: 'md', style: 'solid' },
    frames: { outfitFrameStyle: 'soft-border' },
    background: { patternId: 'none', intensity: 0 },
  },
  'modern-minimal': {
    templateId: 'modern-minimal',
    palette: {
      background: '#F7FAFC',
      surface: '#FFFFFF',
      text: '#1A202C',
      muted: '#718096',
      accent: '#4A5568',
      accentText: '#FFFFFF',
    },
    fonts: { heading: 'Montserrat', body: 'Inter', button: 'Inter' },
    buttons: { radius: 'sm', style: 'solid' },
    frames: { outfitFrameStyle: 'none' },
    background: { patternId: 'none', intensity: 0 },
  },
  'soft-feminine': {
    templateId: 'soft-feminine',
    palette: {
      background: '#FFF9F9',
      surface: '#FFFFFF',
      text: '#5B4242',
      muted: '#C7BABA',
      accent: '#E6A8A8',
      accentText: '#5B4242',
    },
    fonts: { heading: 'Lora', body: 'Lato', button: 'Lato' },
    buttons: { radius: 'full', style: 'solid' },
    frames: { outfitFrameStyle: 'shadow' },
    background: { patternId: 'flowers', intensity: 0.05 },
  },
  'bold-luxury': {
    templateId: 'bold-luxury',
    palette: {
      background: '#0B0F17',
      surface: '#111827',
      text: '#F8FAFC',
      muted: '#94A3B8',
      accent: '#D4AF37',
      accentText: '#0B0F17',
    },
    fonts: { heading: 'DM Serif Display', body: 'Raleway', button: 'Raleway' },
    buttons: { radius: 'none', style: 'outline' },
    frames: { outfitFrameStyle: 'thick-border' },
    background: { patternId: 'none', intensity: 0 },
  },
   'playful-boutique': {
    templateId: 'playful-boutique',
    palette: {
      background: '#FEFCE8',
      surface: '#FFFFFF',
      text: '#44403C',
      muted: '#A8A29E',
      accent: '#FB923C',
      accentText: '#FFFFFF',
    },
    fonts: { heading: 'Poppins', body: 'Quicksand', button: 'Poppins' },
    buttons: { radius: 'full', style: 'solid' },
    frames: { outfitFrameStyle: 'shadow' },
    background: { patternId: 'sparkle', intensity: 0.08 },
  },
};


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

export const getBoutiqueDesignDefaults = (brandProfile?: BrandProfile | null): Omit<BoutiqueDesign, 'id' | 'updatedAt'> => {
  const defaultTemplate = boutiqueTemplates['editorial-chic'];
  const accentColor = (brandProfile?.brandColors && brandProfile.brandColors[0]) || defaultTemplate.palette.accent;

  return {
    ...defaultTemplate,
    palette: {
      ...defaultTemplate.palette,
      accent: accentColor,
      accentText: getContrastingTextColor(accentColor),
    },
    welcomeMessage: null,
  };
};

// --- Hooks and Data Functions ---

export const useBoutiqueDesign = (userId: string | null) => {
  const firestore = useFirestore();
  const docRef = useMemo(() => {
    if (!userId || !firestore) return null;
    return doc(firestore, `users/${userId}/boutiqueDesign/main`);
  }, [userId, firestore]);

  return useDoc<BoutiqueDesign>(docRef as any);
};

export const initializeBoutiqueDesign = async (firestore: Firestore, userId: string, brandProfile?: BrandProfile | null) => {
  const designRef = doc(firestore, `users/${userId}/boutiqueDesign/main`);
  const docSnap = await getDoc(designRef);

  if (!docSnap.exists()) {
    const defaults = getBoutiqueDesignDefaults(brandProfile);
    await setDoc(designRef, { ...defaults, updatedAt: serverTimestamp() });
    return { ...defaults, id: 'main' };
  }
  return docSnap.data();
};

export const updateBoutiqueDesign = async (firestore: Firestore, userId: string, data: Partial<Omit<BoutiqueDesign, 'id'>>) => {
  const designRef = doc(firestore, `users/${userId}/boutiqueDesign/main`);
  await setDoc(designRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

    