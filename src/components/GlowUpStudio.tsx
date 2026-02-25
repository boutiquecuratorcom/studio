"use client";

import Image from "next/image";
import * as React from "react";
import {
  Download,
  Loader2,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";

import { enhanceImage, type EnhanceImageOutput } from "@/ai/flows/enhance-image-flow";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

const beforeImageDefault = PlaceHolderImages.find(
  (p) => p.id === "glow-up-before-default"
)!;
const afterImageDefault = PlaceHolderImages.find(
  (p) => p.id === "glow-up-after-default"
)!;

export function GlowUpStudio() {
  const { toast } = useToast();
  const [originalImage, setOriginalImage] = React.useState<string | null>(
    beforeImageDefault.imageUrl
  );
  const [enhancedImage, setEnhancedImage] = React.useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [isEnhanced, setIsEnhanced] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: "destructive",
          title: "Image too large",
          description: "Please upload an image smaller than 10MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEnhancedImage(null);
        setIsEnhanced(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = async () => {
    if (!originalImage) return;

    setIsEnhancing(true);
    setIsEnhanced(false);
    setEnhancedImage(null);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.floor(Math.random() * 5) + 2; // Smoother progress
      });
    }, 500);

    try {
      const result: EnhanceImageOutput = await enhanceImage({ imageDataUri: originalImage });
      
      clearInterval(interval);
      
      if (result.enhancedImageDataUri) {
        setProgress(100);
        setEnhancedImage(result.enhancedImageDataUri);
        setIsEnhanced(true);
        toast({
            title: "Glow-up complete!",
            description: "Your image has been successfully enhanced.",
        });
      } else {
        throw new Error("The AI did not return an enhanced image.");
      }
    } catch (error) {
      clearInterval(interval);
      console.error("Error enhancing image:", error);
      toast({
        variant: "destructive",
        title: "Enhancement failed",
        description: (error instanceof Error ? error.message : "An unknown error occurred") + ". Please try again.",
      });
      setProgress(0);
      setEnhancedImage(null);
      setIsEnhanced(false);
    } finally {
      setIsEnhancing(false);
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

  const ImageCard = ({
    title,
    imageUrl,
    isOriginal = false,
    isLoading = false,
  }: {
    title: string;
    imageUrl: string | null;
    isOriginal?: boolean;
    isLoading?: boolean;
  }) => (
    <div className="space-y-2">
      <h3 className="text-center font-medium text-muted-foreground">{title}</h3>
      <Card
        className={cn(
          "relative group aspect-[2/3] w-full max-w-md mx-auto overflow-hidden shadow-lg",
          isLoading && "bg-muted/30"
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={isOriginal ? beforeImageDefault.imageHint : afterImageDefault.imageHint}
          />
        ) : (
          !isLoading && (
            <div className="flex flex-col h-full items-center justify-center bg-muted/30 p-8 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Your enhanced image will appear here</p>
            </div>
          )
        )}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-8">
            <p className="font-medium text-lg text-primary mb-4">
              Creating your glow-up...
            </p>
            <Progress value={progress} className="w-full max-w-xs" />
            <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
          </div>
        )}
        {isOriginal && imageUrl && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload New Image
            </Button>
          </div>
        )}
        {isEnhanced && !isOriginal && imageUrl && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button variant="secondary" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Image
            </Button>
          </div>
        )}
        {!imageUrl && !isLoading && !isOriginal && <Skeleton className="w-full h-full" />}
      </Card>
    </div>
  );

  return (
    <Card className="w-full mx-auto p-4 sm:p-6 lg:p-8">
      <CardHeader className="text-center px-0 sm:px-6">
        <CardTitle className="text-3xl font-bold tracking-tight md:text-4xl font-headline">
          Glow-Up Studio
        </CardTitle>
        <CardDescription className="max-w-xl mx-auto">
          Upload a photo of your clothing item and let our AI transform it into a
          premium, boutique-quality marketing image.
        </CardDescription>
      </CardHeader>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />

      <div className="mt-8">
        {/* Mobile View */}
        <div className="lg:hidden">
          <Tabs defaultValue="before" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="before">Before</TabsTrigger>
              <TabsTrigger value="after">After</TabsTrigger>
            </TabsList>
            <TabsContent value="before" className="mt-6">
              <ImageCard title="Before" imageUrl={originalImage} isOriginal />
            </TabsContent>
            <TabsContent value="after" className="mt-6">
              <ImageCard
                title="After"
                imageUrl={enhancedImage}
                isLoading={isEnhancing}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <ImageCard title="Before" imageUrl={originalImage} isOriginal />
          <ImageCard
            title="After"
            imageUrl={enhancedImage}
            isLoading={isEnhancing}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <Button
          size="lg"
          className="font-semibold text-lg py-7 px-8 transition-transform duration-200 active:scale-95"
          onClick={handleEnhance}
          disabled={!originalImage || isEnhancing}
        >
          {isEnhancing ? (
            <>
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Wand2 className="mr-3 h-6 w-6" />
              Generate Glow-Up
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Click to start the AI enhancement
        </p>
      </div>
    </Card>
  );
}
