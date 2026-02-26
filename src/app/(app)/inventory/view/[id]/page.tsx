'use client';

import { useInventoryItem } from '@/lib/inventory';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bot, Cpu, FileText, Palette, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/firebase';

export default function ViewInventoryItemPage() {
  const params = useParams();
  const id = params.id as string;

  const { user, loading: userLoading } = useUser();
  const { item, loading: itemLoading, error } = useInventoryItem(id);

  const loading = itemLoading || userLoading;

  if (loading) {
    return (
      <div className="flex-1 p-8 sm:p-10 lg:p-12">
        <header className="mb-10">
          <Skeleton className="h-12 w-3/5" />
          <Skeleton className="mt-4 h-6 w-2/5" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Skeleton className="aspect-square w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Handle errors, not found, and unauthorized access
  if (error || !item || !user || item.ownerId !== user.uid) {
    let title = "Item Not Found";
    let description = "We couldn't find the inventory item you're looking for.";
    
    if (error) {
        title = "Error Loading Item";
        description = error.message;
    } else if (item && (!user || item.ownerId !== user.uid)) {
        title = "Access Denied";
        description = "You do not have permission to view this item.";
    }

    return (
      <div className="flex-1 p-8 text-center flex flex-col items-center justify-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          {description}
        </p>
        <Button asChild className="mt-6">
          <Link href="/inventory">Back to Inventory</Link>
        </Button>
      </div>
    );
  }

  const AnalysisContent = () => {
    if (!item.analysis || item.analysis.status === 'pending') {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8">
          <Cpu className="h-12 w-12 text-muted-foreground animate-pulse mb-4" />
          <p className="font-semibold">Analysis in progress...</p>
          <p className="text-sm text-muted-foreground">The AI is currently analyzing this item. Check back soon.</p>
        </div>
      );
    }
    if (item.analysis.status === 'failed') {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="font-semibold">Analysis Failed</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            There was an error during analysis. You can try again from the main inventory page.
          </p>
          {item.analysis.error && <p className="text-xs text-destructive/80 mt-2 font-mono">{item.analysis.error}</p>}
        </div>
      );
    }
    // Status is 'complete'
    return (
        <div className="space-y-4 text-sm">
            <DetailItem icon={FileText} label="Visual Description" value={item.analysis.visualDescription} />
            <DetailItem icon={Tag} label="Clothing Type Guess" value={item.analysis.clothingType} />
            <DetailItem icon={Bot} label="Style Vibe" value={item.analysis.styleVibe} />
            <DetailItem icon={Palette} label="Pattern" value={`${item.analysis.patternType} - ${item.analysis.patternDescription}`} />
            
            <div>
              <p className="text-muted-foreground font-medium mb-2 flex items-center gap-2"><Palette className="h-4 w-4" />Dominant Colors</p>
              <div className="flex flex-wrap gap-2">
                  {item.analysis.dominantColors?.map(color => (
                      <div key={color} className="flex items-center gap-2 border rounded-full px-3 py-1 bg-secondary/50">
                          <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
                          <span className="font-mono text-xs">{color}</span>
                      </div>
                  ))}
              </div>
            </div>

            <div>
              <p className="text-muted-foreground font-medium mb-2 flex items-center gap-2"><Tag className="h-4 w-4" />AI Tags</p>
              <div className="flex flex-wrap gap-2">
                  {item.analysis.tags?.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
              </div>
            </div>

             <div className="space-y-2 pt-2">
                <p className="text-muted-foreground font-medium mb-2">Facebook Caption Hooks</p>
                <ul className="list-disc list-inside space-y-1 text-foreground/80">
                    {item.analysis.facebookCaptionHooks?.map((hook, i) => <li key={i}>{hook}</li>)}
                </ul>
            </div>
             <div className="space-y-2 pt-2">
                <p className="text-muted-foreground font-medium mb-2">Instagram Caption Hooks</p>
                 <ul className="list-disc list-inside space-y-1 text-foreground/80">
                    {item.analysis.instagramCaptionHooks?.map((hook, i) => <li key={i}>{hook}</li>)}
                </ul>
            </div>
        </div>
    );
  };
  
  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight break-words">{item.title}</h1>
        <p className="text-lg text-muted-foreground mt-2">{item.type}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="overflow-hidden sticky top-12">
            <div className="relative aspect-square w-full">
              <Image src={item.image.originalUrl} alt={item.title} fill className="object-cover" />
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <DetailItem label="Brand" value={item.brand} />
                <DetailItem label="Sizes Available" value={item.sizes.join(', ')} />
                {item.notes && <DetailItem label="Internal Notes" value={item.notes} isBlock={true} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>Generated by Gemini to help you with marketing and search.</CardDescription>
            </CardHeader>
            <CardContent>
                <AnalysisContent />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search Keywords</CardTitle>
              <CardDescription>These keywords are used for the inventory search feature.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {item.searchKeywords?.map(keyword => (
                  <Badge key={keyword} variant="outline">{keyword}</Badge>
                ))}
                {(!item.searchKeywords || item.searchKeywords.length === 0) && (
                    <p className="text-sm text-muted-foreground">No search keywords have been generated for this item yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon: Icon, isBlock = false }: { label: string; value: React.ReactNode, icon?: React.ElementType, isBlock?: boolean }) {
    const content = (
        <>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {label}
            </p>
            <div className={isBlock ? 'mt-1' : ''}>
                {typeof value === 'string' ? <p className="text-foreground break-words">{value}</p> : value}
            </div>
        </>
    );

    if (isBlock) {
        return <div>{content}</div>;
    }
    
  return (
    <div className="flex justify-between items-start gap-4">
      {content}
    </div>
  );
}
