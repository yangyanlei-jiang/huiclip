import { t as interfaceNotice } from "@/i18n";
import { t as translateDynamic } from "../i18n";
import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { useState } from "react";
import { Check, FolderOpen, Loader2, Plus, X } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export interface AllowedProjectsEditorProps {
  projects: Array<{ id: string; name: string }>;
  projectIds: string[];
  canManage: boolean;
  agentName: string;
  onSave: (projectIds: string[]) => Promise<unknown>;
}

export function AllowedProjectsEditor({ projects, projectIds, canManage, agentName, onSave }: AllowedProjectsEditorProps) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const [added, setAdded] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = added.filter(id => !projectIds.includes(id));
  const visibleIds = [...new Set([...projectIds, ...pending])];
  const name = (id: string) => projects.find(project => project.id === id)?.name ?? "Unavailable project";
  const matches = projects.filter(project => project.name.toLowerCase().includes(query.toLowerCase()));

  async function save() {
    if (!canManage || saving || !pending.length) return;
    setSaving(true); setError(null); setSaved(false);
    try { await onSave(pending); setAdded([]); setSaved(true); }
    catch (failure) { setError(failure instanceof Error ? failure.message : interfaceNotice("interface:couldnTSaveProjectAccess_d12675")); }
    finally { setSaving(false); }
  }

  return <section aria-label={pageText("allowedProjects_7013c6")} className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1"><h3 className="text-sm font-semibold">{pageText("allowedProjects_7013c6")}</h3>
        <p className="text-sm text-muted-foreground">{pageText("projectsWhoseTasksAndRepositoriesThisAgentMay_f12c24")}</p></div>
      {canManage && <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={saving}><Plus className="size-4" aria-hidden />{pageText("addProject_2470e8")}</Button>
      </PopoverTrigger><PopoverContent align="end" className="w-72 space-y-3">
        <Input aria-label={pageText("searchProjects_30c3c3")} placeholder={pageText("searchProjects_16f8bb")} value={query} onChange={event => setQuery(event.target.value)} />
        <div className="max-h-64 space-y-1 overflow-y-auto">{matches.map(project => <label key={project.id} className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-accent">
          <Checkbox aria-label={project.name} checked={projectIds.includes(project.id) || pending.includes(project.id)} disabled={projectIds.includes(project.id)} className="mt-0.5"
            onCheckedChange={checked => { setAdded(current => checked ? [...new Set([...current, project.id])] : current.filter(id => id !== project.id)); setSaved(false); }} />
          <span className="min-w-0 text-sm">{project.name}{projectIds.includes(project.id) && <span className="block text-xs text-muted-foreground">{pageText("alreadyAllowed_c95df9")}</span>}</span>
        </label>)}</div>
        {!matches.length && <p className="text-sm text-muted-foreground">{pageText("noProjectsFound_ca7870")}</p>}
        <Button variant="secondary" size="sm" className="w-full" onClick={() => setOpen(false)}>{translateUi("interfaceCopy.done")}</Button>
      </PopoverContent></Popover>}
    </div>
    {visibleIds.length ? <ul aria-label={pageText("allowedProjects_7013c6")} className="divide-y divide-border rounded-lg border">
      {visibleIds.map(id => <li key={id} className="flex items-center gap-3 p-4">
        <FolderOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden /><span className="min-w-0 flex-1 break-words text-sm font-medium">{name(id)}</span>
        {projectIds.includes(id) ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Check className="size-3.5" aria-hidden />{pageText("allowed_77c7b4")}</span>
          : <><span className="text-xs text-muted-foreground">{pageText("toAdd_6df0d2")}</span><Button variant="ghost" size="icon-sm" disabled={saving} aria-label={translateDynamic("dynamic:undoAdding", { value1: name(id) })} onClick={() => setAdded(current => current.filter(value => value !== id))}><X className="size-4" aria-hidden /></Button></>}
      </li>)}
    </ul> : <p className="text-sm text-muted-foreground">{pageText("noProjectsAllowedYet_a1302d")}</p>}
    {!canManage && <p className="text-sm text-muted-foreground">{pageText("aPersonWithAgentManagementPermissionCanAdd_c052f7")}</p>}
    {pending.length > 0 && <div className="space-y-2 rounded-md bg-muted p-4 text-sm">
      <p className="font-medium">{pageText("addAccessTo_fa5249") + " "}{pending.map(name).join(", ")}</p>
      <p className="text-muted-foreground">{agentName}{" " + pageText("willBeAbleToAccessWorkAndRepositories_384d04") + " "}{pending.length === 1 ? pageText("thisProject_bd0d43") : pageText("theseProjects_208f9f")}{pageText("existingProjectAccessAndLowTrustRestrictionsStay_fad3c9")}</p>
    </div>}
    {error && <p role="alert" className="text-sm text-destructive">{pageText("couldnTSaveProjectAccessYourSelectionIs_cef704") + " "}{error}</p>}
    {saved && <p role="status" className="inline-flex items-center gap-2 text-sm"><Check className="size-4" aria-hidden />{pageText("projectAccessSavedReturnToYourTaskTo_57a202")}</p>}
    {canManage && <div className="flex items-center justify-between gap-3 border-t pt-4">
      <Button variant="ghost" disabled={saving || !pending.length} onClick={() => { setAdded([]); setError(null); setSaved(false); }}>{translateUi("interfaceCopy.cancel")}</Button>
      <Button disabled={saving || !pending.length} onClick={() => void save()}>{saving && <Loader2 className="size-4 animate-spin" aria-hidden />}{saving ? pageText("savingAccess_ce4589") : error ? pageText("trySavingAgain_dd1d48") : pageText("saveProjectAccess_39d83f")}</Button>
    </div>}
  </section>;
}
