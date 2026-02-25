"use client";

import React from 'react';
import Link from 'next/link';
import { MyUploads } from '@/components/MyUploads';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export default function DashboardPage() {

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
            My Studio
          </h1>
          <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
            Create, refine, and curate your boutique universe.
          </p>
        </div>
        <Button size="lg" asChild className="py-6 text-base">
          <Link href="/editor">
            <Upload className="mr-2 h-5 w-5" />
            Upload & Enhance
          </Link>
        </Button>
      </header>
      <h2 className="text-2xl font-headline font-semibold tracking-tight mb-4">Recent Uploads</h2>
      <MyUploads />
    </div>
  );
}
