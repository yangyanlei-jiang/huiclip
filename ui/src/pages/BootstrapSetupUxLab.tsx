import { useTranslation as usePageTranslation } from "@/i18n";
import type { ReactElement, ReactNode } from "react";
import { Loader2, ShieldCheck, Terminal, TriangleAlert } from "lucide-react";
import { BOOTSTRAP_FALLBACK_COMMAND } from "@/bootstrapSetup";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type LabFixtureKey =
  | "signed-out-private"
  | "signed-in-private"
  | "claiming"
  | "claim-error"
  | "claim-success"
  | "public-invite-only";

const FIXTURE_LABELS: Record<LabFixtureKey, string> = {
  "signed-out-private": "1 · authenticated/private — signed out (browser claim available)",
  "signed-in-private": "2 · authenticated/private — signed in (claim CTA primary)",
  claiming: "3 · authenticated/private — claim in flight",
  "claim-error": "4 · authenticated/private — claim error (e.g. 409 already claimed)",
  "claim-success": "5 · authenticated/private — claim succeeded, redirect pending",
  "public-invite-only": "6 · authenticated/public — invite-only (no browser claim)",
};

const FIXTURE_ORDER: LabFixtureKey[] = [
  "signed-out-private",
  "signed-in-private",
  "claiming",
  "claim-error",
  "claim-success",
  "public-invite-only",
];

function CliFallback({ hasActiveInvite }: { hasActiveInvite: boolean }) {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <div className="mt-6 border-t border-border pt-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Terminal className="size-4 text-muted-foreground" aria-hidden />
        <span>{pageText("preferToFinishSetupFromTheHost_9c8855")}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasActiveInvite
          ? pageText("aBootstrapInviteIsAlreadyActiveCheckYour_cf70e7")
          : pageText("runThisCommandOnTheHostThatRuns_8f7384")}
      </p>
      <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
{BOOTSTRAP_FALLBACK_COMMAND}
      </pre>
    </div>
  );
}

function StateChrome({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl py-10">
      <Card className="block p-6">{children}</Card>
    </div>
  );
}

function SignedOutPrivate() {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <StateChrome>
      <h1 className="text-xl font-semibold">{pageText("finishSettingUpThisPaperclip_1f613d")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{pageText("noAdminHasClaimedThisInstanceYetSign_efa840")}</p>
      <div className="mt-5">
        <Button asChild>
          <a href="/auth?next=/">{pageText("signInCreateAccount_5d2b23")}</a>
        </Button>
      </div>
      <CliFallback hasActiveInvite={false} />
    </StateChrome>
  );
}

function SignedInPrivate() {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <StateChrome>
      <h1 className="text-xl font-semibold">{pageText("finishSettingUpThisPaperclip_1f613d")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{pageText("noAdminHasClaimedThisInstanceYetClaim_73d6f2")}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button>{pageText("claimThisInstance_57cb3d")}</Button>
        <span className="text-sm text-muted-foreground">{pageText("signedInAs_a02107") + " "}<span className="font-medium text-foreground">jane@appliance.local</span>
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{pageText("wrongAccount_29c736")}{" "}
        <a href="/auth?next=/" className="underline underline-offset-2">{pageText("switchAccount_a28b02")}</a>
        .
      </p>
      <CliFallback hasActiveInvite={false} />
    </StateChrome>
  );
}

function ClaimingPrivate() {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <StateChrome>
      <h1 className="text-xl font-semibold">{pageText("finishSettingUpThisPaperclip_1f613d")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{pageText("noAdminHasClaimedThisInstanceYetClaim_73d6f2")}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button disabled>
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />{pageText("claiming_25b55e")}</Button>
        <span className="text-sm text-muted-foreground">{pageText("signedInAs_a02107") + " "}<span className="font-medium text-foreground">jane@appliance.local</span>
        </span>
      </div>
      <CliFallback hasActiveInvite={false} />
    </StateChrome>
  );
}

