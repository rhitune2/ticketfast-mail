// components/landing/problem-section.tsx
import React from 'react';
import { Zap, Users, Clock } from 'lucide-react'; // Icons relevant to problems

const ProblemSection = () => {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-secondary/30 dark:bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
           <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Struggling with Inefficient Support?</h2>
           <p className="text-lg text-muted-foreground">
            Managing customer support tickets can be overwhelming. Disorganized inboxes, slow response times, and inconsistent answers frustrate both your team and your customers.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pain Point 1: Inefficiency */}
          <div className="flex flex-col items-center text-center p-6 rounded-lg">
            <Clock className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Wasted Time</h3>
            <p className="text-muted-foreground">
              Manually sorting, assigning, and answering repetitive queries consumes valuable team hours that could be spent on complex issues.
            </p>
          </div>

          {/* Pain Point 2: Team Collaboration */}
          <div className="flex flex-col items-center text-center p-6 rounded-lg">
            <Users className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Collaboration Bottlenecks</h3>
            <p className="text-muted-foreground">
              Lack of visibility into ticket status and assignments leads to duplicate efforts and delays in resolving customer problems.
            </p>
          </div>

          {/* Pain Point 3: Customer Experience */}
          <div className="flex flex-col items-center text-center p-6 rounded-lg">
            <Zap className="h-12 w-12 mb-4 text-primary" /> {/* Using Zap for impact/frustration */}
            <h3 className="text-xl font-semibold mb-2">Poor Customer Experience</h3>
            <p className="text-muted-foreground">
              Slow, inconsistent, or unresolved support interactions damage customer satisfaction and loyalty.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
