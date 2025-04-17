"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SaveIcon, CheckCircle } from "lucide-react";
import { submitFeedback } from "@/lib/actions/submit-feedback";
import { toast } from "sonner";

// Feedback form schema for validation
const feedbackFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }).max(100, {
    message: "Title cannot be longer than 100 characters."
  }),
  description: z.string().min(10, {
    message: "Feedback must be at least 10 characters.",
  }).max(1000, {
    message: "Feedback cannot be longer than 1000 characters."
  }),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

export function FeedbackForm({ userId }: { userId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initialize form with react-hook-form
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Handle form submission
  async function onSubmit(data: FeedbackFormValues) {
    setIsSubmitting(true);
    
    try {
      await submitFeedback({
        ...data,
        userId,
      });
      
      setIsSubmitted(true);
      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show success message after submission
  if (isSubmitted) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="mb-4 text-primary">
            <CheckCircle className="h-16 w-16" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Thank You!</h3>
          <p className="text-muted-foreground max-w-md">
            Your feedback has been successfully submitted. We appreciate your input
            and will use it to improve TicketFast.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button variant="outline" onClick={() => setIsSubmitted(false)}>
            Submit Another Feedback
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="pt-6 space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="E.g., Feature Request, Bug Report, Suggestion" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe your feedback in detail..."
                      className="min-h-[150px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="border-t pt-6 pb-6">
            <Button 
              type="submit" 
              className="w-full md:w-auto gap-2"
              disabled={isSubmitting}
            >
              <SaveIcon className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
