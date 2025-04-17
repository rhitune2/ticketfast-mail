// components/landing/qualification-section.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react'; // For ratings, optional

// Placeholder testimonials - replace with real ones
const testimonials = [
  {
    quote: "TicketFast revolutionized our support workflow. The AI suggestions are incredibly accurate and save us hours every week!",
    name: "Alice Johnson",
    title: "Support Lead",
    company: "TechCorp",
    avatar: "/avatars/01.png", // Placeholder path
  },
  {
    quote: "We saw a 30% decrease in response times after implementing TicketFast. Our customers are happier, and our team is less stressed.",
    name: "Bob Williams",
    title: "Operations Manager",
    company: "Innovate Solutions",
    avatar: "/avatars/02.png", // Placeholder path
  },
  {
    quote: "The collaboration features are fantastic. It's so much easier to assign tickets and track progress across the team.",
    name: "Charlie Brown",
    title: "Customer Success Agent",
    company: "ServicePro",
    avatar: "/avatars/03.png", // Placeholder path
  },
];

const QualificationSection = () => {
  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Trusted by Teams Like Yours</h2>
          <p className="text-lg text-muted-foreground">
            Hear directly from businesses that transformed their customer support with TicketFast.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="flex flex-col justify-between">
              <CardContent className="pt-6">
                {/* Optional: Rating Stars */}
                {/* <div className="flex mb-2">{[...Array(5)].map((_, i) => (<Star key={i} className="h-5 w-5 fill-primary text-primary" />))}</div> */}
                <p className="text-muted-foreground italic mb-4">"{testimonial.quote}"</p>
              </CardContent>
              <div className="flex items-center gap-4 p-4 pt-0 border-t bg-muted/30 rounded-b-lg">
                <Avatar>
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.title}, {testimonial.company}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Optional: Add other qualification elements like Awards, Certifications, Case Study links */}
        {/* <div className="mt-16 text-center"> <p className="text-muted-foreground">Featured in...</p> <div className="flex justify-center gap-8 items-center mt-4"> [Logos] </div> </div> */}
      </div>
    </section>
  );
};

export default QualificationSection;
