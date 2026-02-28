import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="w-full border-t">
      <div className="container mx-auto max-w-[1120px] flex items-center justify-between h-16 px-4 md:px-6">
        <p className="text-xs text-muted-foreground">
          © Boutique Curator. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:gap-6">
          <Link href="/terms" className="text-xs hover:underline underline-offset-4 text-muted-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="text-xs hover:underline underline-offset-4 text-muted-foreground">
            Privacy
          </Link>
          <Link href="/support" className="text-xs hover:underline underline-offset-4 text-muted-foreground">
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
