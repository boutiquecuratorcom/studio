'use client';

import { useParams } from 'next/navigation';
import { usePublicBoutiqueByHandle } from '@/lib/boutique';
import { BoutiqueRenderer } from '@/components/boutique/BoutiqueRenderer';
import { Store, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
      <p className="text-muted-foreground">
        This boutique is not public yet (or does not exist). Check back soon.
      </p>
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

  if (loading) return <BoutiqueLoading />;

  if (error || !publicProfile?.enabled) return <BoutiqueNotAvailable />;

  const templateId = publicProfile.templateId ?? 'editorial';
  const patternId = publicProfile.patternId ?? 'none';

  return (
    <BoutiqueRenderer
      brandProfile={publicProfile}
      featuredOutfit={publicProfile.featuredOutfit}
      templateId={templateId}
      patternId={patternId}
    />
  );
}
