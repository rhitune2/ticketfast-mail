"use client"

import { useOnboarding } from "@/components/onboarding/onboarding-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"

export function InvitationList() {
  const { data, removeInvitation } = useOnboarding()

  if (data.invitations.length === 0) {
    return (
      <div className="text-center py-4 text-slate-400 text-sm border rounded-md">
        No team members invited yet
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[200px] overflow-y-auto">
      {data.invitations.map((invitation, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 border rounded-md"
        >
          <div className="flex items-center space-x-2">
            <div className="font-medium">{invitation.email}</div>
            <Badge variant="outline" className="capitalize">
              {invitation.role}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => removeInvitation(index)}>
            <Trash2 className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      ))}
    </div>
  )
}
