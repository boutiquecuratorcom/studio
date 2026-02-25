import { Sparkles } from 'lucide-react';
import React from 'react';

export function Header() {
  return (
    <header className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Boutique Curator
        </h1>
      </div>
    </header>
  );
}
