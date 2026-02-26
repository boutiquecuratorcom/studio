'use client';

import { Suspense } from 'react';
import PostCreatorClient from '@/components/post-creator/PostCreatorClient';
import { Skeleton } from '@/components/ui/skeleton';

export default function PostCreatorPage() {
  return (
    // Suspense is required because PostCreatorClient uses useSearchParams
    <Suspense fallback={<LoadingState />}>
      <PostCreatorClient />
    </Suspense>
  );
}

function LoadingState() {
    return (
        <div className="flex-1 p-8 sm:p-10 lg:p-12">
            <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-10 w-72 mb-3" />
                    <Skeleton className="h-6 w-96" />
                </div>
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                 </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <div className="lg:col-span-2 flex items-center justify-center">
                    <Skeleton className="aspect-[4/5] w-full max-w-md" />
                </div>
            </div>
        </div>
    )
}
