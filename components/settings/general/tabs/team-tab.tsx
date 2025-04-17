"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "@/db";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  RefreshCw,
  Info,
  UserPlus,
  Shield,
  X,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";
import { SUBSCRIPTION_QUOTAS } from "@/lib/constants";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Organization as BaseOrganization } from "@/lib/auth";
import { useRouter } from "next/navigation";

// Extend the Organization type to include members and orgSession
interface ExtendedOrganization extends BaseOrganization {
  members: MemberWithUser[];
  orgSession?: {
    userId: string;
  };
}

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

// Define a type for the member including the nested user
type MemberWithUser = {
  userId: string;
  role: string; // Assuming 'role' is a property of the member object
  user: User;
};

interface TeamTabProps {
  organization: ExtendedOrganization; // Using our extended organization type
  isOwner: boolean;
  organizationName: string;
  setOrganizationName: (name: string) => void;
  handleTeamSave: () => void;
  handleSubmitLoading: boolean;
}

export function TeamTab({
  organization,
  isOwner,
  organizationName,
  setOrganizationName,
  handleTeamSave,
  handleSubmitLoading,
}: TeamTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading,setIsLoading] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const maxInvites = SUBSCRIPTION_QUOTAS["free"].organization.memberQuota;

  // We're using the isOwner prop directly from the parent component
  // The parent already handles the logic to determine if the user is an owner or admin

  // Initialize form
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  // Calculate pending invitations (filter only pending status)
  const pendingInvitations = invitations.filter(
    (invite) => invite.status === "pending"
  );

  // Get members safely from organization
  const members = organization?.members || [];

  // Calculate active members (excluding owner and pending invitations)
  const activeMembers = members.filter(
    (member) => member.role !== "owner"
  ).length;

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

  // Update progress whenever invitations or members change
  useEffect(() => {
    // Count only active members (excluding owner)
    const activeMembers = members.filter(
      (member) => member.role !== "owner"
    ).length;
    // Calculate progress based only on active members (not pending invites)
    const percentage = Math.min(100, (activeMembers / maxInvites) * 100);
    setProgress(percentage);
  }, [invitations, members, maxInvites]);

  async function handleAddInvitation(values: InviteFormValues) {
    // Only count active members against the limit
    const activeMembers = members.filter(
      (member) => member.role !== "owner"
    ).length;

    if (activeMembers >= maxInvites) {
      toast.error("Maximum number of members reached", {
        description: `You can have up to ${maxInvites} total team members with your current plan`,
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

      const { data, error } = await authClient.organization.inviteMember({
        email: invitation.email,
        role: invitation.role as "member" | "admin" | "owner",
        resend: true,
      });

      if (error) {
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

  async function handleCancelInvitation(invitationId: string) {
    try {
      setCancelingId(invitationId);

      // Find the invitation to cancel
      const invitation = invitations.find((inv) => inv.id === invitationId);
      if (!invitation) return;

      const { error } = await authClient.organization.cancelInvitation({
        invitationId,
      });

      if (error) {
        toast.error("Failed to cancel invitation", {
          description: error.message || "Please try again later",
        });
        return;
      }

      // Remove the invitation from the list
      const updatedInvitations = invitations.filter((inv) => inv.id !== invitationId);
      setInvitations(updatedInvitations);

      toast.success("Invitation cancelled", {
        description: `The invitation to ${invitation.email} has been cancelled`,
      });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast.error("Failed to cancel invitation", {
        description: "Please try again later",
      });
    } finally {
      setCancelingId(null);
    }
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
      case "owner":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-800 hover:bg-purple-200"
          >
            <Shield className="mr-1 h-3 w-3" /> Owner
          </Badge>
        );
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

  // This calculation is now moved to above

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>
          Manage your organization details and team members.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isOwner ? (
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input
              id="organizationName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium">Organization Name</p>
            <p className="text-sm text-muted-foreground">{organization.name}</p>
          </div>
        )}
        <Separator />

        {/* Invitation quota progress */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Team Members</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>
                      {activeMembers} of {maxInvites}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({activeMembers} active members,{" "}
                      {pendingInvitations.length} pending invites)
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
        </div>

        {/* Invitation form - only show if user is owner or admin */}
        {isOwner && (
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
                    form.formState.isSubmitting || activeMembers >= maxInvites
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
        )}

        {/* Current team members list */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Current Members</h4>
          <div className="space-y-2">
            {members.map((member: MemberWithUser) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {member.user.name
                        ? member.user.name.substring(0, 2).toUpperCase()
                        : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.user.name || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getRoleBadge(member.role)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invitations list */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Pending Invitations</h4>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="py-8 px-4 text-center border rounded-md">
              <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <UserPlus className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium mb-1">
                No pending invitations
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Invite team members to collaborate with you on TicketFast.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {invitations
                .filter((invite) => invite.status === "pending")
                .map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getAvatarFallback(invite.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{invite.email}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          {getRoleBadge(invite.role)}
                          {renderStatusBadge(invite.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-slate-500">
                        Expires {format(invite.expiresAt, "MMM d, yyyy")}
                      </div>
                      {isOwner && (
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() =>
                                    handleResendInvitation(invite.id!)
                                  }
                                  disabled={resendingId === invite.id || cancelingId === invite.id}
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
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() =>
                                    handleCancelInvitation(invite.id!)
                                  }
                                  disabled={cancelingId === invite.id || resendingId === invite.id}
                                >
                                  {cancelingId === invite.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cancel invitation</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </CardContent>
      {isOwner && (
        <CardFooter>
          <Button onClick={handleTeamSave} disabled={handleSubmitLoading}>
            {handleSubmitLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {handleSubmitLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
