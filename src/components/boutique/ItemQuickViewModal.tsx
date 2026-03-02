
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import type { InventoryItem } from '@/lib/inventory';
import type { BoutiqueRenderTokens } from '@/lib/brand/brandPublicBits';
import { ExternalLink } from 'lucide-react';

interface ItemQuickViewModalProps {
  item: InventoryItem | null;
  onOpenChange: (open: boolean) => void;
  theme: BoutiqueRenderTokens;
}

export function ItemQuickViewModal({ item, onOpenChange, theme }: ItemQuickViewModalProps) {
  const isOpen = !!item;

  const claimUrl = item?.claim?.url;
  const claimLabel = item?.claim?.label || 'Shop Item';

  const buttonStyle: React.CSSProperties = {
    fontFamily: theme.buttonFontFamily,
    backgroundColor: theme.accentColor,
    color: theme.accentTextColor,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" style={{ fontFamily: theme.bodyFontFamily }}>
        {item && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-2">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <Image src={item.image.originalUrl} alt={item.title} fill className="object-cover" />
            </div>
            <div className="flex flex-col">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-3xl" style={{ fontFamily: theme.headingFontFamily }}>
                  {item.title}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-grow space-y-4">
                <p className="text-muted-foreground text-lg">{item.type}</p>
                {item.sizes && item.sizes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Available Sizes</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.sizes.map((size) => (
                        <Badge key={size} variant="secondary">
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <Button
                  asChild={!!claimUrl}
                  disabled={!claimUrl}
                  size="lg"
                  className="w-full py-6 text-base"
                  style={buttonStyle}
                >
                  {claimUrl ? (
                    <a href={claimUrl} target="_blank" rel="noopener noreferrer">
                      {claimLabel} <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  ) : (
                    <span>Link not available</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
