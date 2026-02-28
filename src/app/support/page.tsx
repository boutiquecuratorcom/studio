import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';

export default function SupportPage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1 py-12 md:py-24 lg:py-32">
        <div className="container mx-auto max-w-[1120px] px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Support</h1>
          <p className="mt-4 text-muted-foreground">Coming soon.</p>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
