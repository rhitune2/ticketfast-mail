import { SettingsTabs } from "@/components/settings/general/settings-tabs";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrganizationSubscription } from "@/lib/actions";
import { getSmtpSettings } from "@/lib/actions/settings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TicketFast - Settings",
  description: "Manage your organization settings",
};

export default async function GeneralSettingsPage() {
  const headerList = await headers();
  const [session, organization, subscription, smtpSettings] = await Promise.all(
    [
      auth.api.getSession({ headers: headerList }),
      auth.api.getFullOrganization({
        headers: headerList,
      }),
      getOrganizationSubscription({ headers: headerList }),
      getSmtpSettings(),
    ]
  );

  const isOwnerOrAdmin =
    session?.user.id ===
    organization?.members.find(
      (member) => member.role === "owner" || member.role === "admin"
    )?.userId;

  return (
    <SettingsTabs
      session={session!}
      // any for now.
      organization={organization! as any}
      isOwner={isOwnerOrAdmin}
      subscription={subscription!}
      smtpSettings={smtpSettings}
    />
  );
}
