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
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react"

// Define the form schema
const formSchema = z
  .object({
    isUsingSmtp: z.boolean(),
    smtpHost: z.string().optional()
      .refine(value => !value || value.length >= 2, {
        message: "SMTP host must be at least 2 characters"
      }),
    smtpPort: z.string().optional()
      .refine(value => !value || /^\d+$/.test(value), {
        message: "SMTP port must be a number"
      }),
    smtpUsername: z.string().optional()
      .refine(value => !value || value.length >= 2, {
        message: "SMTP username must be at least 2 characters"
      }),
    smtpPassword: z.string().optional()
      .refine(value => !value || value.length >= 4, {
        message: "SMTP password must be at least 4 characters"
      }),
    smtpSecure: z.boolean(),
    fromEmail: z.union([
      z.string().email("Invalid email format"),
      z.string().max(0)
    ]).optional(),
    fromName: z.string().optional()
      .refine(value => !value || value.length >= 2, {
        message: "From name must be at least 2 characters"
      }),
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
  .superRefine((data, ctx) => {
    // Only validate fromEmail if SMTP is enabled and a value is provided
    if (data.isUsingSmtp && data.fromEmail && data.fromEmail.length > 0) {
      try {
        z.string().email().parse(data.fromEmail);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid email format",
          path: ["fromEmail"]
        });
      }
    }
  })

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
        const errorText = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText || "Unknown error"}`)
      }

      const result = await response.json()

      if (!result.status) {
        toast.error(result.message || "Failed to save email settings")
        return
      }

      toast.success(result.message || "Email settings saved successfully!")
      onNext()
    } catch (error) {
      console.error("Error saving email settings:", error)
      toast.error(
        error instanceof Error 
          ? `Error: ${error.message}` 
          : "Failed to save email settings. Please try again."
      )
      
      // If there are validation errors, they will be shown in the form
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          if (err.path) {
            form.setError(err.path.join(".") as any, { 
              type: "manual", 
              message: err.message 
            })
          }
        })
      }
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
                        <Input placeholder="support@yourcompany.com" {...field} value={field.value || ""} />
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
              disabled={isPending}
              className="transition-all duration-200 hover:translate-x-[-2px]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? (
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
  )
}
