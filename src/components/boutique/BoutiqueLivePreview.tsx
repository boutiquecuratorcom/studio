'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, ImageIcon } from 'lucide-react';
import type { Outfit } from '@/lib/outfits';

export const BoutiqueLivePreview = ({
  brandProfile,
  featuredOutfit,
  accentColor,
}: {
  brandProfile: any;
  featuredOutfit: Outfit | undefined;
  accentColor: string;
}) => {
  return (
    <div className="w-full bg-card rounded-xl shadow-lg p-4 border relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-muted to-transparent"></div>
      <div className="relative z-10 space-y-6">
        <header className="flex flex-col items-center text-center space-y-3 pt-8">
          {brandProfile?.logoUrl ? (
            <Image
              src={brandProfile.logoUrl}
              alt={`${brandProfile.brandName || 'Brand'} logo`}
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
              {brandProfile?.brandName || 'Your Boutique Name'}
            </h3>
            <p className="text-muted-foreground text-md max-w-sm mx-auto">
              {brandProfile?.tagline || 'Your amazing tagline goes here.'}
            </p>
          </div>
          <Button size="lg" style={{ backgroundColor: accentColor }}>
            Claim a Look
          </Button>
        </header>

        <section>
          {featuredOutfit ? (
            <Card className="overflow-hidden bg-background/50">
              <div className="relative aspect-video w-full">
                <Image
                  src={
                    featuredOutfit.cover?.imageUrl ||
                    'https://picsum.photos/seed/boutique-fallback/600/400'
                  }
                  alt={featuredOutfit.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h4 className="font-semibold">{featuredOutfit.title}</h4>
                <p className="text-sm text-muted-foreground truncate">
                  {featuredOutfit.storefrontDescription ||
                    `${featuredOutfit.linkedRackItemIds.length} items`}
                </p>
              </div>
            </Card>
          ) : (
            <div className="aspect-video w-full rounded-lg bg-muted flex flex-col items-center justify-center text-center p-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="font-medium text-muted-foreground">
                Your featured look will appear here
              </p>
              <p className="text-sm text-muted-foreground/80">
                Select an outfit or create one to get started.
              </p>
            </div>
          )}
        </section>

        <footer className="text-center">
          <p className="text-sm text-muted-foreground font-medium">
            More Looks
          </p>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="aspect-square bg-muted rounded-md"></div>
            <div className="aspect-square bg-muted rounded-md"></div>
            <div className="aspect-square bg-muted rounded-md"></div>
          </div>
        </footer>
      </div>
    </div>
  );
};
