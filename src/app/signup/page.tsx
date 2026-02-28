'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { AuthForm } from '@/components/AuthForm';
import { Loader2 } from 'lucide-react';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';

export default function SignupPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center p-4" style={{ background: 'radial-gradient(circle, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%)' }}>
        <AuthForm mode="signup" />
      </main>
      <PublicFooter />
    </>
  );
}
