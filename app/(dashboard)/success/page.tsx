import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import React from "react";

const SuccessPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-2xl font-semibold mb-2">Payment Successful!</h1>
      <p className="text-muted-foreground mb-6">
        Your payment has been processed successfully. You can now access your support tickets.
      </p>
      <Button asChild>
        <Link href="/inbox">Go to Inbox</Link>
      </Button>
    </div>
  );
};

export default SuccessPage;