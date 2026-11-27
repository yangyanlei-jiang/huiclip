import { useTranslation as usePageTranslation } from "@/i18n";
import type { ReactNode } from "react";
import { ResponsibleUserDenialNotice } from "@/components/ResponsibleUserDenialNotice";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * UX lab for PAP-12462 (P7): run "on behalf of {user}" surfacing + responsible-user
 * denial copy. Renders before/after of both surfaces with real design tokens so the
 * states can be captured for UX review. Route: /ux-lab/responsible-user-denial
 */

function LabSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-background/85 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function BeforeAfter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
        {label}
      </div>
      <Card className="block border-border/60 p-3">{children}</Card>
    </div>
  );
}

/** A faithful copy of a run ledger row header (see IssueRunLedger.tsx). */
function RunLedgerRow({
  onBehalfOf,
  denial,
}: {
  onBehalfOf?: string | null;
  denial?: ReactNode;
}) {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <article className="space-y-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium text-foreground">{pageText("run_b1b392")}</span>
        <span className="min-w-0 max-w-full truncate font-mono text-foreground">a1b2c3d4</span>
        <span>{pageText("byCodexCoder_a47eb5")}</span>
        {onBehalfOf ? (
          <span className="min-w-0 max-w-full truncate text-muted-foreground">{pageText("onBehalfOf_308287") + " "}<span className="text-foreground">{onBehalfOf}</span>
          </span>
        ) : null}
        <span className="rounded-md border border-border px-1.5 py-0.5 text-(length:--text-micro) capitalize text-muted-foreground">
          {denial ? pageText("failed_09fef5") : pageText("succeeded_c8fbda")}
        </span>
        <span className="ml-auto shrink-0">{pageText("2mAgo_71db45")}</span>
      </div>
      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div className="min-w-0">
          <span className="text-foreground">{pageText("elapsed_5fc977")}</span>{" " + pageText("1m4s_002d60")}</div>
        <div className="min-w-0">
          <span className="text-foreground">{pageText("lastUsefulAction_39e32a")}</span>{" " + pageText("2mAgo_71db45")}</div>
        <div className="min-w-0">
          <span className="text-foreground">{pageText("stop_9e2534")}</span> {denial ? pageText("denied_63b16b") : pageText("completed_1798b3")}
        </div>
      </div>
      {denial}
    </article>
  );
}

/** A faithful copy of the run-detail header identity block (see AgentDetail.tsx RunDetail). */
function RunDetailHeader({ onBehalfOf, denial }: { onBehalfOf?: string | null; denial?: ReactNode }) {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-foreground">{pageText("runA1b2c3d4_267d58")}</span>
        <span className="rounded-md border border-border px-1.5 py-0.5 text-(length:--text-micro) capitalize text-muted-foreground">
          {denial ? pageText("failed_5f5f87") : pageText("succeeded_88c2e0")}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-(length:--text-micro) text-muted-foreground">
        <span className="rounded bg-muted px-1.5 py-0.5 text-(length:--text-nano) font-medium uppercase tracking-wide">
          codex local
        </span>
        <span>anthropic/claude-opus-4-8</span>
      </div>
      {onBehalfOf ? (
        <div className="text-xs text-muted-foreground">{pageText("onBehalfOf_903002") + " "}<span className="text-foreground">{onBehalfOf}</span>
        </div>
      ) : null}
      {denial}
    </div>
  );
}

