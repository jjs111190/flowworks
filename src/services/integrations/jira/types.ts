export interface JiraConnectionInput {
  workspaceId: string;
  cloudUrl: string;
  email: string;
  apiToken: string;
}

export interface JiraSyncState {
  provider: "JIRA";
  status: "IDLE" | "SYNCING" | "SUCCESS" | "FAILED";
  externalIssueKey?: string;
  externalIssueUrl?: string;
  lastSyncedAt?: string;
  failureReason?: string;
}
