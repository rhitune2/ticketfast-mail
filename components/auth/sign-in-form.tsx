"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { SignInGoogleButton } from "./sign-in-google";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  // rememberMe: z.boolean().optional().default(false)
});

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      // rememberMe: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: "/dashboard",
        // rememberMe: values.rememberMe
      }, {
        onSuccess: () => {
          router.push("/dashboard");
        },
        onError: (ctx: any) => {
          form.setError("root", { 
            type: "manual",
            message: ctx.error.message || "Failed to sign in. Please check your credentials."
          });
        }
      });

      if (error) {
        form.setError("root", { 
          type: "manual",
          message: error.message || "Failed to sign in. Please check your credentials."
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
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">
                      Password
                    </FormLabel>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-primary/80 hover:text-primary hover:underline transition-all duration-200 hover:translate-x-0.5"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      autoComplete="current-password"
                      className="transition-all duration-300 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs animate-in fade-in-50" />
                </FormItem>
              )}
            />

            {/* <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0 form-field mt-1">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors duration-200"
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal text-muted-foreground">
                    Remember me for 30 days
                  </FormLabel>
                </FormItem>
              )}
            /> */}

            <Button
              type="submit"
              className="w-full form-field transition-all duration-300 hover:scale-[1.01] hover:shadow-md mt-4 bg-gradient-to-r from-primary to-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
