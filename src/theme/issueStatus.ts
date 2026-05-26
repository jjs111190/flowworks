import type { IssueStatus } from "../types/models";

export const issueStatus: Record<IssueStatus, { label: string; color: string; bg: string }> = {
  TODO: { label: "To do", color: "#475467", bg: "#eef2f6" },
  IN_PROGRESS: { label: "In progress", color: "#1d4ed8", bg: "#dbeafe" },
  IN_REVIEW: { label: "In review", color: "#7c3aed", bg: "#ede9fe" },
  BLOCKED: { label: "Blocked", color: "#b42318", bg: "#fee4e2" },
  DONE: { label: "Done", color: "#047857", bg: "#d1fae5" },
  ARCHIVED: { label: "Archived", color: "#667085", bg: "#f2f4f7" }
};
