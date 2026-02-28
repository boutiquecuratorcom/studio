'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

export function PublicHeader() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl flex h-24 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
            <div>
                <span className="text-xl font-bold font-headline tracking-wide">Boutique Curator</span>
                <p className="text-xs text-muted-foreground">Discovery & marketing for boutique growth.</p>
            </div>
        </Link>
        <nav className="flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          ) : user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>Log out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
