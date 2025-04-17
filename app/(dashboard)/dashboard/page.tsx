import { DataTable } from "@/components/dashboard/data-table"
import { ChartAreaInteractive } from "@/components/dashboard/chart-area";
import { SectionCards } from "@/components/dashboard/section-cards";

import { 
  getDashboardCardsData, 
  getDashboardChartData, 
  getContactsData, 
  type ChartDataPoint, 
  type ContactData 
} from "@/lib/dashboard/actions";

export default async function DashboardPage() {

  // 4 Cards for dashboard.
  // Active Tickets,  Closed Tickets , Team Member , Contacts Count

  const [cardsData, chartData, contactsData] = await Promise.all(
    [getDashboardCardsData(), getDashboardChartData() , getContactsData()]
  )

  return(
    <div className="@container/main flex flex-1 flex-col gap-2">
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards data={cardsData} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={chartData as ChartDataPoint[]} />
      </div>
      <DataTable data={contactsData as ContactData[]} />
    </div>
  </div>
  );
}
