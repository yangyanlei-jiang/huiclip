import { useTranslation as usePageTranslation } from "@/i18n";
import { useTranslation as useUiTranslation } from "@/i18n";
import { GitBranch, LoaderCircle } from 'lucide-react';
import { SearchableSelect, type SearchableSelectGroup, type SearchableSelectOption } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';

export interface RepositoryBranch {
  name: string;
  isDefault?: boolean;
}

interface BranchOption extends SearchableSelectOption {
  isDefault?: boolean;
  entered?: boolean;
}

export function RepositoryBranchSelect({ value, branches, loading, error, disabled, onChange, onRetry }: {
  value: string;
  branches: readonly RepositoryBranch[];
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  onChange: (branch: string) => void;
  onRetry?: () => void;
}) {
  const { t: pageText } = usePageTranslation("interface");
  const { t: translateUi } = useUiTranslation();
  const uniqueBranches = [...new Map(branches.map(branch => [branch.name, branch])).values()];
  const options: BranchOption[] = uniqueBranches.map(branch => ({ key: branch.name, value: branch.name, label: branch.name, searchText: branch.isDefault ? 'default branch' : undefined, isDefault: branch.isDefault }));
  if (value && !options.some(option => option.value === value)) options.push({ key: value, value, label: value });
  const groups: SearchableSelectGroup<string, BranchOption>[] = [
    { id: 'default', label: 'Default branch', options: options.filter(option => option.isDefault) },
    { id: 'branches', label: 'Branches', options: options.filter(option => !option.isDefault) },
  ];
  return <div className="flex min-w-0 flex-col gap-2">
    <SearchableSelect<string, BranchOption>
      value={value} groups={groups} disabled={disabled} triggerAriaLabel="Branch" mobileTitle="Choose a branch"
      placeholder={pageText("chooseABranch_0f9067")} searchPlaceholder={pageText("searchOrEnterABranchName_851364")}
      emptyMessage={loading ? pageText("branchesAreLoadingYouCanStillEnterA_a0508c") : pageText("noMatchingBranchesEnterABranchNameTo_a5df15")}
      onValueChange={branch => onChange(branch)}
      deriveGroups={(query, current) => {
        const name = query.trim();
        return name && !options.some(option => option.value === name)
          ? [...current, { id: 'entered', options: [{ key: `entered:${name}`, value: name, label: name, entered: true }] }]
          : current;
      }}
      renderOption={option => <>
        <GitBranch className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate" title={option.value}>{option.entered ? `Use “${option.value}”` : option.label}</span>
        {option.isDefault && <span className="text-xs text-muted-foreground">{translateUi("interfaceCopy.default")}</span>}
      </>}
    />
    {loading && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />{pageText("loadingBranches_8fc3fb")}</p>}
    {error && <div className="flex flex-wrap items-center gap-2"><p role="alert" className="text-sm text-destructive">{error}{" " + pageText("youCanStillEnterABranchName_8303a3")}</p>
      {onRetry && <Button type="button" size="sm" variant="ghost" disabled={loading || disabled} onClick={onRetry}>{translateUi("interfaceCopy.tryAgain")}</Button>}
    </div>}
  </div>;
}
