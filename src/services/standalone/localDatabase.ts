import type {
  ActivityLog,
  BootstrapPayload,
  Integration,
  Issue,
  IssueComment,
  Message,
  NotificationItem,
  Project,
  Room,
  RoomMember,
  Sprint,
  Task,
  User,
  Workspace,
  WorkspaceMember
} from "../../types/models";

const DB_KEY = "flowworks.standalone.db.v1";
const SESSION_KEY = "flowworks.standalone.session";
const now = () => new Date().toISOString();
const randomId = () => globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10);
const id = (prefix: string) => `${prefix}_${randomId()}`;

interface StandaloneUser extends User {
  password: string;
}

interface StandaloneDb {
  users: StandaloneUser[];
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  rooms: Room[];
  roomMembers: RoomMember[];
  messages: Message[];
  projects: Project[];
  issues: Issue[];
  issueComments: IssueComment[];
  sprints: Sprint[];
  tasks: Task[];
  notifications: NotificationItem[];
  integrations: Integration[];
  activityLogs: ActivityLog[];
}

function seedDb(): StandaloneDb {
  const users: StandaloneUser[] = [
    {
      id: "usr_jae",
      email: "jae@flowworks.local",
      password: "flowworks123!",
      name: "Jae Kim",
      department: "Product",
      position: "Product Lead",
      statusMessage: "Standalone workspace",
      presenceStatus: "ONLINE",
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: "usr_mina",
      email: "mina@flowworks.local",
      password: "flowworks123!",
      name: "Mina Park",
      department: "Engineering",
      position: "Frontend Engineer",
      presenceStatus: "IN_MEETING",
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: "usr_daniel",
      email: "daniel@flowworks.local",
      password: "flowworks123!",
      name: "Daniel Lee",
      department: "Design",
      position: "Product Designer",
      presenceStatus: "AWAY",
      createdAt: now(),
      updatedAt: now()
    }
  ];
  const workspace: Workspace = { id: "wks_flow", name: "FlowWorks Local", ownerId: "usr_jae", createdAt: now(), updatedAt: now() };
  const project: Project = {
    id: "prj_flow",
    workspaceId: workspace.id,
    key: "FLOW",
    name: "Offline MVP",
    description: "A no-server FlowWorks workspace that runs on this device.",
    color: "#2563eb",
    leadId: "usr_jae",
    createdAt: now(),
    updatedAt: now()
  };
  const rooms: Room[] = [
    { id: "room_general", workspaceId: workspace.id, type: "CHANNEL", name: "general", lastMessageId: "msg_2", createdBy: "usr_jae", createdAt: now(), updatedAt: now() },
    { id: "room_project_flow", workspaceId: workspace.id, projectId: project.id, type: "PROJECT", name: "project-flow", lastMessageId: "msg_3", createdBy: "usr_jae", createdAt: now(), updatedAt: now() }
  ];
  const issues: Issue[] = [
    {
      id: "iss_flow_1",
      workspaceId: workspace.id,
      projectId: project.id,
      issueKey: "FLOW-1",
      type: "STORY",
      title: "Installable mobile workspace",
      description: "Run FlowWorks as a PWA without a backend server.",
      status: "IN_REVIEW",
      priority: "HIGH",
      reporterId: "usr_jae",
      assigneeId: "usr_mina",
      sprintId: "spr_1",
      storyPoints: 5,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      labels: ["pwa", "offline"],
      commentCount: 1,
      attachmentCount: 0,
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: "iss_flow_2",
      workspaceId: workspace.id,
      projectId: project.id,
      issueKey: "FLOW-2",
      type: "TASK",
      title: "Local-first chat and issue data",
      description: "Store messages, issues, sprints, and tasks on the device.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      reporterId: "usr_jae",
      assigneeId: "usr_jae",
      sprintId: "spr_1",
      labels: ["local-db"],
      commentCount: 0,
      attachmentCount: 0,
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: "iss_flow_3",
      workspaceId: workspace.id,
      projectId: project.id,
      issueKey: "FLOW-3",
      type: "BUG",
      title: "Offline queue should never block sending",
      status: "TODO",
      priority: "MEDIUM",
      reporterId: "usr_mina",
      assigneeId: "usr_daniel",
      labels: ["chat"],
      commentCount: 0,
      attachmentCount: 0,
      createdAt: now(),
      updatedAt: now()
    }
  ];
  return {
    users,
    workspaces: [workspace],
    workspaceMembers: users.map((user, index) => ({
      id: id("wm"),
      workspaceId: workspace.id,
      userId: user.id,
      role: index === 0 ? "OWNER" : index === 1 ? "PROJECT_MANAGER" : "MEMBER",
      joinedAt: now()
    })),
    rooms,
    roomMembers: rooms.flatMap((room) =>
      users.map((user) => ({ id: id("rm"), roomId: room.id, userId: user.id, role: "MEMBER", muted: false, pinned: room.id === "room_general", joinedAt: now() }))
    ),
    messages: [
      { id: "msg_1", roomId: "room_general", senderId: "usr_jae", type: "TEXT", content: "FlowWorks now works without opening a backend server.", createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
      { id: "msg_2", roomId: "room_general", senderId: "usr_mina", type: "TEXT", content: "@Jae Kim FLOW-1 is ready to install on iPhone and Android as a PWA.", linkedIssueId: "iss_flow_1", createdAt: new Date(Date.now() - 1000 * 60 * 24).toISOString() },
      { id: "msg_3", roomId: "room_project_flow", senderId: "usr_daniel", type: "TEXT", content: "Design checked on mobile widths. Board and chat are usable offline.", createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString() }
    ],
    projects: [project],
    issues,
    issueComments: [{ id: id("ic"), issueId: "iss_flow_1", authorId: "usr_jae", content: "PWA manifest and service worker are required for install.", createdAt: now(), updatedAt: now() }],
    sprints: [{ id: "spr_1", workspaceId: workspace.id, projectId: project.id, name: "Standalone Sprint", goal: "No-server installable app", status: "ACTIVE", startDate: now(), endDate: new Date(Date.now() + 86400000 * 10).toISOString(), createdAt: now(), updatedAt: now() }],
    tasks: [{ id: "tsk_1", workspaceId: workspace.id, roomId: "room_general", messageId: "msg_2", issueId: "iss_flow_1", title: "Install FlowWorks on phone", assigneeId: "usr_jae", status: "IN_PROGRESS", createdBy: "usr_mina", createdAt: now(), updatedAt: now() }],
    notifications: [{ id: id("noti"), workspaceId: workspace.id, userId: "usr_jae", type: "PWA_READY", title: "Standalone app ready", body: "FlowWorks can run from this device without a backend server.", read: false, createdAt: now() }],
    integrations: [{ id: "int_jira", workspaceId: workspace.id, provider: "JIRA", name: "Jira Mock", status: "DISCONNECTED", createdBy: "usr_jae", createdAt: now(), updatedAt: now() }],
    activityLogs: [{ id: id("act"), workspaceId: workspace.id, actorId: "usr_jae", entityType: "APP", entityId: "standalone", action: "STANDALONE_READY", createdAt: now() }]
  };
}

function readDb(): StandaloneDb {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = seedDb();
    writeDb(seeded);
    return seeded;
  }
  return JSON.parse(raw) as StandaloneDb;
}

