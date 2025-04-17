// components/landing/solution-mechanism.tsx
import React from 'react';
import { BrainCircuit, Users, Inbox, FileText } from 'lucide-react'; // Icons for features
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'; // Use Card for structure

const SolutionMechanism = () => {
  return (
    <section id="features" className="py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How TicketFast Transforms Your Support</h2>
          <p className="text-lg text-muted-foreground">
            Our platform combines AI intelligence with intuitive tools to streamline your entire support workflow, from ticket arrival to resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1: AI Power */}
          <Card>
            <CardHeader className="items-center text-center">
              <BrainCircuit className="h-10 w-10 mb-3 text-primary" />
              <CardTitle>AI-Powered Analysis</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription>
                Leverage AI to automatically categorize tickets, suggest relevant responses, and identify ticket sentiment for faster, smarter handling.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Feature 2: Smart Inbox */}
          <Card>
            <CardHeader className="items-center text-center">
              <Inbox className="h-10 w-10 mb-3 text-primary" />
              <CardTitle>Smart Inbox</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription>
                Organize your tickets effortlessly with advanced filtering by status, priority, assignee, and more. Never lose track of a customer query.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Feature 3: Team Collaboration */}
          <Card>
            <CardHeader className="items-center text-center">
              <Users className="h-10 w-10 mb-3 text-primary" />
              <CardTitle>Seamless Collaboration</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription>
                 Assign tickets, track workloads, and collaborate internally on complex issues within a unified platform, ensuring efficient teamwork.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Feature 4: Response Templates */}
          <Card>
            <CardHeader className="items-center text-center">
              <FileText className="h-10 w-10 mb-3 text-primary" />
              <CardTitle>Response Templates</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription>
                Create and utilize pre-defined templates for common questions to ensure consistent messaging and drastically reduce response times.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SolutionMechanism;
