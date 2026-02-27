'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOutfits, deleteOutfit, type Outfit } from '@/lib/outfits';
import { AlertTriangle, Edit, MoreVertical, Trash2, Eye } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

function OutfitCard({ outfit }: { outfit: Outfit }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!firestore) return;
    try {
      await deleteOutfit(firestore, outfit.id);
      toast({ title: 'Outfit Deleted', description: `"${outfit.title}" has been removed.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="w-full overflow-hidden shadow-lg transition-shadow hover:shadow-xl flex flex-col">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="leading-snug break-words">{outfit.title || 'Untitled Outfit'}</CardTitle>
            <CardDescription>
              Created {outfit.createdAt ? formatDistanceToNow(outfit.createdAt.toDate(), { addSuffix: true }) : 'just now'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/outfits/view/${outfit.id}`} className="flex items-center cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View Details</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/outfits/edit/${outfit.id}`} className="flex items-center cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit Outfit</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Outfit</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex-grow">
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">
                <p>No cover image</p>
            </div>
        </CardContent>
        <CardFooter>
            <Badge variant={outfit.status === 'published' ? 'default' : 'secondary'}>{outfit.status}</Badge>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{outfit.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Yes, delete outfit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function OutfitList({ userId }: { userId: string }) {
  const { outfits, loading, error } = useOutfits(userId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card text-destructive flex flex-col items-center gap-4">
            <AlertTriangle className="h-10 w-10" />
            <p className="font-semibold">Error loading outfits.</p>
        </div>
    );
  }

  if (!outfits || outfits.length === 0) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card">
            <p className="text-muted-foreground">No outfits found.</p>
            <Button asChild variant="link">
                <Link href="/outfits/create">Create your first outfit.</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {outfits.map((outfit) => (
        <OutfitCard key={outfit.id} outfit={outfit} />
      ))}
    </div>
  );
}
