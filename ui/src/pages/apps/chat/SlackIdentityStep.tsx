import { useTranslation as usePageTranslation } from "@/i18n";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, ExternalLink, Loader2 } from "lucide-react";
import { authApi } from "@/api/auth";
import { healthApi } from "@/api/health";
import { chatEndpointsApi } from "@/api/chatEndpoints";
import { Button } from "@/components/ui/button";
import { useQueryView } from "@/components/QueryView";
import { copyTextToClipboard } from "@/lib/clipboard";
import { queryKeys } from "@/lib/queryKeys";

export function SlackIdentityStep({ endpointId, command, testStartedAt, onConnected, onSaveExit }: {
  endpointId: string;
  command: string;
  testStartedAt?: string | null;
  onConnected: () => void;
  onSaveExit: () => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const client = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const session = useQuery({ queryKey: queryKeys.auth.session, queryFn: authApi.getSession });
  const sessionView = useQueryView(session);
  const health = useQuery({ queryKey: queryKeys.health, queryFn: healthApi.get });
  const healthView = useQueryView(health);
  const identities = useQuery({
    queryKey: queryKeys.chatEndpoints.principals(endpointId),
    queryFn: () => chatEndpointsApi.listPrincipals(endpointId),
    refetchInterval: 1_500,
  });
  const identitiesView = useQueryView(identities);
  const local = health.data?.deploymentMode === "local_trusted";
  const userId = local ? "local-board" : session.data?.user.id;
  const userLabel = local ? "Local Board" : session.data?.user.name || session.data?.user.email;
  const candidates = (identities.data ?? []).filter((identity) => identity.lastConnectAt &&
    (!testStartedAt || Date.parse(identity.lastConnectAt) >= Date.parse(testStartedAt)));
  const linkedToMe = candidates.some((identity) => identity.status === "linked" && identity.paperclipUserId === userId);
  const connectCommand = `${command} connect`;
  const link = useMutation({
    mutationFn: async (principalId: string) => {
      const { confirmationUrl } = await chatEndpointsApi.createLinkIntent(endpointId, principalId);
      const token = new URL(confirmationUrl, window.location.origin).searchParams.get("token");
      if (!token) throw new Error("Could not create the account confirmation. Try again.");
      await chatEndpointsApi.confirmIdentityLink(token);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.chatEndpoints.principals(endpointId) }),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">{pageText("connectYourSlackAccount_640634")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{pageText("sendThisCommandInSlackSoWeCan_d0eb51")}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
        <code className="text-sm">{connectCommand}</code>
        <Button variant="ghost" size="sm" onClick={() => {
          void copyTextToClipboard(connectCommand).then(() => { setCopied(true); setCopyError(false); }, () => setCopyError(true));
        }}><Copy className="size-4" />{copied ? pageText("copied_8e3df4") : pageText("copyCommand_a8e104")}</Button>
      </div>
      {copyError && <p role="alert" className="text-sm text-destructive">{pageText("couldnTCopyTheCommandSelectAndCopy_2f9f9f")}</p>}
      <p className="text-sm">
        <a href="https://app.slack.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{pageText("openSlack_eec851") + " "}<ExternalLink className="inline size-3" /></a>{pageText("sendTheCommandInYourWorkspaceThenReturn_5e88e0")}</p>
      {identitiesView.kind === "error" ? (
        <p role="alert" className="text-sm text-destructive">{pageText("couldnTCheckForYourSlackAccountWe_e7df82")}</p>
      ) : candidates.length === 0 ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{pageText("waitingForYourConnectCommand_b58907")}</p>
      ) : (
        <div className={`space-y-3 rounded-lg border p-4 ${linkedToMe
          ? "border-(--status-task-done)/30 bg-(--status-task-done)/10"
          : "border-(--status-task-todo)/30 bg-(--status-task-todo)/10"}`}>
          <p className="text-sm">{pageText("chooseYourSlackAccountBelowToLinkIt_8318bc") + " "}<strong>{userLabel ?? pageText("yourPaperclipAccount_456506")}</strong>{pageText("onlyConfirmAnAccountThatBelongsToYou_c13950")}</p>
          {candidates.map((identity) => {
            const mine = identity.status === "linked" && identity.paperclipUserId === userId;
            return (
              <div key={identity.principalId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{identity.externalLabel}</p>
                  <p className="text-xs text-muted-foreground">{identity.externalDetail}</p>
                </div>
                {mine ? <p role="status" className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-(--status-task-done)" />{pageText("linkedToYou_572a13")}</p>
                  : identity.status === "linked" ? <p className="text-sm text-muted-foreground">{pageText("linkedTo_e7ca9e") + " "}{identity.paperclipUserLabel ?? pageText("anotherPaperclipAccount_fbf870")}</p>
                  : <Button variant="outline" disabled={!userId || link.isPending} onClick={() => link.mutate(identity.principalId)} aria-label={`Link ${identity.externalLabel} to my Paperclip account`}>
                    {link.isPending && link.variables === identity.principalId && <Loader2 className="size-4 animate-spin" />}{pageText("thisIsMySlackAccount_1ecf72")}</Button>}
              </div>
            );
          })}
        </div>
      )}
      {!userId && !session.isPending && !health.isPending && sessionView.kind !== "reconnecting" && healthView.kind !== "reconnecting" && <p role="alert" className="text-sm text-destructive">{pageText("signInToPaperclipToLinkYourSlack_b24c91")}</p>}
      {link.error ? <p role="alert" className="text-sm text-destructive">{pageText("couldnTLinkYourAccountCheckThatYou_1fc4d3")}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" className="text-muted-foreground" onClick={onSaveExit}>{pageText("saveExit_fc5599")}</Button>
        {linkedToMe && <Button onClick={onConnected}>{pageText("continueToMessageTest_311517")}</Button>}
      </div>
    </div>
  );
}
