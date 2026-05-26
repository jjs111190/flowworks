import type { IssueStatus } from "../types/models";

export const issueStatus: Record<IssueStatus, { label: string; color: string; bg: string }> = {
  TODO: { label: "할 일", color: "#475467", bg: "#eef2f6" },
  IN_PROGRESS: { label: "진행 중", color: "#1d4ed8", bg: "#dbeafe" },
  IN_REVIEW: { label: "검토 중", color: "#7c3aed", bg: "#ede9fe" },
  BLOCKED: { label: "차단됨", color: "#b42318", bg: "#fee4e2" },
  DONE: { label: "완료", color: "#047857", bg: "#d1fae5" },
  ARCHIVED: { label: "보관됨", color: "#667085", bg: "#f2f4f7" }
};
