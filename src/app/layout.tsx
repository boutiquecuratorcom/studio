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
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=DM+Serif+Display&family=Dancing+Script&family=Great+Vibes&family=Inter:wght@400;500;600;700&family=Lato&family=Libre+Baskerville&family=Lobster&family=Lora&family=Montserrat&family=Open+Sans&family=Pacifico&family=Playfair+Display:wght@400;700;800&family=Poppins:wght@400;700&family=Raleway&display=swap"
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
