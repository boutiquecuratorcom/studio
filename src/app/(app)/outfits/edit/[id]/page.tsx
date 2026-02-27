'use client';

import { OutfitForm } from '@/components/outfits/OutfitForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useOutfit } from '@/lib/outfits';
import { useParams, useRouter } from 'next/navigation';

export default function EditOutfitPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: outfit, loading, error } = useOutfit(id);

  const handleSuccess = () => {
    router.push(`/outfits/view/${id}`);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 sm:p-10 lg:p-12">
        <header className="mb-12">
          <Skeleton className="h-16 w-96 mb-4" />
          <Skeleton className="h-7 w-full max-w-md" />
        </header>
        <div className="max-w-2xl">
            <Skeleton className="h-24 w-full mb-6" />
            <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }
  
  if (error || !outfit) {
     return (
        <div className="flex-1 p-8 text-center">
            <p className="text-destructive mt-10">
                {error ? `Error: ${error.message}` : 'Outfit not found.'}
            </p>
        </div>
     )
  }

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="mb-12">
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
          Edit Outfit
        </h1>
        <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
          Update the details for &quot;{outfit.title}&quot;.
        </p>
      </header>
      <OutfitForm mode="update" outfit={outfit} onSave={handleSuccess} />
    </div>
  );
}
