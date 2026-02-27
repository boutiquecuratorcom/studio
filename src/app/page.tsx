"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { AuthForm } from '@/components/AuthForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-screen bg-background">
        <Sparkles className="h-10 w-10 text-accent animate-pulse" />
        <p className="text-muted-foreground font-headline tracking-wider">Loading your studio...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(circle, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%)' }}>
      <AuthForm />
    </div>
  );
}
