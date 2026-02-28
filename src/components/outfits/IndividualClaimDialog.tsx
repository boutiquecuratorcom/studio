'use client';

import Image from 'next/image';
import { useInventoryItemsByIds } from '@/lib/outfits';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { ExternalLink } from 'lucide-react';

export const IndividualClaimDialog = ({ linkedItemIds }: { linkedItemIds: string[] }) => {
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
