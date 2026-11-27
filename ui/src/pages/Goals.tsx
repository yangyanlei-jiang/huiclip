import { t as interfaceNotice } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { goalsApi } from "../api/goals";
import { useCompany } from "../context/CompanyContext";
import { useDialogActions } from "../context/DialogContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { GoalTree } from "../components/GoalTree";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { QueryErrorState, useQueryView } from "../components/QueryView";
import { Button } from "@/components/ui/button";
import { Target, Plus } from "lucide-react";

export function Goals() {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const { selectedCompanyId } = useCompany();
  const { openNewGoal } = useDialogActions();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: interfaceNotice("interface:goals_48d8c6") }]);
  }, [setBreadcrumbs]);

  const goalsQuery = useQuery({
    queryKey: queryKeys.goals.list(selectedCompanyId!),
    queryFn: () => goalsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const { data: goals, isLoading } = goalsQuery;
  const goalsView = useQueryView(goalsQuery);

  if (!selectedCompanyId) {
    return <EmptyState icon={Target} message={translateUi("interfaceCopy.selectAnOrganizationToViewGoals")} />;
  }

  // Keep a loaded list on screen through a failed refetch; only a real
  // failure, or an outage before the first load, replaces the page.
  if (isLoading || goalsView.kind === "reconnecting") {
    return <PageSkeleton variant="list" />;
  }
  if (goalsView.kind === "error") {
    return (
      <QueryErrorState
        size="page"
        error={goalsView.error}
        action="load goals"
        onRetry={goalsView.retry}
        retrying={goalsView.isFetching}
      />
    );
  }

  return (
    <div className="space-y-4">
      {goals && goals.length === 0 && (
        <EmptyState
          icon={Target}
          message={translateUi("interfaceCopy.noGoalsYet")}
          action={translateUi("interfaceCopy.addGoal")}
          onAction={() => openNewGoal()}
        />
      )}

      {goals && goals.length > 0 && (
        <>
          <div className="flex items-center justify-start">
            <Button size="sm" variant="outline" onClick={() => openNewGoal()}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />{pageText("newGoal_5e8164")}</Button>
          </div>
          <GoalTree goals={goals} goalLink={(goal) => `/goals/${goal.id}`} />
        </>
      )}
    </div>
  );
}
