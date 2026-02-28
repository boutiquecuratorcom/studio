'use client';

import { doc, serverTimestamp, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { useMemo } from 'react';
import type { BrandProfile } from '@/ai/flows/schemas';

// 1. Interfaces
export interface BoutiqueDesign {
  id: string;
  templateId: 'editorial-chic' | 'modern-minimal' | 'soft-feminine' | 'bold-luxury' | 'playful-boutique';
  accentColor: string; // Legacy, kept for quick customize
  palette: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    accentText: string;
  };
  fonts: {
    heading: string;
    body: string;
    button: string;
  };
  buttons: {
    radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    style: 'solid' | 'outline' | 'ghost';
  };
  frames: {
    outfitFrameStyle: 'none' | 'soft-border' | 'shadow' | 'thick-border';
  };
  background: {
    patternId: 'none' | 'subtle-dots' | 'geometric-lines';
    intensity: number; // 0 to 1
  };
  welcomeMessage: string | null;
  updatedAt?: any;
}

// 2. Templates Definition
export const boutiqueTemplates: Record<BoutiqueDesign['templateId'], Omit<BoutiqueDesign, 'id' | 'updatedAt' | 'accentColor' | 'welcomeMessage'>> = {
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
    background: { patternId: 'none', intensity: 0 },
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
    background: { patternId: 'subtle-dots', intensity: 0.05 },
  },
};

// 3. Helper functions
export const getFontFamily = (fontName: string | undefined, defaultFont: string) => {
  const fontOptions = [
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
    { name: 'Quicksand', family: 'Quicksand, sans-serif' },
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
    accentColor: accentColor,
    palette: {
      ...defaultTemplate.palette,
      accent: accentColor,
      accentText: getContrastingTextColor(accentColor),
    },
    welcomeMessage: null,
  };
};

// 4. Hooks and data functions

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

    