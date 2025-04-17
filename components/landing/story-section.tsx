// components/landing/story-section.tsx
import React from 'react';

const StorySection = () => {
  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">From Chaos to Clarity: The Support Heroes Inc. Story</h2>
          {/* <p className="text-lg text-muted-foreground">
            See how a team just like yours conquered support challenges.
          </p> */}
        </div>

        <div className="max-w-4xl mx-auto text-lg text-muted-foreground space-y-6">
          <p>
            Meet Support Heroes Inc. A dedicated team, but drowning in a sea of emails. Tickets slipped through the cracks, response times lagged, and team morale was low. Assigning tasks was a guessing game, and finding past customer interactions felt like searching for a needle in a haystack.
          </p>
          <blockquote className="border-l-4 border-primary pl-6 italic text-foreground">
            "We were constantly putting out fires, never getting ahead. It felt like we were letting our customers down, despite working incredibly hard."
            <span className="block text-sm text-muted-foreground mt-2">- Sarah Chen, Former Support Manager at Support Heroes Inc.</span>
          </blockquote>
          <p>
            Then they discovered TicketFast. The AI immediately started sorting and suggesting responses, freeing up agents to handle complex issues. The smart inbox brought order to the chaos, and collaboration tools made teamwork seamless. Suddenly, the team wasn't just reacting; they were proactively delighting customers.
          </p>
          <p className="font-medium text-foreground">
            Response times dropped by 40%, customer satisfaction soared, and the team finally felt empowered, not overwhelmed. TicketFast didn't just change their workflow; it changed their entire support culture.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
