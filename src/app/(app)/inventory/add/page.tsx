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
      <header className="mb-10">
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
          Add New Inventory
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
          Upload a photo and add details for your new inventory item.
        </p>
      </header>
      <InventoryForm mode="create" onSave={handleSuccess} />
    </div>
  );
}
