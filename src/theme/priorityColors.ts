import type { IssuePriority } from "../types/models";

export const priorityColors: Record<IssuePriority, { label: string; color: string; bg: string }> = {
  LOW: { label: "낮음", color: "#047857", bg: "#d1fae5" },
  MEDIUM: { label: "보통", color: "#0369a1", bg: "#e0f2fe" },
  HIGH: { label: "높음", color: "#b45309", bg: "#fef3c7" },
  URGENT: { label: "긴급", color: "#c2410c", bg: "#ffedd5" },
  CRITICAL: { label: "치명적", color: "#b42318", bg: "#fee4e2" }
};
