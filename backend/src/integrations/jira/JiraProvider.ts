import type { Issue, Project } from "../../types";

export interface JiraConnectionConfig {
  cloudUrl: string;
  email: string;
  apiToken: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  leadName?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  url: string;
}

export interface JiraProvider {
  testConnection(config: JiraConnectionConfig): Promise<boolean>;
  listProjects(config: JiraConnectionConfig): Promise<JiraProject[]>;
  listIssues(config: JiraConnectionConfig, projectKey: string): Promise<JiraIssue[]>;
  createIssue(config: JiraConnectionConfig, issue: Issue): Promise<JiraIssue>;
  transitionIssue(config: JiraConnectionConfig, issueKey: string, status: string): Promise<JiraIssue>;
  addComment(config: JiraConnectionConfig, issueKey: string, body: string): Promise<void>;
}

export class MockJiraProvider implements JiraProvider {
  async testConnection() {
    return true;
  }

  async listProjects(): Promise<JiraProject[]> {
    return [
      { id: "10000", key: "FW", name: "FlowWorks Cloud", leadName: "Jae Kim" },
      { id: "10001", key: "OPS", name: "Operations Board", leadName: "Mina Park" }
    ];
  }

  async listIssues(_config: JiraConnectionConfig, projectKey: string): Promise<JiraIssue[]> {
    return [
      { id: "20001", key: `${projectKey}-28`, title: "Backend token encryption", status: "In Progress", priority: "High", url: `https://example.atlassian.net/browse/${projectKey}-28` },
      { id: "20002", key: `${projectKey}-31`, title: "Webhook retry worker", status: "To Do", priority: "Medium", url: `https://example.atlassian.net/browse/${projectKey}-31` }
    ];
  }

  async createIssue(_config: JiraConnectionConfig, issue: Issue): Promise<JiraIssue> {
    return {
      id: `mock-${issue.id}`,
      key: issue.externalIssueKey ?? `FW-${Date.now().toString().slice(-4)}`,
      title: issue.title,
      status: issue.status,
      priority: issue.priority,
      url: `https://example.atlassian.net/browse/${issue.externalIssueKey ?? "FW-MOCK"}`
    };
  }

  async transitionIssue(_config: JiraConnectionConfig, issueKey: string, status: string): Promise<JiraIssue> {
    return { id: `mock-${issueKey}`, key: issueKey, title: "Mock synced issue", status, priority: "Medium", url: `https://example.atlassian.net/browse/${issueKey}` };
  }

  async addComment() {
    return;
  }
}

export class RealJiraProvider implements JiraProvider {
  private async request<T>(config: JiraConnectionConfig, path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${config.cloudUrl.replace(/\/$/, "")}/rest/api/3${path}`, {
      ...init,
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString("base64")}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init?.headers
      }
    });
    if (!response.ok) {
      throw new Error(`Jira API failed with ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async testConnection(config: JiraConnectionConfig) {
    await this.request(config, "/myself");
    return true;
  }

  async listProjects(config: JiraConnectionConfig): Promise<JiraProject[]> {
    const projects = await this.request<Array<{ id: string; key: string; name: string; lead?: { displayName?: string } }>>(config, "/project/search?maxResults=50");
    return projects.map((project) => ({ id: project.id, key: project.key, name: project.name, leadName: project.lead?.displayName }));
  }

  async listIssues(config: JiraConnectionConfig, projectKey: string): Promise<JiraIssue[]> {
    const data = await this.request<{ issues: Array<{ id: string; key: string; fields: { summary: string; status: { name: string }; priority?: { name: string } } }> }>(
      config,
      `/search?jql=project=${encodeURIComponent(projectKey)}&maxResults=50`
    );
    return data.issues.map((issue) => ({
      id: issue.id,
      key: issue.key,
      title: issue.fields.summary,
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name ?? "Medium",
      url: `${config.cloudUrl.replace(/\/$/, "")}/browse/${issue.key}`
    }));
  }

  async createIssue(): Promise<JiraIssue> {
    throw new Error("Real Jira createIssue is intentionally isolated for MVP wiring.");
  }

  async transitionIssue(): Promise<JiraIssue> {
    throw new Error("Real Jira transitions need workflow transition id mapping.");
  }

  async addComment(config: JiraConnectionConfig, issueKey: string, body: string) {
    await this.request(config, `/issue/${issueKey}/comment`, {
      method: "POST",
      body: JSON.stringify({ body: { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: body }] }] } })
    });
  }
}

export function createJiraProvider(): JiraProvider {
  return process.env.JIRA_PROVIDER === "real" ? new RealJiraProvider() : new MockJiraProvider();
}

export function projectToJiraLabel(project: Project) {
  return `${project.key} - ${project.name}`;
}
