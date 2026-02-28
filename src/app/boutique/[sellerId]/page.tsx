import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getAdminInstances } from '@/firebase/admin';
import type { BoutiqueSettings } from '@/lib/boutique';
import type { Outfit } from '@/lib/outfits';
import { Card } from '@/components/ui/card';
import { Store, ImageIcon } from 'lucide-react';
import { PublicClaimButton } from '@/components/boutique/PublicClaimButton';

async function getBoutiqueData(sellerId: string) {
  const { db } = getAdminInstances();
  if (!db) {
    console.error("Admin DB not initialized for SSR.");
    return null;
  }

  const settingsRef = db.collection('users').doc(sellerId).collection('boutiqueSettings').doc('main');
  const brandRef = db.collection('users').doc(sellerId).collection('brandProfile').doc('main');
  
  const [settingsSnap, brandSnap] = await Promise.all([
    settingsRef.get(),
    brandRef.get(),
  ]);

  const settings = settingsSnap.exists ? settingsSnap.data() as BoutiqueSettings : null;
  const brandProfile = brandSnap.exists ? brandSnap.data() : null;

  if (!settings || !settings.enabled) {
    return { isLive: false };
  }

  let featuredOutfit: Outfit | null = null;
  
  if (settings.featuredOutfitId && settings.featuredOutfitId !== 'auto') {
    const outfitSnap = await db.collection('outfits').doc(settings.featuredOutfitId).get();
    if (outfitSnap.exists) {
        featuredOutfit = { id: outfitSnap.id, ...outfitSnap.data() } as Outfit;
    }
  } else {
    // Fetch newest published outfit for this user
    const outfitsQuery = db.collection('outfits')
        .where('ownerId', '==', sellerId)
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(1);
    const outfitSnaps = await outfitsQuery.get();
    if (!outfitSnaps.empty) {
        const outfitDoc = outfitSnaps.docs[0];
        featuredOutfit = { id: outfitDoc.id, ...outfitDoc.data() } as Outfit;
    }
  }

  return {
    isLive: true,
    settings,
    brandProfile,
    featuredOutfit,
  };
}

export default async function PublicBoutiquePage({ params }: { params: { sellerId: string } }) {
  const { sellerId } = params;
  const data = await getBoutiqueData(sellerId);

  if (!data || !data.isLive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted text-center p-4">
        <Store className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Boutique Not Available</h1>
        <p className="text-muted-foreground">This seller's boutique is not currently live.</p>
      </div>
    );
  }

  const { brandProfile, featuredOutfit, settings } = data;
  const accentColor = settings.accentColor || brandProfile?.brandColors?.[0] || '#111827';
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-card rounded-xl shadow-lg p-4 border relative overflow-hidden">
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
                {brandProfile?.brandName || 'Boutique'}
              </h3>
              <p className="text-muted-foreground text-md max-w-sm mx-auto">
                {brandProfile?.tagline || 'Curated looks just for you.'}
              </p>
            </div>
            {featuredOutfit && <PublicClaimButton outfit={featuredOutfit} accentColor={accentColor} />}
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
                  No featured looks right now.
                </p>
                <p className="text-sm text-muted-foreground/80">
                  Check back soon for new styles!
                </p>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
