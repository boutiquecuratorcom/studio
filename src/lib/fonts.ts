export interface FontDefinition {
  name: string;
  cssFamily: string;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  isButtonSafe: boolean;
}

export const ALL_FONTS: FontDefinition[] = [
  // Sans-Serif (Button Safe)
  { name: 'Inter', cssFamily: 'Inter, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Poppins', cssFamily: 'Poppins, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Raleway', cssFamily: 'Raleway, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Montserrat', cssFamily: 'Montserrat, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Nunito', cssFamily: 'Nunito, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Quicksand', cssFamily: 'Quicksand, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Source Sans 3', cssFamily: "'Source Sans 3', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Work Sans', cssFamily: "'Work Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Figtree', cssFamily: 'Figtree, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Manrope', cssFamily: 'Manrope, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Lato', cssFamily: 'Lato, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Open Sans', cssFamily: "'Open Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Urbanist', cssFamily: 'Urbanist, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Plus Jakarta Sans', cssFamily: "'Plus Jakarta Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Josefin Sans', cssFamily: "'Josefin Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Tenor Sans', cssFamily: "'Tenor Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },

  // Serif
  { name: 'Playfair Display', cssFamily: "'Playfair Display', serif", category: 'serif', isButtonSafe: false },
  { name: 'Lora', cssFamily: 'Lora, serif', category: 'serif', isButtonSafe: false },
  { name: 'DM Serif Display', cssFamily: "'DM Serif Display', serif", category: 'serif', isButtonSafe: false },
  { name: 'Merriweather', cssFamily: 'Merriweather, serif', category: 'serif', isButtonSafe: false },
  { name: 'Roboto Slab', cssFamily: "'Roboto Slab', serif", category: 'serif', isButtonSafe: false },
  { name: 'Libre Baskerville', cssFamily: "'Libre Baskerville', serif", category: 'serif', isButtonSafe: false },
  { name: 'Cormorant Garamond', cssFamily: "'Cormorant Garamond', serif", category: 'serif', isButtonSafe: false },
  { name: 'Cinzel', cssFamily: 'Cinzel, serif', category: 'serif', isButtonSafe: false },
  
  // Display / Decorative
  { name: 'Abril Fatface', cssFamily: "'Abril Fatface', display", category: 'display', isButtonSafe: false },
  { name: 'Oswald', cssFamily: 'Oswald, sans-serif', category: 'display', isButtonSafe: false },
  { name: 'Pacifico', cssFamily: 'Pacifico, cursive', category: 'handwriting', isButtonSafe: false },
  { name: 'Lobster', cssFamily: 'Lobster, cursive', category: 'handwriting', isButtonSafe: false },

  // Handwriting / Cursive
  { name: 'Caveat', cssFamily: 'Caveat, cursive', category: 'handwriting', isButtonSafe: false },
  { name: 'Dancing Script', cssFamily: "'Dancing Script', cursive", category: 'handwriting', isButtonSafe: false },
  { name: 'Great Vibes', cssFamily: "'Great Vibes', cursive", category: 'handwriting', isButtonSafe: false },
];

export const BUTTON_SAFE_FONTS = ALL_FONTS.filter(font => font.isButtonSafe);

export const DEFAULT_FONTS = {
  heading: 'Playfair Display',
  body: 'Inter',
  button: 'Inter',
};

const ALL_FONT_NAMES = new Set(ALL_FONTS.map(f => f.name));
const BUTTON_SAFE_FONT_NAMES = new Set(BUTTON_SAFE_FONTS.map(f => f.name));

/**
 * Retrieves a font definition object by its name.
 * @param name The name of the font to find.
 * @returns The FontDefinition object or undefined if not found.
 */
export function getFontByName(name?: string | null): FontDefinition | undefined {
  if (!name) return undefined;
  return ALL_FONTS.find(font => font.name === name);
}

/**
 * Checks if a given font name is in the button-safe list.
 * @param name The name of the font to check.
 * @returns True if the font is button-safe, false otherwise.
 */
export function isButtonSafeFont(name?: string | null): boolean {
  if (!name) return false;
  return BUTTON_SAFE_FONT_NAMES.has(name);
}

/**
 * Ensures a font name is valid against a list of allowed names, returning a fallback if not.
 * @param name The font name to validate.
 * @param allowedNames The set of valid font names.
 * @param fallbackName The name to return if the original is invalid.
 * @returns A valid font name.
 */
export function normalizeFontName(name: string | undefined | null, allowedNames: Set<string>, fallbackName: string): string {
    if (name && allowedNames.has(name)) {
        return name;
    }
    return fallbackName;
}

/**
 * Normalizes all fonts in a design object.
 */
export function getNormalizedFonts(fonts?: { heading?: string, body?: string, button?: string } | null) {
  return {
    heading: normalizeFontName(fonts?.heading, ALL_FONT_NAMES, DEFAULT_FONTS.heading),
    body: normalizeFontName(fonts?.body, ALL_FONT_NAMES, DEFAULT_FONTS.body),
    button: normalizeFontName(fonts?.button, BUTTON_SAFE_FONT_NAMES, DEFAULT_FONTS.button),
  };
}
