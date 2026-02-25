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
  Check,
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
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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

const formSchema = z
  .object({
    creationType: z.enum(["single", "outfit"]),
    itemType: z.string().optional(),
    styleName: z.string().optional(),
    sizes: z.string().optional(),
    outfitDescription: z.string().optional(),
    shadowOption: z.enum(["none", "soft", "hard"]).default("soft"),
  })
  .refine(
    (data) => {
      if (data.creationType === "single") {
        return !!data.itemType && data.itemType.length > 0;
      }
      return true;
    },
    {
      message: "Item type is required for a single item.",
      path: ["itemType"],
    }
  )
  .refine(
    (data) => {
      if (data.creationType === "outfit") {
        return !!data.outfitDescription && data.outfitDescription.length > 0;
      }
      return true;
    },
    {
      message: "Outfit description is required.",
      path: ["outfitDescription"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

type Step =
  | "upload"
  | "selectCreationType"
  | "selectStyleType"
  | "fillForm"
  | "enhancing"
  | "done";

export function GlowUpStudio() {
  const { toast } = useToast();
  const [originalImages, setOriginalImages] = React.useState<string[]>([
    beforeImageDefault.imageUrl,
  ]);
  const [isPlaceholder, setIsPlaceholder] = React.useState(true);
  const [enhancedImage, setEnhancedImage] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [step, setStep] = React.useState<Step>("upload");
  const [creationType, setCreationType] = React.useState<
    "single" | "outfit" | null
  >(null);
  const [styleType, setStyleType] = React.useState<
    "flat-lay" | "on-model" | null
  >(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isEnhancing = step === "enhancing";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  const resetWorkflow = () => {
    setOriginalImages([beforeImageDefault.imageUrl]);
    setEnhancedImage(null);
    setIsPlaceholder(true);
    setCreationType(null);
    setStyleType(null);
    setStep("upload");
    form.reset();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      let hasError = false;
      Array.from(files).forEach((file) => {
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          toast({
            variant: "destructive",
            title: "Image too large",
            description: `"${file.name}" is over 10MB. Please upload smaller images.`,
          });
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
            setOriginalImages((current) => {
              const startImages = isPlaceholder ? [] : current;
              return [...startImages, ...newImageUrls];
            });
            if (isPlaceholder) setIsPlaceholder(false);
            setEnhancedImage(null);
            setCreationType(null);
            setStyleType(null);
            form.reset();
            setStep("selectCreationType");
          }
        };
        reader.readAsDataURL(file);
      };

      Array.from(files).forEach(processFile);
    }
  };

  const handleSelectCreationType = (type: "single" | "outfit") => {
    setCreationType(type);
    form.setValue("creationType", type, { shouldValidate: true });
    setStep("selectStyleType");
  };

  const handleSelectStyleType = (type: "flat-lay" | "on-model") => {
    setStyleType(type);
    setStep("fillForm");
  };

  const handleEnhance = async (values: FormValues) => {
    if (isPlaceholder || !creationType || !styleType) return;

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
      const input: EnhanceImageInput = {
        imageDataUris: originalImages,
        creationType: creationType,
        styleType: styleType,
        ...values,
      };

      const result: EnhanceImageOutput = await enhanceImage(input);
      clearInterval(interval);

      if (result.enhancedImageDataUri) {
        setProgress(100);
        setEnhancedImage(result.enhancedImageDataUri);
        setStep("done");
        let title = "Glow-up complete!";
        if (creationType === 'outfit') title = "Outfit styled!";
        let description = "Your boutique-ready image has been generated.";
        if (styleType === 'flat-lay') description = "Your new flat lay is ready for its close-up.";
        
        toast({ title, description });
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

  const ChoiceButton = ({
    onClick,
    icon,
    label,
    description,
    isSelected,
    disabled,
  }: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    description: string;
    isSelected: boolean;
    disabled?: boolean;
  }) => (
    <Button
      variant="outline"
      size="lg"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-auto w-full text-left justify-start p-4",
        isSelected && "border-primary ring-2 ring-primary"
      )}
    >
      <div className="flex gap-4 items-center">
        <div
          className={cn(
            "h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0",
            isSelected && "bg-primary text-primary-foreground"
          )}
        >
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold">{label}</span>
          <span className="text-sm text-muted-foreground font-normal">
            {description}
          </span>
        </div>
        {isSelected && <Check className="h-5 w-5 ml-auto text-primary" />}
      </div>
    </Button>
  );

  const ImageCard = ({
    title,
    isOriginal = false,
  }: {
    title: string;
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
        {isOriginal && originalImages.length > 0 ? (
          <Carousel className="w-full h-full">
            <CarouselContent>
              {originalImages.map((src, index) => (
                <CarouselItem key={index}>
                  <Image
                    src={src}
                    alt={`${title} ${index + 1}`}
                    fill
                    className="object-cover"
                    data-ai-hint={beforeImageDefault.imageHint}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {originalImages.length > 1 && (
              <>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </>
            )}
          </Carousel>
        ) : !isOriginal && enhancedImage ? (
           <Image
            src={enhancedImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={afterImageDefault.imageHint}
          />
        ) : (
          !isEnhancing &&
          !isOriginal && (
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
        {step !== "enhancing" && isOriginal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              {isPlaceholder ? "Upload Image" : "Upload More"}
            </Button>
          </div>
        )}
        {step === "done" && !isOriginal && enhancedImage && (
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
        {!enhancedImage && !isEnhancing && !isOriginal && <Skeleton className="w-full h-full" />}
      </Card>
    </div>
  );

  const getCardDescription = () => {
    switch (step) {
      case 'upload': return "Upload a photo (or multiple) of your clothing to get started.";
      case 'selectCreationType': return "What are we creating today? Select one to continue.";
      case 'selectStyleType': return "Great. Now, how should it be styled?";
      case 'fillForm': return "Perfect. Just a few more details to create the perfect shot.";
      case 'enhancing': return "Our AI is working its magic...";
      case 'done': return "Your boutique-ready image is complete!";
      default: return "AI-powered image enhancement for your boutique.";
    }
  }

  return (
    <Card className="w-full mx-auto p-4 sm:p-6 lg:p-8">
      <CardHeader className="text-center px-0 sm:px-6">
        <CardTitle className="text-3xl font-bold tracking-tight md:text-4xl font-headline">
          Glow-Up Studio
        </CardTitle>
        <CardDescription className="max-w-xl mx-auto">
          {getCardDescription()}
        </CardDescription>
      </CardHeader>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        multiple
      />

      <div className="mt-8">
        <div className="lg:hidden">
          <Tabs defaultValue="before" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="before">Before</TabsTrigger>
              <TabsTrigger value="after">After</TabsTrigger>
            </TabsList>
            <TabsContent value="before" className="mt-6">
              <ImageCard title="Before" isOriginal />
            </TabsContent>
            <TabsContent value="after" className="mt-6">
              <ImageCard title="After" />
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <ImageCard title="Before" isOriginal />
          <ImageCard title="After" />
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center max-w-lg mx-auto">
        {step === "upload" && (
          <Button
            size="lg"
            className="font-semibold text-lg py-7 px-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="mr-3 h-6 w-6" />
            Upload Clothing Photo(s)
          </Button>
        )}

        {step === "selectCreationType" && (
          <div className="flex flex-col gap-4 w-full">
             <ChoiceButton
              onClick={() => handleSelectCreationType("single")}
              icon={<Shirt className="h-6 w-6" />}
              label="Single Item"
              description="Enhance one main product."
              isSelected={creationType === "single"}
            />
            <ChoiceButton
              onClick={() => handleSelectCreationType("outfit")}
              icon={<Sparkles className="h-6 w-6" />}
              label="Outfit"
              description="Combine multiple items."
              isSelected={creationType === "outfit"}
              disabled={originalImages.length < 2}
            />
          </div>
        )}
        
        {step === "selectStyleType" && (
           <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button
              size="lg"
              variant="outline"
              className="w-full h-24 text-lg flex-col"
              onClick={() => handleSelectStyleType("flat-lay")}
            >
              <Shirt className="h-8 w-8 mb-2" />
              Flat Lay
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-24 text-lg flex-col"
              onClick={() => handleSelectStyleType("on-model")}
            >
              <User className="h-8 w-8 mb-2" />
              On-Model
            </Button>
          </div>
        )}

        {step === "fillForm" && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleEnhance)}
              className="space-y-6 w-full"
            >
              {creationType === "single" && (
                <div className="space-y-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                     <FormField
                      control={form.control}
                      name="sizes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sizes (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="S, M, L" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {creationType === "outfit" && (
                 <FormField
                  control={form.control}
                  name="outfitDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outfit Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the items and how they should be styled. e.g., 'Blue floral dress with the white sneakers and sunglasses.'"
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {styleType === "flat-lay" && (
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
                          className="flex space-x-6"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="soft" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Yes, add a soft shadow
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="none" />
                            </FormControl>
                            <FormLabel className="font-normal">No shadow</FormLabel>
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
                  disabled={isEnhancing || !form.formState.isValid}
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

        {step === "done" && (
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
