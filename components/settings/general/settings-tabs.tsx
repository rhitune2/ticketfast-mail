"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { User, Settings, CreditCard, Users, Mail } from "lucide-react";
import { Subscription, SmtpSettings } from "@/db";
import {
  ProfileTab,
  AccountTab,
  BillingTab,
  TeamTab,
  EmailTab,
} from "@/components/settings/general/tabs";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session, Organization } from "@/lib/auth";
import slugify from "slugify";

const tabs = [
  { name: "Profile", icon: User, component: ProfileTab, id: "profile" },
  { name: "Account", icon: Settings, component: AccountTab, id: "account" },
  { name: "Billing", icon: CreditCard, component: BillingTab, id: "billing" },
  { name: "Team", icon: Users, component: TeamTab, id: "team" },
  { name: "Email", icon: Mail, component: EmailTab, id: "email" },
];

interface SettingsTabsProps {
  session: Session;
  organization: any;
  subscription: Subscription | null;
  isOwner: boolean;
  smtpSettings: SmtpSettings | null;
}

function SettingsTabsContent({
  session,
  organization,
  subscription,
  isOwner,
  smtpSettings,
}: SettingsTabsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverStyle, setHoverStyle] = useState({});
  const [activeStyle, setActiveStyle] = useState({ left: "0px", width: "0px" });
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [userName, setUserName] = useState(session.user.name);
  const [organizationName, setOrganizationName] = useState(organization.name);
  const [isLoading, setIsLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Initialize activeIndex state based on initial URL param
  const [activeIndex, setActiveIndex] = useState(() => {
    const index = tabs.findIndex((tab) => tab.id === tabParam);
    return index >= 0 ? index : 0;
  });

  // Effect to sync state with URL param changes (e.g., back/forward navigation)
  useEffect(() => {
    const indexFromParam = tabs.findIndex((tab) => tab.id === tabParam);
    const newActiveIndex = indexFromParam >= 0 ? indexFromParam : 0;
    if (newActiveIndex !== activeIndex) {
      setActiveIndex(newActiveIndex);
    }
    // Only run when tabParam changes, not activeIndex
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex];
      if (hoveredElement) {
        const { offsetLeft, offsetWidth } = hoveredElement;
        setHoverStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    }
  }, [hoveredIndex]);

  // Effect for active indicator style - depends on local activeIndex state
  useEffect(() => {
    const activeElement = tabRefs.current[activeIndex];
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement;
      setActiveStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const initialActiveElement = tabRefs.current[activeIndex];
      if (initialActiveElement) {
        const { offsetLeft, offsetWidth } = initialActiveElement;
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  const handleAccountSave = async () => {
    setIsLoading(true);
    try {
      await authClient.updateUser({
        name: userName,
      });

      router.refresh();

      toast.success("Account changes saved successfully", {
        description: "Your account settings have been updated.",
      });
    } catch (error) {
      toast.error("Failed to save account changes", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to save account changes",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamSave = async () => {
    setIsSubmitting(true);
    try {
      await authClient.organization.update({
        data: {
          name: organizationName,
          slug: slugify(organizationName),
        },
        organizationId: organization.id,
      });

      router.refresh();

      toast.success("Team changes saved successfully", {
        description: "Your team settings have been updated.",
      });
    } catch (error) {
      toast.error("Failed to save team changes", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to save team changes",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-secondary rounded-md p-2 border mb-6">
        <div className="relative">
          <div
            className="absolute h-[30px] transition-all duration-300 ease-out bg-[#0e0f1114] dark:bg-[#ffffff1a] rounded-[6px] flex items-center"
            style={{
              ...hoverStyle,
              opacity: hoveredIndex !== null ? 1 : 0,
            }}
          />
          <div
            className="absolute bottom-[-8px] h-[2px] bg-primary dark:bg-primary transition-all duration-300 ease-out"
            style={activeStyle}
          />
          <div className="relative flex space-x-[6px] items-center">
            {tabs.map((tab, index) => (
              <div
                key={index}
                ref={(el: HTMLDivElement | null) => {
                  tabRefs.current[index] = el;
                }}
                className={`px-3 py-2 cursor-pointer transition-colors duration-300 h-[30px] flex items-center space-x-2 rounded-md ${
                  activeIndex === index
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-primary/80"
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  if (tab.id === "email" && !isOwner) {
                    toast.info("Only owner/admin can access Email settings.");
                    return;
                  }
                  // Update state immediately for responsiveness
                  setActiveIndex(index);
                  // Update URL without full page reload
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("tab", tabs[index].id);
                  router.push(`?${params.toString()}`, { scroll: false });
                }}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-sm leading-5 whitespace-nowrap">
                  {tab.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {activeIndex === 0 && <ProfileTab session={session} />}
        {activeIndex === 1 && (
          <AccountTab
            session={session}
            userName={userName}
            setUserName={setUserName}
            handleAccountSave={handleAccountSave}
            isLoading={isLoading}
          />
        )}
        {activeIndex === 2 && (
          <BillingTab subscription={subscription} isOwner={isOwner} />
        )}
        {activeIndex === 3 && (
          <TeamTab
            organization={organization}
            isOwner={isOwner}
            organizationName={organizationName}
            setOrganizationName={setOrganizationName}
            handleSubmitLoading={isSubmitting}
            handleTeamSave={handleTeamSave}
          />
        )}
        {activeIndex === 4 && (
          <EmailTab
            initialData={smtpSettings}
            organizationId={organization.id}
            isOwner={isOwner}
          />
        )}
      </div>
    </>
  );
}

export function SettingsTabs(props: SettingsTabsProps) {
  return (
    <Suspense fallback={<div>Loading tabs...</div>}>
      <SettingsTabsContent {...props} />
    </Suspense>
  );
}
