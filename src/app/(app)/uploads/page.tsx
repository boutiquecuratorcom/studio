"use client";

import { MyUploads } from '@/components/MyUploads';

export default function UploadsPage() {
    return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto">
       <header className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-headline font-bold text-foreground tracking-normal">
            My Library
          </h1>
          <p className="text-lg text-muted-foreground mt-3 max-w-2xl">
            A complete collection of your original and AI-enhanced images.
          </p>
        </header>
      <MyUploads />
    </div>
  );
}
