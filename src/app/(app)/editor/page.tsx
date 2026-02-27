"use client";

import { GlowUpStudio } from '@/components/GlowUpStudio';

export default function EditorPage() {
  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
       <header className="mb-12">
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
            Glow-Up Studio
          </h1>
          <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
            Transform your product photos into luxury marketing assets. Start by uploading an image.
          </p>
        </header>
      <GlowUpStudio />
    </div>
  );
}
