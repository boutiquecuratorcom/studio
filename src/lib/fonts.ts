export type FontCategory =
  | 'serif'
  | 'sans-serif'
  | 'display'
  | 'handwriting'
  | 'monospace';

export interface FontDefinition {
  name: string;
  cssFamily: string;
  category: FontCategory;
  isButtonSafe: boolean;
}

/*
IMPORTANT:
We keep RAW_FONTS separate so TypeScript validates every entry.
Then we export a sorted clean list.
*/

const RAW_FONTS = [
  // Sans-serif (button safe)
  { name: 'Inter', cssFamily: 'Inter, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Poppins', cssFamily: 'Poppins, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Raleway', cssFamily: 'Raleway, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Montserrat', cssFamily: 'Montserrat, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Lato', cssFamily: 'Lato, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Open Sans', cssFamily: "'Open Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Roboto', cssFamily: 'Roboto, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Nunito', cssFamily: 'Nunito, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Quicksand', cssFamily: 'Quicksand, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Source Sans 3', cssFamily: "'Source Sans 3', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Work Sans', cssFamily: "'Work Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Figtree', cssFamily: 'Figtree, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Manrope', cssFamily: 'Manrope, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Urbanist', cssFamily: 'Urbanist, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Plus Jakarta Sans', cssFamily: "'Plus Jakarta Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Josefin Sans', cssFamily: "'Josefin Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Tenor Sans', cssFamily: "'Tenor Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Hind', cssFamily: 'Hind, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Cabin', cssFamily: 'Cabin, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Karla', cssFamily: 'Karla, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Rubik', cssFamily: 'Rubik, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Maven Pro', cssFamily: "'Maven Pro', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Barlow', cssFamily: 'Barlow, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Titillium Web', cssFamily: "'Titillium Web', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Mulish', cssFamily: 'Mulish, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Proza Libre', cssFamily: "'Proza Libre', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Abel', cssFamily: 'Abel, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Archivo', cssFamily: 'Archivo, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Asap', cssFamily: 'Asap, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Chivo', cssFamily: 'Chivo, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Comfortaa', cssFamily: 'Comfortaa, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'DM Sans', cssFamily: "'DM Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Fira Sans', cssFamily: "'Fira Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Heebo', cssFamily: 'Heebo, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'IBM Plex Sans', cssFamily: "'IBM Plex Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Jost', cssFamily: 'Jost, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'League Spartan', cssFamily: "'League Spartan', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Libre Franklin', cssFamily: "'Libre Franklin', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Livvic', cssFamily: 'Livvic, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Merriweather Sans', cssFamily: "'Merriweather Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Noto Sans', cssFamily: "'Noto Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Prompt', cssFamily: 'Prompt, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Questrial', cssFamily: 'Questrial, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Rajdhani', cssFamily: 'Rajdhani, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Red Hat Display', cssFamily: "'Red Hat Display', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Signika', cssFamily: 'Signika, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Sora', cssFamily: 'Sora, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Space Grotesk', cssFamily: "'Space Grotesk', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Syne', cssFamily: 'Syne, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Yantramanav', cssFamily: 'Yantramanav, sans-serif', category: 'sans-serif', isButtonSafe: true },

  // Serif
  { name: 'Playfair Display', cssFamily: "'Playfair Display', serif", category: 'serif', isButtonSafe: false },
  { name: 'Lora', cssFamily: 'Lora, serif', category: 'serif', isButtonSafe: false },
  { name: 'DM Serif Display', cssFamily: "'DM Serif Display', serif", category: 'serif', isButtonSafe: false },
  { name: 'Merriweather', cssFamily: 'Merriweather, serif', category: 'serif', isButtonSafe: false },
  { name: 'Roboto Slab', cssFamily: "'Roboto Slab', serif", category: 'serif', isButtonSafe: false },
  { name: 'Libre Baskerville', cssFamily: "'Libre Baskerville', serif", category: 'serif', isButtonSafe: false },
  { name: 'Cormorant Garamond', cssFamily: "'Cormorant Garamond', serif", category: 'serif', isButtonSafe: false },
  { name: 'Cinzel', cssFamily: 'Cinzel, serif', category: 'serif', isButtonSafe: false },
  { name: 'Bitter', cssFamily: 'Bitter, serif', category: 'serif', isButtonSafe: false },
  { name: 'Noto Serif', cssFamily: "'Noto Serif', serif", category: 'serif', isButtonSafe: false },
  { name: 'PT Serif', cssFamily: "'PT Serif', serif", category: 'serif', isButtonSafe: false },
  { name: 'Source Serif Pro', cssFamily: "'Source Serif Pro', serif", category: 'serif', isButtonSafe: false },
  { name: 'Cardo', cssFamily: 'Cardo, serif', category: 'serif', isButtonSafe: false },
  { name: 'Crimson Text', cssFamily: "'Crimson Text', serif", category: 'serif', isButtonSafe: false },
  { name: 'EB Garamond', cssFamily: "'EB Garamond', serif", category: 'serif', isButtonSafe: false },
  { name: 'Vollkorn', cssFamily: 'Vollkorn, serif', category: 'serif', isButtonSafe: false },
  { name: 'Domine', cssFamily: 'Domine, serif', category: 'serif', isButtonSafe: false },
  { name: 'Zilla Slab', cssFamily: "'Zilla Slab', serif", category: 'serif', isButtonSafe: false },
] satisfies FontDefinition[];

export const ALL_FONTS: FontDefinition[] = [...RAW_FONTS].sort((a, b) =>
  a.name.localeCompare(b.name)
);

export const BUTTON_SAFE_FONTS = ALL_FONTS.filter((f) => f.isButtonSafe);

export const DEFAULT_FONTS = {
  heading: 'Playfair Display',
  body: 'Inter',
  button: 'Inter',
};

const ALL_FONT_NAMES = new Set(ALL_FONTS.map((f) => f.name));
const BUTTON_SAFE_FONT_NAMES = new Set(BUTTON_SAFE_FONTS.map((f) => f.name));

export function getFontByName(name?: string | null): FontDefinition | undefined {
  if (!name) return undefined;
  return ALL_FONTS.find((font) => font.name === name);
}

export function isButtonSafeFont(name?: string | null): boolean {
  if (!name) return false;
  return BUTTON_SAFE_FONT_NAMES.has(name);
}

export function normalizeFontName(
  name: string | undefined | null,
  allowedNames: Set<string>,
  fallbackName: string
): string {
  if (name && allowedNames.has(name)) {
    return name;
  }
  return fallbackName;
}

export function getNormalizedFonts(
  fonts?: { heading?: string; body?: string; button?: string } | null
) {
  return {
    heading: normalizeFontName(fonts?.heading, ALL_FONT_NAMES, DEFAULT_FONTS.heading),
    body: normalizeFontName(fonts?.body, ALL_FONT_NAMES, DEFAULT_FONTS.body),
    button: normalizeFontName(fonts?.button, BUTTON_SAFE_FONT_NAMES, DEFAULT_FONTS.button),
  };
}
