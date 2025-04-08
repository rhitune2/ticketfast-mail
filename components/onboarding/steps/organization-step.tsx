"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useOnboarding } from "../onboarding-context"
import { ImageUpload } from "../image-upload"
import { InvitationList } from "../invitation-list"
import { Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { User } from "@/db"

const formSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  organizationLogo: z.any().optional(),
})

type OrganizationFormValues = z.infer<typeof formSchema>

interface OrganizationStepProps {
  onBack: () => void
  onNext?: () => void
  user: User
}

export function OrganizationStep({ onBack, onNext, user }: OrganizationStepProps) {
  const { data, updateData, addInvitation } = useOnboarding()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: data.organizationName,
      organizationLogo: data.organizationLogo,
    },
  })

  function handleAddInvitation(e: React.FormEvent) {
    e.preventDefault()
    if (inviteEmail) {
      addInvitation(inviteEmail, inviteRole)
      setInviteEmail("")
    }
  }

  async function onSubmit(values: OrganizationFormValues) {
    try {
      updateData(values)
      setIsSubmitting(true)
      
      // Save organization data to API
      const response = await fetch("/api/user/organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationName: values.organizationName,
          organizationLogo: values.organizationLogo ? values.organizationLogo.name : null,
          // We'll handle the actual file upload in a separate function when we implement Supabase
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save organization settings")
      }

      setIsSubmitting(false)
      
      if (onNext) {
        onNext()
      } else {
        setIsComplete(true)
      }
      
      toast.success("Organization settings saved successfully!")
    } catch (error) {
      console.error("Error saving organization settings:", error)
      toast.error("Failed to save organization settings. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <div className="rounded-full bg-green-900/30 p-3 mb-4">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-center text-white">Setup Complete!</h2>
        <p className="text-slate-400 mt-2 text-center max-w-md">
          Your organization has been created successfully. You can now start using TicketFast.
        </p>
        <Button className="mt-6" size="lg">
          Go to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Organization Setup</h2>
        <p className="text-slate-500 mt-1">Set up your organization and invite team members</p>
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
                      // When we implement Supabase, we'll handle the upload here
                    }}
                    userId={user.id}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-medium mb-4 text-white">Invite Team Members</h3>

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
              <Button type="button" onClick={handleAddInvitation}>
                Add
              </Button>
            </div>

            <InvitationList />
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing Setup
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
