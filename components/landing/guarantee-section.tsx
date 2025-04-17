// components/landing/guarantee-section.tsx
import React from 'react';
import { ShieldCheck } from 'lucide-react'; // Icon for guarantee/trust

const GuaranteeSection = () => {
  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center bg-muted p-8 rounded-lg shadow">
          <ShieldCheck className="h-16 w-16 mb-4 text-primary mx-auto" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Try TicketFast Risk-Free</h2>
          <p className="text-lg text-muted-foreground mb-4">
            We're confident you'll love how TicketFast streamlines your support. That's why we offer a
            <span className="font-semibold text-foreground"> 30-day money-back guarantee</span> on all our paid plans (Pro & Enterprise).
          </p>
          <p className="text-sm text-muted-foreground">
            If you're not completely satisfied within the first 30 days, simply contact us for a full refund, no questions asked.
          </p>
          {/* Optional: Link to terms/conditions */}
          {/* <a href="/terms" className="text-sm text-primary hover:underline mt-2 inline-block">Terms apply</a> */}
        </div>
      </div>
    </section>
  );
};

export default GuaranteeSection;
