// components/landing/faq-section.tsx
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'; // Import Shadcn Accordion

// Define FAQ items
const faqItems = [
  {
    question: 'How does the AI help manage tickets?',
    answer:
      'TicketFast\'s AI analyzes incoming tickets to suggest categorization, priority levels, and relevant response templates. It can also summarize long threads and detect sentiment, helping your team respond faster and more effectively.',
  },
  {
    question: 'What email providers can I integrate with?',
    answer:
      'You can integrate TicketFast with any email provider that supports standard SMTP/IMAP protocols, including Google Workspace, Microsoft 365, and custom email servers. Setup is straightforward via the inbox settings.',
  },
  {
    question: 'Is my customer data secure?',
    answer:
      'Absolutely. We prioritize data security using industry-standard encryption for data at rest and in transit. We adhere to strict privacy policies and offer features like role-based access control to ensure data confidentiality. Refer to our security documentation for more details.',
  },
  {
    question: 'What happens if I exceed my plan limits?',
    answer:
      'If you approach your plan limits (e.g., tickets per month), we\'ll notify you. You can easily upgrade to a higher tier plan at any time to accommodate your growing needs. For Enterprise plans, limits are typically custom.',
  },
  {
    question: 'How easy is it to set up TicketFast?',
    answer:
      'Getting started is simple! Sign up for a free account, connect your support email inbox(es), and invite your team members. Our onboarding guide and support team are available to help you get set up quickly.',
  },
  {
    question: 'Can I customize TicketFast for my specific workflow?',
    answer:
      'Yes, TicketFast offers various customization options, including custom ticket fields, response templates, and workflow rules (depending on the plan). Enterprise plans offer deeper customization possibilities.',
  },
];

const FaqSection = () => {
  return (
    <section id="faq" className="py-16 md:py-24 lg:py-32 bg-secondary/30 dark:bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">
            Have questions? We've got answers. If you don't see your question here, feel free to reach out.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Optional: Link to contact page for further questions */}
        {/* <div className="text-center mt-12"> <p className="text-muted-foreground">Still have questions? <Link href="/contact" className="text-primary hover:underline font-medium">Contact Us</Link></p> </div> */}
      </div>
    </section>
  );
};

export default FaqSection;
