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
  AlertTriangle,
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
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const { data: boutiqueSettings, loading: settingsLoading, error: settingsError } =
    useBoutiqueSettings(user?.uid || null);

  const brandProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}/brandProfile/main`);
  }, [user, firestore]);

  const { data: brandProfile, loading: brandLoading, error: brandError } = useDoc<any>(brandProfileRef);
  
  const { outfits, loading: outfitsLoading, error: outfitsError } = useOutfits(user?.uid || null);

  const [localSettings, setLocalSettings] = useState<Partial<BoutiqueSettings>>({});
  const [isSavingEnabled, setIsSavingEnabled] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (userLoading || settingsLoading) return;
    if (!user) return;

    const initialize = async () => {
      if (boutiqueSettings) {
        setLocalSettings({
          enabled: boutiqueSettings.enabled,
          featuredOutfitId: boutiqueSettings.featuredOutfitId || 'auto',
          stylePreset: boutiqueSettings.stylePreset || 'magazine',
        });
        setIsInitialized(true);
      } else if (!settingsError) {
        try {
          if (!firestore) throw new Error("Firestore not available");
          const defaultAccent = brandProfile?.brandColors?.[0] || null;
          const defaults: Partial<BoutiqueSettings> = {
            enabled: false,
            featuredOutfitId: null,
            accentColor: defaultAccent,
            stylePreset: 'magazine',
          };
          await updateBoutiqueSettings(firestore, user.uid, defaults);
          // The useBoutiqueSettings hook will re-run and provide the new data
        } catch (e: any) {
          console.error('[MyBoutique] Failed to create default settings:', e);
          toast({ variant: 'destructive', title: 'Initialization Failed', description: e.message });
        }
      }
    };
    initialize();
  }, [user, userLoading, firestore, boutiqueSettings, settingsLoading, settingsError, brandProfile, toast]);

  const handleEnabledToggle = async (enabled: boolean) => {
    if (!user || !firestore) return;
    setIsSavingEnabled(true);
    setLocalSettings(prev => ({ ...prev, enabled })); // Optimistic update

    try {
      await updateBoutiqueSettings(firestore, user.uid, { enabled });
      toast({
        title: 'Boutique Status Updated',
        description: `Your boutique is now ${enabled ? 'live' : 'private'}.`,
      });
    } catch (e: any) {
      setLocalSettings(prev => ({ ...prev, enabled: !enabled })); // Revert on error
      console.error('[MyBoutique] Failed to toggle status:', e);
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
          localSettings.featuredOutfitId === 'auto' ? null : localSettings.featuredOutfitId,
        stylePreset: localSettings.stylePreset as any,
      };
      await updateBoutiqueSettings(firestore, user.uid, settingsToSave);
      toast({ title: 'Configuration Saved!' });
    } catch (e: any) {
      console.error('[MyBoutique] Failed to save config:', e);
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

  const loading = userLoading || !isInitialized || outfitsLoading || brandLoading;
  const anyError = settingsError || brandError || outfitsError;

  const featuredOutfit = useMemo(() => {
    if (!outfits) return undefined;
    if (localSettings.featuredOutfitId === 'auto') {
      return outfits[0];
    }
    return outfits.find((o) => o.id === localSettings.featuredOutfitId);
  }, [localSettings.featuredOutfitId, outfits]);

  const accentColor = useMemo(() => 
    boutiqueSettings?.accentColor || brandProfile?.brandColors?.[0] || '#111827',
    [boutiqueSettings, brandProfile]
  );
  
  const isConfigDirty = useMemo(() => boutiqueSettings ? 
    (localSettings.featuredOutfitId !== (boutiqueSettings.featuredOutfitId || 'auto')) || 
    (localSettings.stylePreset !== (boutiqueSettings.stylePreset || 'magazine'))
    : false,
    [localSettings, boutiqueSettings]
  );

  const renderHeader = () => (
     <header className="mb-12">
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
          My Boutique
        </h1>
        <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
          Your personal boutique showcase. When you're ready, share it with the world.
        </p>
      </header>
  );

  if (userLoading) {
    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
    );
  }

  if (anyError) {
    console.error("[MyBoutique] Rendering error state:", anyError);
    return (
      <div className="flex-1 p-8 sm:p-10 lg:p-12">
        {renderHeader()}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Boutique Data</AlertTitle>
          <AlertDescription>
            <p>There was a problem loading your data. Please try refreshing the page.</p>
            <pre className="mt-2 text-xs bg-destructive/10 p-2 rounded">{anyError.message}</pre>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (loading) {
    return (
       <div className="flex-1 p-8 sm:p-10 lg:p-12">
            {renderHeader()}
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
    );
  }

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      {renderHeader()}
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
                        checked={localSettings.enabled ?? false}
                        onCheckedChange={handleEnabledToggle}
                    />
                )}
                <Label htmlFor="boutique-enabled" className="flex-grow">
                  Boutique is {localSettings.enabled ? 'Live' : 'Private'}
                </Label>
              </div>
               <p className="text-sm text-muted-foreground mt-3 px-1">
                {localSettings.enabled ? 'Your boutique is public and can be viewed by anyone with the link.' : 'Your boutique is currently private. Only you can see it.'}
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
                    <Select value={localSettings.featuredOutfitId || 'auto'} onValueChange={(v) => setLocalSettings(prev => ({...prev, featuredOutfitId: v}))}>
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
                    <Select value={localSettings.stylePreset || 'magazine'} onValueChange={(v) => setLocalSettings(prev => ({...prev, stylePreset: v as any}))}>
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
          
            {!brandProfile && !brandLoading && (
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

    