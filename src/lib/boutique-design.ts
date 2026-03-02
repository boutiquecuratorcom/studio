import type {
  BrandProfilePublicBits,
  BoutiquePatternId,
  BoutiqueRenderTokens,
  BoutiqueTemplateId,
} from './brand/brandPublicBits';
import { getFontByName, isButtonSafeFont } from './fonts';
import type { CSSProperties } from 'react';

// --- Color Utilities ---

/**
 * Validates a string as a hex color.
 * @returns The normalized hex color (e.g., #RRGGBB) or null if invalid.
 */
export const validateHexColor = (color: string | null | undefined): string | null => {
  if (!color) return null;

  const raw = color.trim();
  const hex = raw.startsWith('#') ? raw.slice(1) : raw;

  // Only allow 3 or 6
  if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) return null;

  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
  }

  return `#${hex}`.toUpperCase();
};

/**
 * Calculates a contrasting text color for a given hex background.
 * Returns a near-black for light backgrounds and white for dark backgrounds.
 */
export const getContrastingTextColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // perceived luminance
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 140 ? '#111827' : '#FFFFFF';
};

// --- Theme & Pattern Definitions ---

const THEME_DEFAULTS: BoutiqueRenderTokens = {
  accentColor: 'hsl(var(--accent))',
  accentTextColor: 'hsl(var(--accent-foreground))',
  backgroundColor: 'hsl(var(--background))',

  headingFontFamily: 'var(--font-headline)',
  bodyFontFamily: 'var(--font-body)',
  buttonFontFamily: 'var(--font-body)',

  buttonStyle: 'solid',

  cardClass: 'bg-card text-card-foreground',
  headerClass: '',
  bodyClass: '',

  patternStyles: {},
};

const PATTERNS: Record<BoutiquePatternId, CSSProperties> = {
  none: {},
  polka: {
    backgroundImage: 'radial-gradient(var(--pattern-color) 0.8px, transparent 0.8px)',
    backgroundSize: '14px 14px',
  },
  pinstripe: {
    backgroundImage: 'linear-gradient(90deg, var(--pattern-color) 1px, transparent 1px)',
    backgroundSize: '10px 10px',
  },
  grid: {
    backgroundImage:
      'linear-gradient(var(--pattern-color) 1px, transparent 1px), linear-gradient(90deg, var(--pattern-color) 1px, transparent 1px)',
    backgroundSize: '18px 18px',
  },
  domino: {
    backgroundImage:
      'radial-gradient(circle at 25% 25%, var(--pattern-color) 2px, transparent 2.2px), radial-gradient(circle at 75% 75%, var(--pattern-color) 2px, transparent 2.2px)',
    backgroundSize: '26px 26px',
  },
  waves: {
    backgroundImage:
      'radial-gradient(circle at 50% 0%, var(--pattern-color) 12%, transparent 13%), radial-gradient(circle at 50% 100%, var(--pattern-color) 12%, transparent 13%)',
    backgroundSize: '24px 24px',
  },
  confetti: {
    backgroundImage:
      'radial-gradient(var(--pattern-color) 1px, transparent 1px), radial-gradient(var(--pattern-color) 1px, transparent 1px)',
    backgroundSize: '18px 18px',
    backgroundPosition: '0 0, 9px 9px',
  },
  linen: {
    backgroundImage:
      'linear-gradient(45deg, var(--pattern-color) 1px, transparent 1px), linear-gradient(-45deg, var(--pattern-color) 1px, transparent 1px)',
    backgroundSize: '16px 16px',
  },
};

/**
 * Computes the final render tokens for the boutique based on brand and theme settings.
 * This function is PURE and is intended to be called ONLY from BoutiqueRenderer.
 */
export const computeRenderTokens = (
  brandProfile: BrandProfilePublicBits | null | undefined,
  templateId: BoutiqueTemplateId,
  patternId: BoutiquePatternId
): BoutiqueRenderTokens => {
  const tokens: BoutiqueRenderTokens = { ...THEME_DEFAULTS };

  // 1) Brand defaults
  const brandAccent = validateHexColor(brandProfile?.brandColors?.[0] ?? null);
  if (brandAccent) {
    tokens.accentColor = brandAccent;
    tokens.accentTextColor = getContrastingTextColor(brandAccent);
  }

  const primaryFont = getFontByName(brandProfile?.primaryFont ?? undefined);
  if (primaryFont) {
    tokens.headingFontFamily = primaryFont.cssFamily;
  }

  const secondaryFont = getFontByName(brandProfile?.secondaryFont ?? undefined);
  if (secondaryFont) {
    tokens.bodyFontFamily = secondaryFont.cssFamily;
    if (isButtonSafeFont(secondaryFont.name)) {
      tokens.buttonFontFamily = secondaryFont.cssFamily;
    }
  }

  // 2) Template overrides (expand later)
  switch (templateId) {
    case 'modern-minimal':
      tokens.backgroundColor = '#FFFFFF';
      tokens.cardClass = 'bg-transparent border-none shadow-none';
      tokens.buttonStyle = 'outline';
      break;

    case 'soft-luxe':
      tokens.backgroundColor = '#F8F5F2';
      tokens.cardClass = 'bg-white/70 rounded-xl shadow-sm';
      break;

    case 'playful-pop':
      tokens.cardClass = 'bg-card/90 rounded-xl shadow-sm';
      break;

    case 'street-bold':
      tokens.cardClass = 'bg-card rounded-none border-2';
      tokens.buttonStyle = 'solid';
      break;

    case 'romantic-vintage':
      tokens.backgroundColor = '#FBF7F3';
      tokens.cardClass = 'bg-white/80 rounded-2xl shadow-sm';
      break;

    case 'editorial':
    default:
      // keep defaults
      break;
  }

  // 3) Pattern styles
  // Pattern color aligned to accent, but subtle. If accent is hsl(var(--accent)),
  // this still works because CSS var is used.
  tokens.patternStyles = {
    ...PATTERNS[patternId],
    // subtle overlay color
    ['--pattern-color' as any]: 'color-mix(in srgb, var(--boutique-accent) 12%, transparent)',
  };

  return tokens;
};
