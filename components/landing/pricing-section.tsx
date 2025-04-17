// components/landing/pricing-section.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react'; // Icon for features
import Link from 'next/link';

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'per month',
    description: 'Get started with essential features for small teams.',
    features: [
      '100 Tickets / month',
      '10 Customers',
      '1 Organization',
      '3 Team Members',
      'AI Basic Suggestions',
      'Basic Reporting',
    ],
    cta: 'Get Started Free',
    ctaLink: '/sign-up',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$9,99', // Placeholder price
    period: 'per month',
    description: 'Unlock powerful features for growing support teams.',
    features: [
      '500 Tickets / month',
      '50 Customers',
      '3 Organizations',
      '10 Team Members',
      'Advanced AI Features',
      'Customizable Reports',
      'Priority Support',
    ],
    cta: 'Choose Pro Plan',
    ctaLink: '/sign-up?plan=pro', // Example link structure
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$19,99',
    period: 'per month',
    description: 'Tailored solutions for large organizations with specific needs.',
    features: [
      '2,000+ Tickets / month',
      '200+ Customers',
      '10+ Organizations',
      '50+ Team Members',
      'Dedicated AI Models',
      'Advanced Security & Compliance',
      'Dedicated Account Manager',
      'Custom Integrations',
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact-sales', // Example link structure
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-16 md:py-24 lg:py-32 bg-secondary/30 dark:bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that best fits your team's size and requirements. Start free, upgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card key={plan.name} className={`flex flex-col ${plan.popular ? 'border-primary border-2 relative' : ''}`}>
                {plan.popular && (
                    <div className="absolute top-0 right-4 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full shadow-lg">
                        Most Popular
                    </div>
                )}
              <CardHeader className="items-center text-center">
                <CardTitle className="text-2xl font-semibold">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>}
                </div>
                <CardDescription className="mt-3 min-h-[40px]">{plan.description}</CardDescription> {/* Added min-height */} 
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant={plan.popular ? 'default' : 'outline'} size="lg">
                   <Link href={plan.ctaLink}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
