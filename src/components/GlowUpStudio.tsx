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
} from "lucide-react";

import {
  enhanceImage,
  type EnhanceImageInput,
  type EnhanceImageOutput,
} from "@/ai/flows/enhance-image-flow";
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

const beforeImageDefault = PlaceHolderImages.find(
  (p) => p.id === "glow-up-before-default"
)!;

type CreationType = "single" | "multiple";
type StyleType = "flat-lay" | "on-model";
type LookPreset =
  | "soft-boutique-studio"
  | "bright-clean-catalog"
  | "cozy-lifestyle-flat"
  | "minimal-studio-model"
  | "warm-lifestyle-model"
  | "casual-outdoor-model";

type Step =
  | "selectCreationType"
  | "upload"
  | "selectStyleType"
  | "selectLookPreset"
  | "enhancing"
  | "done";

const flatLayPresets: Record<LookPreset, { label: string; description: string }> = {
  "soft-boutique-studio": { label: "Soft Boutique Studio", description: "Neutral warm background, soft shadows" },
  "bright-clean-catalog": { label: "Bright Clean Catalog", description: "White background, minimal shadow" },
  "cozy-lifestyle-flat": { label: "Cozy Lifestyle Flat", description: "Textured neutral surface" },
  'minimal-studio-model': { label: '', description: '' }, // to satisfy typescript
  'warm-lifestyle-model': { label: '', description: '' },
  'casual-outdoor-model': { label: '', description: '' },
};

const modeledPresets: Record<LookPreset, { label: string; description: string }> = {
  "minimal-studio-model": { label: "Minimal Studio Model", description: "Clean studio background" },
  "warm-lifestyle-model": { label: "Warm Lifestyle Model", description: "Indoor boutique setting" },
  "casual-outdoor-model": { label: "Casual Outdoor Model", description: "Natural light outdoor look" },
  'soft-boutique-studio': { label: '', description: '' }, // to satisfy typescript
  'bright-clean-catalog': { label: '', description: '' },
  'cozy-lifestyle-flat': { label: '', description: '' },
};


