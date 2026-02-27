"use client";

import { GlowUpStudio } from '@/components/GlowUpStudio';

export default function EditorPage() {
  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto">
       <header className="mb-16">
          <h1 className="text-5xl lg:text-6xl font-headline font-bold text-foreground tracking-tight">
            AI Editor
          </h1>
          <p className="text-xl text-muted-foreground mt-4 max-w-2xl">
            Transform your product photos into luxury marketing assets. Start by uploading an image.
          </p>
        </header>
      <GlowUpStudio />
    </div>
  );
}