function writeDb(db: StandaloneDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function safeUser(user: StandaloneUser): User {
  const { password: _password, ...rest } = user;
  return rest;
}

function currentUser(db: StandaloneDb) {
  const userId = localStorage.getItem(SESSION_KEY);
  const user = db.users.find((item) => item.id === userId);
  if (!user) throw new Error("Not logged in");
  return user;
}

export const standaloneApi = {
  async login(email: string, password: string) {
    const db = readDb();
    const user = db.users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
    if (!user) throw new Error("Invalid email or password");
    user.presenceStatus = "ONLINE";
    user.updatedAt = now();
    writeDb(db);
    localStorage.setItem(SESSION_KEY, user.id);
    return { accessToken: `standalone.${user.id}`, refreshToken: `standalone.refresh.${user.id}`, user: safeUser(user) };
  },
  async register(input: { email: string; password: string; name: string; workspaceName: string }) {
    const db = readDb();
    if (db.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) throw new Error("Email already exists");
    const user: StandaloneUser = { id: id("usr"), email: input.email, password: input.password, name: input.name, presenceStatus: "ONLINE", createdAt: now(), updatedAt: now() };
    const workspace: Workspace = { id: id("wks"), name: input.workspaceName, ownerId: user.id, createdAt: now(), updatedAt: now() };
    const project: Project = { id: id("prj"), workspaceId: workspace.id, key: "APP", name: "App Launch", color: "#2563eb", leadId: user.id, createdAt: now(), updatedAt: now() };
    const room: Room = { id: id("room"), workspaceId: workspace.id, projectId: project.id, type: "PROJECT", name: "project-app", createdBy: user.id, createdAt: now(), updatedAt: now() };
    db.users.push(user);
    db.workspaces.push(workspace);
    db.workspaceMembers.push({ id: id("wm"), workspaceId: workspace.id, userId: user.id, role: "OWNER", joinedAt: now() });
    db.projects.push(project);
    db.rooms.push(room);
    db.roomMembers.push({ id: id("rm"), roomId: room.id, userId: user.id, role: "MEMBER", muted: false, pinned: true, joinedAt: now() });
    writeDb(db);
    localStorage.setItem(SESSION_KEY, user.id);
    return { accessToken: `standalone.${user.id}`, refreshToken: `standalone.refresh.${user.id}`, user: safeUser(user) };
  },
  async bootstrap(): Promise<BootstrapPayload> {
    const db = readDb();
    const user = currentUser(db);
    const memberships = db.workspaceMembers.filter((member) => member.userId === user.id);
    const workspaceIds = memberships.map((member) => member.workspaceId);
    const roomIds = db.roomMembers.filter((member) => member.userId === user.id).map((member) => member.roomId);
    return {
      user: safeUser(user),
      workspaces: db.workspaces.filter((workspace) => workspaceIds.includes(workspace.id)),
      workspaceMembers: db.workspaceMembers.filter((member) => workspaceIds.includes(member.workspaceId)),
      users: db.users.filter((item) => db.workspaceMembers.some((member) => member.userId === item.id && workspaceIds.includes(member.workspaceId))).map(safeUser),
      rooms: db.rooms.filter((room) => roomIds.includes(room.id)),
      roomMembers: db.roomMembers.filter((member) => roomIds.includes(member.roomId)),
      messages: db.messages.filter((message) => roomIds.includes(message.roomId) && !message.deletedAt),
      projects: db.projects.filter((project) => workspaceIds.includes(project.workspaceId)),
      issues: db.issues.filter((issue) => workspaceIds.includes(issue.workspaceId) && !issue.deletedAt),
      issueComments: db.issueComments.filter((comment) => !comment.deletedAt),
      sprints: db.sprints.filter((sprint) => workspaceIds.includes(sprint.workspaceId)),
      tasks: db.tasks.filter((task) => workspaceIds.includes(task.workspaceId)),
      notifications: db.notifications.filter((notification) => notification.userId === user.id),
      integrations: db.integrations.filter((integration) => workspaceIds.includes(integration.workspaceId)),
      activityLogs: db.activityLogs.filter((activity) => workspaceIds.includes(activity.workspaceId))
    };
  },
  async sendMessage(roomId: string, content: string, metadata?: Record<string, unknown>) {
    const db = readDb();
    const user = currentUser(db);
    const message: Message = { id: id("msg"), roomId, senderId: user.id, type: metadata ? "FILE" : "TEXT", content, metadata, createdAt: now() };
    db.messages.push(message);
    const room = db.rooms.find((item) => item.id === roomId);
    if (room) {
      room.lastMessageId = message.id;
      room.updatedAt = now();
    }
    writeDb(db);
    return message;
  },
  async updateMessage(messageId: string, content: string) {
    const db = readDb();
    const user = currentUser(db);
    const message = db.messages.find((item) => item.id === messageId && item.senderId === user.id && !item.deletedAt);
    if (!message) throw new Error("Message not found");
    message.content = content;
    message.editedAt = now();
    writeDb(db);
    return message;
  },
  async deleteMessage(messageId: string) {
    const db = readDb();
    const user = currentUser(db);
    const message = db.messages.find((item) => item.id === messageId && item.senderId === user.id && !item.deletedAt);
    if (!message) throw new Error("Message not found");
    message.deletedAt = now();
    writeDb(db);
    return message;
  },
  async createIssueFromMessage(messageId: string, title?: string) {
    const db = readDb();
    const user = currentUser(db);
    const message = db.messages.find((item) => item.id === messageId);
    if (!message) throw new Error("Message not found");
    const room = db.rooms.find((item) => item.id === message.roomId);
    const project = db.projects.find((item) => item.id === room?.projectId) ?? db.projects.find((item) => item.workspaceId === room?.workspaceId);
    if (!room || !project) throw new Error("Project context not found");
    const nextNumber = db.issues.filter((issue) => issue.projectId === project.id).length + 1;
    const issue: Issue = {
      id: id("iss"),
      workspaceId: project.workspaceId,
      projectId: project.id,
      issueKey: `${project.key}-${nextNumber}`,
      type: "TASK",
      title: title || message.content.slice(0, 80),
      description: `Created from message: ${message.content}`,
      status: "TODO",
      priority: "MEDIUM",
      reporterId: user.id,
      labels: ["from-chat"],
      commentCount: 0,
      attachmentCount: 0,
      createdAt: now(),
      updatedAt: now()
    };
    message.linkedIssueId = issue.id;
    message.type = "ISSUE";
    db.issues.push(issue);
    writeDb(db);
    return issue;
  },
  async createTaskFromMessage(messageId: string) {
    const db = readDb();
    const user = currentUser(db);
    const message = db.messages.find((item) => item.id === messageId);
    const room = db.rooms.find((item) => item.id === message?.roomId);
    if (!message || !room) throw new Error("Message not found");
    const task: Task = { id: id("tsk"), workspaceId: room.workspaceId, roomId: room.id, messageId, title: message.content.slice(0, 80), status: "TODO", createdBy: user.id, createdAt: now(), updatedAt: now() };
    db.tasks.push(task);
    writeDb(db);
    return task;
  },
  async createIssue(input: Partial<Issue> & Pick<Issue, "workspaceId" | "projectId" | "title">) {
    const db = readDb();
    const user = currentUser(db);
    const project = db.projects.find((item) => item.id === input.projectId);
    if (!project) throw new Error("Project not found");
    const nextNumber = db.issues.filter((issue) => issue.projectId === project.id).length + 1;
    const issue: Issue = {
      id: id("iss"),
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      issueKey: `${project.key}-${nextNumber}`,
      type: input.type ?? "TASK",
      title: input.title,
      description: input.description,
      status: input.status ?? "TODO",
      priority: input.priority ?? "MEDIUM",
      reporterId: user.id,
      assigneeId: input.assigneeId,
      sprintId: input.sprintId,
      dueDate: input.dueDate,
      labels: input.labels ?? [],
      commentCount: 0,
      attachmentCount: 0,
      createdAt: now(),
      updatedAt: now()
    };
    db.issues.push(issue);
    writeDb(db);
    return issue;
  },
  async updateIssue(issueId: string, patch: Partial<Issue>) {
    const db = readDb();
    const issue = db.issues.find((item) => item.id === issueId);
    if (!issue) throw new Error("Issue not found");
    Object.assign(issue, patch, { updatedAt: now() });
    writeDb(db);
    return issue;
  },
  async addIssueComment(issueId: string, content: string) {
    const db = readDb();
    const user = currentUser(db);
    const issue = db.issues.find((item) => item.id === issueId);
    if (!issue) throw new Error("Issue not found");
    const comment: IssueComment = { id: id("ic"), issueId, authorId: user.id, content, createdAt: now(), updatedAt: now() };
    db.issueComments.push(comment);
    issue.commentCount += 1;
    issue.updatedAt = now();
    writeDb(db);
    return comment;
  },
  async markNotificationRead(notificationId: string) {
    const db = readDb();
    const notification = db.notifications.find((item) => item.id === notificationId);
    if (!notification) throw new Error("Notification not found");
    notification.read = true;
    writeDb(db);
    return notification;
  },
  async connectJira(input: { workspaceId: string }) {
    const db = readDb();
    const integration = db.integrations.find((item) => item.workspaceId === input.workspaceId && item.provider === "JIRA");
    if (integration) {
      integration.status = "CONNECTED";
      integration.updatedAt = now();
    }
    writeDb(db);
    return { status: "CONNECTED" };
  },
  async jiraProjects() {
    return [
      { id: "mock-1", key: "FW", name: "FlowWorks Mock" },
      { id: "mock-2", key: "MOB", name: "Mobile App Mock" }
    ];
  },
  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
  exportBackup() {
    return JSON.stringify({ exportedAt: now(), version: 1, db: readDb() }, null, 2);
  },
  importBackup(raw: string) {
    const parsed = JSON.parse(raw) as { db?: StandaloneDb };
    if (!parsed.db?.users || !parsed.db?.workspaces || !parsed.db?.messages) throw new Error("Invalid FlowWorks backup");
    writeDb(parsed.db);
    const firstUser = parsed.db.users[0];
    if (firstUser) localStorage.setItem(SESSION_KEY, firstUser.id);
    return true;
  },
  reset() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
};

export function hasStandaloneSession() {
  return Boolean(localStorage.getItem(SESSION_KEY));
}
