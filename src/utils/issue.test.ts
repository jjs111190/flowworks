import { describe, expect, it } from "vitest";
import { getIssueKeyNumber, sortBacklogIssues } from "./issue";
import type { Issue } from "../types/models";

function issue(patch: Partial<Issue>): Issue {
  return {
    id: patch.id ?? "id",
    workspaceId: "wks",
    projectId: "prj",
    issueKey: patch.issueKey ?? "FLOW-1",
    type: "TASK",
    title: patch.title ?? "Task",
    status: patch.status ?? "TODO",
    priority: patch.priority ?? "MEDIUM",
    reporterId: "usr",
    labels: [],
    commentCount: 0,
    attachmentCount: 0,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...patch
  };
}

describe("issue helpers", () => {
  it("parses Jira-style issue numbers", () => {
    expect(getIssueKeyNumber("FLOW-42")).toBe(42);
  });

  it("sorts backlog by priority and issue key", () => {
    const sorted = sortBacklogIssues([
      issue({ issueKey: "FLOW-3", priority: "LOW" }),
      issue({ issueKey: "FLOW-2", priority: "CRITICAL" }),
      issue({ issueKey: "FLOW-1", priority: "CRITICAL" })
    ]);
    expect(sorted.map((item) => item.issueKey)).toEqual(["FLOW-1", "FLOW-2", "FLOW-3"]);
  });
});
