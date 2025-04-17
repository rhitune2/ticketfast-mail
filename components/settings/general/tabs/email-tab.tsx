"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SmtpSettings } from "@/db"; // Assuming SmtpSettings type is exported from db
import { testSmtpConnection, updateSmtpSettings } from "@/lib/actions/settings"; // Actions to be created
import { Organization } from "@/lib/auth";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Import Card components

// Define the Zod schema based on db-schema.ts
const emailSettingsSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().int().positive("Port must be a positive integer"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  // secure: z.boolean().default(true),
  fromEmail: z.string().email("Invalid email address"),
  fromName: z.string().optional(),
  isUsingSmtp: z.boolean().default(false), // Add isUsingSmtp
});

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;

interface EmailTabProps {
  initialData: SmtpSettings | null;
  organizationId: string;
  isOwner: boolean;
}

export function EmailTab({
  initialData,
  organizationId,
  isOwner,
}: EmailTabProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed from isSaving for clarity

  const form = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      host: initialData?.host || "",
      port: initialData?.port || 587,
      username: initialData?.username || "",
      password: initialData?.password || "", // Consider masking or not pre-filling
      // secure: true,
      fromEmail: initialData?.fromEmail || "",
      fromName: initialData?.fromName || "",
      isUsingSmtp: initialData?.isUsingSmtp ?? false, // Set default for isUsingSmtp
    },
    disabled: !isOwner, // Disable form if not owner/admin
  });

  const onSubmit = async (values: EmailSettingsFormValues) => {
    if (!isOwner) {
      toast.error("You do not have permission to save email settings.", {
        description: "Only the owner or admin can save email settings.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateSmtpSettings({ ...values, organizationId });
      toast.success("Email settings saved successfully");
      // Optionally refresh data or router
    } catch (error) {
      console.error("Failed to save email settings:", error);
      toast.error("Failed to save email settings", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!isOwner) return;
    const values = form.getValues();
    const result = emailSettingsSchema.safeParse(values);

    if (!result.success) {
      toast.error("Please fix the errors in the form before testing.");
      // Optionally trigger form validation display
      form.trigger();
      return;
    }

    setIsTesting(true);
    try {
      const { success, message } = await testSmtpConnection(result.data);
      if (success) {
        toast.success("SMTP Connection Successful", {
          description: message || "Successfully connected to the SMTP server.",
        });
      } else {
        toast.error("SMTP Connection Failed", {
          description:
            message ||
            "Could not connect to the SMTP server. Check your settings.",
        });
      }
    } catch (error) {
      console.error("Failed to test SMTP connection:", error);
      toast.error("Failed to test SMTP connection", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Server (SMTP)</CardTitle>
        <CardDescription>
          Configure your outgoing email server settings for sending tickets and
          notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id="email-settings-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="isUsingSmtp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!isOwner} // Disable if not owner/admin
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Use Custom SMTP Server</FormLabel>
                    <FormDescription>
                      Enable this to use your own SMTP server instead of the
                      default email provider.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("isUsingSmtp") && (
              <div className="space-y-4 p-4 border rounded-md relative">
                {/* Overlay to disable fields if not owner */}
                {!isOwner && (
                  <div className="absolute inset-0 bg-gray-100 bg-opacity-50 z-10 cursor-not-allowed"></div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-0">
                  <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Host</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="smtp.example.com"
                            {...field}
                            disabled={!isOwner}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="587"
                            {...field}
                            disabled={!isOwner}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="your-email@example.com"
                            {...field}
                            disabled={!isOwner}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            disabled={!isOwner}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave blank to keep the current password.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="support@example.com"
                            {...field}
                            disabled={!isOwner}
                          />
                        </FormControl>
                        <FormDescription>
                          The email address emails will be sent from.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Example Support Team"
                            {...field}
                            disabled={!isOwner}
                          />
                        </FormControl>
                        <FormDescription>
                          The name associated with the 'From Email'.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* <FormField
                    control={form.control}
                    name="secure"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm col-span-1 md:col-span-2">
                        <div className="space-y-0.5">
                          <FormLabel>Use SSL/TLS (Secure)</FormLabel>
                          <FormDescription>
                            Enable for secure connections (recommended, usually
                            port 465).
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isOwner}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  /> */}
                </div>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        {/* Test Connection Button - Show only if SMTP is enabled */}
        {form.watch("isUsingSmtp") && (
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting || isSubmitting || !isOwner}
          >
            {isTesting ? "Testing..." : "Test Connection"}
          </Button>
        )}
        {/* Save Button */}
        <Button
          type="submit"
          form="email-settings-form"
          disabled={isSubmitting || isTesting || !isOwner}
        >
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
}
