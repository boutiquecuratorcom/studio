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
        <Sparkles className="h-10 w-10 text-primary animate-pulse" />
        <p className="text-muted-foreground">Loading your studio...</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <AuthForm />
    </div>
  );
}
