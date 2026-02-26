"use client";

import Image from "next/image";
import * as React from "react";
import {
  Download,
  Loader2,
  Sparkles,
  UploadCloud,
  Wand2,
  Shirt,
  Users,
  Check,
  Image as ImageIcon,
  Palette,
  Cpu,
  Zap,
  X,
  Save,
  Send,
} from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, query } from "firebase/firestore";
import Link from 'next/link';

import {
  enhanceImage,
  type EnhanceImageInput,
  type EnhanceImageOutput,
} from "@/ai/flows/enhance-image-flow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useStorage, useCollection } from "@/firebase";


const beforeImageDefault = PlaceHolderImages.find(
  (p) => p.id === "glow-up-before-default"
)!;

type CreationType = "single" | "multiple";
type StyleType = "flat-lay" | "on-model";
type LookPreset =
  | 'clean-catalog'
  | 'styled-boutique'
  | 'facebook-sales-post'
  | 'luxury-editorial'
  | 'minimal-studio-model'
  | 'warm-lifestyle-model'
  | 'casual-outdoor-model';


type Step =
  | "selectCreationType"
  | "upload"
  | "selectStyleType"
  | "selectLookPreset"
  | "enhancing"
  | "done";

type GenerationMode = 'ai' | 'instant' | 'busy' | null;

const flatLayPresets: Record<LookPreset, { label: string; description: string }> = {
  "clean-catalog": { label: "Clean Catalog", description: "Bright, symmetrical, minimal accessories" },
  "styled-boutique": { label: "Styled Boutique", description: "Warm, soft shadows, 1 premium accessory" },
  "facebook-sales-post": { label: "Facebook Sales Post", description: "Dynamic & playful, up to 2 accessories" },
  "luxury-editorial": { label: "Luxury Editorial", description: "Artistic, dramatic lighting, premium feel" },
  // Placeholders for modeled presets
  'minimal-studio-model': { label: '', description: '' },
  'warm-lifestyle-model': { label: '', description: '' },
  'casual-outdoor-model': { label: '', description: '' },
};

const modeledPresets: Record<LookPreset, { label: string; description: string }> = {
  "minimal-studio-model": { label: "Minimal Studio Model", description: "Clean studio background" },
  "warm-lifestyle-model": { label: "Warm Lifestyle Model", description: "Indoor boutique setting" },
  "casual-outdoor-model": { label: "Casual Outdoor Model", description: "Natural light outdoor look" },
  // Placeholders for flat lay presets
  'clean-catalog': { label: '', description: '' },
  'styled-boutique': { label: '', description: '' },
  'facebook-sales-post': { label: '', description: '' },
  'luxury-editorial': { label: '', description: '' },
};

const dataURIToBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

