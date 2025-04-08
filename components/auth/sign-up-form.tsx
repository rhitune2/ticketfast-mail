"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";
import { SignInGoogleButton } from "@/components/auth/sign-in-google";
import { authClient } from "@/lib/auth-client";

const formSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = form.watch("password");

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    return Math.min(Math.floor((strength / 6) * 100), 100);
  };

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
        callbackURL: "/dashboard"
      }, {
        onRequest: () => {
          // Already handling with isLoading state
        },
        onSuccess: () => {
          router.push("/dashboard");
        },
        onError: (ctx: any) => {
          form.setError("root", { 
            type: "manual",
            message: ctx.error.message || "Failed to sign up. Please try again."
          });
        }
      });

      if (error) {
        form.setError("root", { 
          type: "manual",
          message: error.message || "Failed to sign up. Please try again."
        });
      }
    } catch (error: any) {
      form.setError("root", { 
        type: "manual",
        message: error?.message || "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-4 pt-3 pb-0">
        <div className="grid grid-cols-1 gap-2 mb-3">
          <SignInGoogleButton />
        </div>

        <div className="relative flex items-center mb-2">
          <div className="flex-grow border-t border-border/60"></div>
          <div className="mx-3 text-xs text-muted-foreground">
            or with email
          </div>
          <div className="flex-grow border-t border-border/60"></div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pt-2 pb-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 tab-content"
          >
            {form.formState.errors.root && (
              <div className="p-2 text-sm font-medium text-destructive bg-destructive/10 rounded-md animate-in fade-in-50">
                {form.formState.errors.root.message}
              </div>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="form-field group">
                  <FormLabel className="text-sm font-medium">
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      autoComplete="name"
                      className="transition-all duration-300 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs animate-in fade-in-50" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="form-field group">
                  <FormLabel className="text-sm font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      autoComplete="email"
                      className="transition-all duration-300 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs animate-in fade-in-50" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="form-field group">
                  <FormLabel className="text-sm font-medium">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      autoComplete="new-password"
                      className="transition-all duration-300 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setPasswordStrength(
                          calculatePasswordStrength(e.target.value)
                        );
                      }}
                    />
                  </FormControl>
                  <PasswordStrengthIndicator strength={passwordStrength} />
                  <FormMessage className="text-xs animate-in fade-in-50" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="form-field group">
                  <FormLabel className="text-sm font-medium">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      autoComplete="new-password"
                      className="transition-all duration-300 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs animate-in fade-in-50" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full form-field transition-all duration-300 hover:scale-[1.01] hover:shadow-md mt-4 bg-gradient-to-r from-primary to-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <div className="px-4 pb-4">
        <p className="text-center text-xs text-muted-foreground/80">
          By clicking continue, you agree to our{" "}
          <a
            href="/terms"
            className="text-primary/80 underline underline-offset-4 hover:text-primary transition-colors duration-200"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-primary/80 underline underline-offset-4 hover:text-primary transition-colors duration-200"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </Card>
  );
}
