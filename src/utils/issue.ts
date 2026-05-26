import type { Issue, IssueStatus } from "../types/models";

export const boardColumns: IssueStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"];

export function getIssueKeyNumber(issueKey: string) {
  const [, rawNumber] = issueKey.split("-");
  return Number(rawNumber ?? 0);
}

export function sortBacklogIssues(issues: Issue[]) {
  const priorityRank = { CRITICAL: 0, URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
  return [...issues].sort((a, b) => {
    const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return getIssueKeyNumber(a.issueKey) - getIssueKeyNumber(b.issueKey);
  });
}

export function groupIssuesByStatus(issues: Issue[]) {
  return boardColumns.reduce<Record<IssueStatus, Issue[]>>((groups, status) => {
    groups[status] = issues.filter((issue) => issue.status === status);
    return groups;
  }, { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], BLOCKED: [], DONE: [], ARCHIVED: [] });
}
