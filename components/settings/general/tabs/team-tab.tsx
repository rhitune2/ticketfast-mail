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
import { Organization, User, Session } from "@/db";

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
  members: MemberWithUser[]; // Expect members as a separate prop
  session: {
    user: User;
    session: Session;
  };
  isOwner: boolean;
  organizationName: string;
  setOrganizationName: (name: string) => void;
  handleTeamSave: () => void;
}

export function TeamTab({ 
  organization, 
  members, // Receive members separately
  session, 
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
            {members?.map((member) => (
              <div key={member.userId} className="flex items-center justify-between p-3 border rounded-md bg-background">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    {/* Ensure member.user exists before accessing properties */}
                    <AvatarImage src={member.user?.image ?? undefined} alt={member.user?.name ?? 'User'} />
                    <AvatarFallback>{member.user?.name?.charAt(0) ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.user?.name ?? 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground">{member.user?.email ?? 'No email'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs capitalize bg-secondary text-secondary-foreground px-2 py-1 rounded">
                    {member.role.toLowerCase()}
                  </span>
                  {isOwner && member.userId !== session.user.id && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditMember(member.userId)}>
                      {/* Placeholder icon for edit/manage */} 
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {(!members || members.length === 0) && (
                 <p className="text-sm text-muted-foreground text-center py-4">No other team members found.</p>
            )}
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
