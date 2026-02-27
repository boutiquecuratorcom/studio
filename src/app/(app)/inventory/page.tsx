'use client';

import { InventoryList } from '@/components/inventory/InventoryList';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
  const { user } = useUser();

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
            My Rack
          </h1>
          <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
            Manage your entire collection from one place.
          </p>
        </div>
        <Button size="lg" asChild className="py-6 text-base rounded-full">
          <Link href="/inventory/add">
            <LayoutGrid className="mr-2 h-5 w-5" />
            Add to My Rack
          </Link>
        </Button>
      </header>
      
      {user && <InventoryList userId={user.uid} />}

    </div>
  );
}
