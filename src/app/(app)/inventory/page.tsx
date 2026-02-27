'use client';

import { InventoryList } from '@/components/inventory/InventoryList';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { Boxes } from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
  const { user } = useUser();

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
            My Rack
          </h1>
          <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
            Manage your entire collection from one place.
          </p>
        </div>
        <Button size="lg" asChild className="py-6 text-base">
          <Link href="/inventory/add">
            <Boxes className="mr-2 h-5 w-5" />
            Add to My Rack
          </Link>
        </Button>
      </header>
      
      {user && <InventoryList userId={user.uid} />}

    </div>
  );
}
