import { t as interfaceNotice } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useEffect } from "react";
import { ArrowLeft, RadioTower } from "lucide-react";
import { Link } from "@/lib/router";
import { ActiveAgentsPanel } from "../components/ActiveAgentsPanel";
import { EmptyState } from "../components/EmptyState";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";

const DASHBOARD_LIVE_RUN_LIMIT = 50;

export function DashboardLive() {
  const { t: pageText } = usePageTranslation("interface");
  const { selectedCompanyId, companies } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: interfaceNotice("interface:dashboard_d87f47"), href: "/dashboard" },
      { label: interfaceNotice("interface:liveRuns_69bc23") },
    ]);
  }, [setBreadcrumbs]);

  if (!selectedCompanyId) {
    return (
      <EmptyState
        icon={RadioTower}
        message={companies.length === 0 ? pageText("createAnOrganizationToViewLiveRuns_ec31f2") : pageText("selectAnOrganizationToViewLiveRuns_b9e659")}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />{pageText("dashboard_d87f47")}</Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">{pageText("liveAgentRuns_9a10f5")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pageText("activeRunsFirstFollowedByTheMostRecent_04f886")}</p>
        </div>
        <div className="text-sm text-muted-foreground">{pageText("showingUpTo_7563c9") + " "}{DASHBOARD_LIVE_RUN_LIMIT}</div>
      </div>

      <ActiveAgentsPanel
        companyId={selectedCompanyId}
        title={pageText("activeRecent_46116c")}
        minRunCount={DASHBOARD_LIVE_RUN_LIMIT}
        fetchLimit={DASHBOARD_LIVE_RUN_LIMIT}
        cardLimit={DASHBOARD_LIVE_RUN_LIMIT}
        emptyMessage={pageText("noActiveOrRecentAgentRuns_3fe199")}
        queryScope="dashboard-live"
        showMoreLink={false}
      />
    </div>
  );
}
