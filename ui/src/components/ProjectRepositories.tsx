import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { LegacyProjectRepository } from "./LegacyProjectRepository";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project, ProjectRepository } from "@paperclipai/shared";
import { projectsApi } from "@/api/projects";
import { describeError } from "@/api/errors";
import { queryKeys } from "@/lib/queryKeys";
import { ConnectionSetupFlow } from "@/features/connections/ConnectionSetupFlow";
import { ProjectRepositoryInput, repositoryOptionsKey } from "./ProjectRepositoryInput";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

export function ProjectRepositories({ project }: { project: Project }) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const client = useQueryClient();
  const saved: ProjectRepository[] = project.workspaces.flatMap((workspace) => {
    const id = workspace.metadata?.githubRepositoryId;
    return typeof id === "string" && workspace.repoUrl ? [{ id, fullName: workspace.name, url: workspace.repoUrl, connections: [] }] : [];
  });
  const [draft, setDraft] = useState<ProjectRepository[] | null>(null);
  const [connecting, setConnecting] = useState(false);
  const save = useMutation({
    mutationFn: () => projectsApi.setRepositories(project.id, (draft ?? saved).map((repo) => repo.id)),
    onSuccess: (updated) => {
      for (const ref of new Set([project.id, project.urlKey])) {
        client.setQueriesData({ queryKey: queryKeys.projects.detail(ref) }, updated);
        void client.invalidateQueries({ queryKey: queryKeys.projects.detail(ref) });
      }
      void client.invalidateQueries({ queryKey: queryKeys.projects.all(project.companyId) });
      void client.invalidateQueries({ queryKey: queryKeys.projects.detail(project.id) });
      setDraft(null);
    },
  });
  return <section aria-label={pageText("repositories_c91e6e")} className="flex min-w-0 flex-col gap-4 py-4">
    <ProjectRepositoryInput companyId={project.companyId} selected={draft ?? saved} onChange={(repos) => { setDraft(repos); save.reset(); }} onConnect={() => setConnecting(true)} disabled={save.isPending} />
    {project.workspaces.filter((workspace) => workspace.repoUrl && !workspace.metadata?.githubRepositoryId).map((workspace) => <LegacyProjectRepository key={workspace.id} workspace={workspace} projectRef={project.urlKey} />)}
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
      {save.status === "error" && <p role="alert" className="mr-auto text-sm text-destructive">{describeError(save.error).body}</p>}
      {save.isSuccess && <span role="status" className="mr-auto text-sm text-muted-foreground">Changes saved</span>}
      {draft && <Button type="button" variant="ghost" disabled={save.isPending} onClick={() => { setDraft(null); save.reset(); }}>{pageText("discardChanges_fa8fc0")}</Button>}
      <Button type="button" disabled={!draft || save.isPending} onClick={() => save.mutate()}>{save.isPending ? pageText("saving_56a228") : pageText("saveChanges_179359")}</Button>
    </div>
    <Dialog open={connecting} onOpenChange={setConnecting}><DialogContent showCloseButton={false} aria-describedby={undefined} className="max-h-(--sz-calc-18) overflow-y-auto sm:max-w-2xl">
      <DialogTitle className="sr-only">{translateUi("interfaceCopy.connectGitHub")}</DialogTitle>
      <ConnectionSetupFlow host="dialog" serviceSlug="github" forceNewConnection onCancel={() => setConnecting(false)} onComplete={() => {
        void client.invalidateQueries({ queryKey: repositoryOptionsKey(project.companyId) });
        setConnecting(false);
      }} />
    </DialogContent></Dialog>
  </section>;
}
