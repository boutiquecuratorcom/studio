'use client';

import { InventoryForm } from '@/components/inventory/InventoryForm';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const [glowUpData, setGlowUpData] = useState<GlowUpPrefillData | null>(null);

  useEffect(() => {
    const prefillJson = localStorage.getItem('glowUpToAdd');
    if (prefillJson) {
      try {
        setGlowUpData(JSON.parse(prefillJson));
        localStorage.removeItem('glowUpToAdd');
      } catch (e) {
        console.error("Failed to parse glow up prefill data", e);
        localStorage.removeItem('glowUpToAdd');
      }
    }
  }, []);

  const handleSuccess = (itemId: string) => {
    router.push('/inventory');
  };

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="mb-12">
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
          Add to My Rack
        </h1>
        <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
          {glowUpData
            ? 'Finalize the details for your new Glow-Up item.'
            : 'Upload a photo and add details for the new piece.'}
        </p>
      </header>
      <InventoryForm mode="create" onSave={handleSuccess} glowUpData={glowUpData} />
    </div>
  );
}
