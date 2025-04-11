"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, Plus } from "lucide-react";
import type { User } from "@/db";

// Define the form schema using Zod
const inviteFormSchema = z.object({
  email: z.string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  role: z.enum(["admin", "support"], {
    required_error: "Role is required",
    invalid_type_error: "Select a valid role"
  }),
});

// Define the form values type from the schema
type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface InviteStepProps {
  onBack: () => void;
  onNext?: () => void;
  user: User;
}

export function InviteStep({ onBack, onNext, user }: InviteStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [invitations, setInvitations] = useState<{ email: string; role: string }[]>([]);
  
  // "member" | "admin" | "owner";
  // Initialize form
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "support",
    },
  });

  function handleAddInvitation(values: InviteFormValues) {
    // Check if email already exists in the invitation list
    if (invitations.some(invite => invite.email.toLowerCase() === values.email.toLowerCase())) {
      form.setError("email", {
        type: "manual",
        message: `${values.email} has already been invited`
      });
      return;
    }
    
    // Log the invitation data
    console.log("Adding invitation:", values);

    // Add to local state
    setInvitations([...invitations, { email: values.email, role: values.role }]);
    
    // Reset form
    form.reset();
  }

  async function handleCompleteSetup() {
    try {
      setIsSubmitting(true);
      
      // Log the final invitations data
      console.log("Sending invitations to API:", invitations);
      
      // Send invitations to the API
      const response = await fetch("/api/onboarding/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invitations }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to send invitations");
      }
      
      console.log("API response:", data);
      
      if (onNext) {
        onNext();
      } else {
        setIsComplete(true);
      }
    } catch (error) {
      console.error("Error sending invitations:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <div className="rounded-full bg-green-900/30 p-3 mb-4">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-center">
          Setup Complete!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-center max-w-md">
          Your organization has been created successfully. You can now start
          using TicketFast.
        </p>
        <Button className="mt-6" size="lg">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          Invite Team Members
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Invite your colleagues to collaborate with you on TicketFast
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddInvitation)} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full md:w-40">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {/* Display the list of invitations */}
          <div className="border rounded-md">
            {invitations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No team members invited yet
              </div>
            ) : (
              <div className="divide-y">
                {invitations.map((invite, index) => (
                  <div key={index} className="p-4 flex justify-between">
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-sm text-muted-foreground capitalize">{invite.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="transition-all duration-200 hover:translate-x-[-2px]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            onClick={handleCompleteSetup}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing Setup...
              </>
            ) : (
              <>
                Complete Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
