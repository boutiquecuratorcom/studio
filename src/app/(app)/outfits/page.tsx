'use client';

import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { Briefcase, Plus } from 'lucide-react';
import Link from 'next/link';
import { OutfitList } from '@/components/outfits/OutfitList';

export default function OutfitsPage() {
  const { user } = useUser();

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
            Outfits
          </h1>
          <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
            Curate and manage your styled looks.
          </p>
        </div>
        <Button size="lg" asChild className="py-6 text-base rounded-full">
          <Link href="/outfits/create">
            <Plus className="mr-2 h-5 w-5" />
            Create Outfit
          </Link>
        </Button>
      </header>
      
      {user && <OutfitList userId={user.uid} />}

    </div>
  );
}
