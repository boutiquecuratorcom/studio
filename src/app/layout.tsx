import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Boutique Curator',
  description: 'Discovery & marketing, built for boutique growth.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Abel&family=Abril+Fatface&family=Alegreya+Sans&family=Alegreya&family=Alfa+Slab+One&family=Amatic+SC&family=Anton&family=Architects+Daughter&family=Archivo&family=Asap&family=Barlow&family=Bebas+Neue&family=BioRhyme&family=Bitter&family=Bodoni+Moda&family=Cabin&family=Cantata+One&family=Cardo&family=Caveat&family=Chivo&family=Cinzel&family=Comfortaa&family=Cormorant+Garamond:wght@400;700&family=Courgette&family=Crimson+Text&family=Cutive+Mono&family=DM+Sans&family=DM+Serif+Display&family=Dancing+Script&family=Domine&family=EB+Garamond&family=Eczar&family=Figtree&family=Fira+Sans&family=Frank+Ruhl+Libre&family=Fredoka+One&family=Gentium+Book+Basic&family=Gilda+Display&family=Graduate&family=Great+Vibes&family=Heebo&family=Hind&family=IBM+Plex+Sans&family=IBM+Plex+Serif&family=Inconsolata&family=Indie+Flower&family=Inter:wght@400;500;600;700&family=Josefin+Sans&family=Jost&family=Judson&family=Kalam&family=Karla&family=Kaushan+Script&family=Lato&family=League+Spartan&family=Libre+Baskerville&family=Libre+Franklin&family=Lilita+One&family=Livvic&family=Lobster&family=Lora&family=Major+Mono+Display&family=Manrope&family=Marcellus&family=Maven+Pro&family=Merriweather+Sans&family=Merriweather&family=Monoton&family=Montserrat&family=Mulish&family=Nanum+Gothic+Coding&family=Noticia+Text&family=Noto+Sans&family=Noto+Serif&family=Nunito&family=Open+Sans&family=Oswald&family=PT+Serif&family=Pacifico&family=Passion+One&family=Patrick+Hand&family=Permanent+Marker&family=Playfair+Display+SC&family=Playfair+Display:wght@400;700;800&family=Plus+Jakarta+Sans&family=Poppins:wght@400;700&family=Poiret+One&family=Prata&family=Prociono&family=Prompt&family=Proza+Libre&family=Quando&family=Questrial&family=Quicksand&family=Rajdhani&family=Raleway&family=Red+Hat+Display&family=Righteous&family=Roboto+Mono&family=Roboto+Slab&family=Roboto&family=Rubik&family=Rye&family=Sacramento&family=Satisfy&family=Shadows+Into+Light&family=Share+Tech+Mono&family=Shrikhand&family=Signika&family=Six+Caps&family=Slabo+27px&family=Sorts+Mill+Goudy&family=Sora&family=Source+Code+Pro&family=Source+Sans+3&family=Source+Serif+Pro&family=Space+Grotesk&family=Space+Mono&family=Spectral&family=Staatliches&family=Syne&family=Taviraj&family=Tenor+Sans&family=Titillium+Web&family=Ultra&family=Unna&family=Urbanist&family=Vidaloka&family=Vollkorn&family=Work+Sans&family=Yantramanav&family=Yeseva+One&family=Zilla+Slab&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased bg-background')}>
        <FirebaseClientProvider>
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
