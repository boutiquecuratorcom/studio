export interface FontDefinition {
  name: string;
  cssFamily: string;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  isButtonSafe: boolean;
}

export const ALL_FONTS: FontDefinition[] = [
  // Sans-Serif (many are button-safe)
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

  // Display
  { name: 'Abril Fatface', cssFamily: "'Abril Fatface', display", category: 'display', isButtonSafe: false },
  { name: 'Oswald', cssFamily: 'Oswald, sans-serif', category: 'display', isButtonSafe: false },
  { name: 'Bebas Neue', cssFamily: "'Bebas Neue', sans-serif", category: 'display', isButtonSafe: false },
  { name: 'Anton', cssFamily: 'Anton, sans-serif', category: 'display', isButtonSafe: false },
  { name: 'Alfa Slab One', cssFamily: "'Alfa Slab One', display", category: 'display', isButtonSafe: false },
  { name: 'Righteous', cssFamily: 'Righteous, display', category: 'display', isButtonSafe: false },
  { name: 'Ultra', cssFamily: 'Ultra, serif', category: 'display', isButtonSafe: false },
  { name: 'Passion One', cssFamily: "'Passion One', display", category: 'display', isButtonSafe: false },
  { name: 'Fredoka One', cssFamily: "'Fredoka One', display", category: 'display', isButtonSafe: false },
  { name: 'Lilita One', cssFamily: "'Lilita One', display", category: 'display', isButtonSafe: false },
  { name: 'Graduate', cssFamily: 'Graduate, serif', category: 'display', isButtonSafe: false },
  { name: 'Staatliches', cssFamily: 'Staatliches, display', category: 'display', isButtonSafe: false },
  { name: 'Poiret One', cssFamily: "'Poiret One', display", category: 'display', isButtonSafe: false },
  { name: 'Monoton', cssFamily: 'Monoton, display', category: 'display', isButtonSafe: false },
  { name: 'Six Caps', cssFamily: "'Six Caps', sans-serif", category: 'display', isButtonSafe: false },
  { name: 'Shrikhand', cssFamily: 'Shrikhand, display', category: 'display', isButtonSafe: false },
  { name: 'Rye', cssFamily: 'Rye, serif', category: 'display', isButtonSafe: false },
  { name: 'Yeseva One', cssFamily: "'Yeseva One', display", category: 'display', isButtonSafe: false },

  // Handwriting
  { name: 'Caveat', cssFamily: 'Caveat, cursive', category: 'handwriting', isButtonSafe: false },
  { name: 'Dancing Script', cssFamily: "'Dancing Script', cursive", category: 'handwriting', isButtonSafe: false },
  { name: 'Great Vibes', cssFamily: "'Great Vibes', cursive", category: 'handwriting', isButtonSafe: false },
  { name: 'Pacifico', cssFamily: 'Pacifico, cursive', category: 'handwriting', isButtonSafe: false },
  { name: 'Lobster', cssFamily: 'Lobster, cursive', category: 'handwriting', isButtonSafe: false },
  { name: 'Indie Flower', cssFamily: "'Indie Flower', cursive", category: 'handwriting', isButtonSafe: false },
  { name: 'Shadows Into Light', cssFamily: "'Shadows Into Light', cursive", category: 'handwriting', isButtonSafe: false },
  { name: 'Permanent Marker', cssFamily: "'Permanent Marker', cursive", category: 'handwriting', isButtonSafe: false },
  { name: 'Amatic SC', cssFamily: "'Amatic SC', cursive", category: 'handwriting', isButtonSafe: false },
  { name: 'Patrick Hand', cssFamily: "'Patrick Hand', cursive", category: 'handwriting', isButtonSafe: false },
  { name: 'Satisfy', cssFamily: 'Satisfy, cursive', category: 'handwriting', isButtonSafe: false },
  { name: 'Kalam', cssFamily: 'Kalam, cursive', category: 'handwriting', isButtonSafe: false },
  { name: 'Architects Daughter', cssFamily: "'Architects Daughter', cursive", category: 'handwriting', isButtonSafe: false },
  { name: 'Sacramento', cssFamily: 'Sacramento, cursive', category: 'handwriting', isButtonSafe: false },
  { name: 'Courgette', cssFamily: 'Courgette, cursive', category: 'handwriting', isButtonSafe: false },
  { name: 'Kaushan Script', cssFamily: "'Kaushan Script', cursive", category: 'handwriting', isButtonSafe: false },
  
  // Monospace
  { name: 'Roboto Mono', cssFamily: "'Roboto Mono', monospace", category: 'monospace', isButtonSafe: false },
  { name: 'Source Code Pro', cssFamily: "'Source Code Pro', monospace", category: 'monospace', isButtonSafe: false },
  { name: 'Inconsolata', cssFamily: 'Inconsolata, monospace', category: 'monospace', isButtonSafe: false },
  { name: 'Space Mono', cssFamily: "'Space Mono', monospace", category: 'monospace', isButtonSafe: false },
  { name: 'Cutive Mono', cssFamily: "'Cutive Mono', monospace", category: 'monospace', isButtonSafe: false },
  { name: 'Nanum Gothic Coding', cssFamily: "'Nanum Gothic Coding', monospace", category: 'monospace', isButtonSafe: false },
  { name: 'Share Tech Mono', cssFamily: "'Share Tech Mono', monospace", category: 'monospace', isButtonSafe: false },
  { name: 'Major Mono Display', cssFamily: "'Major Mono Display', monospace", category: 'monospace', isButtonSafe: false },
  
  // Additional Fonts
  { name: 'Abel', cssFamily: 'Abel, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Alegreya', cssFamily: 'Alegreya, serif', category: 'serif', isButtonSafe: false },
  { name: 'Alegreya Sans', cssFamily: "'Alegreya Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Archivo', cssFamily: 'Archivo, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Asap', cssFamily: 'Asap, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'BioRhyme', cssFamily: 'BioRhyme, serif', category: 'serif', isButtonSafe: false },
  { name: 'Bodoni Moda', cssFamily: "'Bodoni Moda', serif", category: 'serif', isButtonSafe: false },
  { name: 'Cantata One', cssFamily: "'Cantata One', serif", category: 'serif', isButtonSafe: false },
  { name: 'Chivo', cssFamily: 'Chivo, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Comfortaa', cssFamily: 'Comfortaa, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'DM Sans', cssFamily: "'DM Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Eczar', cssFamily: 'Eczar, serif', category: 'serif', isButtonSafe: false },
  { name: 'Fira Sans', cssFamily: "'Fira Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Frank Ruhl Libre', cssFamily: "'Frank Ruhl Libre', serif", category: 'serif', isButtonSafe: false },
  { name: 'Gentium Book Basic', cssFamily: "'Gentium Book Basic', serif", category: 'serif', isButtonSafe: false },
  { name: 'Gilda Display', cssFamily: "'Gilda Display', serif',", category: 'display', isButtonSafe: false },
  { name: 'Heebo', cssFamily: 'Heebo, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'IBM Plex Sans', cssFamily: "'IBM Plex Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'IBM Plex Serif', cssFamily: "'IBM Plex Serif', serif", category: 'serif', isButtonSafe: false },
  { name: 'Jost', cssFamily: 'Jost, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Judson', cssFamily: 'Judson, serif', category: 'serif', isButtonSafe: false },
  { name: 'League Spartan', cssFamily: "'League Spartan', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Libre Franklin', cssFamily: "'Libre Franklin', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Livvic', cssFamily: 'Livvic, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Marcellus', cssFamily: 'Marcellus, serif', category: 'serif', isButtonSafe: false },
  { name: 'Merriweather Sans', cssFamily: "'Merriweather Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Noticia Text', cssFamily: "'Noticia Text', serif", category: 'serif', isButtonSafe: false },
  { name: 'Noto Sans', cssFamily: "'Noto Sans', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Playfair Display SC', cssFamily: "'Playfair Display SC', serif", category: 'serif', isButtonSafe: false },
  { name: 'Prata', cssFamily: 'Prata, serif', category: 'serif', isButtonSafe: false },
  { name: 'Prociono', cssFamily: 'Prociono, serif', category: 'serif', isButtonSafe: false },
  { name: 'Prompt', cssFamily: 'Prompt, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Quando', cssFamily: 'Quando, serif', category: 'serif', isButtonSafe: false },
  { name: 'Questrial', cssFamily: 'Questrial, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Rajdhani', cssFamily: 'Rajdhani, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Red Hat Display', cssFamily: "'Red Hat Display', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Signika', cssFamily: 'Signika, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Slabo 27px', cssFamily: "'Slabo 27px', serif", category: 'serif', isButtonSafe: false },
  { name: 'Sorts Mill Goudy', cssFamily: "'Sorts Mill Goudy', serif", category: 'serif', isButtonSafe: false },
  { name: 'Sora', cssFamily: 'Sora, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Space Grotesk', cssFamily: "'Space Grotesk', sans-serif", category: 'sans-serif', isButtonSafe: true },
  { name: 'Spectral', cssFamily: 'Spectral, serif', category: 'serif', isButtonSafe: false },
  { name: 'Syne', cssFamily: 'Syne, sans-serif', category: 'sans-serif', isButtonSafe: true },
  { name: 'Taviraj', cssFamily: 'Taviraj, serif', category: 'serif', isButtonSafe: false },
  { name: 'Unna', cssFamily: 'Unna, serif', category: 'serif', isButtonSafe: false },
  { name: 'Vidaloka', cssFamily: 'Vidaloka, serif', category: 'serif', isButtonSafe: false },
  { name: 'Yantramanav', cssFamily: 'Yantramanav, sans-serif', category: 'sans-serif', isButtonSafe: true },
].sort((a, b) => a.name.localeCompare(b.name));


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
