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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOnboarding } from "../onboarding-context";
import { ImageUpload } from "../image-upload";
import { InvitationList } from "../invitation-list";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/db";

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
}

export function OrganizationStep({
  onBack,
  onNext,
  user,
}: OrganizationStepProps) {
  const { data, updateData, addInvitation } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: data.organizationName,
      organizationLogo: data.organizationLogo,
    },
  });

  async function handleAddInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    
    // Check if email is valid
    if (!isValidEmail(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    // Get current invitations from your context
    const currentInvitations = data.invitations || [];
    
    // Check if email already exists in the invitation list
    if (currentInvitations.some(invite => invite.email.toLowerCase() === inviteEmail.toLowerCase())) {
      toast.error(`${inviteEmail} has already been invited`);
      return;
    }
    
    setIsInviting(true);
    try {
      addInvitation(inviteEmail, inviteRole);
      setInviteEmail("");
      toast.success(`Invitation added for ${inviteEmail}`);
    } catch (error) {
      toast.error("Failed to add invitation");
    } finally {
      setIsInviting(false);
    }
  }
  
  // Helper function to validate email format
  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  async function onSubmit(values: OrganizationFormValues) {
    try {
      updateData({
        ...values,
        organizationLogoUrl: logoUrl // Store the URL in your context if needed
      })
      setIsSubmitting(true)
  
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
      })
  
      if (!response.ok) {
        throw new Error("Failed to save organization settings")
      }
  
      toast.success("Organization settings saved successfully!")
  
      if (onNext) {
        onNext()
      } else {
        setIsComplete(true)
      }
    } catch (error) {
      console.error("Error saving organization settings:", error)
      toast.error("Failed to save organization settings. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // In your OrganizationStep component
useEffect(() => {
  async function fetchOrganization() {
    try {
      const response = await fetch('/api/onboarding/organization')
      const data = await response.json()
      
      if (data.organization) {
        form.reset({
          organizationName: data.organization.name,
          organizationLogo: null // We can't set the File object, only the URL
        })
        
        // Set the logo URL in state and context
        setLogoUrl(data.organization.logo) 
        updateData({ 
          organizationName: data.organization.name,
          organizationLogoUrl: data.organization.logo 
        })
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }
  
  fetchOrganization()
}, [])
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
          Set up your organization and invite team members
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
            field.onChange(file)
            updateData({ organizationLogo: file })
          }}
          onUrlChange={(url) => {
            setLogoUrl(url)
            updateData({ organizationLogoUrl: url })
          }}
          existingUrl={data.organizationLogoUrl || undefined} // Convert null to undefined
          userId={user.id}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-medium mb-4">Invite Team Members</h3>

            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="w-full md:w-40">
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={handleAddInvitation}
                disabled={isInviting || !inviteEmail}
              >
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add"
                )}
              </Button>
            </div>

            <InvitationList />
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="transition-all duration-200 hover:translate-x-[-2px]"
            >
              <svg
                className="mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:shadow-md transition-all duration-200 hover:translate-x-[2px]"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Completing Setup...
                </>
              ) : (
                <>
                  Complete Setup
                  <svg
                    className="ml-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