export function GlowUpStudio() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();

  const uploadsCollectionPath = React.useMemo(() => (user ? `users/${user.uid}/uploads` : null), [user]);
  const uploadsQuery = React.useMemo(() => {
    if (uploadsCollectionPath && firestore) {
      return query(collection(firestore, uploadsCollectionPath));
    }
    return null;
  }, [uploadsCollectionPath, firestore]);
  const { data: existingUploads } = useCollection(uploadsQuery, uploadsCollectionPath);


  const [originalImages, setOriginalImages] = React.useState<string[]>([]);
  const [enhancedImage, setEnhancedImage] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [step, setStep] = React.useState<Step>("selectCreationType");
  const [creationType, setCreationType] = React.useState<CreationType | null>(null);
  const [styleType, setStyleType] = React.useState<StyleType | null>(null);
  const [lookPreset, setLookPreset] = React.useState<LookPreset | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [generationMode, setGenerationMode] = React.useState<GenerationMode>(null);
  const [isInstantGlowUp, setIsInstantGlowUp] = React.useState(false);
  const [mobileTab, setMobileTab] = React.useState<"before" | "after">("before");
  const afterImageContainerRef = React.useRef<HTMLDivElement>(null);
  
  const isEnhancing = step === "enhancing";

  const resetWorkflow = () => {
    setOriginalImages([]);
    setEnhancedImage(null);
    setCreationType(null);
    setStyleType(null);
    setLookPreset(null);
    setStep("selectCreationType");
    setGenerationMode(null);
    setIsInstantGlowUp(false);
    setMobileTab("before");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
  
    if (!files || files.length === 0 || !creationType || !user || !storage || !firestore) {
      if (step === 'upload' && (!files || files.length === 0)) {
        setStep('selectCreationType');
        setCreationType(null);
      }
      return;
    }
  
    let hasError = false;
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Image too large", description: `"${file.name}" is over 10MB.` });
        hasError = true;
      }
    });
    if (hasError) return;
  
    const prospectiveCount = originalImages.length + files.length;
    if (creationType === 'single' && prospectiveCount > 1) {
      toast({ variant: 'destructive', title: 'Invalid Selection', description: 'For a "Single Item", you can only upload one image.' });
      return;
    }
    if (creationType === 'multiple' && prospectiveCount > 3) {
      toast({ variant: 'destructive', title: 'Too many images', description: 'You can select up to 3 images for an outfit.' });
      return;
    }
  
    const readFileAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    };
  
    const existingImageUrls: string[] = [];
    const filesToUpload: { file: File, dataUrlPromise: Promise<string> }[] = [];
  
    // Immediately check for duplicates without reading files first
    for (const file of Array.from(files)) {
      const existingImage = existingUploads?.find(upload =>
        upload.originalName === file.name && upload.size === file.size
      );
  
      if (existingImage) {
        if (!originalImages.includes(existingImage.downloadURL)) {
          existingImageUrls.push(existingImage.downloadURL);
          toast({
            title: "Image Added From Library",
            description: `Used "${file.name}" from your uploads.`,
          });
        }
      } else {
        filesToUpload.push({ file, dataUrlPromise: readFileAsDataURL(file) });
      }
    }
  
    const allUrlsToAdd = [...existingImageUrls];
  
    if (filesToUpload.length > 0) {
      toast({ title: 'Uploading new image(s)...', description: 'Your new files are being securely saved.' });
  
      try {
        const uploadedResults = await Promise.all(
          filesToUpload.map(async ({ file, dataUrlPromise }) => {
            const storagePath = `uploads/${user.uid}/${Date.now()}-${file.name}`;
            const storageRef = ref(storage, storagePath);
  
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
  
            const uploadDoc = {
              uid: user.uid,
              email: user.email,
              storagePath,
              downloadURL,
              originalName: file.name,
              contentType: file.type,
              size: file.size,
              createdAt: serverTimestamp(),
              isEnhanced: false,
            };
  
            await addDoc(collection(firestore, `users/${user.uid}/uploads`), uploadDoc);
            
            // Now await the dataUrl which was being read in parallel
            const dataUrl = await dataUrlPromise;
            return dataUrl;
          })
        );
  
        allUrlsToAdd.push(...uploadedResults);
        toast({ title: 'Upload complete!', description: 'You can now style your new image(s).' });
  
      } catch (error: any) {
        console.error("Error handling files:", error);
        toast({ variant: "destructive", title: "Upload failed", description: error.message || "There was an error saving your files. Please try again." });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }
  
    if (allUrlsToAdd.length > 0) {
      setOriginalImages(prev => [...prev, ...allUrlsToAdd]);
      if (step === 'upload') {
        setEnhancedImage(null);
        setStep("selectStyleType");
      }
    }
  
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleRemoveImage = (indexToRemove: number) => {
    const newImages = originalImages.filter((_, index) => index !== indexToRemove);
    setOriginalImages(newImages);
    if (newImages.length === 0) {
      if (creationType) {
        setStep('upload');
      } else {
        resetWorkflow();
      }
    }
  };
  
  const handleSelectCreationType = (type: CreationType) => {
    setCreationType(type);
    setStep("upload");

    //must be inside the user's click event (no setTimeout), or some browsers block it.
  
    // MUST fire immediately inside user click
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; //alows re-selecting same file
      fileInputRef.current.click();
    }
  };
  
  const handleSelectStyleType = (type: StyleType) => {
    setStyleType(type);
    setLookPreset(null);
    setStep('selectLookPreset');
  };
  
  const handleSelectLookPreset = (preset: LookPreset) => {
    setLookPreset(preset);
  };
  
  const saveEnhancedImage = async (dataUri: string) => {
    if (!user || !storage || !firestore) return;
  
    try {
      const blob = dataURIToBlob(dataUri);
      const fileName = `glow-up-${Date.now()}.png`;
      const storagePath = `uploads/${user.uid}/${fileName}`;
      const storageRef = ref(storage, storagePath);
  
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
  
      const uploadDoc = {
        uid: user.uid,
        email: user.email,
        storagePath,
        downloadURL,
        originalName: fileName,
        contentType: blob.type,
        size: blob.size,
        createdAt: serverTimestamp(),
        isEnhanced: true,
      };
  
      await addDoc(collection(firestore, `users/${user.uid}/uploads`), uploadDoc);
    } catch (error) {
      console.error('Error saving enhanced image:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save the enhanced image to your uploads.',
      });
      throw error;
    }
  };
  
  const handleEnhance = async () => {
    if (!creationType || originalImages.length === 0 || !styleType || !lookPreset) return;
  
    setStep('enhancing');
    setEnhancedImage(null);
    setProgress(0);
    setGenerationMode('busy');
    setIsInstantGlowUp(false);
    setMobileTab('after');
  
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? 95 : prev + Math.floor(Math.random() * 5) + 2));
    }, 500);
  
    try {
      const input: EnhanceImageInput = {
        imageDataUris: originalImages,
        creationType,
        styleType,
        lookPreset,
      };
      const result: EnhanceImageOutput = await enhanceImage(input);

      if (result.isFallback) {
        setGenerationMode('instant');
        setIsInstantGlowUp(true);
        setEnhancedImage(originalImages[0]);
        if (creationType === 'multiple') {
          toast({
            title: "Instant Mode can't create true outfits yet.",
            description: "Tap 'Try AI Again' for our AI Studio Mode to combine items.",
          });
        } else {
          toast({
            title: 'AI Studio is busy',
            description: 'Using Instant Glow-Up for now. You can try again later.',
          });
        }
      } else {
        setGenerationMode('ai');
        setIsInstantGlowUp(false);
        setEnhancedImage(result.enhancedImageDataUri);

        // Save the image and update toast on success
        setProgress(98);
        await saveEnhancedImage(result.enhancedImageDataUri);
        toast({ title: "Glow-up complete!", description: "Your new image has been saved to your library." });
      }
      
      clearInterval(interval);
      setProgress(100);
      setStep("done");
      setTimeout(() => {
        afterImageContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);


    } catch (error) {
      clearInterval(interval);
      setProgress(0);
      setStep("selectLookPreset");
      setGenerationMode(null);
      console.error("Error enhancing image:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a critical issue generating your image. Please try again.",
      });
    }
  };

  const handleDownload = async () => {
    if (!enhancedImage) return;
    try {
      const response = await fetch(enhancedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "boutique-curator-glow-up.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not download the image. Please try again.",
      });
    }
  };
  
  const GenerationStatusBadge = () => {
    if (!generationMode || (step !== 'enhancing' && step !== 'done')) return null;

    let variant: 'default' | 'destructive' | 'secondary' = 'default';
    let icon: React.ReactNode = null;
    let text = '';
    
    if (generationMode === 'ai') {
        variant = 'default';
        icon = <Cpu className="h-4 w-4" />;
        text = 'AI Studio Mode';
    } else if (generationMode === 'instant') {
        variant = 'secondary';
        icon = <Zap className="h-4 w-4" />;
        text = 'Instant Mode';
    } else if (generationMode === 'busy') {
        variant = 'destructive';
        icon = <Loader2 className="h-4 w-4 animate-spin" />;
        text = 'AI Busy';
    }

    return (
        <Badge variant={variant} className="flex items-center gap-2 text-sm px-3 py-1">
            {icon}
            <span>{text}</span>
        </Badge>
    );
};

  const ChoiceButton = ({ onClick, icon, label, description, isSelected, disabled }: { onClick: () => void; icon: React.ReactNode; label: string; description: string; isSelected: boolean; disabled?: boolean; }) => (
    <Button
      variant="outline"
      size="lg"
      disabled={disabled}
      onClick={onClick}
      className={cn("h-auto w-full text-left justify-start p-4 border-2", isSelected && "border-primary ring-2 ring-primary/50")}
    >
      <div className="flex gap-4 items-center">
        <div className={cn("h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0", isSelected && "bg-primary text-primary-foreground")}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-base">{label}</span>
          <span className="text-sm text-muted-foreground font-normal">{description}</span>
        </div>
        {isSelected && <Check className="h-5 w-5 ml-auto text-primary" />}
      </div>
    </Button>
  );
  
  const ImageCard = ({
    title,
    isOriginal = false,
    wrapperRef,
  }: {
    title: string;
    isOriginal?: boolean;
    wrapperRef?: React.Ref<HTMLDivElement>;
  }) => (
    <div className="space-y-3" ref={wrapperRef}>
      <h3 className="text-center font-medium text-lg text-muted-foreground">{title}</h3>
      <Card className={cn("relative group aspect-square w-full max-w-lg mx-auto overflow-hidden shadow-lg", isEnhancing && !isOriginal && "bg-muted/30")}>
        {isOriginal && originalImages.length > 0 ? (
          <Carousel className="w-full h-full">
            <CarouselContent>
              {originalImages.map((src, index) => (
                <CarouselItem key={index}>
                  <Image src={src} alt={`${title} ${index + 1}`} fill className="object-cover" />
                </CarouselItem>
              ))}
            </CarouselContent>
            {originalImages.length > 1 && (<> <CarouselPrevious className="left-4" /> <CarouselNext className="right-4" /> </>)}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full">{originalImages.length} / {creationType === 'multiple' ? 3 : 1}</div>
          </Carousel>
        ) : !isOriginal && enhancedImage ? (
           <Image src={enhancedImage} alt={title} fill className={cn("object-cover transition-transform duration-300 group-hover:scale-105", isInstantGlowUp && "saturate-125 brightness-110 contrast-105")} data-ai-hint="dress mannequin" />
        ) : (isOriginal && step !== 'selectCreationType') ? (
            <div className="flex flex-col h-full items-center justify-center bg-muted/50 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted transition-colors" onClick={triggerFileInput}>
              <UploadCloud className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">Click to upload your image(s)</p>
              <p className="text-muted-foreground text-sm">Up to 10MB each</p>
            </div>
        ) : (
          !isEnhancing && !isOriginal && (
             <div className="flex flex-col h-full items-center justify-center bg-muted/50 p-8 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Your enhanced image will appear here</p>
            </div>
          )
        )}
        {isEnhancing && !isOriginal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-8">
            <p className="font-medium text-lg text-primary mb-4">Creating your glow-up...</p>
            <Progress value={progress} className="w-full max-w-xs" />
            <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
          </div>
        )}
        {step !== "enhancing" && step !== 'selectCreationType' && isOriginal && originalImages.length > 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button variant="secondary" onClick={triggerFileInput}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Change/Add Images
            </Button>
          </div>
        )}
        {step === "done" && !isOriginal && enhancedImage && (
          <div className="absolute inset-0 bg-black/60 flex flex-col gap-4 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button variant="secondary" onClick={handleDownload}><Download className="mr-2 h-4 w-4" />Download Image</Button>
          </div>
        )}
        {(!enhancedImage && !isEnhancing && !isOriginal) && <Skeleton className="w-full h-full" />}
        { (isOriginal && originalImages.length === 0) && <Image src={beforeImageDefault.imageUrl} alt="placeholder" fill className="object-cover opacity-60" data-ai-hint={beforeImageDefault.imageHint} /> }
      </Card>
    </div>
  );

  const getCardDescription = () => {
    switch (step) {
      case 'selectCreationType': return "Select one to begin.";
      case 'upload': return `Upload up to ${creationType === 'multiple' ? '3 images' : '1 image'}.`;
      case 'selectStyleType': return "How should it be styled?";
      case 'selectLookPreset': return "Pick a look that matches your brand.";
      case 'enhancing': return "Our AI is working its magic...";
      case 'done': return "Your boutique-ready image is complete!";
      default: return "AI-powered image enhancement.";
    }
  }
  
  const currentPresets = styleType === 'flat-lay' ? flatLayPresets : modeledPresets;

  const UploadedImagesPreview = () => {
    if (originalImages.length === 0 || step === 'selectCreationType' || step === 'upload') {
        return null;
    }
    return (
      <div className="mt-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-foreground">Selected Image(s)</h3>
            { (creationType === 'multiple' && originalImages.length < 3) &&
                <Button variant="outline" size="sm" onClick={triggerFileInput}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Add More
                </Button>
            }
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 rounded-xl border bg-card p-4">
            {originalImages.map((src, i) => (
                <div key={i} className="relative aspect-square group">
                    <Image src={src} alt={`upload preview ${i}`} fill className="rounded-md object-cover" />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(i)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full mx-auto p-4 sm:p-6 lg:p-8 border-none bg-transparent shadow-none">
    <input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  multiple={creationType === "multiple"}
  onChange={handleFileChange}
/>

      
      <div className="mt-8">
        <div className="lg:hidden">
          <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="before">Before</TabsTrigger><TabsTrigger value="after">After</TabsTrigger></TabsList>
            <TabsContent value="before" className="mt-6"><ImageCard title="Before" isOriginal /></TabsContent>
            <TabsContent value="after" className="mt-6"><ImageCard title="After" wrapperRef={afterImageContainerRef} /></TabsContent>
          </Tabs>
        </div>
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <ImageCard title="Before" isOriginal />
          <ImageCard title="After" wrapperRef={afterImageContainerRef} />
        </div>
      </div>

      <UploadedImagesPreview />
      
      <div className="mt-10 flex flex-col items-center max-w-3xl mx-auto">
        <div className="text-center mb-6">
            <h2 className="text-2xl font-headline font-semibold">{
                step === 'selectCreationType' ? '1. Select Creation Type' :
                step === 'upload' ? '1. Select Creation Type' :
                step === 'selectStyleType' ? '2. Select Style Type' :
                step === 'selectLookPreset' ? '3. Select Look & Feel' :
                'Image Generation'
            }</h2>
            <p className="text-muted-foreground">{getCardDescription()}</p>
        </div>
        
        {step === "selectCreationType" && (
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <ChoiceButton onClick={() => handleSelectCreationType("single")} icon={<Shirt className="h-6 w-6" />} label="Single Item" description="Enhance one main product." isSelected={creationType === "single"} />
            <ChoiceButton onClick={() => handleSelectCreationType("multiple")} icon={<Users className="h-6 w-6" />} label="Multiple Items" description="Style a complete outfit." isSelected={creationType === "multiple"} />
          </div>
        )}

        {step === "selectStyleType" && (
           <div className="flex flex-col sm:flex-row gap-4 w-full">
            <ChoiceButton onClick={() => handleSelectStyleType("flat-lay")} icon={<ImageIcon className="h-6 w-6" />} label="Flat Lay" description="Top-down arrangement." isSelected={styleType === "flat-lay"} />
            <ChoiceButton onClick={() => handleSelectStyleType("on-model")} icon={<Users className="h-6 w-6" />} label="Modeled" description="On a model or mannequin." isSelected={styleType === "on-model"} />
          </div>
        )}

        {step === "selectLookPreset" && styleType && (
           <div className="flex flex-col gap-4 w-full">
            {Object.entries(currentPresets)
              .filter(([key, value]) => value.label)
              .map(([key, {label, description}]) => (
                <ChoiceButton
                  key={key}
                  onClick={() => handleSelectLookPreset(key as LookPreset)}
                  icon={<Palette className="h-6 w-6" />}
                  label={label}
                  description={description}
                  isSelected={lookPreset === key}
                />
            ))}
          </div>
        )}

        {(step === 'selectLookPreset' || step === 'done' || step === 'enhancing') && (
          <div className="mt-8 flex flex-col items-center gap-4">
             <GenerationStatusBadge />
            {step === 'selectLookPreset' && lookPreset && (
              <Button type="submit" size="lg" className="font-semibold text-lg py-7 px-8 rounded-full" disabled={isEnhancing} onClick={handleEnhance}>
                {isEnhancing ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Wand2 className="mr-3 h-6 w-6" />}
                 {isEnhancing ? "Generating..." : "Generate Glow-Up"}
              </Button>
            )}
            {step === 'done' && (
              <div className="flex flex-wrap justify-center gap-4">
                {generationMode === 'instant' && (
                  <Button onClick={handleEnhance} size="lg" className="font-semibold text-lg py-7 px-8 rounded-full">
                      <Sparkles className="mr-3 h-6 w-6" />
                      Try AI Studio Again
                  </Button>
                )}
                {enhancedImage && (
                    <Button asChild size="lg" className="font-semibold text-lg py-7 px-8 rounded-full">
                        <Link href={`/post-creator?img=${encodeURIComponent(enhancedImage)}`}>
                            <Send className="mr-3 h-6 w-6" />
                            Create Post
                        </Link>
                    </Button>
                )}
                <Button size="lg" variant="outline" onClick={resetWorkflow} className="font-semibold text-lg py-7 px-8 rounded-full">
                  Create Another Image
                </Button>
              </div>
            )}
           </div>
        )}

        {step === 'upload' && (
          <div className="text-center text-muted-foreground animate-pulse p-8">
            <p>Waiting for you to select your image(s)...</p>
          </div>
        )}
      </div>
    </Card>
  );
}
