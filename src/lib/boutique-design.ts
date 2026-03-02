/**
 * @fileOverview Boutique theme token computation logic.
 * Pure functions: no Firestore writes, no UI, no side effects.
 */

import type { CSSProperties } from 'react';
import type {
  BrandProfilePublicBits,
  BoutiquePatternId,
  BoutiqueRenderTokens,
  BoutiqueTemplateId,
} from './brand/brandPublicBits';
import { getFontByName, isButtonSafeFont } from './fonts';

// -------------------------
// Color utilities
// -------------------------

export const validateHexColor = (
  color: string | null | undefined
): string | null => {
  if (!color) return null;
  const raw = color.trim();
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  const hex = withHash.slice(1);

  // allow exactly 3 or 6 hex chars
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return null;

  if (hex.length === 3) {
    const [r, g, b] = hex.split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return `#${hex}`.toUpperCase();
};

export const getContrastingTextColor = (hex: string): string => {
  // hex assumed validated as #RRGGBB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // relative luminance (simple)
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // Tailwind gray-900 vs white
  return luma > 140 ? '#111827' : '#FFFFFF';
};

const hexToRgba = (hex: string, alpha: number): string => {
  const h = validateHexColor(hex);
  if (!h) return `rgba(17,24,39,${alpha})`;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// -------------------------
// Defaults
// -------------------------

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

// -------------------------
// Pattern definitions (scoped)
// -------------------------

const PATTERNS: Record<BoutiquePatternId, CSSProperties> = {
  none: {},

  polka: {
    backgroundImage:
      'radial-gradient(currentColor 1.5px, transparent 1.5px)',
    backgroundSize: '20px 20px',
  },

  pinstripe: {
    backgroundImage:
      'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 8px)',
  },

  grid: {
    backgroundImage:
      'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
    backgroundSize: '18px 18px',
  },

  domino: {
    backgroundImage:
      'radial-gradient(circle at 25% 25%, currentColor 12%, transparent 13%), radial-gradient(circle at 75% 75%, currentColor 12%, transparent 13%)',
    backgroundSize: '22px 22px',
  },

  waves: {
    backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 80 40\' width=\'80\' height=\'40\'%3e%3cpath fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.5\' d=\'M0 20 Q 20 0 40 20 T 80 20\'%3e%3c/path%3e%3c/svg%3e")',
    backgroundSize: '40px',
  },

  confetti: {
    backgroundImage:
      'radial-gradient(currentColor 1px, transparent 1px), radial-gradient(currentColor 1px, transparent 1px)',
    backgroundPosition: '0 0, 8px 12px',
    backgroundSize: '18px 18px',
  },

  linen: {
    backgroundImage:
      'repeating-linear-gradient(0deg, currentColor 0, currentColor 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, currentColor 0, currentColor 1px, transparent 1px, transparent 8px)',
    backgroundSize: '22px 22px',
  },
};

// -------------------------
// Template overrides (6 themes)
// Minimal but distinct. Later we’ll expand layouts in the renderer.
// -------------------------

const applyTemplateOverrides = (
  tokens: BoutiqueRenderTokens,
  templateId: BoutiqueTemplateId
) => {
  const accentIsHex = tokens.accentColor.startsWith('#');

  switch (templateId) {
    case 'editorial':
      tokens.backgroundColor = accentIsHex
        ? `radial-gradient(ellipse at 80% 20%, ${hexToRgba(tokens.accentColor, 0.08)}, hsl(var(--background)) 50%)`
        : 'hsl(var(--background))';
      tokens.cardClass = 'bg-card text-card-foreground';
      tokens.buttonStyle = 'solid';
      break;

    case 'soft-luxe':
      tokens.backgroundColor = '#F8F5F2';
      tokens.cardClass = 'bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-black/5';
      tokens.buttonStyle = 'solid';
      break;

    case 'playful-pop':
      tokens.backgroundColor = accentIsHex
        ? `radial-gradient(ellipse at 20% 20%, ${hexToRgba(tokens.accentColor, 0.15)}, #ffffff 60%)`
        : '#FFFFFF';
      tokens.cardClass = 'bg-card text-card-foreground rounded-xl shadow-md';
      tokens.buttonStyle = 'solid';
      break;

    case 'modern-minimal':
      tokens.backgroundColor = '#FFFFFF';
      tokens.cardClass = 'bg-transparent border border-border shadow-none';
      tokens.buttonStyle = 'outline';
      break;

    case 'street-bold':
      tokens.backgroundColor = `radial-gradient(ellipse at 50% 0%, #333 0%, #0B0B0E 70%)`;
      tokens.cardClass = 'bg-white/5 border border-white/10 text-white';
      tokens.buttonStyle = 'solid';
      break;

    case 'romantic-vintage':
       tokens.backgroundColor = accentIsHex
        ? `radial-gradient(ellipse at 50% 100%, ${hexToRgba(tokens.accentColor, 0.12)}, #FFF7F2 50%)`
        : '#FFF7F2';
      tokens.cardClass = 'bg-white/50 border border-black/10 rounded-2xl shadow-sm';
      tokens.buttonStyle = 'outline';
      break;
  }
};

// -------------------------
// Main computation
// -------------------------

export const computeRenderTokens = (
  brandProfile: BrandProfilePublicBits | null | undefined,
  templateId: BoutiqueTemplateId,
  patternId: BoutiquePatternId
): BoutiqueRenderTokens => {
  const tokens: BoutiqueRenderTokens = { ...THEME_DEFAULTS };

  // 1) Brand accent
  const brandAccent = validateHexColor(brandProfile?.brandColors?.[0] ?? null);
  if (brandAccent) {
    tokens.accentColor = brandAccent;
    tokens.accentTextColor = getContrastingTextColor(brandAccent);
  }

  // 2) Fonts
  const primaryFont = getFontByName(brandProfile?.primaryFont);
  if (primaryFont?.cssFamily) {
    tokens.headingFontFamily = primaryFont.cssFamily;
  }

  const secondaryFont = getFontByName(brandProfile?.secondaryFont);
  if (secondaryFont?.cssFamily) {
    tokens.bodyFontFamily = secondaryFont.cssFamily;
    if (isButtonSafeFont(secondaryFont.name)) {
      tokens.buttonFontFamily = secondaryFont.cssFamily;
    } else {
      tokens.buttonFontFamily = tokens.bodyFontFamily;
    }
  }

  // 3) Template overrides
  applyTemplateOverrides(tokens, templateId);

  // 4) Pattern styles (scoped) — tint with accent, subtle by default
  const basePattern = PATTERNS[patternId] ?? {};
  const accentForPattern =
    typeof tokens.accentColor === 'string' && tokens.accentColor.startsWith('#')
      ? tokens.accentColor
      : '#111827';
  
  let patternOpacity = templateId === 'street-bold' ? 0.25 : 0.2;

  tokens.patternStyles = {
    ...basePattern,
    color: hexToRgba(accentForPattern, patternOpacity),
  };

  return tokens;
};
