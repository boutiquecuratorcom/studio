'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useInventoryItemsByIds, useOutfit } from '@/lib/outfits';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServerCrash, FileQuestion, UserX, Layers, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { format } from 'date-fns';
import { LinkedItemsList } from '@/components/outfits/LinkedItemsList';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const IndividualClaimDialog = ({ linkedItemIds }: { linkedItemIds: string[] }) => {
    const { items, loading, error } = useInventoryItemsByIds(linkedItemIds);

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Claim Individual Items</DialogTitle>
                <DialogDescription>
                    Each item in this outfit has its own claim destination. Select an item to proceed.
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-1 -mx-4">
                {loading && <p>Loading items...</p>}
                {error && <p className="text-destructive">Error loading items.</p>}
                <div className="space-y-2">
                    {items?.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-md border">
                            <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                    <Image src={item.image.thumbUrl} alt={item.title} fill className="object-cover" />
                                </div>
                                <div>
                                    <p className="font-semibold">{item.title}</p>
                                    <p className="text-sm text-muted-foreground">{item.type}</p>
                                </div>
                            </div>
                            {item.claim?.url ? (
                                 <Button asChild size="sm">
                                    <a href={item.claim.url} target="_blank" rel="noopener noreferrer">
                                        {item.claim.label || 'Claim'} <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            ) : (
                                <Button size="sm" disabled variant="outline">No Link</Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </DialogContent>
    )
}

export default function ViewOutfitPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useUser();
  const { data: outfit, loading, error } = useOutfit(id);
  const [isClaimOpen, setIsClaimOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 p-8 sm:p-10 lg:p-12">
        <header className="mb-12">
          <Skeleton className="h-16 w-3/5" />
          <Skeleton className="mt-4 h-7 w-2/5" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
        <div className="flex-1 p-8 text-center text-destructive mt-10">
            <ServerCrash className="h-16 w-16 mx-auto mb-4" />
            <p>Error loading outfit: {error.message}</p>
        </div>
    )
  }
  
  if (!outfit) {
     return (
        <div className="flex-1 p-8 text-center text-muted-foreground mt-10">
            <FileQuestion className="h-16 w-16 mx-auto mb-4" />
            <p>Outfit not found.</p>
        </div>
     )
  }
  
  if (!user || outfit.ownerId !== user.uid) {
    return (
        <div className="flex-1 p-8 text-center text-destructive mt-10">
            <UserX className="h-16 w-16 mx-auto mb-4" />
            <p>You do not have permission to view this outfit.</p>
        </div>
    )
  }

  const claimMode = outfit.outfitClaim?.mode || 'individual';
  const outfitClaimUrl = outfit.outfitClaim?.claim?.url;
  const outfitClaimLabel = outfit.outfitClaim?.claim?.label || 'Claim Now';

  const ClaimButton = () => {
    if (claimMode === 'outfit' && outfitClaimUrl) {
        return (
            <Button size="lg" asChild>
                <a href={outfitClaimUrl} target="_blank" rel="noopener noreferrer">{outfitClaimLabel}</a>
            </Button>
        );
    }
    if (claimMode === 'individual') {
        return (
            <Dialog open={isClaimOpen} onOpenChange={setIsClaimOpen}>
                <DialogTrigger asChild>
                    <Button size="lg">Claim Items</Button>
                </DialogTrigger>
                <IndividualClaimDialog linkedItemIds={outfit.linkedRackItemIds} />
            </Dialog>
        );
    }
    return <Button size="lg" disabled>Claim Not Set</Button>
  }
  
  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="mb-12 flex justify-between items-start">
        <div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight break-words">{outfit.title}</h1>
            <p className="text-xl text-muted-foreground mt-4">
                Created on {outfit.createdAt ? format(outfit.createdAt.toDate(), 'PPP') : ''}
            </p>
        </div>
        <div className="flex items-center gap-3">
            <Button asChild variant="outline">
                <Link href={`/outfits/edit/${outfit.id}`}>Edit Outfit</Link>
            </Button>
            <ClaimButton />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outfit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={outfit.status === 'published' ? 'default' : 'secondary'}>{outfit.status}</Badge>
                </div>
                {outfit.storefrontDescription && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                           Storefront Description
                           {outfit.descriptionLastGeneratedAt && <Sparkles className="h-4 w-4 text-accent" />}
                        </p>
                        <p className="text-foreground whitespace-pre-wrap">{outfit.storefrontDescription}</p>
                    </div>
                )}
                 {outfit.socialCaption && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            Social Media Caption
                            {outfit.descriptionLastGeneratedAt && <Sparkles className="h-4 w-4 text-accent" />}
                        </p>
                        <p className="text-foreground whitespace-pre-wrap">{outfit.socialCaption}</p>
                    </div>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Linked Rack Items ({outfit.linkedRackItemIds.length})
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
                {outfit.linkedRackItemIds.length > 0 ? (
                    <LinkedItemsList outfitId={outfit.id} linkedItemIds={outfit.linkedRackItemIds} />
                ) : (
                    <p className="text-sm text-muted-foreground">No items have been linked to this outfit yet.</p>
                )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Cover Image</CardTitle>
                </CardHeader>
                <CardContent>
                    {outfit.cover?.imageUrl ? (
                        <Image src={outfit.cover.imageUrl} alt={outfit.title} width={400} height={400} className="rounded-lg object-cover w-full aspect-square" />
                    ) : (
                        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">No cover image</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
