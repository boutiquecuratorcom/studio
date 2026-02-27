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
import { createOutfit, updateOutfit, type Outfit } from '@/lib/outfits';
import { useUser, useFirestore } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const outfitFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  notes: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
});

type OutfitFormValues = z.infer<typeof outfitFormSchema>;

type OutfitFormProps = {
  mode: 'create' | 'update';
  outfit?: Outfit;
  onSave: (outfitId: string) => void;
};

export function OutfitForm({ mode, outfit, onSave }: OutfitFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<OutfitFormValues>({
    resolver: zodResolver(outfitFormSchema),
    defaultValues: {
      title: outfit?.title || '',
      notes: outfit?.notes || '',
      status: outfit?.status || 'draft',
    },
  });

  const onSubmit = async (values: OutfitFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'User or Firebase services not available.' });
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'create') {
        const newOutfitId = await createOutfit(firestore, user, { title: values.title, notes: values.notes || '' });
        toast({ title: 'Outfit Created!', description: `"${values.title}" has been created.` });
        onSave(newOutfitId);
      } else {
        if (!outfit) throw new Error('Outfit not found for update.');
        await updateOutfit(firestore, outfit.id, { title: values.title, notes: values.notes, status: values.status });
        toast({ title: 'Outfit Updated!', description: `"${values.title}" has been saved.` });
        onSave(outfit.id);
      }
    } catch (error: any) {
      console.error('Failed to save outfit:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Notes about this outfit, styling ideas, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {mode === 'update' && (
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}
        <Button type="submit" size="lg" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          {mode === 'create' ? 'Create Outfit' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
}
