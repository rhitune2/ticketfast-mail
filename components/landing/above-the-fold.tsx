// components/landing/above-the-fold.tsx
import React from 'react';
import { Button } from '@/components/ui/button'; // Import Shadcn Button
import Link from 'next/link'; // Import Link for CTA

const AboveTheFold = () => {
  return (
    <section className="py-24 md:py-32 lg:py-40 text-center bg-gradient-to-b from-background to-background/80">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-4 leading-tight">
          Streamline Your Support with <span className="text-primary">AI-Powered</span> Ticket Management
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          TicketFast leverages artificial intelligence to help your team efficiently manage, assign, and respond to support tickets, saving time and boosting customer satisfaction.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/sign-up">Get Started for Free</Link>
          </Button>
          {/* Optional: Add a secondary CTA like 'Request a Demo' or 'Learn More' */}
          {/* <Button variant="outline" size="lg">Learn More</Button> */}
        </div>
         {/* Optional: Add a relevant image or graphic here */}
         {/* <div className="mt-12"> <img src="/placeholder-hero.svg" alt="TicketFast Hero Image" className="mx-auto" /> </div> */}
      </div>
    </section>
  );
};

export default AboveTheFold;
