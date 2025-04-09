"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import type { User } from "@/db"
import { useState } from "react"

// Define the form schema
const formSchema = z
  .object({
    isUsingSmtp: z.boolean(),
    smtpHost: z.string().optional(),
    smtpPort: z.string().optional(),
    smtpUsername: z.string().optional(),
    smtpPassword: z.string().optional(),
    smtpSecure: z.boolean(),
    fromEmail: z.string().optional(),
    fromName: z.string().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.isUsingSmtp) {
        return !!data.smtpHost && !!data.smtpPort && !!data.smtpUsername && !!data.smtpPassword
      }
      return true
    },
    {
      message: "SMTP details are required if SMTP is enabled",
      path: ["smtpHost"],
    },
  )

// Define the form values type from the schema
type EmailFormValues = z.infer<typeof formSchema>

interface EmailStepProps {
  onNext: () => void
  onBack: () => void
  user: User & {
    isUsingSmtp?: boolean
    smtpHost?: string
    smtpPort?: string
    smtpUsername?: string
    smtpPassword?: string
    smtpSecure?: boolean
    fromEmail?: string
    fromName?: string
  }
}

export function EmailStep({ onNext, onBack, user }: EmailStepProps) {
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isUsingSmtp: user?.isUsingSmtp || false,
      smtpHost: user?.smtpHost || "",
      smtpPort: user?.smtpPort || "",
      smtpUsername: user?.smtpUsername || "",
      smtpPassword: user?.smtpPassword || "",
      smtpSecure: user?.smtpSecure !== undefined ? user.smtpSecure : true,
      fromEmail: user?.fromEmail || "",
      fromName: user?.fromName || "",
    },
  })

  const isUsingSmtp = form.watch("isUsingSmtp")
  const [isPending, setIsPending] = useState(false)

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setIsPending(true)
      const response = await fetch("/api/onboarding/email-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to save email settings")
      }

      toast.success("Email settings saved successfully!")
      onNext()
    } catch (error) {
      console.error("Error saving email settings:", error)
      toast.error("Failed to save email settings. Please try again.")
    } finally {
      setIsPending(false)
    }
  })

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          Email Configuration
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Customize how emails are sent from your TicketFast account ( Optional )
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="isUsingSmtp"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Custom Email Configuration</FormLabel>
                  <FormDescription>Would you like to set up a custom email for your company?</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {isUsingSmtp && (
            <div className="space-y-4 rounded-lg border p-6 shadow-inner animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="smtpHost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input placeholder="smtp.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smtpPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Port</FormLabel>
                      <FormControl>
                        <Input placeholder="587" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="smtpUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smtpPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="smtpSecure"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Use Secure Connection (TLS)</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="support@yourcompany.com" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">Leave blank to use system default</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fromName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Company Support" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:shadow-md transition-all duration-200 hover:translate-x-[2px]"
            >
              {isPending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25" cx="12" cy="12"r="10" stroke="currentColor"strokeWidth="4" ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <svg
                    className="ml-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