function ClaimErrorPrivate() {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <StateChrome>
      <h1 className="text-xl font-semibold">{pageText("finishSettingUpThisPaperclip_1f613d")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{pageText("noAdminHasClaimedThisInstanceYetClaim_73d6f2")}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button>{pageText("claimThisInstance_57cb3d")}</Button>
        <span className="text-sm text-muted-foreground">{pageText("signedInAs_a02107") + " "}<span className="font-medium text-foreground">jane@appliance.local</span>
        </span>
      </div>
      <div
        role="alert"
        className="mt-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
      >
        <TriangleAlert className="mt-0.5 size-4 flex-shrink-0" aria-hidden />
        <div>
          <p className="font-medium">{pageText("someoneElseHasAlreadyClaimedThisInstance_16df73")}</p>
          <p className="mt-1 text-destructive/90">{pageText("refreshToSignInOrAskTheExisting_fcb25f")}{" "}
            <span className="font-mono">{pageText("settingsAccess_35f4a1")}</span>.
          </p>
        </div>
      </div>
      <CliFallback hasActiveInvite={false} />
    </StateChrome>
  );
}

function ClaimSuccess() {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <StateChrome>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="size-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{pageText("youReTheInstanceAdmin_45b413")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{pageText("setupIsCompleteTakingYouToOnboardingTo_88b7dd")}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
        <span className="text-sm text-muted-foreground">{pageText("redirecting_1af797")}</span>
      </div>
      <div className="mt-5">
        <Button asChild variant="outline">
          <a href="/">{pageText("continueToDashboard_1a0bff")}</a>
        </Button>
      </div>
    </StateChrome>
  );
}

function PublicInviteOnly() {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <StateChrome>
      <h1 className="text-xl font-semibold">{pageText("thisPaperclipIsWaitingOnItsFirstAdmin_e8d3de")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{pageText("thisInstanceRunsInInviteOnlyModeThe_b2ff61")}</p>
      <CliFallback hasActiveInvite />
      <p className="mt-4 text-xs text-muted-foreground">{pageText("browserBasedClaimIsIntentionallyDisabledInPublic_e6b2fb")}</p>
    </StateChrome>
  );
}

const FIXTURE_BODIES: Record<LabFixtureKey, ReactElement> = {
  "signed-out-private": <SignedOutPrivate />,
  "signed-in-private": <SignedInPrivate />,
  claiming: <ClaimingPrivate />,
  "claim-error": <ClaimErrorPrivate />,
  "claim-success": <ClaimSuccess />,
  "public-invite-only": <PublicInviteOnly />,
};

export function BootstrapSetupUxLab() {
  const { t: pageText } = usePageTranslation("interface");
  return (
    <div className="bg-background min-h-screen pb-16">
      <header className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{pageText("uxLab_f1af17")}</p>
          <h1 className="mt-1 text-2xl font-semibold">{pageText("bootstrapPendingSetupStates_264131")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{pageText("fixturesForTheBootstrapPendingScreenIn_5e5727") + " "}<span className="font-mono">CloudAccessGate</span>{pageText("usedAsTheUXSpecFor_8c3cc6")}{" "}
            <a className="underline underline-offset-2" href="/PAP/issues/PAP-10113">
              PAP-10113
            </a>{" "}{pageText("andTheImplementationReferenceFor_0236c7")}{" "}
            <a className="underline underline-offset-2" href="/PAP/issues/PAP-10114">
              PAP-10114
            </a>{pageText("theBrowserClaimCTAOnlyAppearsWhen_bcd413")}{" "}
            <span className="font-mono">deploymentMode === &quot;authenticated&quot;</span>{" " + pageText("and_cffa50")}{" "}
            <span className="font-mono">deploymentExposure === &quot;private&quot;</span>.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-12 px-6 pt-10">
        {FIXTURE_ORDER.map((key) => (
          <section key={key} aria-labelledby={`lab-${key}`}>
            <h2
              id={`lab-${key}`}
              className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              {FIXTURE_LABELS[key]}
            </h2>
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 p-2">
              {FIXTURE_BODIES[key]}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
