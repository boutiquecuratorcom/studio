'use client';

import { InventoryForm } from '@/components/inventory/InventoryForm';
import { useFirestore } from '@/firebase';
import { linkRackItemToOutfit } from '@/lib/outfits';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// This must match the structure of the data stored in localStorage
export interface GlowUpPrefillData {
  id: string;
  inputImageUrl: string;
  inputImageStoragePath: string;
  outputImageUrl: string;
  outputThumbUrl: string;
  storagePath: string;
  thumbStoragePath: string;
}

export default function AddInventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [glowUpData, setGlowUpData] = useState<GlowUpPrefillData | null>(null);
  const [outfitContext, setOutfitContext] = useState<{ outfitId: string } | null>(null);

  useEffect(() => {
    // Existing GlowUp logic
    const prefillJson = localStorage.getItem('glowUpToAdd');
    if (prefillJson) {
      try {
        setGlowUpData(JSON.parse(prefillJson));
        localStorage.removeItem('glowUpToAdd');
      } catch (e) {
        console.error('Failed to parse glow up prefill data', e);
        localStorage.removeItem('glowUpToAdd');
      }
      return; // Prioritize glow-up flow
    }

    // New Outfit logic
    const source = searchParams.get('source');
    const outfitId = searchParams.get('outfitId');
    if (source === 'outfit' && outfitId) {
      setOutfitContext({ outfitId });
    }
  }, [searchParams]);

  const handleSuccess = async (itemId: string) => {
    if (outfitContext) {
      // If we are in the outfit flow, link the item
      try {
        if (!firestore) throw new Error('Firestore not available');
        await linkRackItemToOutfit(firestore, outfitContext.outfitId, itemId);
        toast({ title: 'Item Linked!', description: 'The new item has been linked to your outfit.' });
        router.push(`/outfits/edit/${outfitContext.outfitId}`);
      } catch (error: any) {
        console.error('Failed to link item to outfit', error);
        toast({ variant: 'destructive', title: 'Linking Failed', description: error.message });
        // Still redirect to the main inventory page as a fallback
        router.push('/inventory');
      }
    } else {
      // Default behavior
      router.push('/inventory');
    }
  };
  
  const pageTitle = outfitContext ? 'Add New Item to Outfit' : glowUpData ? 'Add to My Rack' : 'Add to My Rack';
  const pageDescription = outfitContext 
    ? 'Upload a photo and add details for the new piece to link it to your outfit.'
    : glowUpData
    ? 'Finalize the details for your new Glow-Up item.'
    : 'Upload a photo and add details for the new piece.';


  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="mb-12">
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
          {pageTitle}
        </h1>
        <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
          {pageDescription}
        </p>
      </header>
      <InventoryForm mode="create" onSave={handleSuccess} glowUpData={glowUpData} />
    </div>
  );
}
