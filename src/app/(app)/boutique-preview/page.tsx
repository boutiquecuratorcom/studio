'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, ImageIcon } from 'lucide-react';
import type { PublicBoutiqueProfile } from '@/lib/boutique';

export const BoutiqueRenderer = ({
  brandProfile,
  featuredOutfit,
}: {
  brandProfile: any;
  featuredOutfit: PublicBoutiqueProfile['featuredOutfit'];
}) => {
  const claimMode = featuredOutfit?.outfitClaim?.mode || 'individual';
  const outfitClaimUrl = featuredOutfit?.outfitClaim?.claim?.url;
  const outfitClaimLabel =
    featuredOutfit?.outfitClaim?.claim?.label || 'Claim Now';

  let claimButton: React.ReactNode = null;

  if (featuredOutfit) {
    if (claimMode === 'outfit' && outfitClaimUrl) {
      claimButton = (
        <Button size="lg" asChild>
          <a href={outfitClaimUrl} target="_blank" rel="noopener noreferrer">
            {outfitClaimLabel}
          </a>
        </Button>
      );
    } else {
      // Individual claim is intentionally disabled on public page for now
      claimButton = (
        <Button size="lg" className="pointer-events-none">
          Claim a Look
        </Button>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-md mx-auto p-4 relative">
        <div className="relative z-10 space-y-6">
          <header className="flex flex-col items-center text-center space-y-3 pt-8">
            {brandProfile?.logoUrl ? (
              <Image
                src={brandProfile.logoUrl}
                alt={`${brandProfile.brandName || 'Brand'} logo`}
                width={80}
                height={80}
                className="rounded-full object-cover h-20 w-20 border-4 border-card shadow-md"
              />
            ) : (
              <div className="h-20 w-20 rounded-full flex items-center justify-center border bg-card">
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            <div>
              <h3 className="text-3xl font-bold tracking-tight">
                {brandProfile?.brandName || 'Your Boutique Name'}
              </h3>
              <p className="text-md max-w-sm mx-auto text-muted-foreground">
                {brandProfile?.tagline || 'Your amazing tagline goes here.'}
              </p>
            </div>

            {claimButton}
          </header>

          <section>
            {featuredOutfit ? (
              <Card className="overflow-hidden bg-card">
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
                  <h4 className="font-semibold">
                    {featuredOutfit.title || 'Featured Outfit'}
                  </h4>
                  <p className="text-sm truncate text-muted-foreground">
                    {featuredOutfit.description ||
                      `${featuredOutfit.itemCount ?? 0} items`}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="aspect-video w-full rounded-lg flex flex-col items-center justify-center text-center p-4 bg-card">
                <ImageIcon className="h-10 w-10 mb-2 text-muted-foreground" />
                <p className="font-medium text-muted-foreground">
                  Your featured look will appear here
                </p>
              </div>
            )}
          </section>

          <footer className="text-center border-t pt-4 border-card">
            <p className="text-xs text-muted-foreground">
              Powered by Boutique Curator
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};
