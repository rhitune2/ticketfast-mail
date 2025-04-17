"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Subscription } from "@/db";
import { SUBSCRIPTION_QUOTAS, SubscriptionPlan } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BillingTabProps {
  subscription: Subscription | null;
}

export function BillingTab({ subscription }: BillingTabProps) {
  const router = useRouter();

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    toast.success("Redirecting to checkout...", {
      description: `You will be redirected to the checkout page for ${plan} plan.`,
    });

    router.push(`/api/auth/checkout/${plan.toLowerCase()}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          Manage your subscription and billing details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription ? (
          <>
            <div className="space-y-1">
              <p className="text-sm font-medium">Current Plan</p>
              <p className="text-sm text-muted-foreground uppercase">
                {subscription.plan || "Unknown Plan"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground capitalize">
                {subscription.status}
              </p>
            </div>
            <Separator />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Manage Subscription</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Choose a plan that best suits your needs. Current quotas are
                    shown below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {Object.entries(SUBSCRIPTION_QUOTAS).map(
                    ([planName, details]) => (
                      <div
                        key={planName}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {planName.toLowerCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tickets: {details.ticketQuota}, Customers:{" "}
                            {details.customerQuota}, Orgs:{" "}
                            {details.organization.quota}, Members:{" "}
                            {details.organization.memberQuota}
                          </p>
                        </div>
                        <DialogClose asChild>
                          <Button
                            variant={
                              subscription.plan === planName
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              handlePlanSelect(planName as SubscriptionPlan)
                            }
                            disabled={subscription.plan === planName}
                          >
                            {subscription.plan === planName
                              ? "Current Plan"
                              : `Select ${planName.toLowerCase()}`}
                          </Button>
                        </DialogClose>
                      </div>
                    )
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active subscription found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
