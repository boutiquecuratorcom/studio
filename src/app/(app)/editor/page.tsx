"use client";

import { GlowUpStudio } from '@/components/GlowUpStudio';

export default function EditorPage() {
  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto">
       <header className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-headline font-bold text-foreground tracking-normal">
            AI Editor
          </h1>
          <p className="text-lg text-muted-foreground mt-3 max-w-2xl">
            Transform your product photos into luxury marketing assets. Start by uploading an image.
          </p>
        </header>
      <GlowUpStudio />
    </div>
  );
}
