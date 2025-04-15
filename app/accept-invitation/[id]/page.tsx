"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface InvitationData {
  id: string;
  email: string;
  inviterName?: string;
  inviterEmail?: string;
  organizationName: string;
  organizationId: string;
  organizationSlug?: string;
  role: string;
  expiresAt: string | Date;
  status: string;
  teamId?: string;
}

const AcceptInvitationPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const [invitationData, setInvitationData] = useState<InvitationData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const { id } = use(params)

  // Fetch invitation data on component mount
  useEffect(() => {
    const fetchInvitationData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await authClient.organization.getInvitation({
          query: { id: id }
        });

        if (error) {
          // Check if error is due to authentication
          if (error.status === 401) {
            // Redirect to sign-in page with redirect URL back to this page
            const redirectUrl = `/sign-up?redirect_url=${encodeURIComponent(
              `/accept-invitation/${id}`
            )}&invitation_id=${id}`;
            router.push(redirectUrl);
            return;
          }
          throw new Error(error.message || "Failed to fetch invitation");
        }

        // Set invitation data if successful
        if (data) {
          setInvitationData(data);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitationData();
  }, [id, router]);

  // Handle the submission of the invitation acceptance
  const handleAcceptInvitation = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Security check: Verify that we have invitation data before proceeding
      if (!invitationData) {
        throw new Error("Invalid invitation data");
      }

      // Use the auth client to accept the invitation
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId: id 
      });

      if (error) {
        // Check if error is due to authentication
        if (error.status === 401) {
          // Redirect to sign-in page with redirect URL back to this page
          const redirectUrl = `/sign-up?redirect_url=${encodeURIComponent(
            `/accept-invitation/${id}`
          )}&invitation_id=${id}`;
          router.push(redirectUrl);
          return;
        }
        throw new Error(error.message || "Failed to accept invitation");
      }

      // Handle successful acceptance
      setSuccess(true);

      // Redirect to the dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Loading invitation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/")} className="w-full">
          Return to Home
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Invitation Accepted!</CardTitle>
              <CardDescription>
                You have successfully joined {invitationData?.organizationName}.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p>Redirecting you to the dashboard...</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Team Invitation</CardTitle>
            <CardDescription>
              You have been invited to join a team on TicketFast
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitationData && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Organization
                  </p>
                  <p className="text-lg font-semibold">
                    {invitationData.organizationName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Role
                  </p>
                  <p className="text-lg font-semibold capitalize">
                    {invitationData.role.toLowerCase()}
                  </p>
                </div>
                {invitationData.inviterName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Invited by
                    </p>
                    <p className="text-lg font-semibold">
                      {invitationData.inviterName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Expires
                  </p>
                  <p className="text-lg font-semibold">
                    {new Date(invitationData.expiresAt).toLocaleDateString()} at{" "}
                    {new Date(invitationData.expiresAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              onClick={handleAcceptInvitation}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              disabled={isSubmitting}
              className="w-full"
            >
              Decline
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default AcceptInvitationPage;
