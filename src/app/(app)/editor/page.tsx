"use client";

import { GlowUpStudio } from '@/components/GlowUpStudio';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

function EditorLoadingSkeleton() {
  return (
      <div className="w-full">
          <Skeleton className="w-full h-96" />
          <div className="mt-8 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
      </div>
  );
}


export default function EditorPage() {
  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
       <header className="mb-12">
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight font-headline">
            Glow-Up Studio
          </h1>
          <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
            Transform your product photos into luxury marketing assets.
          </p>
        </header>
        <Suspense fallback={<EditorLoadingSkeleton />}>
          <GlowUpStudio />
        </Suspense>
    </div>
  );
}
