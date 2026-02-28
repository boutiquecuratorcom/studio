'use client';

import { Button } from '@/components/ui/button';
import { PublicBoutiqueProfile } from '@/lib/boutique';
import { getContrastingTextColor } from '@/lib/boutique-design';
import { cn } from '@/lib/utils';
import React from 'react';

interface PublicClaimButtonProps {
    outfitSummary: NonNullable<PublicBoutiqueProfile['featuredOutfit']>;
    accentColor: string;
    buttonStyle: 'solid' | 'outline' | 'ghost';
    className?: string;
    style?: React.CSSProperties;
}

export function PublicClaimButton({ outfitSummary, accentColor, buttonStyle, className, style: fontStyle }: PublicClaimButtonProps) {
    const claimMode = outfitSummary.outfitClaim?.mode || 'individual';
    const outfitClaimUrl = outfitSummary.outfitClaim?.claim?.url;
    const outfitClaimLabel = outfitSummary.outfitClaim?.claim?.label || 'Claim Now';
    
    const combinedStyle: React.CSSProperties = {...fontStyle};
    let variant: 'default' | 'outline' | 'ghost' = 'default';

    if (buttonStyle === 'solid') {
        combinedStyle.backgroundColor = accentColor;
        combinedStyle.color = getContrastingTextColor(accentColor);
    } else if (buttonStyle === 'outline') {
        variant = 'outline';
        combinedStyle.borderColor = accentColor;
        combinedStyle.color = accentColor;
    } else {
        variant = 'ghost';
        combinedStyle.color = accentColor;
    }

    if (claimMode === 'outfit' && outfitClaimUrl) {
        return (
            <Button size="lg" asChild style={combinedStyle} className={className} variant={variant}>
                <a href={outfitClaimUrl} target="_blank" rel="noopener noreferrer">{outfitClaimLabel}</a>
            </Button>
        );
    }
    
    // For now, the "Individual Claim" opens a dialog which is not suitable for a public page without a user session.
    // So we render a generic, non-clickable button.
    return <Button size="lg" style={combinedStyle} className={cn("pointer-events-none", className)} variant={variant}>Claim a Look</Button>;
}

    