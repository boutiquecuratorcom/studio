'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useOutfits, type Outfit } from '@/lib/outfits';
import {
  BoutiqueSettings,
  useBoutiqueSettings,
  updateBoutiqueSettings,
} from '@/lib/boutique';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  ArrowRight,
  Copy,
  ExternalLink,
  Eye,
  ImageIcon,
  Info,
  Loader2,
  Save,
  Sparkles,
  Store,
} from 'lucide-react';
import { doc } from 'firebase/firestore';

const BoutiqueLivePreview = ({
  brandProfile,
  featuredOutfit,
  accentColor,
}: {
  brandProfile: any;
  featuredOutfit: Outfit | undefined;
  accentColor: string;
}) => {
  return (
    <div className="w-full bg-card rounded-xl shadow-lg p-4 border relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-muted to-transparent"></div>
      <div className="relative z-10 space-y-6">
        <header className="flex flex-col items-center text-center space-y-3 pt-8">
          {brandProfile?.logoUrl ? (
            <Image
              src={brandProfile.logoUrl}
              alt={`${brandProfile.brandName || 'Brand'} logo`}
              width={80}
              height={80}
              className="rounded-full object-cover h-20 w-20 border-4 border-background shadow-md"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <h3 className="text-3xl font-bold tracking-tight">
              {brandProfile?.brandName || 'Your Boutique Name'}
            </h3>
            <p className="text-muted-foreground text-md max-w-sm mx-auto">
              {brandProfile?.tagline || 'Your amazing tagline goes here.'}
            </p>
          </div>
          <Button size="lg" style={{ backgroundColor: accentColor }}>
            Claim a Look
          </Button>
        </header>

        <section>
          {featuredOutfit ? (
            <Card className="overflow-hidden bg-background/50">
              <div className="relative aspect-video w-full">
                <Image
                  src={
                    featuredOutfit.cover?.imageUrl ||
                    'https://picsum.photos/seed/boutique-fallback/600/400'
                  }
                  alt={featuredOutfit.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h4 className="font-semibold">{featuredOutfit.title}</h4>
                <p className="text-sm text-muted-foreground truncate">
                  {featuredOutfit.storefrontDescription ||
                    `${featuredOutfit.linkedRackItemIds.length} items`}
                </p>
              </div>
            </Card>
          ) : (
            <div className="aspect-video w-full rounded-lg bg-muted flex flex-col items-center justify-center text-center p-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="font-medium text-muted-foreground">
                Your featured look will appear here
              </p>
              <p className="text-sm text-muted-foreground/80">
                Select an outfit or create one to get started.
              </p>
            </div>
          )}
        </section>

        <footer className="text-center">
          <p className="text-sm text-muted-foreground font-medium">
            More Looks
          </p>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="aspect-square bg-muted rounded-md"></div>
            <div className="aspect-square bg-muted rounded-md"></div>
            <div className="aspect-square bg-muted rounded-md"></div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function MyBoutiquePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const { data: boutiqueSettings, loading: settingsLoading } =
    useBoutiqueSettings(user?.uid || null);
  const { data: brandProfile, loading: brandLoading } = useDoc<any>(
    user && firestore ? doc(firestore, `users/${user.uid}/brandProfile/main`) : null
  );
  const { outfits, loading: outfitsLoading } = useOutfits(user?.uid || null);

  const [isEnabled, setIsEnabled] = useState(false);
  const [featuredOutfitId, setFeaturedOutfitId] = useState('auto');
  const [stylePreset, setStylePreset] = useState<
    'magazine' | 'modern' | 'classic'
  >('magazine');

  const [isSavingEnabled, setIsSavingEnabled] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    if (boutiqueSettings) {
      setIsEnabled(boutiqueSettings.enabled);
      setFeaturedOutfitId(boutiqueSettings.featuredOutfitId || 'auto');
      setStylePreset(boutiqueSettings.stylePreset || 'magazine');
    }
  }, [boutiqueSettings]);

  const loading = settingsLoading || brandLoading || outfitsLoading;

  const handleEnabledToggle = async (enabled: boolean) => {
    if (!user || !firestore) return;
    setIsSavingEnabled(true);
    setIsEnabled(enabled); // Optimistic update
    try {
      await updateBoutiqueSettings(firestore, user.uid, { enabled });
      toast({
        title: 'Boutique Status Updated',
        description: `Your boutique is now ${enabled ? 'live' : 'private'}.`,
      });
    } catch (e: any) {
      setIsEnabled(!enabled); // Revert on error
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: e.message,
      });
    } finally {
      setIsSavingEnabled(false);
    }
  };

  const handleConfigSave = async () => {
    if (!user || !firestore) return;
    setIsSavingConfig(true);
    try {
      const settingsToSave: Partial<BoutiqueSettings> = {
        featuredOutfitId:
          featuredOutfitId === 'auto' ? null : featuredOutfitId,
        stylePreset,
      };
      await updateBoutiqueSettings(firestore, user.uid, settingsToSave);
      toast({ title: 'Configuration Saved!' });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: e.message,
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCopyLink = () => {
    if (!user) return;
    const link = `${window.location.origin}/boutique/${user.uid}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link Copied!',
      description: 'Your boutique link is ready to be shared.',
    });
  };

  const featuredOutfit = useMemo(() => {
    if (featuredOutfitId === 'auto') {
      return outfits?.[0]; // Default to newest if 'auto'
    }
    return outfits?.find((o) => o.id === featuredOutfitId);
  }, [featuredOutfitId, outfits]);

  const accentColor =
    boutiqueSettings?.accentColor || brandProfile?.brandColors?.[0] || '#111827';
  
  const isConfigDirty = boutiqueSettings ? 
    (featuredOutfitId !== (boutiqueSettings.featuredOutfitId || 'auto')) || (stylePreset !== boutiqueSettings.stylePreset)
    : true;


  if (loading) {
    return (
       <div className="flex-1 p-8 sm:p-10 lg:p-12">
            <header className="mb-12">
                <Skeleton className="h-12 w-72" />
                <Skeleton className="h-6 w-full max-w-lg mt-4" />
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-[700px] w-full" />
                </div>
            </div>
       </div>
    )
  }

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="mb-12">
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
          My Boutique
        </h1>
        <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
          Your personal boutique showcase. When you&apos;re ready, share it with the world.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Boutique Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 rounded-lg border p-4">
                {isSavingEnabled ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Switch
                        id="boutique-enabled"
                        checked={isEnabled}
                        onCheckedChange={handleEnabledToggle}
                    />
                )}
                <Label htmlFor="boutique-enabled" className="flex-grow">
                  Boutique is {isEnabled ? 'Live' : 'Private'}
                </Label>
              </div>
               <p className="text-sm text-muted-foreground mt-3 px-1">
                {isEnabled ? 'Your boutique is public and can be viewed by anyone with the link.' : 'Your boutique is currently private. Only you can see it.'}
            </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Choose what to feature on your boutique page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Featured Outfit</Label>
                    <Select value={featuredOutfitId} onValueChange={setFeaturedOutfitId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an outfit..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">Auto (newest look)</SelectItem>
                            {outfits?.map(outfit => (
                                <SelectItem key={outfit.id} value={outfit.id}>{outfit.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Style Preset</Label>
                    <Select value={stylePreset} onValueChange={(v) => setStylePreset(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="magazine">Magazine</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="classic">Classic</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleConfigSave} disabled={isSavingConfig || !isConfigDirty} className="w-full">
                    {isSavingConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Configuration
                </Button>
            </CardContent>
          </Card>
          
            {!brandProfile && (
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Complete Your Brand Profile</AlertTitle>
                    <AlertDescription>
                        Your boutique preview uses your brand name, logo, and colors. Fill out your brand profile for the best result.
                        <Button asChild variant="link" className="p-0 h-auto mt-2">
                            <Link href="/my-brand">Go to My Brand <ArrowRight className="ml-1 h-4 w-4" /></Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                     <Button variant="outline" className="w-full justify-between" asChild>
                       <Link href="/boutique-preview" target="_blank">
                            Open Full Preview
                            <ExternalLink />
                       </Link>
                    </Button>
                     <Button variant="outline" className="w-full justify-between" onClick={handleCopyLink}>
                        Copy My Boutique Link
                        <Copy />
                    </Button>
                </CardContent>
            </Card>

        </div>
        <div className="lg:col-span-2 lg:sticky top-12">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <BoutiqueLivePreview brandProfile={brandProfile} featuredOutfit={featuredOutfit} accentColor={accentColor} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
