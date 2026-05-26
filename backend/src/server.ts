import cors from "cors";
import express from "express";
import http from "node:http";
import rateLimit from "express-rate-limit";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { FlowRepository } from "./repository";
import { encryptSecret, requireWorkspaceRole, sanitizeUser, signAccessToken, signRefreshToken, verifyAccessToken, verifyPassword, hashPassword, type AuthClaims } from "./security";
import { createJiraProvider, type JiraConnectionConfig } from "./integrations/jira/JiraProvider";
import type { IssuePriority, IssueStatus, Role } from "./types";

interface RealtimeEvent {
  type: string;
  roomId?: string;
  payload?: unknown;
  ackId?: unknown;
}

const app = express();
const server = http.createServer(app);
const repo = new FlowRepository();
const jiraProvider = createJiraProvider();
await repo.initialize();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, max: 240 }));

function asyncRoute(handler: express.RequestHandler): express.RequestHandler {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function auth(req: express.Request, _res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return next(Object.assign(new Error("Missing bearer token"), { status: 401 }));
  try {
    (req as express.Request & { claims: AuthClaims }).claims = verifyAccessToken(token);
    next();
  } catch {
    next(Object.assign(new Error("Invalid token"), { status: 401 }));
  }
}

function claims(req: express.Request) {
  return (req as express.Request & { claims: AuthClaims }).claims;
}

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "FlowWorks API" }));
app.get("/api/docs", (_req, res) => {
  res.json({
    name: "FlowWorks Free API",
    storage: "local-json",
    cost: "free",
    auth: "Bearer JWT",
    websocket: "/ws?token=<accessToken>",
    resources: [
      "/api/auth/login",
      "/api/auth/register",
      "/api/bootstrap",
      "/api/workspaces",
      "/api/workspaces/:workspaceId/members",
      "/api/rooms",
      "/api/rooms/:roomId/messages",
      "/api/projects",
      "/api/issues",
      "/api/sprints",
      "/api/tasks",
      "/api/attachments",
      "/api/notifications",
      "/api/integrations/jira/*",
      "/api/webhooks/:workspaceId/:eventType"
    ]
  });
});

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const input = z.object({ email: z.string().email(), password: z.string().min(8) }).parse(req.body);
  const user = repo.users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  user.presenceStatus = "ONLINE";
  repo.save();
  const authClaims = { sub: user.id, email: user.email, roles: repo.rolesForUser(user.id) };
  res.json({ accessToken: signAccessToken(authClaims), refreshToken: signRefreshToken(user.id), user: sanitizeUser(user) });
}));

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const input = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    workspaceName: z.string().min(2).default("New Workspace")
  }).parse(req.body);
  if (repo.users.some((user) => user.email === input.email)) return res.status(409).json({ message: "Email already exists" });
  const user = {
    id: `usr_${Date.now()}`,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    name: input.name,
    presenceStatus: "ONLINE" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const workspace = {
    id: `wks_${Date.now()}`,
    name: input.workspaceName,
    ownerId: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  repo.users.push(user);
  repo.workspaces.push(workspace);
  repo.workspaceMembers.push({ id: `wm_${Date.now()}`, workspaceId: workspace.id, userId: user.id, role: "OWNER", joinedAt: new Date().toISOString() });
  repo.save();
  const authClaims = { sub: user.id, email: user.email, roles: repo.rolesForUser(user.id) };
  res.status(201).json({ accessToken: signAccessToken(authClaims), refreshToken: signRefreshToken(user.id), user: sanitizeUser(user) });
}));

app.get("/api/bootstrap", auth, asyncRoute(async (req, res) => {
  res.json(repo.bootstrap(claims(req).sub));
}));

app.get("/api/workspaces", auth, (req, res) => {
  const workspaceIds = repo.workspaceMembers.filter((member) => member.userId === claims(req).sub).map((member) => member.workspaceId);
  res.json(repo.workspaces.filter((workspace) => workspaceIds.includes(workspace.id)));
});

