'use client';

import { InventoryForm } from '@/components/inventory/InventoryForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventoryItem } from '@/lib/inventory';
import { useParams, useRouter } from 'next/navigation';

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { item, loading, error } = useInventoryItem(id);

  const handleSuccess = () => {
    router.push('/inventory');
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 sm:p-10 lg:p-12">
        <header className="mb-10">
          <Skeleton className="h-10 w-64 mb-3" />
          <Skeleton className="h-6 w-96" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
            <div className="md:col-span-1">
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
      </div>
    );
  }
  
  if (error || !item) {
     return (
        <div className="flex-1 p-8 text-center">
            <p className="text-destructive mt-10">
                {error ? `Error: ${error.message}` : 'Inventory item not found.'}
            </p>
        </div>
     )
  }

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
          Edit Inventory Item
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
          Update the details for &quot;{item.title}&quot;.
        </p>
      </header>
      <InventoryForm mode="update" item={item} onSave={handleSuccess} />
    </div>
  );
}
