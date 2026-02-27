"use client";

import { MyUploads } from '@/components/MyUploads';

export default function UploadsPage() {
    return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
       <header className="mb-12">
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
            My Library
          </h1>
          <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
            A complete collection of your original and AI-enhanced images.
          </p>
        </header>
      <MyUploads />
    </div>
  );
}
