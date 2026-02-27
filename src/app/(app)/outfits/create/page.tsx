'use client';

import { OutfitForm } from '@/components/outfits/OutfitForm';
import { useRouter } from 'next/navigation';

export default function CreateOutfitPage() {
  const router = useRouter();

  const handleSuccess = (outfitId: string) => {
    router.push(`/outfits/view/${outfitId}`);
  };

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="mb-12">
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
          Create New Outfit
        </h1>
        <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
          Give your new look a title and some notes to get started.
        </p>
      </header>
      <OutfitForm mode="create" onSave={handleSuccess} />
    </div>
  );
}
