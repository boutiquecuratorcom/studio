'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { collection, doc, orderBy, query, serverTimestamp, setDoc, limit } from 'firebase/firestore';
import { Copy, Download, Loader2, Save, Sparkles, Wand2 } from 'lucide-react';
import { toPng } from 'html-to-image';

import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PostControls } from './PostControls';
import { PostPreview } from './PostPreview';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

// Types
export type PlatformFormat = 'IG_FEED' | 'FB_FEED';
export type TemplateId = 'CLEAN_BOUTIQUE' | 'BOLD_DROP' | 'MINIMAL_LUXE' | 'COMMENT_SOLD_LIVE';
export type FrameStyle = 'none' | 'classicBorder' | 'polaroid' | 'shadowCard' | 'accentStroke';

export type TextLayerStyle = {
  textColorMode: 'auto' | 'light' | 'dark' | 'brandPrimary' | 'brandAccent';
  badgeColor: string; // Hex color or 'none'
  position: 'top' | 'center' | 'bottom';
};

// Default Styles
const DEFAULT_HEADLINE_STYLE: TextLayerStyle = { textColorMode: 'auto', badgeColor: 'none', position: 'top' };
const DEFAULT_SUBTEXT_STYLE: TextLayerStyle = { textColorMode: 'auto', badgeColor: 'none', position: 'bottom' };
const DEFAULT_CTA_STYLE: TextLayerStyle = { textColorMode: 'auto', badgeColor: '#111111', position: 'bottom' };


function LoadingState() {
  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Skeleton className="h-12 w-80 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="lg:col-span-2 flex items-center justify-center">
          <Skeleton className="aspect-[4/5] w-full max-w-md" />
        </div>
      </div>
    </div>
  );
}

