import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FlowRepository } from "./repository";

describe("FlowRepository free persistence", () => {
  it("persists created tasks to a local JSON file", async () => {
    const dataPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "flowworks-")), "flowworks.json");
    const repo = new FlowRepository(dataPath);
    await repo.initialize();

    const task = repo.createTask({
      workspaceId: "wks_flow",
      title: "Persist without paid services",
      createdBy: "usr_jae"
    });

    const reloaded = new FlowRepository(dataPath);
    await reloaded.initialize();

    expect(fs.existsSync(dataPath)).toBe(true);
    expect(reloaded.tasks.some((item) => item.id === task.id)).toBe(true);
  });
});