app.post("/api/workspaces", auth, (req, res) => {
  const input = z.object({ name: z.string().min(2).max(80), logoUrl: z.string().url().optional() }).parse(req.body);
  const workspace = repo.createWorkspace(claims(req).sub, input.name, input.logoUrl);
  res.status(201).json(workspace);
});

app.patch("/api/workspaces/:workspaceId", auth, (req, res) => {
  const workspaceId = String(req.params.workspaceId);
  requireWorkspaceRole(claims(req), workspaceId, ["OWNER", "ADMIN"]);
  const input = z.object({ name: z.string().min(2).max(80).optional(), logoUrl: z.string().url().optional() }).parse(req.body);
  res.json(repo.updateWorkspace(workspaceId, input));
});

app.get("/api/workspaces/:workspaceId/members", auth, (req, res) => {
  const workspaceId = String(req.params.workspaceId);
  requireWorkspaceRole(claims(req), workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER", "GUEST"]);
  res.json(repo.workspaceMembers.filter((member) => member.workspaceId === workspaceId));
});

app.post("/api/workspaces/:workspaceId/members", auth, (req, res) => {
  const workspaceId = String(req.params.workspaceId);
  requireWorkspaceRole(claims(req), workspaceId, ["OWNER", "ADMIN"]);
  const input = z.object({
    email: z.string().email(),
    name: z.string().min(2).optional(),
    role: z.enum(["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER", "GUEST"]).default("MEMBER")
  }).parse(req.body);
  let user = repo.users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());
  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      email: input.email,
      passwordHash: "",
      name: input.name ?? input.email.split("@")[0],
      presenceStatus: "OFFLINE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    repo.users.push(user);
  }
  const member = repo.inviteMember(workspaceId, user.id, input.role);
  res.status(201).json({ member, user: sanitizeUser(user) });
});

app.patch("/api/workspaces/:workspaceId/members/:userId", auth, (req, res) => {
  const workspaceId = String(req.params.workspaceId);
  requireWorkspaceRole(claims(req), workspaceId, ["OWNER", "ADMIN"]);
  const input = z.object({ role: z.enum(["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER", "GUEST"]) }).parse(req.body);
  res.json(repo.updateMemberRole(workspaceId, String(req.params.userId), input.role));
});

app.get("/api/users", auth, (req, res) => {
  const workspaceIds = repo.workspaceMembers.filter((member) => member.userId === claims(req).sub).map((member) => member.workspaceId);
  const userIds = repo.workspaceMembers.filter((member) => workspaceIds.includes(member.workspaceId)).map((member) => member.userId);
  res.json(repo.users.filter((user) => userIds.includes(user.id)).map(sanitizeUser));
});

app.get("/api/rooms", auth, (req, res) => {
  const workspaceId = z.string().optional().parse(req.query.workspaceId);
  const roomIds = repo.roomMembers.filter((member) => member.userId === claims(req).sub).map((member) => member.roomId);
  res.json(repo.rooms.filter((room) => roomIds.includes(room.id) && (!workspaceId || room.workspaceId === workspaceId)));
});

