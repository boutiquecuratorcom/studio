
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
  PlusSquare,
} from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, query, doc, updateDoc, getDoc, FirestoreError, setDoc, where, limit, getDocs } from "firebase/firestore";
import { useRouter, useSearchParams } from 'next/navigation';

import {
  enhanceImage,
  type EnhanceImageInput,
  type EnhanceImageOutput,
} from "@/ai/flows/enhance-image-flow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useStorage, useCollection } from "@/firebase";
import { type InventoryItem, type GlowUp, createInventoryItemFromGlowUp } from "@/lib/inventory";
import { resizeImage } from "@/lib/image-utils";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";

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

interface OriginalImage {
  id: string; // Firestore doc ID of the upload.
  url: string; // public downloadURL
  name: string;
  size: number;
}

const flatLayPresets: Record<LookPreset, { label: string; description: string }> = {
  "clean-catalog": { label: "Clean Catalog", description: "Bright, symmetrical, minimal accessories" },
  "styled-boutique": { label: "Styled Boutique", description: "Warm, soft shadows, 1 premium accessory" },
  "facebook-sales-post": { label: "Facebook Sales Post", description: "Dynamic & playful, up to 2 accessories" },
  "luxury-editorial": { label: "Luxury Editorial", description: "Artistic, dramatic lighting, premium feel" },
  'minimal-studio-model': { label: '', description: '' },
  'warm-lifestyle-model': { label: '', description: '' },
  'casual-outdoor-model': { label: '', description: '' },
};

