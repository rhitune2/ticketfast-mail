"use client";

import type React from "react";

import { useEffect, useState } from "react";
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
import { useOnboarding } from "../onboarding-context";
import { ImageUpload } from "../image-upload";
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { Organization, User } from "@/db";

const formSchema = z.object({
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters"),
  organizationLogo: z.any().optional(),
});

type OrganizationFormValues = z.infer<typeof formSchema>;

interface OrganizationStepProps {
  onBack: () => void;
  onNext?: () => void;
  user: User;
  organization: Organization;
}

export function OrganizationStep({
  onBack,
  onNext,
  user,
  organization,
}: OrganizationStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: organization.name || "",
      organizationLogo: organization.logo || null,
    },
  });

  async function onSubmit(values: OrganizationFormValues) {
    try {
      setIsSubmitting(true);

      // Save organization data to API
      const response = await fetch("/api/onboarding/organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationName: values.organizationName,
          organizationLogo: logoUrl, // Send the URL instead of the file name
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save organization settings");
      }

      toast.success("Organization settings saved successfully!");

      if (onNext) {
        onNext();
      } else {
        setIsComplete(true);
      }
    } catch (error) {
      console.error("Error saving organization settings:", error);
      toast.error("Failed to save organization settings. Please try again.");
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
        <h2 className="text-2xl font-bold text-center text-white">
          Setup Complete!
        </h2>
        <p className="text-slate-400 mt-2 text-center max-w-md">
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
          Organization Setup
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {form.getValues("organizationName")
            ? "Review your organization details"
            : "Let's set up your organization profile"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="organizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input placeholder="My Organization" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="organizationLogo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Logo</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    onChange={(file) => {
                      field.onChange(file);
                    }}
                    onUrlChange={(url) => {
                      setLogoUrl(url);
                    }}
                    existingUrl={organization.logo || undefined} // Convert null to undefined
                    userId={user.id}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:shadow-md transition-all duration-200 hover:translate-x-[2px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
