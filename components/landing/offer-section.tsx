// components/landing/offer-section.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react'; // Icon for features/offer points

const OfferSection = () => {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-secondary/30 dark:bg-secondary/20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ready to Revolutionize Your Support?</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Get access to the complete TicketFast platform, designed to streamline your support operations and enhance customer satisfaction with powerful AI features.
        </p>

        {/* Briefly list key inclusions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10 text-left">
            <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>AI-Powered Ticket Analysis</span>
            </div>
             <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Smart Inbox & Filtering</span>
            </div>
             <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Team Collaboration Tools</span>
            </div>
            <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Response Templates</span>
            </div>
             <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Customer Management</span>
            </div>
             <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Email Integration</span>
            </div>
        </div>

        <p className="text-muted-foreground mb-8">Choose the plan that fits your team's needs – starting with our generous Free tier!</p>

        <Button asChild size="lg">
          <Link href="#pricing">View Plans & Get Started</Link> {/* Link to Pricing Section */}
        </Button>
      </div>
    </section>
  );
};

export default OfferSection;
