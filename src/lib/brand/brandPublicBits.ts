/**
 * @fileOverview Defines a minimal, public-safe type for a user's Brand Profile.
 * This represents the subset of brand data needed by UI components for rendering,
 * theming, and AI prompt context.
 */

import type { CSSProperties } from 'react';

/**
 * Represents the essential public-facing fields of a user's brand profile.
 * This is the canonical "data contract" for what UI components can expect.
 */
export type BrandProfilePublicBits = {
  brandName?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;

  /**
   * Defines how the logo should be framed in the boutique header.
   * 'auto': Natural aspect ratio, no cropping.
   * 'circle': Cropped to a circle.
   * 'rounded': Cropped to a rounded square.
   */
  logoStyle?: 'auto' | 'circle' | 'rounded' | null;

  /**
   * Up to 3 brand colors in hex format. Index [0] is treated as primary/accent.
   */
  brandColors?: (string | null)[];

  /**
   * Font display names, e.g. "Playfair Display", "Inter"
   */
  primaryFont?: string | null;
  secondaryFont?: string | null;

  toneOfVoice?: string | null;
  targetCustomer?: string | null;

  /**
   * The index of the brandColors array to use for the main accent.
   * Defaults to 0 if null or invalid.
   */
  accentColorIndex?: 0 | 1 | 2 | null;
  announcementColorSource?: 'accent' | 'color2' | 'color3' | null;
};

// --- Boutique Theme Engine Types ---

export const BOUTIQUE_TEMPLATES = [
  'editorial',
  'soft-luxe',
  'playful-pop',
  'modern-minimal',
  'street-bold',
  'romantic-vintage',
] as const;

export type BoutiqueTemplateId = (typeof BOUTIQUE_TEMPLATES)[number];

export const BOUTIQUE_PATTERNS = [
  'none',
  'polka',
  'pinstripe',
  'grid',
  'domino',
  'waves',
  'confetti',
  'linen',
] as const;

export type BoutiquePatternId = (typeof BOUTIQUE_PATTERNS)[number];

/**
 * The final, computed set of CSS-ready values used to render a themed boutique.
 */
export interface BoutiqueRenderTokens {
  accentColor: string;
  accentTextColor: string;
  backgroundColor: string;

  headingFontFamily: string;
  bodyFontFamily: string;
  buttonFontFamily: string;

  announcementBackgroundColor: string;
  announcementTextColor: string;

  buttonStyle: 'solid' | 'outline' | 'ghost';

  /**
   * Pattern background styles (backgroundImage/backgroundSize/etc).
   * This is applied as scoped CSS vars/styles within BoutiqueRenderer only.
   */
  patternStyles: CSSProperties;

  bannerEnabled: boolean;
  bannerStyle: CSSProperties;
  bannerHeightClass: string;

  /**
   * Tailwind class tokens (scoped to renderer usage)
   */
  cardClass: string;
  headerClass: string;
  bodyClass: string;
}
