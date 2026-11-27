import { useTranslation as usePageTranslation } from "@/i18n";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { accessApi } from "../api/access";
import { ApiError } from "../api/client";
import { authApi } from "../api/auth";
import { describeError } from "../api/errors";
import { QueryErrorState, useQueryView } from "../components/QueryView";
import { queryKeys } from "../lib/queryKeys";

function cliAuthRetryDelay(error: unknown): number {
  const body = error instanceof ApiError && error.body && typeof error.body === "object"
    ? error.body as { details?: unknown } : null;
  const details = body?.details && typeof body.details === "object"
    ? body.details as { retryAfterSeconds?: unknown } : null;
  const milliseconds = typeof details?.retryAfterSeconds === "number" ? details.retryAfterSeconds * 1000 : Number.NaN;
  return Number.isFinite(milliseconds) && milliseconds > 0 ? Math.max(1000, milliseconds) : 60_000;
}

function isCliAuthRateLimit(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 429;
}

export function CliAuthPage() {
  const { t: pageText } = usePageTranslation("interface");
  const queryClient = useQueryClient();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const challengeId = (params.id ?? "").trim();
  const token = (searchParams.get("token") ?? "").trim();
  const currentPath = useMemo(
    () => `/cli-auth/${encodeURIComponent(challengeId)}${token ? `?token=${encodeURIComponent(token)}` : ""}`,
    [challengeId, token],
  );

  const sessionQuery = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const challengeQueryKey = useMemo(() => ["cli-auth-challenge", challengeId, token] as const, [challengeId, token]);
  const retryWindowEndsAt = useMemo(() => Date.now() + 10 * 60_000, [challengeId, token]);
  const challengeQuery = useQuery({
    queryKey: challengeQueryKey,
    queryFn: () => accessApi.getCliAuthChallenge(challengeId, token),
    enabled: challengeId.length > 0 && token.length > 0,
    retry: (failureCount, error) => {
      if (!isCliAuthRateLimit(error) || failureCount >= 3) return false;
      const knownChallenge = queryClient.getQueryData<{ expiresAt: string }>(challengeQueryKey);
      const knownExpiry = Date.parse(knownChallenge?.expiresAt ?? "");
      const deadline = Number.isFinite(knownExpiry) ? Math.min(knownExpiry, retryWindowEndsAt) : retryWindowEndsAt;
      return Date.now() + cliAuthRetryDelay(error) < deadline;
    },
    retryDelay: (_failureCount, error) => cliAuthRetryDelay(error),
  });
  const challengeView = useQueryView(challengeQuery);

  const approveMutation = useMutation({
    mutationFn: () => accessApi.approveCliAuthChallenge(challengeId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      await challengeQuery.refetch();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => accessApi.cancelCliAuthChallenge(challengeId, token),
    onSuccess: async () => {
      await challengeQuery.refetch();
    },
  });

  if (!challengeId || !token) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-destructive">{pageText("invalidCLIAuthURL_116142")}</div>;
  }

  const waitingForRateLimit = isCliAuthRateLimit(challengeQuery.failureReason) && challengeQuery.isFetching;
  if (sessionQuery.isLoading || challengeQuery.isLoading || waitingForRateLimit) {
    return <div role="status" className="mx-auto max-w-xl py-10 text-sm text-muted-foreground">
      {waitingForRateLimit ? pageText("tooManyCLIApprovalRequestsRetryingShortly_c50c35") : pageText("loadingCLIAuthChallenge_5018f0")}
    </div>;
  }

  if (challengeView.kind === "error" || (challengeQuery.error && isCliAuthRateLimit(challengeQuery.error))) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <Card className="block p-6">
          <QueryErrorState
            size="panel"
            error={challengeQuery.error}
            action="load the CLI auth challenge"
            onRetry={challengeView.retry}
            retrying={challengeView.isFetching}
          />
        </Card>
      </div>
    );
  }

  const challenge = challengeQuery.data;
  if (!challenge) {
    return <div className="mx-auto max-w-xl py-10 text-sm text-destructive">{pageText("cliAuthChallengeUnavailable_1cc5a5")}</div>;
  }

  if (challenge.status === "approved") {
    return (
      <div className="mx-auto max-w-xl py-10">
        <Card className="block p-6">
          <h1 className="text-xl font-semibold">{pageText("cliAccessApproved_7b9d80")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{pageText("thePaperclipCLICanNowFinishAuthenticationOn_944113")}</p>
          <p className="mt-4 text-sm text-muted-foreground">{pageText("command_e7d3c5") + " "}<span className="font-mono text-foreground">{challenge.command}</span>
          </p>
        </Card>
      </div>
    );
  }

  if (challenge.status === "cancelled" || challenge.status === "expired") {
    return (
      <div className="mx-auto max-w-xl py-10">
        <Card className="block p-6">
          <h1 className="text-xl font-semibold">
            {challenge.status === "expired" ? pageText("cliAuthChallengeExpired_0252c6") : pageText("cliAuthChallengeCancelled_65e4f4")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{pageText("startTheCLIAuthFlowAgainFromYour_359dac")}</p>
        </Card>
      </div>
    );
  }

  if (challenge.requiresSignIn || !sessionQuery.data) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <Card className="block p-6">
          <h1 className="text-xl font-semibold">{pageText("signInRequired_934d2a")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{pageText("signInOrCreateAnAccountThenReturn_0a1632")}</p>
          <Button asChild className="mt-4">
            <Link to={`/auth?next=${encodeURIComponent(currentPath)}`}>{pageText("signInCreateAccount_5d2b23")}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-10">
      <Card className="block p-6">
        <h1 className="text-xl font-semibold">{pageText("approvePaperclipCLIAccess_8feb30")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{pageText("aCLIClientIsRequestingFullBoardAccess_5aa07f")}</p>

        <div className="mt-5 space-y-3 text-sm">
          <div>
            <div className="text-muted-foreground">{pageText("command_890189")}</div>
            <div className="font-mono text-foreground">{challenge.command}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{pageText("client_1bdd79")}</div>
            <div className="text-foreground">{challenge.clientName ?? "paperclipai cli"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{pageText("requestedAccess_7fd9c3")}</div>
            <div className="text-foreground">
              {challenge.requestedAccess === "instance_admin_required" ? pageText("instanceAdmin_3ed638") : pageText("board_e879b0")}
            </div>
          </div>
          {challenge.requestedCompanyName && (
            <div>
              <div className="text-muted-foreground">{pageText("organizationForAuditContext_df349d")}</div>
              <div className="text-foreground">{challenge.requestedCompanyName}</div>
            </div>
          )}
        </div>

        {(approveMutation.isError || cancelMutation.isError) && ( // query-error-ok: mutation result
          <p className="mt-4 text-sm text-destructive">{describeError((approveMutation.error ?? cancelMutation.error)as unknown).body}</p>
        )}

        {!challenge.canApprove && (
          <p className="mt-4 text-sm text-destructive">
            {challenge.requestedAccess === "instance_admin_required"
              ? pageText("thisChallengeRequiresInstanceAdminAccessSignIn_3408d3")
              : pageText("youDoNotHaveAccessToTheRequested_551ed2")}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <Button
            onClick={() => approveMutation.mutate()}
            disabled={!challenge.canApprove || approveMutation.isPending || cancelMutation.isPending}
          >
            {approveMutation.isPending ? pageText("approving_ccd088") : pageText("approveCLIAccess_ea09b2")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => cancelMutation.mutate()}
            disabled={approveMutation.isPending || cancelMutation.isPending}
          >
            {cancelMutation.isPending ? pageText("cancelling_f498a5") : pageText("cancel_77dfd2")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
