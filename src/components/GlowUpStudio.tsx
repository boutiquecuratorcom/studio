"use client";

import Image from "next/image";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Download,
  Loader2,
  Sparkles,
  UploadCloud,
  Wand2,
  Shirt,
  User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

const beforeImageDefault = PlaceHolderImages.find(
  (p) => p.id === "glow-up-before-default"
)!;
const afterImageDefault = PlaceHolderImages.find(
  (p) => p.id === "glow-up-after-default"
)!;

const formSchema = z.object({
  itemType: z.string().min(1, "Please specify the item type (e.g., dress, shirt)."),
  styleName: z.string().optional(),
  sizes: z.string().optional(),
  shadowOption: z.enum(["none", "soft", "hard"]).default("soft"),
});

type FormValues = z.infer<typeof formSchema>;

type Step = "upload" | "selectType" | "fillForm" | "enhancing" | "done";

export function GlowUpStudio() {
  const { toast } = useToast();
  const [originalImage, setOriginalImage] = React.useState<string | null>(
    beforeImageDefault.imageUrl
  );
  const [enhancedImage, setEnhancedImage] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [step, setStep] = React.useState<Step>("upload");
  const [imageType, setImageType] = React.useState<"flat-lay" | "on-body" | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isEnhancing = step === "enhancing";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemType: "",
      styleName: "",
      sizes: "",
      shadowOption: "soft",
    },
  });

  const resetWorkflow = () => {
    setOriginalImage(beforeImageDefault.imageUrl);
    setEnhancedImage(null);
    setImageType(null);
    setStep('upload');
    form.reset();
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
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
        setStep("selectType");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectType = (type: "flat-lay" | "on-body") => {
    setImageType(type);
    setStep("fillForm");
  };

  const handleEnhance = async (values: FormValues) => {
    if (!originalImage || !imageType) return;

    setStep("enhancing");
    setEnhancedImage(null);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.floor(Math.random() * 5) + 2;
      });
    }, 500);

    try {
      const result: EnhanceImageOutput = await enhanceImage({
        imageDataUri: originalImage,
        imageType: imageType,
        ...values,
      });

      clearInterval(interval);

      if (result.enhancedImageDataUri) {
        setProgress(100);
        setEnhancedImage(result.enhancedImageDataUri);
        setStep("done");
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
        description:
          (error instanceof Error ? error.message : "An unknown error occurred") +
          ". Please try again.",
      });
      setStep("fillForm");
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
  }: {
    title: string;
    imageUrl: string | null;
    isOriginal?: boolean;
  }) => (
    <div className="space-y-2">
      <h3 className="text-center font-medium text-muted-foreground">{title}</h3>
      <Card
        className={cn(
          "relative group aspect-square w-full max-w-md mx-auto overflow-hidden shadow-lg",
          isEnhancing && !isOriginal && "bg-muted/30"
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={
              isOriginal
                ? beforeImageDefault.imageHint
                : afterImageDefault.imageHint
            }
          />
        ) : (
          !isEnhancing && !isOriginal && (
            <div className="flex flex-col h-full items-center justify-center bg-muted/30 p-8 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Your enhanced image will appear here
              </p>
            </div>
          )
        )}
        {isEnhancing && !isOriginal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-8">
            <p className="font-medium text-lg text-primary mb-4">
              Creating your glow-up...
            </p>
            <Progress value={progress} className="w-full max-w-xs" />
            <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
          </div>
        )}
        {step !== 'enhancing' && isOriginal && imageUrl && (
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
        {step === 'done' && !isOriginal && imageUrl && (
          <div className="absolute inset-0 bg-black/50 flex flex-col gap-4 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button variant="secondary" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Image
            </Button>
            <Button variant="outline" size="sm" onClick={resetWorkflow}>
              Start New Project
            </Button>
          </div>
        )}
        {!imageUrl && !isEnhancing && !isOriginal && <Skeleton className="w-full h-full" />}
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
          {step === 'upload' && "Upload a photo of your clothing item to get started."}
          {step === 'selectType' && "Great! Now, what kind of image would you like to create?"}
          {step === 'fillForm' && "Perfect. Just a few more details to create the perfect shot."}
          {step === 'enhancing' && "Our AI is working its magic..."}
          {step === 'done' && "Your boutique-ready image is complete!"}
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
              <ImageCard title="After" imageUrl={enhancedImage} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <ImageCard title="Before" imageUrl={originalImage} isOriginal />
          <ImageCard title="After" imageUrl={enhancedImage} />
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center max-w-md mx-auto">
        {step === 'upload' && (
             <Button
             size="lg"
             className="font-semibold text-lg py-7 px-8"
             onClick={() => fileInputRef.current?.click()}
           >
            <UploadCloud className="mr-3 h-6 w-6" />
             Upload Clothing Photo
           </Button>
        )}

        {step === "selectType" && (
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button
              size="lg"
              variant="outline"
              className="w-full h-24 text-lg flex-col"
              onClick={() => handleSelectType("flat-lay")}
            >
              <Shirt className="h-8 w-8 mb-2" />
              Flat Lay
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-24 text-lg flex-col"
              onClick={() => handleSelectType("on-body")}
            >
              <User className="h-8 w-8 mb-2" />
              On-Body Lifestyle
            </Button>
          </div>
        )}

        {step === "fillForm" && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleEnhance)}
              className="space-y-8 w-full"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itemType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Summer Dress" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="styleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., The Riviera" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="sizes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sizes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., S, M, L or 2, 4, 6, 8"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      List the available sizes for this item.
                    </FormDescription>
                  </FormItem>
                )}
              />

              {imageType === "flat-lay" && (
                <FormField
                  control={form.control}
                  name="shadowOption"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Shadow Option</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="soft" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Soft Shadow (Natural)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="hard" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Hard Shadow (Modern)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="none" />
                            </FormControl>
                            <FormLabel className="font-normal">None</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <Separator />

              <div className="flex flex-col items-center">
                <Button
                  type="submit"
                  size="lg"
                  className="font-semibold text-lg py-7 px-8"
                  disabled={!originalImage || isEnhancing}
                >
                  <Wand2 className="mr-3 h-6 w-6" />
                  Generate Glow-Up
                </Button>
                 <p className="text-xs text-muted-foreground mt-3">
                    Click to start the AI enhancement
                </p>
              </div>
            </form>
          </Form>
        )}
        
        {step === 'done' && (
            <Button
                size="lg"
                variant="outline"
                onClick={resetWorkflow}
                className="font-semibold text-lg py-7 px-8"
            >
                Create Another Image
            </Button>
        )}

      </div>
    </Card>
  );
}
