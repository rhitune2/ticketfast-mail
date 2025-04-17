// components/landing/benefits-section.tsx
import React from 'react';
import { Rocket, Users, Smile, TrendingUp } from 'lucide-react'; // Icons representing benefits

const BenefitsSection = () => {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-secondary/30 dark:bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Unlock Superior Support Performance</h2>
          <p className="text-lg text-muted-foreground">
            TicketFast empowers your team to deliver exceptional customer service while boosting operational efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {/* Benefit 1: Efficiency */}
          <div className="flex flex-col items-center">
            <Rocket className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Boost Efficiency</h3>
            <p className="text-muted-foreground">
              Automate repetitive tasks, find information faster, and resolve tickets quicker with AI assistance and smart organization.
            </p>
          </div>

          {/* Benefit 2: Collaboration */}
          <div className="flex flex-col items-center">
            <Users className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Enhance Teamwork</h3>
            <p className="text-muted-foreground">
              Improve communication and coordination with clear ticket ownership, shared context, and collaborative tools.
            </p>
          </div>

          {/* Benefit 3: Customer Satisfaction */}
          <div className="flex flex-col items-center">
            <Smile className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Improve Satisfaction</h3>
            <p className="text-muted-foreground">
              Deliver faster, more consistent, and personalized support experiences that delight your customers and build loyalty.
            </p>
          </div>

           {/* Benefit 4: Scalability/Growth */}
           <div className="flex flex-col items-center">
            <TrendingUp className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Scale Support Easily</h3>
            <p className="text-muted-foreground">
              Handle growing ticket volumes effectively without proportionally increasing headcount, thanks to AI and automation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