app.post("/api/rooms", auth, (req, res) => {
  const input = z.object({
    workspaceId: z.string(),
    projectId: z.string().optional(),
    type: z.enum(["DIRECT", "GROUP", "CHANNEL", "NOTICE", "PROJECT"]).default("CHANNEL"),
    name: z.string().min(1).max(80),
    memberIds: z.array(z.string()).default([])
  }).parse(req.body);
  requireWorkspaceRole(claims(req), input.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER"]);
  const room = repo.createRoom({ workspaceId: input.workspaceId, projectId: input.projectId, type: input.type, name: input.name, createdBy: claims(req).sub }, input.memberIds);
  res.status(201).json(room);
});

app.get("/api/rooms/:roomId/messages", auth, (req, res) => {
  const room = repo.rooms.find((item) => item.id === req.params.roomId);
  if (!room) return res.status(404).json({ message: "Room not found" });
  requireWorkspaceRole(claims(req), room.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER", "GUEST"]);
  const cursor = req.query.cursor?.toString();
  const pageSize = Number(req.query.limit ?? 50);
  const all = repo.messages.filter((message) => message.roomId === room.id && !message.deletedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const start = cursor ? Math.max(0, all.findIndex((message) => message.id === cursor) - pageSize) : Math.max(0, all.length - pageSize);
  res.json(all.slice(start, cursor ? all.findIndex((message) => message.id === cursor) : all.length));
});

app.post("/api/rooms/:roomId/messages", auth, (req, res) => {
  const input = z.object({ content: z.string().min(1).max(4000), type: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM", "TASK", "NOTICE", "ISSUE"]).default("TEXT"), replyToMessageId: z.string().optional(), metadata: z.record(z.unknown()).optional() }).parse(req.body);
  const room = repo.rooms.find((item) => item.id === req.params.roomId);
  if (!room) return res.status(404).json({ message: "Room not found" });
  requireWorkspaceRole(claims(req), room.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER", "GUEST"]);
  const message = repo.createMessage({ roomId: room.id, senderId: claims(req).sub, content: input.content, type: input.type, replyToMessageId: input.replyToMessageId, metadata: input.metadata });
  broadcast({ type: "message_created", payload: message, roomId: room.id });
  res.status(201).json(message);
});

app.patch("/api/messages/:messageId", auth, (req, res) => {
  const input = z.object({ content: z.string().min(1).max(4000) }).parse(req.body);
  const message = repo.messages.find((item) => item.id === req.params.messageId);
  if (!message || message.senderId !== claims(req).sub) return res.status(404).json({ message: "Message not found" });
  message.content = input.content;
  message.editedAt = new Date().toISOString();
  repo.save();
  broadcast({ type: "message_updated", payload: message, roomId: message.roomId });
  res.json(message);
});

app.delete("/api/messages/:messageId", auth, (req, res) => {
  const message = repo.messages.find((item) => item.id === req.params.messageId);
  if (!message || message.senderId !== claims(req).sub) return res.status(404).json({ message: "Message not found" });
  message.deletedAt = new Date().toISOString();
  repo.save();
  broadcast({ type: "message_deleted", payload: message, roomId: message.roomId });
  res.status(204).end();
});

app.post("/api/rooms/:roomId/read", auth, (req, res) => {
  const input = z.object({ messageId: z.string() }).parse(req.body);
  const membership = repo.roomMembers.find((member) => member.roomId === req.params.roomId && member.userId === claims(req).sub);
  if (!membership) return res.status(404).json({ message: "Room membership not found" });
  membership.lastReadMessageId = input.messageId;
  repo.save();
  broadcast({ type: "message_read", roomId: String(req.params.roomId), payload: { userId: claims(req).sub, messageId: input.messageId } });
  res.json(membership);
});

app.post("/api/messages/:messageId/issue", auth, (req, res) => {
  const issue = repo.createIssueFromMessage(String(req.params.messageId), claims(req).sub, req.body);
  broadcast({ type: "issue_created", payload: issue });
  res.status(201).json(issue);
});

app.post("/api/messages/:messageId/task", auth, (req, res) => {
  const task = repo.createTaskFromMessage(String(req.params.messageId), claims(req).sub);
  res.status(201).json(task);
});

app.post("/api/issues", auth, (req, res) => {
  const input = z.object({
    workspaceId: z.string(),
    projectId: z.string(),
    title: z.string().min(2),
    description: z.string().optional(),
    type: z.enum(["EPIC", "STORY", "TASK", "BUG", "IMPROVEMENT", "SUB_TASK", "MEETING", "DECISION"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]).optional(),
    assigneeId: z.string().optional(),
    sprintId: z.string().optional(),
    dueDate: z.string().optional()
  }).parse(req.body);
  requireWorkspaceRole(claims(req), input.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER"]);
  const issue = repo.createIssue({ ...input, reporterId: claims(req).sub, labels: [] });
  broadcast({ type: "issue_created", payload: issue });
  res.status(201).json(issue);
});

app.get("/api/projects", auth, (req, res) => {
  const workspaceId = z.string().optional().parse(req.query.workspaceId);
  const workspaceIds = repo.workspaceMembers.filter((member) => member.userId === claims(req).sub).map((member) => member.workspaceId);
  res.json(repo.projects.filter((project) => workspaceIds.includes(project.workspaceId) && (!workspaceId || project.workspaceId === workspaceId)));
});

app.post("/api/projects", auth, (req, res) => {
  const input = z.object({
    workspaceId: z.string(),
    key: z.string().regex(/^[A-Z][A-Z0-9]{1,9}$/i),
    name: z.string().min(2).max(100),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().default("#2563eb"),
    leadId: z.string().optional()
  }).parse(req.body);
  requireWorkspaceRole(claims(req), input.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER"]);
  const project = repo.createProject({ ...input, leadId: input.leadId ?? claims(req).sub });
  res.status(201).json(project);
});

app.patch("/api/projects/:projectId", auth, (req, res) => {
  const project = repo.projects.find((item) => item.id === req.params.projectId);
  if (!project) return res.status(404).json({ message: "Project not found" });
  requireWorkspaceRole(claims(req), project.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER"]);
  const input = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    leadId: z.string().optional()
  }).parse(req.body);
  res.json(repo.updateProject(project.id, input));
});

app.get("/api/issues", auth, (req, res) => {
  const workspaceId = z.string().optional().parse(req.query.workspaceId);
  const projectId = z.string().optional().parse(req.query.projectId);
  const status = z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE", "ARCHIVED"]).optional().parse(req.query.status);
  const assigneeId = z.string().optional().parse(req.query.assigneeId);
  const q = z.string().optional().parse(req.query.q)?.toLowerCase();
  const workspaceIds = repo.workspaceMembers.filter((member) => member.userId === claims(req).sub).map((member) => member.workspaceId);
  res.json(repo.issues.filter((issue) =>
    !issue.deletedAt &&
    workspaceIds.includes(issue.workspaceId) &&
    (!workspaceId || issue.workspaceId === workspaceId) &&
    (!projectId || issue.projectId === projectId) &&
    (!status || issue.status === status) &&
    (!assigneeId || issue.assigneeId === assigneeId) &&
    (!q || issue.title.toLowerCase().includes(q) || issue.issueKey.toLowerCase().includes(q))
  ));
});

app.patch("/api/issues/:issueId", auth, (req, res) => {
  const issue = repo.issues.find((item) => item.id === req.params.issueId);
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  requireWorkspaceRole(claims(req), issue.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER"]);
  const updated = repo.updateIssue(issue.id, req.body, claims(req).sub);
  broadcast({ type: "issue_updated", payload: updated });
  res.json(updated);
});

app.post("/api/issues/:issueId/comments", auth, (req, res) => {
  const input = z.object({ content: z.string().min(1).max(4000) }).parse(req.body);
  const comment = repo.addIssueComment(String(req.params.issueId), claims(req).sub, input.content);
  broadcast({ type: "issue_commented", payload: comment });
  res.status(201).json(comment);
});

app.get("/api/issues/:issueId/comments", auth, (req, res) => {
  const issue = repo.issues.find((item) => item.id === req.params.issueId);
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  requireWorkspaceRole(claims(req), issue.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER", "GUEST"]);
  res.json(repo.issueComments.filter((comment) => comment.issueId === issue.id && !comment.deletedAt));
});

app.post("/api/sprints", auth, (req, res) => {
  const input = z.object({ workspaceId: z.string(), projectId: z.string(), name: z.string().min(2), goal: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() }).parse(req.body);
  requireWorkspaceRole(claims(req), input.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER"]);
  const sprint = repo.createSprint(input);
  res.status(201).json(sprint);
});

app.get("/api/sprints", auth, (req, res) => {
  const workspaceId = z.string().optional().parse(req.query.workspaceId);
  const projectId = z.string().optional().parse(req.query.projectId);
  const workspaceIds = repo.workspaceMembers.filter((member) => member.userId === claims(req).sub).map((member) => member.workspaceId);
  res.json(repo.sprints.filter((sprint) => workspaceIds.includes(sprint.workspaceId) && (!workspaceId || sprint.workspaceId === workspaceId) && (!projectId || sprint.projectId === projectId)));
});

app.patch("/api/sprints/:sprintId", auth, (req, res) => {
  const sprint = repo.sprints.find((item) => item.id === req.params.sprintId);
  if (!sprint) return res.status(404).json({ message: "Sprint not found" });
  requireWorkspaceRole(claims(req), sprint.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER"]);
  const input = z.object({
    name: z.string().min(2).optional(),
    goal: z.string().optional(),
    status: z.enum(["PLANNED", "ACTIVE", "COMPLETED"]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  }).parse(req.body);
  res.json(repo.updateSprint(sprint.id, input));
});

app.get("/api/tasks", auth, (req, res) => {
  const workspaceId = z.string().optional().parse(req.query.workspaceId);
  const assigneeId = z.string().optional().parse(req.query.assigneeId);
  const workspaceIds = repo.workspaceMembers.filter((member) => member.userId === claims(req).sub).map((member) => member.workspaceId);
  res.json(repo.tasks.filter((task) => workspaceIds.includes(task.workspaceId) && (!workspaceId || task.workspaceId === workspaceId) && (!assigneeId || task.assigneeId === assigneeId)));
});

app.post("/api/tasks", auth, (req, res) => {
  const input = z.object({
    workspaceId: z.string(),
    title: z.string().min(1).max(160),
    description: z.string().optional(),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional(),
    roomId: z.string().optional(),
    messageId: z.string().optional(),
    issueId: z.string().optional()
  }).parse(req.body);
  requireWorkspaceRole(claims(req), input.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER"]);
  res.status(201).json(repo.createTask({ ...input, createdBy: claims(req).sub }));
});

app.patch("/api/tasks/:taskId", auth, (req, res) => {
  const task = repo.tasks.find((item) => item.id === req.params.taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });
  requireWorkspaceRole(claims(req), task.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER"]);
  const input = z.object({
    title: z.string().min(1).max(160).optional(),
    description: z.string().optional(),
    assigneeId: z.string().optional(),
    status: z.string().optional(),
    dueDate: z.string().optional()
  }).parse(req.body);
  res.json(repo.updateTask(task.id, input));
});

app.get("/api/attachments", auth, (req, res) => {
  const workspaceId = z.string().optional().parse(req.query.workspaceId);
  const workspaceIds = repo.workspaceMembers.filter((member) => member.userId === claims(req).sub).map((member) => member.workspaceId);
  res.json(repo.attachments.filter((attachment) => workspaceIds.includes(attachment.workspaceId) && (!workspaceId || attachment.workspaceId === workspaceId)));
});

app.post("/api/attachments", auth, (req, res) => {
  const input = z.object({
    workspaceId: z.string(),
    messageId: z.string().optional(),
    issueId: z.string().optional(),
    fileName: z.string().min(1).max(200),
    fileUrl: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.number().int().positive().max(Number(process.env.MAX_UPLOAD_MB ?? 25) * 1024 * 1024)
  }).parse(req.body);
  requireWorkspaceRole(claims(req), input.workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER"]);
  res.status(201).json(repo.createAttachment({ ...input, uploaderId: claims(req).sub }));
});

app.get("/api/notifications", auth, (req, res) => {
  res.json(repo.notifications.filter((notification) => notification.userId === claims(req).sub));
});

app.patch("/api/notifications/:notificationId/read", auth, (req, res) => {
  const notification = repo.notifications.find((item) => item.id === req.params.notificationId && item.userId === claims(req).sub);
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  notification.read = true;
  repo.save();
  res.json(notification);
});

app.patch("/api/notifications/read-all", auth, (req, res) => {
  const notifications = repo.notifications.filter((notification) => notification.userId === claims(req).sub);
  notifications.forEach((notification) => {
    notification.read = true;
  });
  repo.save();
  res.json({ updated: notifications.length });
});

app.post("/api/integrations/jira/connect", auth, asyncRoute(async (req, res) => {
  const input = z.object({ workspaceId: z.string(), cloudUrl: z.string().url(), email: z.string().email(), apiToken: z.string().min(8) }).parse(req.body);
  requireWorkspaceRole(claims(req), input.workspaceId, ["OWNER", "ADMIN"]);
  const config: JiraConnectionConfig = { cloudUrl: input.cloudUrl, email: input.email, apiToken: input.apiToken };
  await jiraProvider.testConnection(config);
  const integration = repo.integrations.find((item) => item.workspaceId === input.workspaceId && item.provider === "JIRA");
  if (integration) {
    integration.status = "CONNECTED";
    integration.updatedAt = new Date().toISOString();
    Object.assign(integration, { encryptedConfig: encryptSecret(JSON.stringify(config)) });
  }
  repo.save();
  res.json({ status: "CONNECTED", integration });
}));

app.get("/api/integrations/jira/projects", auth, asyncRoute(async (req, res) => {
  const workspaceId = z.string().parse(String(req.query.workspaceId ?? ""));
  requireWorkspaceRole(claims(req), workspaceId, ["OWNER", "ADMIN", "PROJECT_MANAGER", "MEMBER"]);
  const projects = await jiraProvider.listProjects({ cloudUrl: "https://example.atlassian.net", email: "mock@example.com", apiToken: "mock-token" });
  res.json(projects);
}));

app.post("/api/webhooks/:workspaceId/:eventType", (req, res) => {
  const workspaceId = String(req.params.workspaceId);
  const signature = req.header("x-flowworks-secret");
  const webhook = repo.integrations.find((item) => item.workspaceId === workspaceId);
  if (!signature || !webhook) return res.status(401).json({ message: "Invalid webhook" });
  repo.activityLogs.push({ id: `act_${Date.now()}`, workspaceId, actorId: "external", entityType: "WEBHOOK", entityId: String(req.params.eventType), action: "WEBHOOK_RECEIVED", metadata: req.body, createdAt: new Date().toISOString() });
  repo.save();
  res.status(202).json({ accepted: true });
});

app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(error.status ?? 500).json({ message: error.message ?? "Unexpected error" });
});

const clients = new Set<{ userId: string; rooms: Set<string>; send: (data: unknown) => void }>();
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcast(data: RealtimeEvent) {
  for (const client of clients) {
    if (!data.roomId || client.rooms.has(data.roomId)) client.send(data);
  }
}

wss.on("connection", (socket, req) => {
  try {
    const token = new URL(req.url ?? "", "http://localhost").searchParams.get("token");
    if (!token) throw new Error("Missing token");
    const verified = verifyAccessToken(token);
    const client = {
      userId: verified.sub,
      rooms: new Set<string>(),
      send: (data: unknown) => socket.readyState === socket.OPEN && socket.send(JSON.stringify(data))
    };
    clients.add(client);
    client.send({ type: "connect", payload: { userId: verified.sub } });
    socket.on("message", (raw) => {
      const event = JSON.parse(raw.toString()) as { type: string; roomId?: string; payload?: Record<string, unknown> };
      if (event.type === "join_room" && event.roomId) client.rooms.add(event.roomId);
      if (event.type === "leave_room" && event.roomId) client.rooms.delete(event.roomId);
      if (event.type === "typing_start" || event.type === "typing_stop") broadcast({ type: event.type, roomId: event.roomId, payload: { userId: verified.sub } });
      if (event.type === "message_read" && event.roomId) broadcast({ type: "message_read", roomId: event.roomId, payload: { userId: verified.sub, messageId: event.payload?.messageId } });
      if (event.type === "send_message" && event.roomId && typeof event.payload?.content === "string") {
        const message = repo.createMessage({ roomId: event.roomId, senderId: verified.sub, content: event.payload.content });
        broadcast({ type: "message_created", roomId: event.roomId, payload: message, ackId: event.payload.ackId });
      }
      if (event.type === "issue_updated" && typeof event.payload?.id === "string" && typeof event.payload?.status === "string") {
        const issue = repo.moveIssue(event.payload.id, event.payload.status as IssueStatus, verified.sub);
        broadcast({ type: "issue_updated", payload: issue });
      }
    });
    socket.on("close", () => clients.delete(client));
  } catch {
    socket.close(1008, "Unauthorized");
  }
});

const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => {
  console.log(`FlowWorks API listening on http://localhost:${port}`);
});