export function GlowUpStudio() {
  const { toast } = useToast();
  const [originalImages, setOriginalImages] = React.useState<string[]>([]);
  const [enhancedImage, setEnhancedImage] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [step, setStep] = React.useState<Step>("selectCreationType");
  const [creationType, setCreationType] = React.useState<CreationType | null>(null);
  const [styleType, setStyleType] = React.useState<StyleType | null>(null);
  const [lookPreset, setLookPreset] = React.useState<LookPreset | null>(null);
  const [isFallback, setIsFallback] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isEnhancing = step === "enhancing";

  const resetWorkflow = () => {
    setOriginalImages([]);
    setEnhancedImage(null);
    setCreationType(null);
    setStyleType(null);
    setLookPreset(null);
    setStep("selectCreationType");
    setIsFallback(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !creationType) return;

    // Validate file count
    if (creationType === 'single' && files.length > 1) {
      toast({ variant: 'destructive', title: 'Too many images', description: 'Please select only one image for a single item.' });
      return;
    }
    if (creationType === 'multiple' && files.length > 3) {
      toast({ variant: 'destructive', title: 'Too many images', description: 'You can select up to 3 images for an outfit.' });
      return;
    }
    
    let hasError = false;
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({ variant: "destructive", title: "Image too large", description: `"${file.name}" is over 10MB. Please upload smaller images.` });
        hasError = true;
      }
    });
    if (hasError) return;

    const newImageUrls: string[] = [];
    let filesLoaded = 0;

    const processFile = (file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImageUrls.push(reader.result as string);
        filesLoaded++;
        if (filesLoaded === files.length) {
          setOriginalImages(newImageUrls);
          setEnhancedImage(null);
          setStep("selectStyleType");
        }
      };
      reader.readAsDataURL(file);
    };

    Array.from(files).forEach(processFile);
  };

  const handleSelectCreationType = (type: CreationType) => {
    setCreationType(type);
    setStep("upload");
    // Trigger file input immediately
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleSelectStyleType = (type: StyleType) => {
    setStyleType(type);
    setLookPreset(null); // Reset preset when style changes
    setStep("selectLookPreset");
  };
  
  const handleSelectLookPreset = (preset: LookPreset) => {
    setLookPreset(preset);
  }

  const handleEnhance = async () => {
    if (!creationType || originalImages.length === 0 || !styleType || !lookPreset) return;

    setStep("enhancing");
    setIsFallback(false); // Reset on each attempt
    setEnhancedImage(null);
    setProgress(0);

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
      clearInterval(interval);

      if (result.enhancedImageDataUri) {
        setProgress(100);
        setEnhancedImage(result.enhancedImageDataUri);
        setStep("done");

        if (result.isFallback) {
          setIsFallback(true);
          toast({
            title: "Gemini is busy right now — using Instant Glow-Up mode.",
            description: "A simulated enhancement has been applied as a fallback.",
          });
        } else {
          toast({ title: "Glow-up complete!", description: "Your new boutique-ready image has been generated." });
        }
      } else {
        throw new Error("The AI did not return an enhanced image.");
      }
    } catch (error) {
      clearInterval(interval);
      console.error("Error enhancing image:", error);
      
      // This is a client-side fallback if the entire `enhanceImage` function fails to execute.
      setProgress(100);
      setEnhancedImage(originalImages[0]); // Use first original image as fallback
      setStep("done");
      setIsFallback(true); // Activate fallback mode UI
      toast({
        title: "Using Instant Glow-Up mode.",
        description: "There was an issue connecting to the AI. A simulated enhancement has been applied.",
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

  const ChoiceButton = ({ onClick, icon, label, description, isSelected, disabled }: { onClick: () => void; icon: React.ReactNode; label: string; description: string; isSelected: boolean; disabled?: boolean; }) => (
    <Button
      variant="outline"
      size="lg"
      disabled={disabled}
      onClick={onClick}
      className={cn("h-auto w-full text-left justify-start p-4", isSelected && "border-primary ring-2 ring-primary")}
    >
      <div className="flex gap-4 items-center">
        <div className={cn("h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0", isSelected && "bg-primary text-primary-foreground")}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold">{label}</span>
          <span className="text-sm text-muted-foreground font-normal">{description}</span>
        </div>
        {isSelected && <Check className="h-5 w-5 ml-auto text-primary" />}
      </div>
    </Button>
  );

  const ImageCard = ({ title, isOriginal = false, isFallback = false }: { title: string; isOriginal?: boolean; isFallback?: boolean; }) => (
    <div className="space-y-2">
      <h3 className="text-center font-medium text-muted-foreground">{title}</h3>
      <Card className={cn("relative group aspect-square w-full max-w-md mx-auto overflow-hidden shadow-lg", isEnhancing && !isOriginal && "bg-muted/30")}>
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
           <Image src={enhancedImage} alt={title} fill className={cn("object-cover transition-transform duration-300 group-hover:scale-105", isFallback && "brightness-110 contrast-105 saturate-110")} data-ai-hint="dress mannequin" />
        ) : (isOriginal && step !== 'selectCreationType') ? (
            <div className="flex flex-col h-full items-center justify-center bg-muted/30 p-8 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Click to upload your image(s)</p>
            </div>
        ) : (
          !isEnhancing && !isOriginal && (
             <div className="flex flex-col h-full items-center justify-center bg-muted/30 p-8 text-center">
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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Change Image(s)
            </Button>
          </div>
        )}
        {step === "done" && !isOriginal && enhancedImage && (
          <div className="absolute inset-0 bg-black/50 flex flex-col gap-4 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button variant="secondary" onClick={handleDownload}><Download className="mr-2 h-4 w-4" />Download Image</Button>
            <Button variant="outline" size="sm" onClick={resetWorkflow}>Start New Project</Button>
          </div>
        )}
        {(!enhancedImage && !isEnhancing && !isOriginal) && <Skeleton className="w-full h-full" />}
        { (isOriginal && originalImages.length === 0) && <Image src={beforeImageDefault.imageUrl} alt="placeholder" fill className="object-cover opacity-50" data-ai-hint={beforeImageDefault.imageHint} /> }
      </Card>
    </div>
  );

  const getCardDescription = () => {
    switch (step) {
      case 'selectCreationType': return "What are we creating? Select one to begin.";
      case 'upload': return `Upload up to ${creationType === 'multiple' ? '3 images' : '1 image'} for your project.`;
      case 'selectStyleType': return "Great. Now, how should it be styled?";
      case 'selectLookPreset': return "Almost there. Pick a look that matches your brand.";
      case 'enhancing': return "Our AI is working its magic...";
      case 'done': return isFallback ? "Used Instant Glow-Up. You can retry the AI." : "Your boutique-ready image is complete!";
      default: return "AI-powered image enhancement for your boutique.";
    }
  }
  
  const currentPresets = styleType === 'flat-lay' ? flatLayPresets : modeledPresets;

  return (
    <Card className="w-full mx-auto p-4 sm:p-6 lg:p-8">
      <CardHeader className="text-center px-0 sm:px-6">
        <CardTitle className="text-3xl font-bold tracking-tight md:text-4xl font-headline">Glow-Up Studio</CardTitle>
        <CardDescription className="max-w-xl mx-auto">{getCardDescription()}</CardDescription>
      </CardHeader>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        multiple={creationType === 'multiple'}
      />

      <div className="mt-8">
        <div className="lg:hidden">
          <Tabs defaultValue="before" className="w-full">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="before">Before</TabsTrigger><TabsTrigger value="after">After</TabsTrigger></TabsList>
            <TabsContent value="before" className="mt-6"><ImageCard title="Before" isOriginal /></TabsContent>
            <TabsContent value="after" className="mt-6"><ImageCard title="After" isFallback={isFallback} /></TabsContent>
          </Tabs>
        </div>
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <ImageCard title="Before" isOriginal />
          <ImageCard title="After" isFallback={isFallback} />
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center max-w-2xl mx-auto">
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
              .filter(([key, value]) => value.label) // Filter out dummy entries
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

        {lookPreset && (step === 'selectLookPreset' || step === 'done') && (
          <div className="mt-8 flex flex-col items-center">
            {step === 'selectLookPreset' ? (
              <Button type="submit" size="lg" className="font-semibold text-lg py-7 px-8" disabled={isEnhancing} onClick={handleEnhance}>
                <Wand2 className="mr-3 h-6 w-6" /> Generate Glow-Up
              </Button>
            ) : step === 'done' && isFallback ? (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button size="lg" className="font-semibold text-lg py-7 px-8" disabled={isEnhancing} onClick={handleEnhance}>
                  <Wand2 className="mr-2 h-5 w-5" /> Try AI Again
                </Button>
                <Button size="lg" variant="outline" onClick={resetWorkflow} className="font-semibold text-lg py-7 px-8">
                  Start New Project
                </Button>
              </div>
            ) : (
               <Button size="lg" variant="outline" onClick={resetWorkflow} className="font-semibold text-lg py-7 px-8">
                Create Another Image
              </Button>
            )}
           </div>
        )}

        {step === 'upload' && (
          <div className="text-center text-muted-foreground animate-pulse">
            <p>Waiting for you to select your image(s)...</p>
          </div>
        )}
      </div>
    </Card>
  );
}
