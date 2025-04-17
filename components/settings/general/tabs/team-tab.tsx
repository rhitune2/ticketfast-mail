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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/db";
import type { Session , Organization } from "@/lib/auth"


// Define a type for the member including the nested user
// Use a type alias with intersection for better clarity and correctness
// Define based on expected properties passed down
type MemberWithUser = {
  userId: string;
  role: string; // Assuming 'role' is a property of the member object
  user: User;
}

interface TeamTabProps {
  organization: Organization; // Expect the base organization type
  isOwner: boolean;
  organizationName: string;
  setOrganizationName: (name: string) => void;
  handleTeamSave: () => void;
}

export function TeamTab({ 
  organization, 
  isOwner, 
  organizationName, 
  setOrganizationName, 
  handleTeamSave 
}: TeamTabProps) {

  // TODO: Implement Add Member functionality (likely opens a modal/dialog)
  const handleAddMember = () => {
    console.log("Opening Add Member dialog...");
  };

  // TODO: Implement Edit Member functionality (role change/remove)
  const handleEditMember = (memberId: string) => {
    console.log(`Editing member: ${memberId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>Manage your organization details and team members.</CardDescription>
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
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Team Members</h3>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={handleAddMember}>
                 Add Member
              </Button>
            )}
          </div>
          <div className="mt-4 space-y-4">
           
          </div>
        </div>
      </CardContent>
      {isOwner && (
        <CardFooter>
          <Button onClick={handleTeamSave}>Save Changes</Button>
        </CardFooter>
      )}
    </Card>
  );
}
