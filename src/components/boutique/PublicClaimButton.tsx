'use client';

import { Button } from '@/components/ui/button';
import { PublicBoutiqueProfile } from '@/lib/boutique';
import { getContrastingTextColor } from '@/lib/boutique-design';
import { cn } from '@/lib/utils';

interface PublicClaimButtonProps {
    outfitSummary: NonNullable<PublicBoutiqueProfile['featuredOutfit']>;
    accentColor: string;
    buttonStyle: 'solid' | 'outline' | 'ghost';
    className?: string;
}

export function PublicClaimButton({ outfitSummary, accentColor, buttonStyle, className }: PublicClaimButtonProps) {
    const claimMode = outfitSummary.outfitClaim?.mode || 'individual';
    const outfitClaimUrl = outfitSummary.outfitClaim?.claim?.url;
    const outfitClaimLabel = outfitSummary.outfitClaim?.claim?.label || 'Claim Now';
    
    const style: React.CSSProperties = {};
    let variant: 'default' | 'outline' | 'ghost' = 'default';

    if (buttonStyle === 'solid') {
        style.backgroundColor = accentColor;
        style.color = getContrastingTextColor(accentColor);
    } else if (buttonStyle === 'outline') {
        variant = 'outline';
        style.borderColor = accentColor;
        style.color = accentColor;
    } else {
        variant = 'ghost';
        style.color = accentColor;
    }

    if (claimMode === 'outfit' && outfitClaimUrl) {
        return (
            <Button size="lg" asChild style={style} className={className} variant={variant}>
                <a href={outfitClaimUrl} target="_blank" rel="noopener noreferrer">{outfitClaimLabel}</a>
            </Button>
        );
    }
    
    // For now, the "Individual Claim" opens a dialog which is not suitable for a public page without a user session.
    // So we render a generic, non-clickable button.
    return <Button size="lg" style={style} className={cn("pointer-events-none", className)} variant={variant}>Claim a Look</Button>;
}
