// components/landing/landing-header.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const LandingHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-primary">
          TicketFast
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="#pricing" className="text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link href="#faq" className="text-muted-foreground transition-colors hover:text-foreground">
            FAQ
          </Link>
        </nav>

        {/* Sign In Button */}
        <Button asChild variant="outline">
          <Link href="/sign-in">Get Started</Link>
        </Button>

        {/* TODO: Add mobile navigation (e.g., hamburger menu) */}
      </div>
    </header>
  );
};

export default LandingHeader;
