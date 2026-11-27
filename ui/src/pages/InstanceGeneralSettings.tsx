import { controlText } from "@/i18n/controls";
import { t as interfaceNotice } from "@/i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatchInstanceGeneralSettings, BackupRetentionPolicy } from "@paperclipai/shared";
import {
  DAILY_RETENTION_PRESETS,
  WEEKLY_RETENTION_PRESETS,
  MONTHLY_RETENTION_PRESETS,
  DEFAULT_BACKUP_RETENTION,
} from "@paperclipai/shared";
import { LogOut, SlidersHorizontal } from "lucide-react";
import { describeError } from "@/api/errors";
import { healthApi } from "@/api/health";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { QueryErrorState, useQueryView } from "@/components/QueryView";
import { ModeBadge } from "@/components/access/ModeBadge";
import { Button } from "../components/ui/button";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { cn } from "../lib/utils";
import { useSignOut } from "@/hooks/useSignOut";

const FEEDBACK_TERMS_URL = import.meta.env.VITE_FEEDBACK_TERMS_URL?.trim() || "https://paperclip.ing/tos";

export function InstanceGeneralSettings({ embedded = false }: { embedded?: boolean }) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const signOutMutation = useSignOut();

  useEffect(() => {
    if (embedded) return;
    setBreadcrumbs([
      { label: interfaceNotice("interface:settings_c7f73b"), href: "/company/settings" },
      { label: interfaceNotice("interface:general_9239ee") },
    ]);
  }, [embedded, setBreadcrumbs]);

  const generalQuery = useQuery({
    queryKey: queryKeys.instance.generalSettings,
    queryFn: () => instanceSettingsApi.getGeneral(),
  });
  const generalView = useQueryView(generalQuery);
  const healthQuery = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => healthApi.get(),
  });

  const updateGeneralMutation = useMutation({
    mutationFn: instanceSettingsApi.updateGeneral,
    onMutate: () => {
      setActionError(null);
      signOutMutation.reset();
    },
    onSuccess: async () => {
      setActionError(null);
      signOutMutation.reset();
      await queryClient.invalidateQueries({ queryKey: queryKeys.instance.generalSettings });
    },
    onError: (error) => {
      setActionError(describeError(error).body);
    },
  });

  if (generalQuery.isLoading || generalView.kind === "reconnecting" || healthQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">{pageText("loadingGeneralSettings_4e77cd")}</div>;
  }

  if (generalView.kind === "error") {
    return (
      <QueryErrorState
        size={embedded ? "panel" : "page"}
        error={generalQuery.error}
        action="load general settings"
        onRetry={generalView.retry}
        retrying={generalView.isFetching}
      />
    );
  }

  const censorUsernameInLogs = generalQuery.data?.censorUsernameInLogs === true;
  const feedbackDataSharingPreference = generalQuery.data?.feedbackDataSharingPreference ?? "prompt";
  const backupRetention: BackupRetentionPolicy = generalQuery.data?.backupRetention ?? DEFAULT_BACKUP_RETENTION;
  const hiddenSettings = new Set(healthQuery.data?.hiddenSettings ?? []);
  const showDeploymentStatus = !hiddenSettings.has("instance.general.deploymentStatus");
  const showCensorUsernameInLogs = !hiddenSettings.has("instance.general.censorUsernameInLogs");
  const showBackupRetention = !hiddenSettings.has("instance.general.backupRetention");
  const showFeedbackDataSharing = !hiddenSettings.has("instance.general.feedbackDataSharingPreference");
  const showSignOut = !hiddenSettings.has("instance.general.signOut");
  const visibleTopics = [
    ...(showCensorUsernameInLogs ? ["log display"] : []),
    ...(showBackupRetention ? ["backup retention"] : []),
    ...(showFeedbackDataSharing ? ["data sharing"] : []),
  ];
  const topicSummary = visibleTopics.length > 2
    ? `${visibleTopics.slice(0, -1).join(", ")}, and ${visibleTopics[visibleTopics.length - 1]}`
    : visibleTopics.join(" and ");
  const visibleActionError = signOutMutation.error
    ? describeError(signOutMutation.error).body
    : actionError;

  return (
    <div className={embedded ? "space-y-8" : "max-w-4xl space-y-8"}>
      {!embedded ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{translateUi("interfaceCopy.general")}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{pageText("configureInstanceWidePreferences_12fb89")}{visibleTopics.length > 0 ? <>{" " + pageText("including_d358da") + " "}{topicSummary}</> : null}.
          </p>
        </div>
      ) : null}

      {visibleActionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {visibleActionError}
        </div>
      )}

      {showDeploymentStatus && (
      <section>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">{pageText("deploymentAndAuth_ff2496")}</h2>
            <ModeBadge
              deploymentMode={healthQuery.data?.deploymentMode}
              deploymentExposure={healthQuery.data?.deploymentExposure}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {healthQuery.data?.deploymentMode === "local_trusted"
              ? pageText("localTrustedModeIsOptimizedForALocal_dce059")
              : healthQuery.data?.deploymentExposure === "public"
                ? pageText("authenticatedPublicModeRequiresSignInForBoard_1e095c")
                : pageText("authenticatedPrivateModeRequiresSignInAndIs_e932bd")}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <StatusBox
              label={pageText("authReadiness_460133")}
              value={controlText(healthQuery.data?.authReady ? "Ready" : "Not ready")}
            />
            <StatusBox
              label={pageText("bootstrapStatus_4a8a22")}
              value={controlText(healthQuery.data?.bootstrapStatus === "bootstrap_pending" ? "Setup required" : "Ready")}
            />
            <StatusBox
              label={pageText("bootstrapInvite_6411c5")}
              value={controlText(healthQuery.data?.bootstrapInviteActive ? "Active" : "None")}
            />
          </div>
        </div>
      </section>
      )}

      {showCensorUsernameInLogs && (
      <section>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">{pageText("censorUsernameInLogs_7478bd")}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">{pageText("hideTheUsernameSegmentInHomeDirectoryPaths_ae0428")}</p>
          </div>
          <ToggleSwitch
            checked={censorUsernameInLogs}
            onCheckedChange={() => updateGeneralMutation.mutate({ censorUsernameInLogs: !censorUsernameInLogs })}
            disabled={updateGeneralMutation.isPending || signOutMutation.isPending}
            aria-label={pageText("toggleUsernameLogCensoring_fd1c77")}
          />
        </div>
      </section>
      )}

      {showBackupRetention && (
      <section>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">{pageText("backupRetention_893a97")}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">{pageText("configureHowLongAutomaticDatabaseBackupsAreRetained_9f12fa")}</p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{pageText("daily_728298")}</h3>
            <div className="flex flex-wrap gap-2">
              {DAILY_RETENTION_PRESETS.map((days) => {
                const active = backupRetention.dailyDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    disabled={updateGeneralMutation.isPending || signOutMutation.isPending}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      active
                        ? "border-foreground bg-accent text-foreground"
                        : "border-border bg-background hover:bg-accent/50",
                    )}
                    onClick={() =>
                      updateGeneralMutation.mutate({
                        backupRetention: { ...backupRetention, dailyDays: days },
                      })
                    }
                  >
                    <div className="text-sm font-medium">{days}{" " + pageText("days_5548ae")}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{pageText("weekly_158f3d")}</h3>
            <div className="flex flex-wrap gap-2">
              {WEEKLY_RETENTION_PRESETS.map((weeks) => {
                const active = backupRetention.weeklyWeeks === weeks;
                const label = weeks === 1 ? "1 week" : `${weeks} weeks`;
                return (
                  <button
                    key={weeks}
                    type="button"
                    disabled={updateGeneralMutation.isPending || signOutMutation.isPending}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      active
                        ? "border-foreground bg-accent text-foreground"
                        : "border-border bg-background hover:bg-accent/50",
                    )}
                    onClick={() =>
                      updateGeneralMutation.mutate({
                        backupRetention: { ...backupRetention, weeklyWeeks: weeks },
                      })
                    }
                  >
                    <div className="text-sm font-medium">{label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{pageText("monthly_d31edb")}</h3>
            <div className="flex flex-wrap gap-2">
              {MONTHLY_RETENTION_PRESETS.map((months) => {
                const active = backupRetention.monthlyMonths === months;
                const label = months === 1 ? "1 month" : `${months} months`;
                return (
                  <button
                    key={months}
                    type="button"
                    disabled={updateGeneralMutation.isPending || signOutMutation.isPending}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      active
                        ? "border-foreground bg-accent text-foreground"
                        : "border-border bg-background hover:bg-accent/50",
                    )}
                    onClick={() =>
                      updateGeneralMutation.mutate({
                        backupRetention: { ...backupRetention, monthlyMonths: months },
                      })
                    }
                  >
                    <div className="text-sm font-medium">{label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      )}

      {showFeedbackDataSharing && (
      <section>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">{pageText("aiFeedbackSharing_556540")}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">{pageText("controlWhetherThumbsUpAndThumbsDownVotes_fd9fa8")}</p>
            {FEEDBACK_TERMS_URL ? (
              <a
                href={FEEDBACK_TERMS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >{pageText("readOurTermsOfService_8a15a6")}</a>
            ) : null}
          </div>
          {feedbackDataSharingPreference === "prompt" ? (
            <div className="rounded-lg bg-accent/20 px-3 py-2 text-sm text-muted-foreground">{pageText("noDefaultIsSavedYetTheNextThumbs_abb5e4")}</div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {[
              {
                value: "allowed",
                label: "Always allow",
                description: "Share voted AI outputs automatically.",
              },
              {
                value: "not_allowed",
                label: "Don't allow",
                description: "Keep voted AI outputs local only.",
              },
            ].map((option) => {
              const active = feedbackDataSharingPreference === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={updateGeneralMutation.isPending || signOutMutation.isPending}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                    active
                      ? "border-foreground bg-accent text-foreground"
                      : "border-border bg-background hover:bg-accent/50",
                  )}
                  onClick={() =>
                    updateGeneralMutation.mutate({
                      feedbackDataSharingPreference: option.value as
                        | "allowed"
                        | "not_allowed",
                    })
                  }
                >
                  <div className="text-sm font-medium">{controlText(option.label)}</div>
                  <div className="text-xs text-muted-foreground">
                    {controlText(option.description)}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{pageText("toRetestTheFirstUsePromptInLocal_01c749")}{" "}
            <code>feedbackDataSharingPreference</code>{" " + pageText("keyFromThe_792173")}{" "}
            <code>instance_settings.general</code>{" " + pageText("jsonRowForThisInstanceOrSetIt_2cfcf5")}{" "}
            <code>"prompt"</code>{pageText("unsetAnd_d7e779") + " "}<code>"prompt"</code>{" " + pageText("bothMeanNoDefaultHasBeenChosenYet_68ec32")}</p>
        </div>
      </section>

      )}

      {showSignOut && (
      <section>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">{pageText("signOut_dc1649")}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">{pageText("signOutOfThisPaperclipInstanceYouWill_9d9eea")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={signOutMutation.isPending || updateGeneralMutation.isPending}
            onClick={() => {
              setActionError(null);
              signOutMutation.mutate();
            }}
          >
            <LogOut className="size-4" />
            {signOutMutation.isPending ? pageText("signingOut_b9412f") : pageText("signOut_dc1649")}
          </Button>
        </div>
      </section>
      )}
    </div>
  );
}

function StatusBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
