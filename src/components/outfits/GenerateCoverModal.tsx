'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { type CoverPreferences } from '@/lib/outfits';

interface GenerateCoverModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onGenerate: (prefs: CoverPreferences) => void;
  currentPrefs?: CoverPreferences;
}

const formSchema = z.object({
  preset: z.string().min(1, 'Preset is required.'),
  accessories: z.string().min(1, 'Accessory level is required.'),
  layout: z.string().min(1, 'Layout is required.'),
});

type FormValues = z.infer<typeof formSchema>;

const presets = [
    { value: 'styled-boutique', label: 'Styled Boutique' },
    { value: 'clean-catalog', label: 'Clean Catalog' },
    { value: 'facebook-sales-post', label: 'Facebook Sales Post' },
    { value: 'luxury-editorial', label: 'Luxury Editorial' },
];
const accessories = [
    { value: 'Light', label: 'Light' },
    { value: 'Full', label: 'Full' },
    { value: 'Off', label: 'None' },
];
const layouts = [
    { value: 'Flat-lay', label: 'Organic Flat-lay' },
    { value: 'Grid', label: 'Organized Grid' },
    { value: 'Hero', label: 'Hero Item Focus' },
];

export function GenerateCoverModal({
  isOpen,
  onOpenChange,
  onGenerate,
  currentPrefs,
}: GenerateCoverModalProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      preset: currentPrefs?.preset || 'styled-boutique',
      accessories: currentPrefs?.accessories || 'Light',
      layout: currentPrefs?.layout || 'Flat-lay',
    },
  });
  
  React.useEffect(() => {
    if (currentPrefs) {
      form.reset(currentPrefs);
    }
  }, [currentPrefs, form]);


  const onSubmit = async (values: FormValues) => {
    setIsGenerating(true);
    await onGenerate(values);
    setIsGenerating(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate AI Cover Image</DialogTitle>
          <DialogDescription>
            Choose the style preferences for your new outfit cover image.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="preset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visual Preset</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a preset" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {presets.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accessories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accessory Level</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select accessory level" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accessories.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="layout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Layout Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a layout" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {layouts.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Generate
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
