import { t as interfaceNotice } from "@/i18n";
import { useEffect } from "react";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { NewAgentSetup } from "../components/new-agent/NewAgentSetup";

export function NewAgent() {
  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    setBreadcrumbs([
      { label: interfaceNotice("interface:agents_64acf7"), href: "/agents" },
      { label: interfaceNotice("interface:newAgent_d200d9") },
    ]);
  }, [setBreadcrumbs]);
  return <NewAgentSetup />;
}
