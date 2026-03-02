'use client';

import { useParams, notFound } from 'next/navigation';
import { usePublicBoutiqueByHandle } from '@/lib/boutique';
import { BoutiqueRenderer } from '@/components/boutique/BoutiqueRenderer';
import { Store, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { computeRenderTokens } from '@/lib/boutique-design';

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

  const { data: publicProfile, loading, error } = usePublicBoutiqueByHandle(handle);

  if (loading) {
    return <BoutiqueLoading />;
  }
  
  if (!error && !publicProfile) {
      notFound();
  }

  if (error || !publicProfile?.enabled) {
    return <BoutiqueNotAvailable />;
  }

  // For the public page, we don't have the full brandProfile, just the public bits.
  // The computeRenderTokens function is designed to handle this gracefully.
  // We hardcode the template and pattern for now, as per the directive.
  const renderTokens = computeRenderTokens(publicProfile, 'editorial', 'none');

  return (
    <BoutiqueRenderer
      brandProfile={publicProfile}
      featuredOutfit={publicProfile.featuredOutfit}
      renderTokens={renderTokens}
    />
  );
}
