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
import { User } from "@/db";
import { Loader2 } from "lucide-react";
import type { Session } from "@/lib/auth";

interface AccountTabProps {
  session: Session;
  userName: string;
  setUserName: (name: string) => void;
  handleAccountSave: () => void;
  isLoading: boolean;
}

export function AccountTab({
  session,
  userName,
  setUserName,
  handleAccountSave,
  isLoading,
}: AccountTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Manage your account settings and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userName">Name</Label>
          <Input
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={session.user.email} disabled />
        </div>
        {/* Optional: Add theme preference later */}
      </CardContent>
      <CardFooter>
        <Button onClick={handleAccountSave} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
