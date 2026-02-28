'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { PublicBoutiqueProfile } from '@/lib/boutique';
import { IndividualClaimDialog } from '@/components/outfits/IndividualClaimDialog';

interface PublicClaimButtonProps {
    outfitSummary: NonNullable<PublicBoutiqueProfile['featuredOutfit']>;
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


export function PublicClaimButton({ outfitSummary, accentColor }: PublicClaimButtonProps) {
    const claimMode = outfitSummary.outfitClaim?.mode || 'individual';
    const outfitClaimUrl = outfitSummary.outfitClaim?.claim?.url;
    const outfitClaimLabel = outfitSummary.outfitClaim?.claim?.label || 'Claim Now';
    
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
    
    // For public pages, individual claim dialogs are not supported as we don't expose all item IDs.
    // The button will simply be a non-clickable label. A better UX would be to link to the seller's main website if available.
    // For now, we just show a generic button.
    return <Button size="lg" style={buttonStyle}>Claim a Look</Button>;
}
