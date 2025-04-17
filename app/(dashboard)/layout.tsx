import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "TicketFast - Dashboard",
  description:
    "TicketFast Dashboard - AI Intelligence Ticket Management System",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });

  if (!session) {
    redirect("/sign-in");
  }

  if (!session.user.isCompletedOnboarding) {
    redirect("/onboarding");
  }

  const currentOrganization = await auth.api.getFullOrganization({
    headers: headerList,
  });

  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
          } as React.CSSProperties
        }
      >
        <AppSidebar
          session={session}
          organization={currentOrganization}
          variant="inset"
        />
        <SidebarInset>
          <SiteHeader />

          <main className="p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
