import { i18n } from "@/i18n";
import type { Issue } from "@paperclipai/shared";
import { api } from "./client";
export const agentChatsApi = {
  list: (companyId: string) => api.get<Issue[]>(`/companies/${companyId}/chats`),
  get: (companyId: string, agentRef: string) =>
    api.get<Issue | null>(
      `/companies/${companyId}/chats/${encodeURIComponent(agentRef)}`,
    ),
  ensure: (companyId: string, agentRef: string) =>
    api.post<Issue>(
      `/companies/${companyId}/chats/${encodeURIComponent(agentRef)}`,
      {},
      { headers: { "X-Paperclip-UI-Locale": i18n.resolvedLanguage ?? i18n.language } },
    ),
};
