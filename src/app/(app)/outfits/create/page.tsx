'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { createOutfit } from '@/lib/outfits';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';

const outfitCreateSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  internalNotes: z.string().optional(),
});

type OutfitCreateFormValues = z.infer<typeof outfitCreateSchema>;

export default function CreateOutfitPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<OutfitCreateFormValues>({
    resolver: zodResolver(outfitCreateSchema),
    defaultValues: {
      title: '',
      internalNotes: '',
    },
  });

  const onSubmit = async (values: OutfitCreateFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'User or Firebase services not available.' });
      return;
    }

    setIsSaving(true);
    try {
        const newOutfitId = await createOutfit(firestore, user, { title: values.title, internalNotes: values.internalNotes || '' });
        toast({ title: 'Outfit Created!', description: `"${values.title}" has been created.` });
        router.push(`/outfits/edit/${newOutfitId}`);
    } catch (error: any) {
      console.error('Failed to create outfit:', error);
      toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="mb-12">
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
          Create New Outfit
        </h1>
        <p className="text-xl text-muted-foreground mt-3 max-w-2xl">
          Give your new look a title and some internal notes to get started. You&apos;ll add items and other details next.
        </p>
      </header>
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-8">
            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Weekend Brunch Look" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="internalNotes"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Internal Notes (Optional)</FormLabel>
                <FormControl>
                    <Textarea placeholder="Private notes about this outfit..." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Create and Edit Outfit
            </Button>
        </form>
    </Form>
    </div>
  );
}
