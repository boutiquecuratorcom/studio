'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Store, ImageIcon, Loader2 } from 'lucide-react';

import { usePublicBoutiqueByHandle, type PublicBoutiqueProfile } from '@/lib/boutique';
import { PublicClaimButton } from '@/components/boutique/PublicClaimButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function BoutiqueLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted p-4">
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
        </div>
    );
}

function BoutiqueNotAvailable() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted text-center p-4">
            <Store className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">Boutique Not Available</h1>
            <p className="text-muted-foreground">This boutique is not public yet. Check back soon.</p>
            <Button asChild variant="link" className="mt-4">
                <Link href="/">Back to Boutique Curator</Link>
            </Button>
        </div>
    );
}

export default function PublicBoutiquePage() {
  const params = useParams();
  const handle = params.sellerId as string;

  const { data, loading, error } = usePublicBoutiqueByHandle(handle);

  if (loading) {
    return <BoutiqueLoading />;
  }

  if (error || !data || !data.enabled) {
    return <BoutiqueNotAvailable />;
  }
  
  const { brandName, tagline, logoUrl, accentColor, featuredOutfit } = data;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-card rounded-xl shadow-lg p-4 border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-muted to-transparent"></div>
        <div className="relative z-10 space-y-6">
          <header className="flex flex-col items-center text-center space-y-3 pt-8">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${brandName || 'Brand'} logo`}
                width={80}
                height={80}
                className="rounded-full object-cover h-20 w-20 border-4 border-background shadow-md"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border">
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h3 className="text-3xl font-bold tracking-tight">
                {brandName || 'Boutique'}
              </h3>
              <p className="text-muted-foreground text-md max-w-sm mx-auto">
                {tagline || 'Curated looks just for you.'}
              </p>
            </div>
            {featuredOutfit && <PublicClaimButton outfitSummary={featuredOutfit} accentColor={accentColor || '#111827'} />}
          </header>

          <section>
            {featuredOutfit ? (
              <Card className="overflow-hidden bg-background/50">
                <div className="relative aspect-video w-full">
                  <Image
                    src={
                      featuredOutfit.imageUrl ||
                      'https://picsum.photos/seed/boutique-fallback/600/400'
                    }
                    alt={featuredOutfit.title || 'Featured Outfit'}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-semibold">{featuredOutfit.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {featuredOutfit.description ||
                      `${featuredOutfit.itemCount} items`}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="aspect-video w-full rounded-lg bg-muted flex flex-col items-center justify-center text-center p-4">
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-medium text-muted-foreground">
                  No featured looks right now.
                </p>
                <p className="text-sm text-muted-foreground/80">
                  Check back soon for new styles!
                </p>
              </div>
            )}
          </section>

          <footer className="text-center border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Boutique owner? <Link href="/login" className="underline hover:text-primary">Log in</Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
