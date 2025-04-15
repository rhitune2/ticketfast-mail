"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Info,
  UserPlus,
  Shield,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { User } from "@/db";
import { authClient } from "@/lib/auth-client";
import { SUBSCRIPTION_QUOTAS } from "@/lib/constants";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

// Define the form schema using Zod
const inviteFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  role: z.enum(["member", "admin"], {
    required_error: "Role is required",
    invalid_type_error: "Select a valid role",
  }),
});

// Define the form values type from the schema
type InviteFormValues = z.infer<typeof inviteFormSchema>;

// Define invitation status types
type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

// Define invitation interface with status and timestamp
interface Invitation {
  email: string;
  role: string;
  status: InvitationStatus;
  expiresAt: Date;
  id?: string;
}

interface InviteStepProps {
  onBack: () => void;
  onNext?: () => void;
  user: User;
}

export function InviteStep({ onBack, onNext, user }: InviteStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const maxInvites = SUBSCRIPTION_QUOTAS["FREE"].organization.memberQuota;
  const router = useRouter()
  // Initialize form
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  // Fetch existing invitations on component mount
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setIsLoading(true);

        const response = await authClient.organization.listInvitations();

        if ("data" in response && Array.isArray(response.data)) {
          console.log("Invitations data:", response.data);
          setInvitations(response.data);

          // Calculate progress based on the number of invitations
          const percentage = Math.min(
            100,
            (response.data.length / maxInvites) * 100
          );
          setProgress(percentage);
        } else {
          console.log("No invitations found or invalid response format");
          setInvitations([]);
          setProgress(0);
        }
      } catch (error) {
        console.error("Error fetching invitations:", error);
        toast.error("Failed to load invitations");
        setInvitations([]);
        setProgress(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitations();
  }, [maxInvites]);

  // Update progress whenever invitations change
  useEffect(() => {
    const percentage = Math.min(100, (invitations.length / maxInvites) * 100);
    setProgress(percentage);
  }, [invitations, maxInvites]);

  async function handleAddInvitation(values: InviteFormValues) {
    if (invitations.length >= maxInvites) {
      toast.error("Maximum number of members reached", {
        description: `You can invite up to ${maxInvites} members with your current plan`,
      });
      return;
    }

    if (
      invitations.some(
        (invite) => invite.email.toLowerCase() === values.email.toLowerCase()
      )
    ) {
      form.setError("email", {
        type: "manual",
        message: `${values.email} has already been invited`,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Call the API to send the invitation
      const { data, error } = await authClient.organization.inviteMember({
        email: values.email,
        role: values.role,
      });

      if (error) {
        toast.error("Failed to send invitation", {
          description: error.message || "Please try again later",
        });
        return;
      }

      // Create a new invitation with pending status
      const newInvitation: Invitation = {
        id: data?.id || `invite-${Date.now()}`, // Use actual ID from API or generate a temporary one
        email: values.email,
        role: values.role,
        status: "pending",
        expiresAt: data.expiresAt,
      };

      // Add the new invitation to the list
      setInvitations([newInvitation, ...invitations]);

      // Show success message
      toast.success("Invitation sent", {
        description: `An invitation has been sent to ${values.email}`,
      });

      // Reset the form
      form.reset();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to invite member", {
        description: "Please check the email address and try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendInvitation(invitationId: string) {
    try {
      setResendingId(invitationId);

      // Find the invitation to resend
      const invitation = invitations.find((inv) => inv.id === invitationId);
      if (!invitation) return;

      const { data , error } = await authClient.organization.inviteMember({
        email: invitation.email,
        role: invitation.role as "member" | "admin" | "owner",
        resend: true,
      });

      if(error){
        toast.error("Failed to resend invitation", {
          description: error.message || "Please try again later",
        });
        return;
      }

      const updatedInvitations = invitations.map((inv) =>
        inv.id === invitationId ? { ...inv, invitedAt: new Date() } : inv
      );

      setInvitations(updatedInvitations);

      toast.success("Invitation resent", {
        description: `A new invitation has been sent to ${invitation.email}`,
      });
      
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to resend invitation", {
        description: "Please try again later",
      });
    } finally {
      setResendingId(null);
    }
  }

  async function handleCompleteSetup() {
    try {
      setIsSubmitting(true);

      const { data, error } = await authClient.updateUser({
        isCompletedOnboarding: true,
      });

      if (error) {
        toast.error("Failed to complete setup", {
          description: error.message,
        });
        return;
      }

      toast.success("Setup complete", {
        description: "Your organization has been created successfully and team invitations have been sent.",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);

      if (onNext) {
        onNext();
      } else {
        setIsComplete(true);
      }
    } catch (error) {
      console.error("Error completing setup:", error);
      toast.error("Failed to complete setup", {
        description: "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <div className="rounded-full bg-gradient-to-br from-green-500/20 to-green-600/30 p-4 mb-6 shadow-inner">
          <CheckCircle2 className="h-14 w-14 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-600">
          Setup Complete!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-3 text-center max-w-md leading-relaxed">
          Your organization has been created successfully and team invitations
          have been sent. You can now start using TicketFast to manage your
          customer support tickets.
        </p>
        <Button
          className="mt-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md transition-all duration-200"
          size="lg"
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // Helper function to render status badge
  const renderStatusBadge = (status: InvitationStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="mr-1 h-3 w-3" /> Accepted
          </Badge>
        );
      case "declined":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <X className="mr-1 h-3 w-3" /> Declined
          </Badge>
        );
      case "expired":
        return (
          <Badge
            variant="outline"
            className="bg-slate-100 text-slate-700 border-slate-200"
          >
            <AlertCircle className="mr-1 h-3 w-3" /> Expired
          </Badge>
        );
      default:
        return null;
    }
  };

  // Helper function to get avatar fallback text
  const getAvatarFallback = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  // Helper function to get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-800 hover:bg-purple-200"
          >
            <Shield className="mr-1 h-3 w-3" /> Admin
          </Badge>
        );
      case "member":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            <UserPlus className="mr-1 h-3 w-3" /> Member
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          Invite Team Members
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Invite your colleagues to collaborate with you on TicketFast
        </p>
      </div>

      {/* Invitation quota progress */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">
              Team Invitations
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>
                      {invitations.length} of {maxInvites}
                    </span>
                    <Info className="ml-1 h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum number of invitations for your current plan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Progress value={progress} className="h-2 mt-2" />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddInvitation)}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Email address"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-full sm:w-40">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    form.formState.isSubmitting ||
                    invitations.length >= maxInvites
                  }
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-200"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Invite
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Invitations list */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Pending Invitations
          </CardTitle>
          <CardDescription>
            Track the status of your team invitations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <UserPlus className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium  mb-1">
                No team members invited yet
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Start inviting team members to collaborate with you on
                TicketFast.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {invitations.map((invite) => (
                <div
                  key={invite.id}
                  className="p-4 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getAvatarFallback(invite.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        {getRoleBadge(invite.role)}
                        {renderStatusBadge(invite.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-slate-500">
                      Expires {format(invite.expiresAt, "MMM d, yyyy")}
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleResendInvitation(invite.id!)}
                            disabled={resendingId === invite.id}
                          >
                            {resendingId === invite.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Resend invitation</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="transition-all duration-200 hover:translate-x-[-2px]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={handleCompleteSetup}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing Setup...
            </>
          ) : (
            <>
              Complete Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
