import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { placeholderImages } from '@/lib/placeholder-images';

export default function Homepage() {
  const p = placeholderImages;

  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                    Get discovered. Stay on brand. Grow beautifully.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl font-body">
                    Boutique Curator transforms everyday product photos into premium marketing visuals, organized collections, and discovery-ready content that helps your brand stand out.
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg" className="px-8 py-6 text-base font-semibold">
                    <Link href="/signup">Create free account</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="px-8 py-6 text-base font-semibold">
                    <Link href="#features">See how it works</Link>
                  </Button>
                </div>
              </div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                 <Image
                    src={p['hero-boutique-rack'].imageUrl}
                    alt={p['hero-boutique-rack'].description}
                    fill
                    className="object-cover"
                    data-ai-hint={p['hero-boutique-rack'].imageHint}
                    priority
                  />
              </div>
            </div>
          </div>
        </section>
        
        {/* Visual Feature Strip */}
        <section id="features" className="w-full py-16 md:py-24 lg:py-32">
          <div className="container mx-auto max-w-7xl px-4 md:px-6 space-y-12">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Everything you need to look premium—and get discovered.</h2>
              </div>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3">
              {[
                { id: 'feature-glow-up', title: 'Glow-Up Studio', body: 'Turn simple product photos into premium marketing visuals.' },
                { id: 'feature-my-rack', title: 'My Rack', body: 'Organize pieces by color, pattern, and vibe for effortless discovery.' },
                { id: 'feature-outfits', title: 'Outfits', body: 'Create curated looks that feel intentional and elevated.' },
              ].map(feature => (
                <div key={feature.id} className="grid gap-4">
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl">
                     <Image
                      src={p[feature.id].imageUrl}
                      alt={p[feature.id].description}
                      fill
                      className="object-cover"
                      data-ai-hint={p[feature.id].imageHint}
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground font-body">{feature.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Designed for Growth Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div className="relative aspect-square lg:aspect-[4/5] w-full overflow-hidden rounded-2xl">
                 <Image
                    src={p['growth-workspace'].imageUrl}
                    alt={p['growth-workspace'].description}
                    fill
                    className="object-cover"
                    data-ai-hint={p['growth-workspace'].imageHint}
                  />
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Designed for sellers who take growth seriously.</h2>
                <p className="max-w-lg text-muted-foreground md:text-xl font-body">Consistency builds trust. Beautiful visuals build confidence. Organization creates momentum. Boutique Curator helps you show up like the brand you're becoming.</p>
                <Button asChild size="lg" className="px-8 py-6 text-base font-semibold">
                  <Link href="/signup">Start building your brand</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-16 md:py-24 lg:py-32">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">How it works</h2>
            </div>
            <div className="mx-auto grid gap-12 md:grid-cols-3">
              {[
                  { id: 'how-it-works-upload', number: '01', title: 'Upload' },
                  { id: 'how-it-works-create', number: '02', title: 'Create' },
                  { id: 'how-it-works-share', number: '03', title: 'Share' },
              ].map(step => (
                <div key={step.number} className="grid gap-4">
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl">
                     <Image
                      src={p[step.id].imageUrl}
                      alt={p[step.id].description}
                      fill
                      className="object-cover"
                      data-ai-hint={p[step.id].imageHint}
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">{step.number} — {step.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Preview Section */}
        <section className="w-full py-16 md:py-24 lg:py-32">
           <div className="container mx-auto max-w-7xl px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Your brand, elevated.</h2>
                <p className="max-w-3xl text-muted-foreground md:text-xl font-body">Every image, every outfit, every detail — aligned with the brand you're building.</p>
              </div>
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-8 border-card shadow-2xl">
                 <Image
                    src={p['platform-preview'].imageUrl}
                    alt={p['platform-preview'].description}
                    fill
                    className="object-cover"
                    data-ai-hint={p['platform-preview'].imageHint}
                  />
              </div>
           </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid items-center justify-center gap-4 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Ready to grow beautifully?</h2>
                <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl font-body">
                  This isn’t just about better images. It’s about showing up like the brand you’re becoming.
                </p>
              </div>
              <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center mt-4">
                <Button asChild size="lg" className="px-8 py-6 text-base font-semibold">
                  <Link href="/signup">Create free account</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 py-6 text-base font-semibold">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
