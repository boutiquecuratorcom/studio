import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4 py-8 px-4 md:px-6">
        <p className="text-sm text-foreground font-headline font-bold">
          Boutique Curator
        </p>
        <nav className="flex gap-4 sm:gap-6">
          <Link href="/privacy" className="text-sm hover:underline underline-offset-4 text-muted-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm hover:underline underline-offset-4 text-muted-foreground">
            Terms
          </Link>
          <Link href="/support" className="text-sm hover:underline underline-offset-4 text-muted-foreground">
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