const modeledPresets: Record<LookPreset, { label: string; description: string }> = {
  "minimal-studio-model": { label: "Minimal Studio Model", description: "Clean studio background" },
  "warm-lifestyle-model": { label: "Warm Lifestyle Model", description: "Indoor boutique setting" },
  "casual-outdoor-model": { label: "Casual Outdoor Model", description: "Natural light outdoor look" },
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
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const uploadsCollectionPath = React.useMemo(() => (user ? `users/${user.uid}/uploads` : null), [user]);
  const uploadsQuery = React.useMemo(() => {
    if (uploadsCollectionPath && firestore) {
      return query(collection(firestore, uploadsCollectionPath));
    }
    return null;
  }, [uploadsCollectionPath, firestore]);
  const { data: existingUploads } = useCollection(uploadsQuery, uploadsCollectionPath);


  // --- Main State ---
  const [originalImages, setOriginalImages] = React.useState<OriginalImage[]>([]);
  const [enhancedImage, setEnhancedImage] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [step, setStep] = React.useState<Step>("selectCreationType");
  const [isSaving, setIsSaving] = React.useState(false);
  const [newGlowUpId, setNewGlowUpId] = React.useState<string | null>(null);

  // --- Workflow State ---
  const [creationType, setCreationType] = React.useState<CreationType | null>(null);
  const [styleType, setStyleType] = React.useState<StyleType | null>(null);
  const [lookPreset, setLookPreset] = React.useState<LookPreset | null>(null);
  
  // --- Generation State ---
  const [generationMode, setGenerationMode] = React.useState<GenerationMode>(null);
  const [isInstantGlowUp, setIsInstantGlowUp] = React.useState(false);
  
  // --- Rack Item Integration State ---
  const [source, setSource] = React.useState<string | null>(null);
  const [sourceItem, setSourceItem] = React.useState<InventoryItem | null>(null);
  const [sourceItemLoading, setSourceItemLoading] = React.useState(true);
  const [sourceItemError, setSourceItemError] = React.useState<FirestoreError | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const afterImageContainerRef = React.useRef<HTMLDivElement>(null);
  
  const isEnhancing = step === "enhancing";

  const resetWorkflow = React.useCallback(() => {
    setOriginalImages([]);
    setEnhancedImage(null);
    setCreationType(null);
    setStyleType(null);
    setLookPreset(null);
    setStep("selectCreationType");
    setGenerationMode(null);
    setIsInstantGlowUp(false);
    
    setSource(null);
    setSourceItem(null);
    setSourceItemLoading(true);
    setSourceItemError(null);
    setNewGlowUpId(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    router.replace('/editor');
  }, [router]);

  // --- Effects for Rack Item Integration ---
  React.useEffect(() => {
    const sourceParam = searchParams.get('source');
    const idParam = searchParams.get('id');

    if (sourceParam === 'rackItem' && idParam) {
      setSource(sourceParam);
      setCreationType("single");
      setStep("upload"); // Use 'upload' as an intermediate "loading" state
    } else {
      setSourceItemLoading(false);
    }
  }, [searchParams]);

  React.useEffect(() => {
    const fetchItem = async () => {
      const idParam = searchParams.get('id');
      if (source !== 'rackItem' || !idParam || userLoading || !user || !firestore) {
        return;
      }
  
      setSourceItemLoading(true);
      setSourceItemError(null);
  
      try {
        const decodedId = decodeURIComponent(idParam);
        const itemRef = doc(firestore, 'inventory', decodedId);
        const docSnap = await getDoc(itemRef);
  
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as InventoryItem;
          if (data.ownerId === user?.uid) {
            setSourceItem(data);
            const imageUrl = data.originalImageDetails?.originalUrl || data.image.originalUrl;
            setOriginalImages([{ 
              id: data.id, 
              url: imageUrl, 
              name: data.title,
              size: 0 // Size is not critical here
            }]);
          } else {
            throw new FirestoreError('permission-denied', 'You do not have permission to access this item.');
          }
        } else {
          setSourceItem(null);
          throw new FirestoreError('not-found', 'The requested item does not exist.');
        }
      } catch (e: any) {
        setSourceItemError(e);
        if (e.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: `inventory/${idParam}`,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
      } finally {
        setSourceItemLoading(false);
      }
    };
  
    if (source === 'rackItem' && !userLoading) {
      fetchItem();
    }
  }, [source, searchParams, firestore, user, userLoading]);

  React.useEffect(() => {
    if (source === 'rackItem' && !sourceItemLoading) {
      if (sourceItem) {
        setEnhancedImage(null);
        setStep("selectStyleType");
      } else {
        toast({
          variant: "destructive",
          title: "Failed to load rack item",
          description: sourceItemError?.message || "The selected item could not be found. Please try again.",
        });
        resetWorkflow();
      }
    }
  }, [sourceItem, sourceItemLoading, sourceItemError, source, resetWorkflow, toast]);


  // --- Core Functions ---

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
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
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

    const filesToProcess = Array.from(files);
    
    const filesToUpload: File[] = [];
    const existingImagesToAdd: OriginalImage[] = [];

    for (const file of filesToProcess) {
      const existingImage = existingUploads?.find(upload => upload.originalName === file.name && upload.size === file.size);
      if (existingImage && !originalImages.some(img => img.id === existingImage.id)) {
        existingImagesToAdd.push({
          id: existingImage.id,
          url: existingImage.downloadURL,
          name: existingImage.originalName,
          size: existingImage.size,
        });
        toast({ title: "Image Added From Library", description: `Used "${file.name}" from your uploads.` });
      } else if (!existingImage) {
        filesToUpload.push(file);
      }
    }
    
    let allNewImages: OriginalImage[] = [...existingImagesToAdd];

    if (filesToUpload.length > 0) {
        toast({ title: 'Uploading new image(s)...', description: 'Your new files are being securely saved.' });
        try {
            const uploadedImagesData = await Promise.all(
                filesToUpload.map(async (file) => {
                    const storagePath = `uploads/${user.uid}/${Date.now()}-${file.name}`;
                    const storageRef = ref(storage, storagePath);
                    await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(storageRef);

                    const uploadDocRef = await addDoc(collection(firestore, `users/${user.uid}/uploads`), {
                        uid: user.uid,
                        email: user.email,
                        storagePath,
                        downloadURL,
                        originalName: file.name,
                        contentType: file.type,
                        size: file.size,
                        createdAt: serverTimestamp(),
                        isEnhanced: false,
                    });
                    
                    return {
                      id: uploadDocRef.id,
                      url: downloadURL,
                      name: file.name,
                      size: file.size,
                    };
                })
            );
            allNewImages = [...allNewImages, ...uploadedImagesData];
            toast({ title: 'Upload complete!', description: 'You can now style your new new image(s).' });
        } catch (error: any) {
            console.error("Error handling files:", error);
            toast({ variant: "destructive", title: "Upload failed", description: error.message || "There was an error saving your files. Please try again." });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
    }

    if (allNewImages.length > 0) {
        setOriginalImages(prev => [...prev, ...allNewImages]);
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
    triggerFileInput();
  };
  
  const handleSelectStyleType = (type: StyleType) => {
    setStyleType(type);
    setLookPreset(null);
    setStep('selectLookPreset');
  };
  
  const handleSelectLookPreset = (preset: LookPreset) => {
    setLookPreset(preset);
  };
  
  const saveEnhancedImageAsUpload = async (dataUri: string): Promise<string> => {
    if (!user || !storage || !firestore) throw new Error("User or Firebase services not available.");
  
    try {
      const blob = dataURIToBlob(dataUri);
      const fileName = `glow-up-${Date.now()}.png`;
      const storagePath = `uploads/${user.uid}/${fileName}`;
      const storageRef = ref(storage, storagePath);
  
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
  
      const docRef = await addDoc(collection(firestore, `users/${user.uid}/uploads`), {
        uid: user.uid,
        email: user.email,
        storagePath,
        downloadURL,
        originalName: fileName,
        contentType: blob.type,
        size: blob.size,
        createdAt: serverTimestamp(),
        isEnhanced: true,
      });
      return docRef.id;
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
    if (!creationType || originalImages.length === 0 || !styleType || !lookPreset || !user || !firestore || !storage) return;
  
    setStep('enhancing');
    setEnhancedImage(null);
    setProgress(0);
    setGenerationMode('busy');
    setIsInstantGlowUp(false);
  
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? 95 : prev + Math.floor(Math.random() * 5) + 2));
    }, 500);
  
    try {
      const input: EnhanceImageInput = {
        imageDataUris: originalImages.map(img => img.url),
        creationType,
        styleType,
        lookPreset,
      };
      const result: EnhanceImageOutput = await enhanceImage(input);

      if (result.isFallback) {
        setGenerationMode('instant');
        setIsInstantGlowUp(true);
        const fallbackUrl = originalImages[0].url;
        setEnhancedImage(fallbackUrl);
        localStorage.setItem('lastEnhancedImageURL', fallbackUrl);

        toast({
          title: 'AI Studio is busy',
          description: 'Using Instant Glow-Up for now. You can try again later.',
        });
      } else {
        setGenerationMode('ai');
        setIsInstantGlowUp(false);
        setEnhancedImage(result.enhancedImageDataUri);
        localStorage.setItem('lastEnhancedImageURL', result.enhancedImageDataUri);
        setProgress(98);

        // This is a universal action: every successful enhancement creates a GlowUp record.
        const originalImage = originalImages[0];
        if (!originalImage || !originalImage.id) {
            throw new Error("Could not find the ID of the original source image to create GlowUp record.");
        }

        const glowUpRef = doc(collection(firestore, `users/${user.uid}/glowUps`));
        const blob = dataURIToBlob(result.enhancedImageDataUri);
        const file = new File([blob], `glow-up-${glowUpRef.id}.png`, { type: 'image/png' });
        const thumbResult = await resizeImage(file, 400);

        const storagePath = `glowUps/${user.uid}/${glowUpRef.id}/original.png`;
        const thumbStoragePath = `glowUps/${user.uid}/${glowUpRef.id}/thumb.png`;
        const storageRef_glowup = ref(storage, storagePath);
        const thumbStorageRef_glowup = ref(storage, thumbStoragePath);

        await Promise.all([
            uploadBytes(storageRef_glowup, blob),
            uploadBytes(thumbStorageRef_glowup, thumbResult.blob),
        ]);

        const [outputImageUrl, outputThumbUrl] = await Promise.all([
            getDownloadURL(storageRef_glowup),
            getDownloadURL(thumbStorageRef_glowup),
        ]);

        const isFromRack = source === 'rackItem';
        const inputUrl = isFromRack 
            ? (sourceItem?.originalImageDetails?.originalUrl || sourceItem?.image.originalUrl)
            : originalImage.url;
        
        await setDoc(glowUpRef, {
            sourceType: isFromRack ? 'rackItem' : 'upload',
            sourceId: originalImage.id,
            inputImageUrl: inputUrl,
            outputImageUrl,
            outputThumbUrl,
            storagePath,
            thumbStoragePath,
            stylePreset: `${styleType}/${lookPreset}`,
            status: 'completed',
            createdAt: serverTimestamp(),
            linkedRackItemId: isFromRack ? originalImage.id : null,
        });

        if (!isFromRack) {
          setNewGlowUpId(glowUpRef.id);
        }

        await saveEnhancedImageAsUpload(result.enhancedImageDataUri);
        toast({ title: "Glow-up complete!", description: isFromRack ? "Your new image is ready." : "Your new image has been saved to your library." });
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
  
  const handleReplaceRackImage = async () => {
    if (!enhancedImage || !sourceItem || !user || !firestore || !storage || !styleType || !lookPreset) return;
    
    setIsSaving(true);
    toast({ title: "Updating your rack...", description: "Please wait while we save the new image." });
    
    try {
        const glowUpRef = doc(collection(firestore, `users/${user.uid}/glowUps`));
        
        const blob = dataURIToBlob(enhancedImage);
        const file = new File([blob], `glow-up-${glowUpRef.id}.png`, { type: 'image/png' });
        const thumbResult = await resizeImage(file, 400);

        const storagePath = `glowUps/${user.uid}/${glowUpRef.id}/original.png`;
        const thumbStoragePath = `glowUps/${user.uid}/${glowUpRef.id}/thumb.png`;
        const storageRef_glowup = ref(storage, storagePath);
        const thumbStorageRef_glowup = ref(storage, thumbStoragePath);

        await Promise.all([
            uploadBytes(storageRef_glowup, blob),
            uploadBytes(thumbStorageRef_glowup, thumbResult.blob),
        ]);
        
        const [outputImageUrl, outputThumbUrl] = await Promise.all([
            getDownloadURL(storageRef_glowup),
            getDownloadURL(thumbStorageRef_glowup),
        ]);

        const inputUrl = sourceItem.originalImageDetails?.originalUrl || sourceItem.image.originalUrl;
        await setDoc(glowUpRef, {
            sourceType: 'rackItem',
            sourceId: sourceItem.id,
            inputImageUrl: inputUrl,
            outputImageUrl,
            outputThumbUrl,
            storagePath,
            thumbStoragePath,
            stylePreset: `${styleType}/${lookPreset}`,
            status: 'completed',
            createdAt: serverTimestamp(),
            linkedRackItemId: sourceItem.id
        });
        
        const rackItemRef = doc(firestore, 'inventory', sourceItem.id);
        const rackItemSnap = await getDoc(rackItemRef);
        const currentData = rackItemSnap.data() as InventoryItem;

        const updateData: Partial<InventoryItem> & { updatedAt: any } = {
            image: {
                originalPath: storagePath,
                originalUrl: outputImageUrl,
                thumbPath: thumbStoragePath,
                thumbUrl: outputThumbUrl,
                width: thumbResult.width,
                height: thumbResult.height,
            },
            glowUpId: glowUpRef.id,
            glowedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        if (!currentData.originalImageDetails) {
            updateData.originalImageDetails = currentData.image;
        }

        await updateDoc(rackItemRef, updateData);

        toast({ title: "My Rack Updated!", description: "The new image has been saved." });
        router.push('/inventory');

    } catch (error: any) {
        console.error("Failed to replace rack image:", error);
        toast({ variant: 'destructive', title: "Update Failed", description: error.message });
    } finally {
        setIsSaving(false);
    }
  }

  const handleAddToRack = async () => {
    if (!newGlowUpId || !user || !firestore || !storage) return;

    setIsSaving(true);
    toast({ title: "Adding to My Rack...", description: "Please wait while we create your new inventory item." });
    
    try {
        const glowUpRef = doc(firestore, `users/${user.uid}/glowUps`, newGlowUpId);
        const glowUpSnap = await getDoc(glowUpRef);
        if (!glowUpSnap.exists()) throw new Error("GlowUp record not found.");

        const glowUpData = glowUpSnap.data() as GlowUp;

        const newItemId = await createInventoryItemFromGlowUp(firestore, storage, user, glowUpData, newGlowUpId);

        await updateDoc(glowUpRef, { linkedRackItemId: newItemId });

        toast({ title: "Item Added to My Rack!", description: "You can now edit the details of your new item." });
        router.push('/inventory');

    } catch (error: any) {
        console.error("Failed to add to rack:", error);
        toast({ variant: 'destructive', title: "Failed to Add Item", description: error.message });
    } finally {
        setIsSaving(false);
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

  const handleCreatePost = () => {
    if (enhancedImage) {
      localStorage.setItem('lastEnhancedImageURL', enhancedImage);
      router.push('/post-creator');
    }
  };
  
  // --- Render Functions & Components ---
  
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
    wrapperRef,
  }: {
    title: string;
    wrapperRef?: React.Ref<HTMLDivElement>;
  }) => {
    const displayImage = enhancedImage || (originalImages.length > 0 ? originalImages[0].url : null);

    return (
        <div className="space-y-3" ref={wrapperRef}>
        <h3 className="text-center font-medium text-lg text-muted-foreground">{title}</h3>
        <Card className={cn("relative group aspect-square w-full overflow-hidden shadow-lg", isEnhancing && "bg-muted/30")}>
            {displayImage ? (
            <Image src={displayImage} alt={title} fill className={cn("object-cover transition-transform duration-300 group-hover:scale-105", isInstantGlowUp && "saturate-125 brightness-110 contrast-105")} data-ai-hint="dress mannequin" />
            ) : (
            !isEnhancing && (
                <div className="flex flex-col h-full items-center justify-center bg-muted/50 p-8 text-center">
                <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Your enhanced image will appear here</p>
                </div>
            )
            )}
            {isEnhancing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-8">
                <p className="font-medium text-lg text-primary mb-4">Creating your glow-up...</p>
                <Progress value={progress} className="w-full max-w-xs" />
                <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
            </div>
            )}
            {step === "done" && enhancedImage && (
            <div className="absolute inset-0 bg-black/60 flex flex-col gap-4 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button variant="secondary" onClick={handleDownload}><Download className="mr-2 h-4 w-4" />Download Image</Button>
            </div>
            )}
            {(!displayImage && !isEnhancing) && <Skeleton className="w-full h-full" />}
        </Card>
        </div>
    );
    };

  const getCardDescription = () => {
    switch (step) {
      case 'selectCreationType': return "Select one to begin.";
      case 'upload': 
        if (source === 'rackItem') return "Loading your item...";
        return `Upload up to ${creationType === 'multiple' ? '3 images' : '1 image'}.`;
      case 'selectStyleType': return "How should it be styled?";
      case 'selectLookPreset': return "Pick a look that matches your brand.";
      case 'enhancing': return "Our AI is working its magic...";
      case 'done': return "Your boutique-ready image is complete!";
      default: return "AI-powered image enhancement.";
    }
  }
  
  const currentPresets = styleType === 'flat-lay' ? flatLayPresets : modeledPresets;

  const UploadedImagesPreview = () => {
    if (step === 'selectCreationType' || source === 'rackItem') {
      return null;
    }

    if (originalImages.length === 0) {
      return (
        <div className="mt-8 max-w-4xl mx-auto">
          <Card
            className="flex flex-col h-full items-center justify-center bg-muted/50 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted transition-colors"
            onClick={triggerFileInput}
          >
            <UploadCloud className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">Click to upload your image(s)</p>
            <p className="text-muted-foreground text-sm">
              {creationType === 'multiple' ? 'Up to 3 images, 10MB each' : 'One image, up to 10MB'}
            </p>
          </Card>
        </div>
      );
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
            {originalImages.map((img, i) => (
                <div key={i} className="relative aspect-square group">
                    <Image src={img.url} alt={`upload preview ${i}`} fill className="rounded-md object-cover" />
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
  
    if (step === 'upload' && source === 'rackItem' && sourceItemLoading) {
        return (
            <div className="mt-10 flex flex-col items-center max-w-3xl mx-auto text-center p-8">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-6" />
                <h2 className="text-3xl font-headline font-semibold text-foreground">Loading Your Item</h2>
                <p className="text-muted-foreground mt-2">Please wait while we fetch the details from your rack.</p>
            </div>
        );
    }

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
      
      { originalImages.length > 0 && 
        <div className="mt-8 w-full max-w-lg mx-auto">
            <ImageCard title="After" wrapperRef={afterImageContainerRef} />
        </div>
      }

      <UploadedImagesPreview />
      
      <div className="mt-10 flex flex-col items-center max-w-3xl mx-auto">
        <div className="text-center mb-6">
            <h2 className="text-2xl font-headline font-semibold">{
                source === 'rackItem' && step === 'selectStyleType' ? '1. Select Style Type' :
                source === 'rackItem' && step === 'selectLookPreset' ? '2. Select Look & Feel' :
                step === 'selectCreationType' ? '1. Select Creation Type' :
                step === 'upload' ? '1. Upload Your Image(s)' :
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
                {source === 'rackItem' ? (
                  <>
                    <Button onClick={handleReplaceRackImage} size="lg" className="font-semibold text-lg py-7 px-8 rounded-full" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Save className="mr-3 h-6 w-6" />}
                        Replace Rack Image
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => router.push('/inventory')} className="font-semibold text-lg py-7 px-8 rounded-full">
                        Keep Original
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleAddToRack} size="lg" className="font-semibold text-lg py-7 px-8 rounded-full" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <PlusSquare className="mr-3 h-6 w-6" />}
                        Add to My Rack
                    </Button>
                    {generationMode === 'instant' && (
                      <Button onClick={handleEnhance} size="lg" variant="outline" className="font-semibold text-lg py-7 px-8 rounded-full">
                          <Sparkles className="mr-3 h-6 w-6" />
                          Try AI Studio Again
                      </Button>
                    )}
                  </>
                )}
                
                <Button size="lg" variant="outline" onClick={resetWorkflow} className="font-semibold text-lg py-7 px-8 rounded-full">
                  Create Another
                </Button>
              </div>
            )}
        </div>

        {step === 'upload' && originalImages.length === 0 && source !== 'rackItem' && (
          <div className="text-center text-muted-foreground animate-pulse p-8">
            <p>Waiting for you to select your image(s)...</p>
          </div>
        )}
      </div>
    </Card>
  );
}

    