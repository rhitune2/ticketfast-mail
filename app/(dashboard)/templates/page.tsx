import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MailIcon, WrenchIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata : Metadata = {
  title: "TicketFast - Templates",
  description: "Manage your email and response templates",
}

export default async function TemplatesPage() {
  return (
    <div className="container w-full py-10 flex flex-col items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md border-muted shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-muted w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <WrenchIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Under Maintenance</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Template management features are currently being improved
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-2">
          <p className="text-sm text-muted-foreground">
            We're working on enhancing template functionality to provide better email and response templates. 
            This feature will be available soon.  
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-6 pt-2">
          <Link href="/inbox" passHref>
            <Button className="gap-2">
              Go to Inbox
              <MailIcon className="w-4 h-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
