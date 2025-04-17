import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { type CardsData } from "@/lib/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SectionCards({ data }: { data: CardsData }) {
  const calculateLastMonthData = (current: number, lastMonth: number) => {
    if (lastMonth === 0) return "0%";

    const percentage = ((current - lastMonth) / lastMonth) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  const getTrendingIcon = (current: number, lastMonth: number) => {
    if (current > lastMonth) {
      return <IconTrendingUp className="size-4" />;
    } else {
      return <IconTrendingDown className="size-4" />;
    }
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Tickets</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.activeTickets}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {getTrendingIcon(data.activeTickets, data.activeTicketsLastMonth)}
              {calculateLastMonthData(
                data.activeTickets,
                data.activeTicketsLastMonth
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending{" "}
            {calculateLastMonthData(
              data.activeTickets,
              data.activeTicketsLastMonth
            )}{" "}
            this month{" "}
            {getTrendingIcon(data.activeTickets, data.activeTicketsLastMonth)}
          </div>
          <div className="text-muted-foreground">
            Active tickets currently in system
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Closed Tickets</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.closedTickets}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {getTrendingIcon(data.closedTickets, data.closedTicketsLastMonth)}
              {calculateLastMonthData(
                data.closedTickets,
                data.closedTicketsLastMonth
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending{" "}
            {calculateLastMonthData(
              data.closedTickets,
              data.closedTicketsLastMonth
            )}{" "}
            this month{" "}
            {getTrendingIcon(data.closedTickets, data.closedTicketsLastMonth)}
          </div>
          <div className="text-muted-foreground">Total resolved tickets</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Team Members</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.teamMembers}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Current team size
          </div>
          <div className="text-muted-foreground">Total staff members</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Contacts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.contacts}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Your customers
          </div>
          <div className="text-muted-foreground">
            Total contacts in the system
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
