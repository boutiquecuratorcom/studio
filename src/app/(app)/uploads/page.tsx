"use client";

import { MyUploads } from '@/components/MyUploads';

export default function UploadsPage() {
    return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto">
       <header className="mb-10">
          <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
            My Library
          </h1>
          <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
            A complete collection of your original and AI-enhanced images.
          </p>
        </header>
      <MyUploads />
    </div>
  );
}
