import { useTranslation as usePageTranslation } from "@/i18n";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@paperclipai/shared";
import { projectsApi } from "@/api/projects";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function ProjectGitAuthorization({ project }: { project: Project }) {
  const { t: pageText } = usePageTranslation("interface");
  const client = useQueryClient();
  const key = ["project-git-authorization", project.companyId, project.id];
  const authorization = useQuery({
    queryKey: key,
    queryFn: () => projectsApi.gitAuthorization(project.id),
  });
  const [selected, setSelected] = useState<string>("");
  const save = useMutation({
    mutationFn: (grantId: string | null) => projectsApi.setGitAuthorization(project.id, grantId),
    onSuccess: (data) => {
      client.setQueryData(key, data);
      setSelected("");
    },
  });
  const data = authorization.data;
  return (
    <section aria-label={pageText("backgroundGitHubAuthorization_63a23d")} className="flex flex-col gap-3 py-4">
      <h3 className="text-sm font-medium">{pageText("backgroundGitHubAuthorization_63a23d")}</h3>
      <p className="text-sm text-muted-foreground">{pageText("allowThisProjectSWorkspaceProviderToUse_61f3de")}</p>
      {data?.grantId && (
        <p role="status" className="text-sm">{pageText("authorized_58ea1d")}{" "}
          {data.options.find((option) => option.grantId === data.grantId)?.login ??
            pageText("selectedGrantUnavailableOrOwnedByAnotherMember_4c65c5")}
        </p>
      )}
      {data && (
        <div className="flex flex-wrap gap-2">
          <Select value={selected} onValueChange={setSelected} disabled={save.isPending}>
            <SelectTrigger aria-label={pageText("yourGitHubAuthorization_35ad27")}>
              <SelectValue placeholder={pageText("selectYourGitHubAccount_c6c454")} />
            </SelectTrigger>
            <SelectContent>
              {data.options.map((option) => (
                <SelectItem key={option.grantId} value={option.grantId}>
                  {option.login} · {option.connectionName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={!selected || save.isPending} onClick={() => save.mutate(selected)}>{pageText("authorizeProject_5de178")}</Button>
          {data.grantId && (
            <Button variant="outline" disabled={save.isPending} onClick={() => save.mutate(null)}>{pageText("revokeAuthorization_a23f3d")}</Button>
          )}
        </div>
      )}
      {data && !data.options.length && (
        <p className="text-sm text-muted-foreground">{pageText("connectYourGitHubAccountAndInstallTheConnector_1256e8")}</p>
      )}
      {(authorization.error || save.error) && (
        <p role="alert" className="text-sm text-destructive">
          {(authorization.error || save.error)?.message}
        </p>
      )}
    </section>
  );
}
