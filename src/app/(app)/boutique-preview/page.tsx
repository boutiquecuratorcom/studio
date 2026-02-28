'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BoutiquePreviewPage() {
  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
      <header className="mb-12">
        <Button asChild variant="ghost" className="-ml-4">
            <Link href="/my-boutique">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Boutique Setup
            </Link>
        </Button>
        <h1 className="text-4xl lg:text-5xl font-headline font-bold text-foreground tracking-normal mt-4">
          Boutique Preview
        </h1>
        <p className="text-lg text-muted-foreground mt-3 max-w-2xl">
          This is a preview of your public boutique page.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Your live, shareable boutique page will be available here soon. Use the{' '}
            <Link href="/my-boutique" className="underline hover:text-primary">
              My Boutique setup page
            </Link>{' '}
            to configure how it will look.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
