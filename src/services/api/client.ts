import type { BootstrapPayload, Issue, IssueComment, Message, NotificationItem, Task } from "../../types/models";
import { hasStandaloneSession, standaloneApi } from "../standalone/localDatabase";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
export const isStandaloneMode = (import.meta.env.VITE_API_MODE ?? "standalone") !== "server";
const TOKEN_KEY = "flowworks.accessToken";
const REFRESH_KEY = "flowworks.refreshToken";

export function getAccessToken() {
  if (isStandaloneMode && hasStandaloneSession()) return localStorage.getItem(TOKEN_KEY) ?? "standalone";
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  if (isStandaloneMode) standaloneApi.logout();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      ...init?.headers
    }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(body.message ?? "Request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  async login(email: string, password: string) {
    if (isStandaloneMode) {
      const result = await standaloneApi.login(email, password);
      setTokens(result.accessToken, result.refreshToken);
      return result;
    }
    const result = await request<{ accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setTokens(result.accessToken, result.refreshToken);
    return result;
  },
  async register(input: { email: string; password: string; name: string; workspaceName: string }) {
    if (isStandaloneMode) {
      const result = await standaloneApi.register(input);
      setTokens(result.accessToken, result.refreshToken);
      return result;
    }
    const result = await request<{ accessToken: string; refreshToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input)
    });
    setTokens(result.accessToken, result.refreshToken);
    return result;
  },
  bootstrap: () => isStandaloneMode ? standaloneApi.bootstrap() : request<BootstrapPayload>("/bootstrap"),
  sendMessage: (roomId: string, content: string, metadata?: Record<string, unknown>) =>
    isStandaloneMode ? standaloneApi.sendMessage(roomId, content, metadata) : request<Message>(`/rooms/${roomId}/messages`, { method: "POST", body: JSON.stringify({ content, metadata }) }),
  createIssueFromMessage: (messageId: string, title?: string) =>
    isStandaloneMode ? standaloneApi.createIssueFromMessage(messageId, title) : request<Issue>(`/messages/${messageId}/issue`, { method: "POST", body: JSON.stringify({ title }) }),
  createTaskFromMessage: (messageId: string) => isStandaloneMode ? standaloneApi.createTaskFromMessage(messageId) : request<Task>(`/messages/${messageId}/task`, { method: "POST" }),
  createIssue: (input: Partial<Issue> & Pick<Issue, "workspaceId" | "projectId" | "title">) =>
    isStandaloneMode ? standaloneApi.createIssue(input) : request<Issue>("/issues", { method: "POST", body: JSON.stringify(input) }),
  updateIssue: (issueId: string, patch: Partial<Issue>) =>
    isStandaloneMode ? standaloneApi.updateIssue(issueId, patch) : request<Issue>(`/issues/${issueId}`, { method: "PATCH", body: JSON.stringify(patch) }),
  updateMessage: (messageId: string, content: string) =>
    isStandaloneMode ? standaloneApi.updateMessage(messageId, content) : request<Message>(`/messages/${messageId}`, { method: "PATCH", body: JSON.stringify({ content }) }),
  deleteMessage: (messageId: string) =>
    isStandaloneMode ? standaloneApi.deleteMessage(messageId) : request<Message>(`/messages/${messageId}`, { method: "DELETE" }),
  addIssueComment: (issueId: string, content: string) =>
    isStandaloneMode ? standaloneApi.addIssueComment(issueId, content) : request<IssueComment>(`/issues/${issueId}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
  markNotificationRead: (id: string) => isStandaloneMode ? standaloneApi.markNotificationRead(id) : request<NotificationItem>(`/notifications/${id}/read`, { method: "PATCH" }),
  connectJira: (input: { workspaceId: string; cloudUrl: string; email: string; apiToken: string }) =>
    isStandaloneMode ? standaloneApi.connectJira(input) : request<{ status: string }>("/integrations/jira/connect", { method: "POST", body: JSON.stringify(input) }),
  jiraProjects: (workspaceId: string) => isStandaloneMode ? standaloneApi.jiraProjects() : request<Array<{ id: string; key: string; name: string }>>(`/integrations/jira/projects?workspaceId=${workspaceId}`),
  exportBackup: () => isStandaloneMode ? standaloneApi.exportBackup() : Promise.reject(new Error("Backup export is available in standalone mode")),
  importBackup: (raw: string) => isStandaloneMode ? standaloneApi.importBackup(raw) : Promise.reject(new Error("Backup import is available in standalone mode")),
  resetStandalone: () => standaloneApi.reset()
};
