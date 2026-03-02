
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useInventoryItemsByIds, type Outfit } from '@/lib/outfits';
import type { BoutiqueRenderTokens } from '@/lib/brand/brandPublicBits';
import { ExternalLink, Link2Off, XCircle } from 'lucide-react';
import React from 'react';

interface OutfitQuickViewModalProps {
  outfit: Outfit | null;
  onOpenChange: (open: boolean) => void;
  theme: BoutiqueRenderTokens;
}

function IncludedItemsList({ itemIds, theme }: { itemIds: string[], theme: BoutiqueRenderTokens }) {
  const { items, loading, error } = useInventoryItemsByIds(itemIds);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Error loading items.</p>;
  }

  const itemsMap = new Map(items?.map(item => [item.id, item]));

  return (
    <div className="space-y-3">
        <h4 className="font-semibold" style={{fontFamily: theme.headingFontFamily}}>Items in this Look</h4>
        {itemIds.map(id => {
            const item = itemsMap.get(id);
            if (!item) {
                return (
                    <div key={id} className="flex items-center gap-3 p-2 rounded-md border border-dashed">
                        <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">Item not found</p>
                    </div>
                )
            }
            const claimUrl = item.claim?.url;
            const claimLabel = item.claim?.label || 'Shop Item';

            return (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-md border">
                    <div className="relative h-14 w-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <Image src={item.image.thumbUrl} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                    </div>
                    <Button asChild={!!claimUrl} disabled={!claimUrl} size="sm" variant="outline" style={{borderColor: theme.accentColor, color: theme.accentColor}}>
                       {claimUrl ? 
                         <a href={claimUrl} target="_blank" rel="noopener noreferrer">{claimLabel}</a> :
                         <><Link2Off className="mr-2 h-4 w-4" /> No Link</>
                       }
                    </Button>
                </div>
            )
        })}
    </div>
  )
}


export function OutfitQuickViewModal({ outfit, onOpenChange, theme }: OutfitQuickViewModalProps) {
  const isOpen = !!outfit;

  const claimMode = outfit?.outfitClaim?.mode || 'individual';
  const outfitClaimUrl = outfit?.outfitClaim?.claim?.url;
  const outfitClaimLabel = outfit?.outfitClaim?.claim?.label || 'Shop This Look';

  const ctaButton = () => {
    const buttonStyle: React.CSSProperties = {
      fontFamily: theme.buttonFontFamily,
      backgroundColor: theme.accentColor,
      color: theme.accentTextColor,
    };

    if (claimMode === 'outfit' && outfitClaimUrl) {
      return (
        <Button asChild size="lg" className="w-full py-6 text-base" style={buttonStyle}>
          <a href={outfitClaimUrl} target="_blank" rel="noopener noreferrer">
            {outfitClaimLabel} <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      );
    }
    return null; // For individual claim mode, the list is shown instead of a single CTA.
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" style={{ fontFamily: theme.bodyFontFamily }}>
        {outfit && (
          <div className="space-y-6">
            <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
                {outfit.cover?.imageUrl && <Image src={outfit.cover.imageUrl} alt={outfit.title} fill className="object-cover" />}
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-3xl" style={{ fontFamily: theme.headingFontFamily }}>
                  {outfit.title}
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                    {outfit.storefrontDescription || `${outfit.linkedRackItemIds.length} items to create the perfect look.`}
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="mt-4">
                {claimMode === 'outfit' ? ctaButton() : <IncludedItemsList itemIds={outfit.linkedRackItemIds} theme={theme} />}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