function ImageSelector({ onImageSelect }: { onImageSelect: (url: string) => void }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const uploadsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    const collectionPath = `users/${user.uid}/uploads`;
    return query(collection(firestore, collectionPath), orderBy('createdAt', 'desc'), limit(12));
  }, [user, firestore]);

  const { data: uploads, loading } = useCollection(uploadsQuery, user ? `users/${user.uid}/uploads` : null);
  
  const validUploads = useMemo(() => uploads?.filter(u => u.downloadURL), [uploads]);

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="mb-16 text-center flex flex-col items-center">
        <h1 className="text-4xl lg:text-5xl font-headline font-bold text-foreground tracking-normal">Post Creator</h1>
        <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
          Start by selecting an image from your recent uploads, or generate a new one.
        </p>
        <Button asChild size="lg" className="mt-6 py-6 text-base">
          <Link href="/editor">
            <Wand2 className="mr-2 h-5 w-5" />
            Go to AI Editor
          </Link>
        </Button>
      </header>

      <div>
        <h2 className="text-3xl font-headline font-semibold tracking-tight mb-6">Select a Recent Upload</h2>
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        )}
        {!loading && (!validUploads || validUploads.length === 0) && (
          <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card">
            <p className="text-muted-foreground">No recent uploads found.</p>
          </div>
        )}
        {!loading && validUploads && validUploads.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {validUploads.map((upload) => (
              <div
                key={upload.id}
                className="relative group aspect-square cursor-pointer"
                onClick={() => onImageSelect(upload.downloadURL)}
              >
                <Card className="w-full h-full overflow-hidden shadow-lg transition-shadow hover:shadow-2xl hover:ring-2 hover:ring-primary">
                  <Image
                    src={upload.downloadURL}
                    alt={upload.originalName || 'Uploaded image'}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                  />
                </Card>
                {upload.isEnhanced && (
                  <div className="absolute top-2 left-2 p-1.5 bg-background/80 rounded-full shadow-lg">
                    <Sparkles className="h-4 w-4 text-accent" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white font-bold text-lg">Use Image</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostCreatorClient() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [importedCaption, setImportedCaption] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialStyleSet, setIsInitialStyleSet] = useState(false);

  // --- State for post customization ---
  const [platformFormat, setPlatformFormat] = useState<PlatformFormat>('IG_FEED');
  const [templateId, setTemplateId] = useState<TemplateId>('CLEAN_BOUTIQUE');
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('none');

  // Text content state
  const [headlineText, setHeadlineText] = useState('new arrival');
  const [subtextText, setSubtextText] = useState('');
  const [ctaText, setCtaText] = useState('comment sold');

  // Text styling state
  const [headlineStyle, setHeadlineStyle] = useState<TextLayerStyle>(DEFAULT_HEADLINE_STYLE);
  const [subtextStyle, setSubtextStyle] = useState<TextLayerStyle>(DEFAULT_SUBTEXT_STYLE);
  const [ctaStyle, setCtaStyle] = useState<TextLayerStyle>(DEFAULT_CTA_STYLE);
  
  // Check for image URL and prefills on mount
  useEffect(() => {
    // Check for text prefills from Engagement Machine
    const prefillJson = localStorage.getItem('postCreatorPrefill');
    if (prefillJson) {
      try {
        const prefill = JSON.parse(prefillJson);
        if (prefill.headline) setHeadlineText(prefill.headline);
        if (prefill.cta) setCtaText(prefill.cta);
        if (prefill.fullCaption) {
            setImportedCaption(prefill.fullCaption);
            toast({
                title: "Content Prefilled!",
                description: "Headline and CTA have been updated from your engagement idea."
            })
        }
        localStorage.removeItem('postCreatorPrefill');
      } catch (e) {
        console.error("Failed to parse prefill data", e);
        localStorage.removeItem('postCreatorPrefill');
      }
    }


    // Check for image URL from param or local storage
    const imgParam = searchParams.get('img');
    if (imgParam) {
      setSelectedImageUrl(imgParam);
      localStorage.setItem('lastEnhancedImageURL', imgParam);
      setIsLoadingImage(false);
      return;
    }

    const lastUrl = localStorage.getItem('lastEnhancedImageURL');
    if (lastUrl) {
      setSelectedImageUrl(lastUrl);
      setIsLoadingImage(false);
      return;
    }

    setIsLoadingImage(false);
  }, [searchParams, toast]);

  // Fetch brand profile
  const brandProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}/brandProfile/main`);
  }, [user, firestore]);

  const { data: brandProfile, loading: brandLoading } = useDoc(brandProfileRef);

  // Set default subtext and CTA badge color once brand profile is loaded
  useEffect(() => {
    if (!brandLoading && !isInitialStyleSet) {
      if (brandProfile?.brandName) {
        setSubtextText(brandProfile.brandName);
      } else {
        setSubtextText('boutique curator');
      }

      const primaryColor = brandProfile?.brandColors?.[0];
      if (primaryColor) {
        setCtaStyle(prev => ({ ...prev, badgeColor: primaryColor }));
      }
      setIsInitialStyleSet(true);
    }
  }, [brandProfile, brandLoading, isInitialStyleSet]);

  const previewRef = React.useRef<HTMLDivElement>(null);
  
  const resetStyles = () => {
    setHeadlineStyle(DEFAULT_HEADLINE_STYLE);
    setSubtextStyle(DEFAULT_SUBTEXT_STYLE);

    const primaryColor = brandProfile?.brandColors?.[0];
    setCtaStyle({ ...DEFAULT_CTA_STYLE, badgeColor: primaryColor || '#111111' });
    
    toast({ title: 'Styles Reset', description: 'Text styling has been reset to defaults.' });
  }

  const handleDownload = React.useCallback(() => {
    if (previewRef.current === null) {
      return;
    }
    toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `boutique-post-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error(err);
        toast({ variant: 'destructive', title: 'Download failed', description: 'Could not export image.' });
      });
  }, [previewRef, toast]);

  const handleCopyImportedCaption = () => {
    if (!importedCaption) return;
    navigator.clipboard.writeText(importedCaption);
    toast({ title: 'Full Caption Copied!' });
  };

  const handleSaveDraft = async () => {
    if (!user || !firestore || !selectedImageUrl) return;

    setIsSaving(true);
    try {
      const newPostRef = doc(collection(firestore, `users/${user.uid}/posts`));
      
      const postData = {
        createdAt: serverTimestamp(),
        platformFormat,
        templateId,
        frameStyle,
        enhancedImageUrl: selectedImageUrl,
        textFields: { headline: headlineText, subtext: subtextText, cta: ctaText },
        styleConfig: { headline: headlineStyle, subtext: subtextStyle, cta: ctaStyle },
        brandSnapshot: {
          primaryFont: brandProfile?.primaryFont || 'Playfair Display',
          secondaryFont: brandProfile?.secondaryFont || 'Inter',
          brandColors: brandProfile?.brandColors || [],
        },
      };
      
      await setDoc(newPostRef, postData);
      toast({ title: 'Draft Saved!', description: 'Your post has been saved.' });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Save failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingImage || brandLoading) {
    return <LoadingState />;
  }

  if (!selectedImageUrl) {
    return <ImageSelector onImageSelect={setSelectedImageUrl} />;
  }

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl lg:text-5xl font-headline font-bold text-foreground tracking-normal">
            Post Creator
          </h1>
          <p className="text-lg text-muted-foreground mt-3 max-w-2xl">
            Customize your auto-generated post and export it for social media.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownload}><Download className="h-4 w-4 mr-2" /> Download PNG</Button>
          <Button onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Draft
          </Button>
        </div>
      </header>

      {importedCaption && (
        <Alert className="mb-8 max-w-3xl mx-auto">
          <Sparkles className="h-4 w-4" />
          <AlertTitle>You&apos;ve got a pre-filled caption!</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            The full caption from your engagement idea is ready to be pasted.
            <Button variant="outline" size="sm" onClick={handleCopyImportedCaption} className="ml-4">
              <Copy className="mr-2 h-4 w-4" />
              Copy Full Caption
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 lg:sticky top-12">
          <PostControls
            platformFormat={platformFormat}
            setPlatformFormat={setPlatformFormat}
            templateId={templateId}
            setTemplateId={setTemplateId}
            frameStyle={frameStyle}
            setFrameStyle={setFrameStyle}
            headlineText={headlineText}
            setHeadlineText={setHeadlineText}
            subtextText={subtextText}
            setSubtextText={setSubtextText}
            ctaText={ctaText}
            setCtaText={setCtaText}
            headlineStyle={headlineStyle}
            setHeadlineStyle={setHeadlineStyle}
            subtextStyle={subtextStyle}
            setSubtextStyle={setSubtextStyle}
            ctaStyle={ctaStyle}
            setCtaStyle={setCtaStyle}
            onResetStyles={resetStyles}
            brandColors={brandProfile?.brandColors}
          />
        </div>
        <div className="lg:col-span-2">
          <PostPreview
            ref={previewRef}
            imageUrl={selectedImageUrl}
            platformFormat={platformFormat}
            templateId={templateId}
            frameStyle={frameStyle}
            headline={{text: headlineText, ...headlineStyle}}
            subtext={{text: subtextText, ...subtextStyle}}
            cta={{text: ctaText, ...ctaStyle}}
            brandProfile={brandProfile}
          />
        </div>
      </div>
    </div>
  );
}
