import { SettingsTabs } from "@/components/settings/general/settings-tabs";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Organization } from "@/db";
import { getOrganizationSubscription } from "@/lib/actions";

export default async function GeneralSettingsPage() {
  const headerList = await headers();
  const [session, organization, subscription] = await Promise.all([
    auth.api.getSession({ headers: headerList }),
    await auth.api.getFullOrganization({
      headers: headerList,
    }),
    getOrganizationSubscription({ headers: headerList }),
  ]);

  const isOwner = session?.user.id === organization?.members.find((member) => member.role === "owner")?.userId;

  return (
    <SettingsTabs
      session={session}
      organization={organization}
      isOwner={isOwner}
      subscription={subscription}
    />
  );
}
