import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useCompany } from "@/context/CompanyContext";
import { useCoordinatorWorkspaceEnabled } from "@/hooks/useCoordinatorWorkspaceEnabled";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

export function ClassicWorkspaceSetting() {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const { selectedCompany } = useCompany();
  const workspace = useCoordinatorWorkspaceEnabled();
  const error = workspace.error instanceof Error ? workspace.error.message : null;
  return (
    <Card className="block bg-transparent p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h3 id="classic-workspace-title" className="text-sm font-medium">{pageText("classicWorkspace_001707")}</h3>
          <p id="classic-workspace-description" className="text-sm text-muted-foreground">{pageText("useThePreviousWorkspaceInsteadOfTheStandard_b04287")}</p>
          <p className="text-xs text-muted-foreground">{pageText("offByDefaultTurnItOffToReturn_745090")}</p>
          {workspace.userId === "local-board" && (
            <p className="text-xs text-muted-foreground">{pageText("thisLocalInstanceUsesTheSharedLocalBoard_5e84aa")}</p>
          )}
        </div>
        <ToggleSwitch
          checked={workspace.loaded && !workspace.enabled}
          disabled={!workspace.loaded || workspace.isSaving || !workspace.userId || !selectedCompany || !!workspace.error}
          aria-label={pageText("enableClassicWorkspace_5fc527")}
          aria-describedby="classic-workspace-description"
          onCheckedChange={(classicEnabled) => {
            if (!selectedCompany) return;
            void workspace.setEnabled(selectedCompany.id, !classicEnabled).catch(() => {});
          }}
        />
      </div>
      {workspace.isSaving && <p role="status" className="mt-3 text-sm text-muted-foreground">{pageText("savingYourWorkspace_5154dd")}</p>}
      {!workspace.loaded && <p role="status" className="mt-3 text-sm text-muted-foreground">{pageText("loadingYourPreference_c2af1d")}</p>}
      {error && (
        <div role="alert" className="mt-3 flex items-center gap-2 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => { void workspace.retry(); }}>{translateUi("interfaceCopy.retry")}</Button>
        </div>
      )}
    </Card>
  );
}
