import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { Check, Image as ImageIcon, LayoutTemplate, Palette, Star, Zap } from 'lucide-react';

const features = [
  {
    icon: ImageIcon,
    title: 'Glow-Up Studio',
    body: 'Turn a single product photo into scroll-stopping marketing images with consistent lighting and style.',
  },
  {
    icon: Palette,
    title: 'Style Templates',
    body: 'Choose clean studio, warm lifestyle, flat lay, modeled looks, and more—then generate on brand.',
  },
  {
    icon: Star,
    title: 'Recent Glow-Ups',
    body: 'Your generated assets are saved so you can reuse, refine, and stay consistent over time.',
  },
  {
    icon: LayoutTemplate,
    title: 'Catalog & Content Management',
    body: 'Keep products organized, track what’s ready, and manage your boutique content from one dashboard.',
  },
  {
    icon: Zap,
    title: 'Shareable Boutique Pages',
    body: 'Publish a clean, public page that highlights your boutique and products for discovery and marketing.',
  },
  {
    icon: Check,
    title: 'Growth-first by design',
    body: 'We prioritize faster creation, a cleaner brand presence, and smoother publishing—because growth is the mission.',
  },
];

const howItWorksSteps = [
  {
    number: '01',
    title: 'Upload a product photo',
    body: 'Start with what you have—phone photos are fine.',
  },
  {
    number: '02',
    title: 'Generate your Glow-Up',
    body: 'Pick a style template and create premium visuals in minutes.',
  },
  {
    number: '03',
    title: 'Publish for discovery',
    body: 'Share your boutique page and visuals anywhere your customers are.',
  },
];

export default function Homepage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto max-w-[1120px] px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl" style={{ fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>
                    Get discovered. Stay on brand. Grow faster.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl" style={{ lineHeight: 1.6 }}>
                    Boutique Curator helps you create polished product visuals, organize your catalog, and publish shareable pages for discovery—so you can focus on customers, not busywork.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="rounded-xl px-8 py-6 text-base">
                    <Link href="/signup">Get started free</Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg" className="rounded-xl px-8 py-6 text-base">
                    <Link href="#features">View features</Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Built for boutique owners who want growth, consistency, and speed.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container mx-auto max-w-[1120px] px-4 md:px-6 space-y-12">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything you need to look premium—and get discovered.</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From AI image generation to boutique-ready organization, we’re building the tools that move you from content to visibility.
                </p>
              </div>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="h-full">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto max-w-[1120px] px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How Boutique Curator works</h2>
            </div>
            <div className="mx-auto grid gap-12 md:grid-cols-3">
              {howItWorksSteps.map((step) => (
                <div key={step.number} className="flex flex-col space-y-4">
                  <h3 className="text-7xl font-bold text-primary/10">{step.number}</h3>
                  <h4 className="text-xl font-bold">{step.title}</h4>
                  <p className="text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container mx-auto max-w-[1120px] px-4 md:px-6">
            <div className="grid items-center justify-center gap-4 text-center">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Ready to elevate your boutique?</h2>
                <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Create your account, generate your first Glow-Up, and start building a brand presence that feels premium.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                <Button asChild size="lg" className="rounded-xl px-8 py-6 text-base">
                  <Link href="/signup">Create my account</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8 py-6 text-base">
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
