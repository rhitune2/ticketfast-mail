import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata : Metadata = {
  title : "TicketFast - Help",
  description: "TicketFast - Help Page for customers"
}

export default async function HelpPage() {
  return (
    <div className="container w-full py-10 flex flex-col items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-2xl border-muted shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Need Help?</CardTitle>
          <CardDescription className="text-muted-foreground mt-2 text-lg">
            We're here to support you with TicketFast
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-6">
            <h3 className="text-lg font-semibold mb-2">Contact Support</h3>
            <p className="text-muted-foreground mb-4">
              For technical assistance, feature requests, or any questions about your TicketFast account, 
              please email our support team at:
            </p>
            <div className="flex items-center justify-center">
              <Card className="bg-primary/5 border-none w-full max-w-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-primary h-5 w-5" />
                    <span className="font-medium">help@ticketfa.st</span>
                  </div>
                  <Link href="mailto:help@ticketfa.st">
                    <Button variant="outline" size="sm">
                      Send Email
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Response Time</h3>
              <p className="text-sm text-muted-foreground">
                We typically respond to all support requests within 24 hours during business days.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Business Hours</h3>
              <p className="text-sm text-muted-foreground">
                Monday - Friday: 9:00 AM - 6:00 PM (GMT+3)
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center gap-4 pt-2 pb-6">
          <p className="text-sm text-muted-foreground text-center">
            Please include your account details and any relevant information to help us assist you faster.
          </p>
          <div className="flex gap-4">
            <Link href="/inbox">
              <Button variant="outline" className="gap-2">
                Return to Inbox
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