export function ResponsibleUserDenialUxLab() {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <div className="text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
            PAP-12462 · P7
          </div>
          <h1 className="mt-1 text-xl font-semibold text-foreground">{pageText("runOnBehalfOfSurfacingDenialCopy_ecfc27")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pageText("beforeAfterOfTheTwoRunSurfacesAnd_f44c1d")}</p>
        </header>

        <LabSection
          title={pageText("1RunIdentityOnBehalfOfUser_341891")}
          description={pageText("aRunActingForAHumanNowNames_791b28")}
        >
          <BeforeAfter label={pageText("beforeRunLedger_df07f2")}>
            <RunLedgerRow />
          </BeforeAfter>
          <BeforeAfter label={pageText("afterRunLedger_66aa8b")}>
            <RunLedgerRow onBehalfOf="Ada Lovelace" />
          </BeforeAfter>
          <BeforeAfter label={pageText("beforeRunDetail_b8e2ad")}>
            <RunDetailHeader />
          </BeforeAfter>
          <BeforeAfter label={pageText("afterRunDetail_1ef40a")}>
            <RunDetailHeader onBehalfOf="Ada Lovelace" />
          </BeforeAfter>
        </LabSection>

        <LabSection
          title={pageText("2DenialStateResponsibleUserNotAuthorized_aad441")}
          description={pageText("theAgentIsAllowedButTheUserThe_a4edca")}
        >
          <BeforeAfter label={pageText("beforeGenericFailureText_8afdbd")}>
            <div className="text-xs">
              <span className="text-red-600 dark:text-red-400">
                Forbidden: action not permitted
              </span>
              <span className="ml-1 text-muted-foreground">(RESPONSIBLE_USER_UNAUTHORIZED)</span>
            </div>
          </BeforeAfter>
          <BeforeAfter label={pageText("afterActionableDenialCopy_45d849")}>
            <ResponsibleUserDenialNotice
              code="RESPONSIBLE_USER_UNAUTHORIZED"
              userName="Ada Lovelace"
            />
          </BeforeAfter>
        </LabSection>

        <LabSection
          title={pageText("3DenialStateAgentLacksPermissionUnchanged_4ef561")}
          description={pageText("aDenialThatIsNOTAResponsibleUser_f70557")}
        >
          <BeforeAfter label={pageText("agentLacksPermissionFailure_1bf517")}>
            <div className="text-xs">
              <span className="text-red-600 dark:text-red-400">
                Forbidden: agent is not permitted to perform this action
              </span>
              <span className="ml-1 text-muted-foreground">(deny_missing_membership)</span>
            </div>
          </BeforeAfter>
          <BeforeAfter label={pageText("noResponsibleUserNoticeRendered_a5f741")}>
            <div className="text-xs text-muted-foreground">{pageText("responsibleUserDenialNoticeIntentionallyAbsentForNon_4e325f")}</div>
          </BeforeAfter>
        </LabSection>

        <LabSection
          title={pageText("4DenialStateResponsibleUserUnavailable_4e914f")}
          description={pageText("theUserThisRunActsForWasRemoved_811813")}
        >
          <BeforeAfter label={pageText("beforeGenericFailureText_8afdbd")}>
            <div className="text-xs">
              <span className="text-red-600 dark:text-red-400">
                Forbidden: responsible user unavailable
              </span>
              <span className="ml-1 text-muted-foreground">(RESPONSIBLE_USER_UNAVAILABLE)</span>
            </div>
          </BeforeAfter>
          <BeforeAfter label={pageText("afterActionableDenialCopy_45d849")}>
            <ResponsibleUserDenialNotice
              code="RESPONSIBLE_USER_UNAVAILABLE"
              userName="Grace Hopper"
            />
          </BeforeAfter>
        </LabSection>

        <LabSection
          title={pageText("inContextDenialInsideAFailedRunLedger_ac4244")}
          description={pageText("howTheNoticeReadsWithinARunRow_e84ee8")}
        >
          <BeforeAfter label={pageText("unauthorized_740b83")}>
            <RunLedgerRow
              onBehalfOf="Ada Lovelace"
              denial={
                <ResponsibleUserDenialNotice
                  code="RESPONSIBLE_USER_UNAUTHORIZED"
                  userName="Ada Lovelace"
                />
              }
            />
          </BeforeAfter>
          <BeforeAfter label={pageText("unavailable_2c9c1f")}>
            <RunLedgerRow
              onBehalfOf="Grace Hopper"
              denial={
                <ResponsibleUserDenialNotice
                  code="RESPONSIBLE_USER_UNAVAILABLE"
                  userName="Grace Hopper"
                />
              }
            />
          </BeforeAfter>
        </LabSection>

        <p className={cn("text-center text-(length:--text-micro) text-muted-foreground")}>{pageText("copyIsSourcedFromTheShared_75fe3e") + " "}<code>describeResponsibleUserDenial</code>{" " + pageText("contract_910238")}</p>
      </div>
    </div>
  );
}
