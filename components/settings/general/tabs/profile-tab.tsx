"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/db";
import type { Session } from "@/lib/auth"

interface ProfileTabProps {
  session: Session
}

export function ProfileTab({ session }: ProfileTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          View your public profile information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={session.user.image ?? undefined} alt={session.user.name} />
            <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="font-medium">{session.user.name}</p>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
        </div>
        <Separator />
        <div className="space-y-1">
          <p className="text-sm font-medium">Member Since</p>
          <p className="text-sm text-muted-foreground">
            {session.user.createdAt.toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
