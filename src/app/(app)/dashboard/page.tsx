"use client";

import React from 'react';
import Link from 'next/link';
import { MyUploads } from '@/components/MyUploads';
import { Button } from '@/components/ui/button';
import { Upload, ArrowRight } from 'lucide-react';
import { useUser } from '@/firebase';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
            Good morning, {user?.displayName?.split(' ')[0] || 'Jessica'}.
          </h1>
          <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
            Ready to elevate your boutique?
          </p>
        </div>
        <Button size="lg" asChild className="py-6 text-base rounded-full">
          <Link href="/editor">
            <Upload className="mr-2 h-5 w-5" />
            Glow-Up Studio
          </Link>
        </Button>
      </header>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-semibold tracking-tight">Recent Glow-Ups</h2>
        <Button variant="ghost" asChild>
            <Link href="/uploads">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
      <MyUploads />
    </div>
  );
}
