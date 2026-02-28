'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import type { Outfit } from '@/lib/outfits';
import { IndividualClaimDialog } from '@/components/outfits/IndividualClaimDialog';

interface PublicClaimButtonProps {
    outfit: Outfit;
    accentColor: string;
}

// Helper to determine text color based on background
const getContrastingTextColor = (hexColor: string) => {
    if (!hexColor || !hexColor.startsWith('#')) return '#ffffff';
    const hex = hexColor.replace('#', '');
    if (hex.length !== 3 && hex.length !== 6) return '#ffffff';
    
    let r, g, b;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else {
        r = parseInt(hex.substring(0,2), 16);
        g = parseInt(hex.substring(2,4), 16);
        b = parseInt(hex.substring(4,6), 16);
    }
    
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 140 ? '#111827' : '#ffffff';
}


export function PublicClaimButton({ outfit, accentColor }: PublicClaimButtonProps) {
    const [isClaimOpen, setIsClaimOpen] = useState(false);

    const claimMode = outfit.outfitClaim?.mode || 'individual';
    const outfitClaimUrl = outfit.outfitClaim?.claim?.url;
    const outfitClaimLabel = outfit.outfitClaim?.claim?.label || 'Claim Now';
    
    const buttonStyle = {
        backgroundColor: accentColor,
        color: getContrastingTextColor(accentColor)
    };

    if (claimMode === 'outfit' && outfitClaimUrl) {
        return (
            <Button size="lg" asChild style={buttonStyle}>
                <a href={outfitClaimUrl} target="_blank" rel="noopener noreferrer">{outfitClaimLabel}</a>
            </Button>
        );
    }

    if (claimMode === 'individual' && outfit.linkedRackItemIds?.length > 0) {
        return (
            <Dialog open={isClaimOpen} onOpenChange={setIsClaimOpen}>
                <DialogTrigger asChild>
                    <Button size="lg" style={buttonStyle}>Claim a Look</Button>
                </DialogTrigger>
                <IndividualClaimDialog linkedItemIds={outfit.linkedRackItemIds} />
            </Dialog>
        );
    }
    
    return <Button size="lg" disabled>Claim Not Available</Button>;
}
