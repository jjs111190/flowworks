import type { IssuePriority } from "../types/models";

export const priorityColors: Record<IssuePriority, { label: string; color: string; bg: string }> = {
  LOW: { label: "Low", color: "#047857", bg: "#d1fae5" },
  MEDIUM: { label: "Medium", color: "#0369a1", bg: "#e0f2fe" },
  HIGH: { label: "High", color: "#b45309", bg: "#fef3c7" },
  URGENT: { label: "Urgent", color: "#c2410c", bg: "#ffedd5" },
  CRITICAL: { label: "Critical", color: "#b42318", bg: "#fee4e2" }
};
