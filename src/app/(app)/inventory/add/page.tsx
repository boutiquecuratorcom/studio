'use client';

import { InventoryForm } from '@/components/inventory/InventoryForm';
import { useRouter } from 'next/navigation';

export default function AddInventoryPage() {
  const router = useRouter();

  const handleSuccess = (itemId: string) => {
    router.push('/inventory');
  };

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto">
      <header className="mb-16">
        <h1 className="text-5xl lg:text-6xl font-headline font-bold text-foreground tracking-tight">
          Add to My Rack
        </h1>
        <p className="text-xl text-muted-foreground mt-4 max-w-2xl">
          Upload a photo and add details for the new piece.
        </p>
      </header>
      <InventoryForm mode="create" onSave={handleSuccess} />
    </div>
  );
}
