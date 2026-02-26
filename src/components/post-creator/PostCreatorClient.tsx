'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PostControls } from './PostControls';
import { PostPreview } from './PostPreview';
import { Button } from '@/components/ui/button';
import { Download, Copy, Save, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';

// Types
type PlatformFormat = 'IG_FEED' | 'IG_STORY' | 'FB_FEED';
type TemplateId = 'MODERN_CATALOG' | 'MINIMAL_LOOK' | 'BOLD_STATEMENT';

export default function PostCreatorClient() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const imageUrl = searchParams.get('img');
  
  // State for post customization
  const [platformFormat, setPlatformFormat] = useState<PlatformFormat>('IG_FEED');
  const [templateId, setTemplateId] = useState<TemplateId>('MODERN_CATALOG');
  const [headline, setHeadline] = useState('new arrival');
  const [subtext, setSubtext] = useState('');
  const [cta, setCta] = useState('comment sold');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch brand profile
  const brandProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}/brandProfile/main`);
  }, [user, firestore]);

  const { data: brandProfile, loading: brandLoading } = useDoc(brandProfileRef);

  // Set default subtext once brand profile is loaded
  React.useEffect(() => {
    if (brandProfile && brandProfile.brandName) {
      setSubtext(brandProfile.brandName);
    } else if (!brandLoading) {
      setSubtext('boutique curator');
    }
  }, [brandProfile, brandLoading]);

  const previewRef = React.useRef<HTMLDivElement>(null);

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
  
  const handleCopyCaption = () => {
    const caption = `✨ ${headline.toUpperCase()} ✨\n\n${subtext}\n\nTo purchase, ${cta}!`;
    navigator.clipboard.writeText(caption);
    toast({ title: 'Caption Copied!' });
  };
  
  const handleSaveDraft = async () => {
    if (!user || !firestore || !imageUrl) return;

    setIsSaving(true);
    try {
      const newPostRef = doc(collection(firestore, `users/${user.uid}/posts`));
      
      const postData = {
        createdAt: serverTimestamp(),
        platformFormat,
        templateId,
        enhancedImageUrl: imageUrl,
        textFields: { headline, subtext, cta },
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

  if (!imageUrl) {
    return (
      <div className="flex-1 p-8 text-center">
        <p className="text-destructive mt-10">
          No image URL provided. Please go back to the AI Editor and create a post from a Glow-Up.
        </p>
      </div>
    );
  }

  if (brandLoading) {
    return (
        <div className="flex-1 p-8 sm:p-10 lg:p-12">
             <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-10 w-72 mb-3" />
                    <Skeleton className="h-6 w-96" />
                </div>
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-24" />
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
    )
  }

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
            Instant Post Creator
          </h1>
          <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
            Customize your auto-generated post and export it for social media.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCopyCaption}><Copy /> Copy Caption</Button>
          <Button variant="outline" onClick={handleDownload}><Download /> Download PNG</Button>
          <Button onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Save Draft
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 lg:sticky top-12">
          <PostControls
            platformFormat={platformFormat}
            setPlatformFormat={setPlatformFormat}
            templateId={templateId}
            setTemplateId={setTemplateId}
            headline={headline}
            setHeadline={setHeadline}
            subtext={subtext}
            setSubtext={setSubtext}
            cta={cta}
            setCta={setCta}
          />
        </div>
        <div className="lg:col-span-2">
          <PostPreview
            ref={previewRef}
            imageUrl={imageUrl}
            platformFormat={platformFormat}
            templateId={templateId}
            headline={headline}
            subtext={subtext}
            cta={cta}
            brandProfile={brandProfile}
          />
        </div>
      </div>
    </div>
  );
}
