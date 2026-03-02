import { type BrandProfilePublicBits, type BoutiqueTemplateId, type BoutiquePatternId, type BoutiqueRenderTokens } from "./brand/brandPublicBits";
import { getFontByName, isButtonSafeFont } from "./fonts";

// --- Color Utilities ---

/**
 * Validates a string as a hex color.
 * @returns The normalized hex color (e.g., #RRGGBB) or null if invalid.
 */
export const validateHexColor = (color: string | null | undefined): string | null => {
  if (!color) return null;
  const hex = color.replace('#', '');
  if (!/^[0-9a-fA-F]{3,6}$/.test(hex)) return null;
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }
  return `#${hex}`;
};

/**
 * Calculates a contrasting text color (black or white) for a given hex background.
 * @param hex A valid hex color string.
 * @returns '#FFFFFF' for dark backgrounds, '#000000' for light backgrounds.
 */
export const getContrastingTextColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 128 ? '#000000' : '#FFFFFF';
};


// --- Theme & Pattern Definitions ---

const THEME_DEFAULTS = {
  accentColor: 'hsl(var(--accent))',
  accentTextColor: 'hsl(var(--accent-foreground))',
  backgroundColor: 'hsl(var(--background))',
  headingFontFamily: 'var(--font-headline)',
  bodyFontFamily: 'var(--font-body)',
  buttonFontFamily: 'var(--font-body)',
  buttonTextColor: 'var(--font-body)',
  buttonStyle: 'solid' as const,
  cardClass: 'bg-card text-card-foreground',
  headerClass: '',
  bodyClass: '',
};

const PATTERNS: Record<BoutiquePatternId, React.CSSProperties> = {
    none: {},
    polka: { backgroundImage: 'radial-gradient(currentColor 0.5px, transparent 0.5px)', backgroundSize: 'calc(10 * 0.5px) calc(10 * 0.5px)' },
    pinstripe: { backgroundImage: 'linear-gradient(currentColor 0.5px, transparent 0.5px)', backgroundSize: '6px 6px' },
    grid: { backgroundImage: 'linear-gradient(currentColor 0.5px, transparent 0.5px), linear-gradient(90deg, currentColor 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' },
    domino: { backgroundImage: 'radial-gradient(circle at 100% 150%, currentColor 24%, transparent 25%), radial-gradient(circle at 0 150%, currentColor 24%, transparent 25%)', backgroundSize: '30px 60px' },
    waves: { backgroundImage: 'radial-gradient(circle at 50% 0, currentColor 12%, transparent 13%), radial-gradient(circle at 50% 100%, transparent 12%, currentColor 13%)', backgroundSize: '20px 20px' },
    confetti: { backgroundImage: 'linear-gradient(135deg, currentColor 25%, transparent 25%), linear-gradient(225deg, currentColor 25%, transparent 25%), linear-gradient(45deg, currentColor 25%, transparent 25%), linear-gradient(315deg, currentColor 25%, transparent 25%)', backgroundSize: '10px 10px' },
    linen: { backgroundImage: 'linear-gradient(315deg, transparent 75%, currentColor 75%), linear-gradient(45deg, transparent 75%, currentColor 75%)', backgroundSize: '12px 12px' },
};

// --- Main Computation Logic ---

/**
 * Computes the final render tokens for the boutique based on brand and theme settings.
 * This function is the single source of truth for boutique styling.
 */
export const computeRenderTokens = (
  brandProfile: BrandProfilePublicBits | null | undefined,
  templateId: BoutiqueTemplateId,
  patternId: BoutiquePatternId
): BoutiqueRenderTokens => {
    
  const tokens: BoutiqueRenderTokens = { ...THEME_DEFAULTS };

  // 1. Apply Brand Defaults
  const brandAccent = validateHexColor(brandProfile?.brandColors?.[0]);
  if (brandAccent) {
    tokens.accentColor = brandAccent;
    tokens.accentTextColor = getContrastingTextColor(brandAccent);
  }

  const primaryFont = getFontByName(brandProfile?.primaryFont);
  if (primaryFont) {
    tokens.headingFontFamily = primaryFont.cssFamily;
  }
  
  const secondaryFont = getFontByName(brandProfile?.secondaryFont);
  if (secondaryFont) {
    tokens.bodyFontFamily = secondaryFont.cssFamily;
    if (isButtonSafeFont(secondaryFont.name)) {
      tokens.buttonFontFamily = secondaryFont.cssFamily;
    }
  }

  // 2. Apply Template Overrides (example for 'modern-minimal')
  switch(templateId) {
      case 'modern-minimal':
        tokens.backgroundColor = '#FFFFFF';
        tokens.cardClass = 'bg-transparent border-none shadow-none';
        tokens.buttonStyle = 'outline';
        break;
      case 'soft-luxe':
        tokens.backgroundColor = '#F8F5F2';
        tokens.cardClass = 'bg-white/50 rounded-lg shadow-sm';
        break;
      // Add other template cases here
  }
  
  // 3. Compute Pattern Styles
  tokens.patternStyles = {
      ...PATTERNS[patternId] || {},
      '--pattern-color': 'rgba(128, 128, 128, 0.1)',
  };

  return tokens;
};
