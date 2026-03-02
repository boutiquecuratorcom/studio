/**
 * @fileOverview Defines a minimal, public-safe type for a user's Brand Profile.
 * This represents the subset of brand data needed by UI components for rendering,
 * theming, and AI prompt context.
 */

// --- Core Brand Data Contract ---

/**
 * Represents the essential public-facing fields of a user's brand profile.
 * This is the canonical "data contract" for what UI components can expect.
 */
export type BrandProfilePublicBits = {
  brandName?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  brandColors?: (string | null)[];
  primaryFont?: string | null;
  secondaryFont?: string | null;
  toneOfVoice?: string | null;
  targetCustomer?: string | null;
};

// --- Boutique Theme Engine Types ---

export const BOUTIQUE_TEMPLATES = [
  'editorial', 
  'soft-luxe', 
  'playful-pop', 
  'modern-minimal', 
  'street-bold', 
  'romantic-vintage'
] as const;
export type BoutiqueTemplateId = typeof BOUTIQUE_TEMPLATES[number];

export const BOUTIQUE_PATTERNS = [
  'none', 
  'polka', 
  'pinstripe', 
  'grid', 
  'domino', 
  'waves', 
  'confetti', 
  'linen'
] as const;
export type BoutiquePatternId = typeof BOUTIQUE_PATTERNS[number];

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
  buttonTextColor: string;
  buttonStyle: 'solid' | 'outline' | 'ghost';
  patternStyles: React.CSSProperties;
  cardClass: string;
  headerClass: string;
  bodyClass: string;
}
