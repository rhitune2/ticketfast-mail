import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import Image from "next/image";
import "../animations.css";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-gradient-to-b from-background to-muted/30">
      {/* Left side - Auth forms */}
      <div className="flex w-full flex-col items-center justify-center p-4 py-12 md:w-1/2 md:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-md space-y-6 auth-form-appear">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent drop-shadow-sm">
              TicketFast
            </h1>
            <p className="text-sm text-muted-foreground">
              Streamline your customer support with AI-powered ticketing
            </p>
          </div>

          <Tabs defaultValue="sign-in" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="sign-in" className="tab-trigger rounded-md transition-all duration-300">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="sign-up" className="tab-trigger rounded-md transition-all duration-300">
                Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sign-in" className="tab-content">
              <SignInForm />
            </TabsContent>
            <TabsContent value="sign-up" className="tab-content">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="hidden bg-muted md:flex md:w-1/2 md:flex-col md:items-center md:justify-center">
        <div className="relative h-full w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background/80 z-10 backdrop-blur-[2px]"></div>
          <Image
            src="/placeholder.svg?height=1080&width=1920"
            alt="Support Dashboard Image"
            width={1920}
            height={1080}
            className="h-full w-full object-cover"
            priority
          />
          <div className="absolute bottom-0 left-0 right-0 z-20 p-8 md:p-12 auth-form-appear">
            <blockquote className="space-y-2 bg-background/80 backdrop-blur-sm p-6 rounded-lg shadow-md border border-border/50">
              <p className="text-lg font-medium">
                "TicketFast has transformed how we handle customer support. The
                AI-powered categorization saves us hours every day."
              </p>
              <footer className="text-sm">
                <strong>John Doe</strong> — Support Manager at Acme Inc.
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
