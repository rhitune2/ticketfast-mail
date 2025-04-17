"use client"

import * as React from "react"
import {
  BarChart2,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Package,
  Settings,
  Users,
  Ticket,
  Tag,
  HelpCircle,
  Command,
  Send,
  ChevronsUpDown,
  LayoutTemplate
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Define interfaces for our data types
interface User {
  name: string;
  email: string;
  image?: string;
  id: string;
}

interface Organization {
  name: string;
  slug: string;
  logo?: string;
  id: string;
}

interface SessionData {
  session: {
    user: User;
    currentOrganization: Organization;
  }
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session?: any;
  organization?: any;
}

export function AppSidebar({ 
  session, 
  organization,
  ...props 
}: AppSidebarProps) {
  const router = useRouter();
  const { data: organizations = [] } = authClient.useListOrganizations();
  
  // Use session and organization data or fall back to default values
  const user = session?.user || { name: "User", email: "user@example.com" };
  const org = organization || { name: "Organization", slug: "org" };
  
  // Dynamic navigation items based on the user's session
  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Tickets",
      url: "/inbox",
      icon: Ticket,
      items: [
        {
          title: "All Tickets",
          url: "/inbox",
        },
        {
          title: "My Tickets",
          url: "/inbox/my",
        },
        {
          title: "Unassigned",
          url: "/inbox/unassigned",
        },
      ],
    },
    {
      title: "Templates",
      url: "/templates",
      icon: LayoutTemplate,
      items: [
        {
          title: "Response Templates",
          url: "/templates/responses",
        },
        {
          title: "Email Templates",
          url: "/templates/emails",
        },
        {
          title: "Ticket Templates",
          url: "/templates/tickets",
        },
      ],
    },
    {
      title: "Team",
      url: "/team",
      icon: Users,
      items: [
        {
          title: "Members",
          url: "/team/members",
        },
        {
          title: "Roles",
          url: "/team/roles",
        },
      ],
    },
    {
      title: "Labels",
      url: "/labels",
      icon: Tag,
      items: [],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
        {
          title: "Team",
          url: "/settings/team",
        },
        {
          title: "Billing",
          url: "/settings/billing",
        },
        {
          title: "API",
          url: "/settings/api",
        },
      ],
    },
  ];

  const navSecondary = [
    {
      title: "Help",
      url: "/help",
      icon: HelpCircle,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: Send,
    },
  ];

  // Prepare user data for the NavUser component
  const userData = {
    name: user.name,
    email: user.email,
    avatar: user.image || "",
    // Add first letter of name as a fallback for avatar
    firstLetter: user.name?.charAt(0)?.toUpperCase() || "U",
    hasAvatar: !!user.image
  };

  return (
    <Sidebar
      className=""
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    {org.logo ? (
                      <img 
                        src={org.logo} 
                        alt={org.name} 
                        className="size-full rounded-lg object-cover" 
                      />
                    ) : (
                      <span className="text-xs font-semibold uppercase">
                        {org.name?.[0] || 'O'}
                      </span>
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{org.name}</span>
                    <span className="truncate text-xs">{org.slug}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                align="start"
                sideOffset={4}
              >
                {organizations && organizations.map((item: any) => (
                  <DropdownMenuItem 
                    key={item.id}
                    onSelect={async () => {
                      if (item.id !== org.id) {
                        await authClient.organization.setActive({
                          organizationId: item.id
                        })
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                      {item.logo ? (
                        <img 
                          src={item.logo} 
                          alt={item.name} 
                          className="size-full rounded object-cover" 
                        />
                      ) : (
                        <span className="text-xs font-semibold uppercase">
                          {item.name?.[0] || 'O'}
                        </span>
                      )}
                    </div>
                    <span>{item.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
