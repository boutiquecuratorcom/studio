'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useOutfits } from '@/lib/outfits';
import { useBoutiqueSettings } from '@/lib/boutique';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BoutiqueLivePreview } from '@/components/boutique/BoutiqueLivePreview';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function BoutiquePreviewPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const { data: boutiqueSettings, loading: settingsLoading, error: settingsError } =
    useBoutiqueSettings(user?.uid || null);

  const brandProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}/brandProfile/main`);
  }, [user, firestore]);
  const { data: brandProfile, loading: brandLoading, error: brandError } = useDoc<any>(brandProfileRef);
  
  const { outfits, loading: outfitsLoading, error: outfitsError } = useOutfits(user?.uid || null);

  useEffect(() => {
    if(boutiqueSettings) {
        console.log("Boutique config:", boutiqueSettings);
    }
  }, [boutiqueSettings]);

  const loading = userLoading || settingsLoading || brandLoading || outfitsLoading;
  const anyError = settingsError || brandError || outfitsError;

  const featuredOutfit = useMemo(() => {
    if (!outfits || !boutiqueSettings) return undefined;
    if (boutiqueSettings.featuredOutfitId === 'auto' || !boutiqueSettings.featuredOutfitId) {
      return outfits[0]; // The useOutfits hook already sorts by newest
    }
    return outfits.find((o) => o.id === boutiqueSettings.featuredOutfitId);
  }, [boutiqueSettings, outfits]);

  const accentColor = useMemo(() => 
    boutiqueSettings?.accentColor || brandProfile?.brandColors?.[0] || '#111827',
    [boutiqueSettings, brandProfile]
  );
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="max-w-md mx-auto mt-10">
          <Skeleton className="h-[700px] w-full" />
        </div>
      );
    }
    
    if (anyError) {
      return (
        <Alert variant="destructive" className="max-w-lg mx-auto mt-10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Boutique Preview</AlertTitle>
          <AlertDescription>
            <p>There was a problem loading your data. Please try refreshing the page.</p>
            <pre className="mt-2 text-xs bg-destructive/10 p-2 rounded">{anyError.message}</pre>
          </AlertDescription>
        </Alert>
      );
    }

    if (!boutiqueSettings?.enabled) {
      return (
        <Card className="max-w-lg mx-auto mt-10">
          <CardHeader>
            <CardTitle>Boutique is Currently Private</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Your public boutique page is not live yet. Enable it from the{' '}
              <Link href="/my-boutique" className="underline hover:text-primary">
                My Boutique setup page
              </Link>{' '}
              to see the public preview.
            </p>
          </CardContent>
        </Card>
      );
    }
    
    return (
        <div className="max-w-md mx-auto">
            <BoutiqueLivePreview brandProfile={brandProfile} featuredOutfit={featuredOutfit} accentColor={accentColor} />
        </div>
    );
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/30 min-h-screen">
      <header className="max-w-md mx-auto mb-6">
        <Button asChild variant="ghost" className="-ml-4">
            <Link href="/my-boutique">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Boutique Setup
            </Link>
        </Button>
      </header>
      <main>
        {renderContent()}
      </main>
    </div>
  );
}
