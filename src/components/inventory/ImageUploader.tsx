'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { UploadCloud, Camera } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  existingImageUrl?: string;
}

export function ImageUploader({ onFileSelect, existingImageUrl }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPreview(null);
      onFileSelect(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select an image file.' });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({ variant: 'destructive', title: 'Image Too Large', description: 'Please select an image under 10MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onFileSelect(file);
  };
  
  const triggerFileInput = useCallback(() => {
    if (existingImageUrl) {
      toast({ title: 'Image Locked', description: 'The image for an existing item cannot be changed.' });
      return;
    }
    fileInputRef.current?.click();
  }, [existingImageUrl, toast]);

  return (
    <div className="space-y-2">
      <Card
        onClick={triggerFileInput}
        className={cn(
            "group relative aspect-square w-full overflow-hidden transition-colors",
            !existingImageUrl && "cursor-pointer hover:border-primary",
            preview && "border-primary"
        )}
      >
        {preview ? (
          <Image src={preview} alt="Item preview" fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-muted/50 p-4 text-center">
            <Camera className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Click or tap to upload</p>
            <p className="text-sm text-muted-foreground/80">PNG, JPG, or WEBP up to 10MB</p>
          </div>
        )}
         {!existingImageUrl && preview && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white font-semibold">Click to change image</p>
            </div>
         )}
      </Card>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        disabled={!!existingImageUrl}
      />
      {preview && !existingImageUrl && (
         <Button 
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
                setPreview(null);
                onFileSelect(null);
                if(fileInputRef.current) fileInputRef.current.value = "";
            }}
        >
            Clear Image
        </Button>
      )}
    </div>
  );
}
