import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { hashPassword } from "./security";
import type {
  ActivityLog,
  Attachment,
  BootstrapPayload,
  Integration,
  Issue,
  IssueComment,
  IssuePriority,
  IssueStatus,
  Message,
  Notification,
  Project,
  Role,
  Room,
  RoomMember,
  Sprint,
  Task,
  User,
  Workspace,
  WorkspaceMember
} from "./types";

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${nanoid(10)}`;

interface RepositorySnapshot {
  users: User[];
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
  notifications: Notification[];
  integrations: Integration[];
  attachments: Attachment[];
  activityLogs: ActivityLog[];
}

export class FlowRepository {
  private readonly dataPath: string;
  users: User[] = [];
  workspaces: Workspace[] = [];
  workspaceMembers: WorkspaceMember[] = [];
  rooms: Room[] = [];
  roomMembers: RoomMember[] = [];
  messages: Message[] = [];
  projects: Project[] = [];
  issues: Issue[] = [];
  issueComments: IssueComment[] = [];
  sprints: Sprint[] = [];
  tasks: Task[] = [];
  notifications: Notification[] = [];
  integrations: Integration[] = [];
  attachments: Attachment[] = [];
  activityLogs: ActivityLog[] = [];

  constructor(dataPath = process.env.FLOWWORKS_DATA_PATH ?? path.resolve(process.cwd(), "backend/data/flowworks.json")) {
    this.dataPath = dataPath;
  }

  async initialize() {
    this.loadFromDisk();
    await this.seed();
  }

  loadFromDisk() {
    if (!fs.existsSync(this.dataPath)) return;
    const snapshot = JSON.parse(fs.readFileSync(this.dataPath, "utf8")) as RepositorySnapshot;
    this.users = snapshot.users ?? [];
    this.workspaces = snapshot.workspaces ?? [];
    this.workspaceMembers = snapshot.workspaceMembers ?? [];
    this.rooms = snapshot.rooms ?? [];
    this.roomMembers = snapshot.roomMembers ?? [];
    this.messages = snapshot.messages ?? [];
    this.projects = snapshot.projects ?? [];
    this.issues = snapshot.issues ?? [];
    this.issueComments = snapshot.issueComments ?? [];
    this.sprints = snapshot.sprints ?? [];
    this.tasks = snapshot.tasks ?? [];
    this.notifications = snapshot.notifications ?? [];
    this.integrations = snapshot.integrations ?? [];
    this.attachments = snapshot.attachments ?? [];
    this.activityLogs = snapshot.activityLogs ?? [];
  }

  save() {
    fs.mkdirSync(path.dirname(this.dataPath), { recursive: true });
    const snapshot: RepositorySnapshot = {
      users: this.users,
      workspaces: this.workspaces,
      workspaceMembers: this.workspaceMembers,
      rooms: this.rooms,
      roomMembers: this.roomMembers,
      messages: this.messages,
      projects: this.projects,
      issues: this.issues,
      issueComments: this.issueComments,
      sprints: this.sprints,
      tasks: this.tasks,
      notifications: this.notifications,
      integrations: this.integrations,
      attachments: this.attachments,
      activityLogs: this.activityLogs
    };
    const tempPath = `${this.dataPath}.${process.pid}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(snapshot, null, 2));
    fs.renameSync(tempPath, this.dataPath);
  }

  async seed() {
    if (this.users.length > 0) return;
    const passwordHash = await hashPassword("flowworks123!");
    const userA: User = {
      id: "usr_jae",
      email: "jae@flowworks.local",
      passwordHash,
      name: "Jae Kim",
      department: "Product",
      position: "Product Lead",
      statusMessage: "Sprint planning",
      presenceStatus: "ONLINE",
      createdAt: now(),
      updatedAt: now()
    };
    const userB: User = {
      id: "usr_mina",
      email: "mina@flowworks.local",
      passwordHash,
      name: "Mina Park",
      department: "Engineering",
      position: "Frontend Engineer",
      statusMessage: "Reviewing board updates",
      presenceStatus: "IN_MEETING",
      createdAt: now(),
      updatedAt: now()
    };
    const userC: User = {
      id: "usr_daniel",
      email: "daniel@flowworks.local",
      passwordHash,
      name: "Daniel Lee",
      department: "Design",
      position: "Product Designer",
      presenceStatus: "AWAY",
      createdAt: now(),
      updatedAt: now()
    };
    const workspace: Workspace = {
      id: "wks_flow",
      name: "FlowWorks HQ",
      ownerId: userA.id,
      logoUrl: "",
      createdAt: now(),
      updatedAt: now()
    };
    const project: Project = {
      id: "prj_flow",
      workspaceId: workspace.id,
      key: "FLOW",
      name: "FlowWorks MVP",
      description: "Chat, collaboration, Jira-style project operations in one workspace.",
      icon: "Sparkles",
      color: "#2563eb",
      leadId: userA.id,
      createdAt: now(),
      updatedAt: now()
    };
    const roomGeneral: Room = {
      id: "room_general",
      workspaceId: workspace.id,
      type: "CHANNEL",
      name: "general",
      createdBy: userA.id,
      createdAt: now(),
      updatedAt: now()
    };
    const roomProject: Room = {
      id: "room_project_flow",
      workspaceId: workspace.id,
      projectId: project.id,
      type: "PROJECT",
      name: "project-flow",
      createdBy: userA.id,
      createdAt: now(),
      updatedAt: now()
    };
    const messages: Message[] = [
      {
        id: "msg_1",
        roomId: roomGeneral.id,
        senderId: userA.id,
        type: "TEXT",
        content: "Welcome to FlowWorks. Convert any important chat into an issue, task, notice, or meeting note.",
        createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString()
      },
      {
        id: "msg_2",
        roomId: roomGeneral.id,
        senderId: userB.id,
        type: "TEXT",
        content: "@Jae Kim FLOW-1 board drag and optimistic updates are ready for review.",
        linkedIssueId: "iss_flow_1",
        createdAt: new Date(Date.now() - 1000 * 60 * 32).toISOString()
      },
      {
        id: "msg_3",
        roomId: roomProject.id,
        senderId: userC.id,
        type: "FILE",
        content: "Uploaded design handoff",
        metadata: { fileName: "flowworks-mobile-layout.pdf", size: "2.4 MB" },
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
      }
    ];
    const issues: Issue[] = [
      {
        id: "iss_flow_1",
        workspaceId: workspace.id,
        projectId: project.id,
        issueKey: "FLOW-1",
        type: "STORY",
        title: "Ship responsive chat shell",
        description: "Desktop three-column layout and mobile bottom tabs with safe spacing.",
        status: "IN_REVIEW",
        priority: "HIGH",
        reporterId: userA.id,
        assigneeId: userB.id,
        sprintId: "spr_1",
        storyPoints: 5,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        labels: ["chat", "responsive"],
        commentCount: 2,
        attachmentCount: 1,
        createdAt: now(),
        updatedAt: now()
      },
      {
        id: "iss_flow_2",
        workspaceId: workspace.id,
        projectId: project.id,
        issueKey: "FLOW-2",
        type: "TASK",
        title: "Add Jira integration provider boundary",
        description: "Keep tokens on the backend and allow mock provider replacement.",
        status: "IN_PROGRESS",
        priority: "URGENT",
        reporterId: userA.id,
        assigneeId: userA.id,
        sprintId: "spr_1",
        storyPoints: 3,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
        labels: ["integration", "security"],
        commentCount: 1,
        attachmentCount: 0,
        externalProvider: "JIRA",
        externalIssueKey: "FW-28",
        externalIssueUrl: "https://example.atlassian.net/browse/FW-28",
        createdAt: now(),
        updatedAt: now()
      },
      {
        id: "iss_flow_3",
        workspaceId: workspace.id,
        projectId: project.id,
        issueKey: "FLOW-3",
        type: "BUG",
        title: "Preserve failed message retry queue",
        description: "Offline queue must survive refresh and retry after reconnect.",
        status: "BLOCKED",
        priority: "CRITICAL",
        reporterId: userB.id,
        assigneeId: userA.id,
        labels: ["offline", "websocket"],
        commentCount: 3,
        attachmentCount: 0,
        createdAt: now(),
        updatedAt: now()
      },
      {
        id: "iss_flow_4",
        workspaceId: workspace.id,
        projectId: project.id,
        issueKey: "FLOW-4",
        type: "MEETING",
        title: "Sprint kickoff notes",
        description: "Collect decisions and action items from planning.",
        status: "TODO",
        priority: "MEDIUM",
        reporterId: userC.id,
        assigneeId: userC.id,
        labels: ["meeting"],
        commentCount: 0,
        attachmentCount: 0,
        createdAt: now(),
        updatedAt: now()
      }
    ];
    this.users.push(userA, userB, userC);
    this.workspaces.push(workspace);
    this.workspaceMembers.push(
      { id: id("wm"), workspaceId: workspace.id, userId: userA.id, role: "OWNER", joinedAt: now() },
      { id: id("wm"), workspaceId: workspace.id, userId: userB.id, role: "PROJECT_MANAGER", joinedAt: now() },
      { id: id("wm"), workspaceId: workspace.id, userId: userC.id, role: "MEMBER", joinedAt: now() }
    );
    this.rooms.push(roomGeneral, roomProject);
    this.roomMembers.push(
      ...[userA, userB, userC].flatMap((user) => [
        { id: id("rm"), roomId: roomGeneral.id, userId: user.id, role: "MEMBER" as const, muted: false, pinned: user.id === userA.id, joinedAt: now(), lastReadMessageId: messages[0].id },
        { id: id("rm"), roomId: roomProject.id, userId: user.id, role: "MEMBER" as const, muted: false, pinned: false, joinedAt: now(), lastReadMessageId: messages[1].id }
      ])
    );
    this.messages.push(...messages);
    roomGeneral.lastMessageId = "msg_2";
    roomProject.lastMessageId = "msg_3";
    this.projects.push(project);
    this.issues.push(...issues);
    this.issueComments.push(
      { id: id("ic"), issueId: "iss_flow_1", authorId: userA.id, content: "Mobile tab spacing looks good. Please verify dark mode.", createdAt: now(), updatedAt: now() },
      { id: id("ic"), issueId: "iss_flow_2", authorId: userB.id, content: "Token storage is backend-only in the mock connection screen.", createdAt: now(), updatedAt: now() }
    );
    this.sprints.push({
      id: "spr_1",
      workspaceId: workspace.id,
      projectId: project.id,
      name: "Sprint 1",
      goal: "Usable chat + Jira-style project MVP",
      status: "ACTIVE",
      startDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 12).toISOString(),
      createdAt: now(),
      updatedAt: now()
    });
    this.tasks.push({
      id: "tsk_1",
      workspaceId: workspace.id,
      roomId: roomGeneral.id,
      messageId: "msg_2",
      issueId: "iss_flow_1",
      title: "Review FLOW-1 board updates",
      assigneeId: userA.id,
      status: "IN_PROGRESS",
      createdBy: userB.id,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      createdAt: now(),
      updatedAt: now()
    });
    this.notifications.push(
      { id: id("noti"), workspaceId: workspace.id, userId: userA.id, type: "MENTION", title: "Mentioned in #general", body: "Mina mentioned you with FLOW-1.", read: false, data: { roomId: roomGeneral.id, issueId: "iss_flow_1" }, createdAt: now() },
      { id: id("noti"), workspaceId: workspace.id, userId: userA.id, type: "ISSUE_ASSIGNED", title: "Issue assigned", body: "FLOW-3 is assigned to you.", read: false, data: { issueId: "iss_flow_3" }, createdAt: now() }
    );
    this.integrations.push({
      id: "int_jira",
      workspaceId: workspace.id,
      provider: "JIRA",
      name: "Jira Cloud",
      status: "DISCONNECTED",
      createdBy: userA.id,
      createdAt: now(),
      updatedAt: now()
    });
    this.activityLogs.push(
      { id: id("act"), workspaceId: workspace.id, actorId: userA.id, entityType: "PROJECT", entityId: project.id, action: "PROJECT_CREATED", createdAt: now() },
      { id: id("act"), workspaceId: workspace.id, actorId: userB.id, entityType: "ISSUE", entityId: "iss_flow_1", action: "STATUS_CHANGED", metadata: { to: "IN_REVIEW" }, createdAt: now() }
    );
    this.save();
  }

  bootstrap(userId: string): BootstrapPayload {
    const user = this.users.find((item) => item.id === userId);
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
    const memberships = this.workspaceMembers.filter((member) => member.userId === userId);
    const workspaceIds = memberships.map((member) => member.workspaceId);
    const roomIds = this.roomMembers.filter((member) => member.userId === userId).map((member) => member.roomId);
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return {
      user: safeUser,
      workspaces: this.workspaces.filter((workspace) => workspaceIds.includes(workspace.id)),
      workspaceMembers: this.workspaceMembers.filter((member) => workspaceIds.includes(member.workspaceId)),
      users: this.users.map(({ passwordHash: _hash, ...safe }) => safe),
      rooms: this.rooms.filter((room) => workspaceIds.includes(room.workspaceId) && roomIds.includes(room.id)),
      roomMembers: this.roomMembers.filter((member) => roomIds.includes(member.roomId)),
      messages: this.messages.filter((message) => roomIds.includes(message.roomId) && !message.deletedAt),
      projects: this.projects.filter((project) => workspaceIds.includes(project.workspaceId)),
      issues: this.issues.filter((issue) => workspaceIds.includes(issue.workspaceId) && !issue.deletedAt),
      issueComments: this.issueComments.filter((comment) => !comment.deletedAt),
      sprints: this.sprints.filter((sprint) => workspaceIds.includes(sprint.workspaceId)),
      tasks: this.tasks.filter((task) => workspaceIds.includes(task.workspaceId)),
      notifications: this.notifications.filter((notification) => notification.userId === userId),
      integrations: this.integrations.filter((integration) => workspaceIds.includes(integration.workspaceId)),
      activityLogs: this.activityLogs.filter((activity) => workspaceIds.includes(activity.workspaceId))
    };
  }

  rolesForUser(userId: string) {
    return this.workspaceMembers
      .filter((member) => member.userId === userId)
      .reduce<Record<string, Role>>((roles, member) => {
        roles[member.workspaceId] = member.role;
        return roles;
      }, {});
  }

  createMessage(input: Pick<Message, "roomId" | "senderId" | "content"> & Partial<Message>) {
    const message: Message = {
      id: id("msg"),
      type: input.type ?? "TEXT",
      roomId: input.roomId,
      senderId: input.senderId,
      content: input.content,
      metadata: input.metadata,
      replyToMessageId: input.replyToMessageId,
      linkedIssueId: input.linkedIssueId,
      createdAt: now()
    };
    this.messages.push(message);
    const room = this.rooms.find((item) => item.id === input.roomId);
    if (room) {
      room.lastMessageId = message.id;
      room.updatedAt = now();
    }
    this.save();
    return message;
  }

  createIssueFromMessage(messageId: string, userId: string, patch?: Partial<Issue>) {
    const message = this.messages.find((item) => item.id === messageId);
    if (!message) throw Object.assign(new Error("Message not found"), { status: 404 });
    const room = this.rooms.find((item) => item.id === message.roomId);
    const project = this.projects.find((item) => item.id === room?.projectId) ?? this.projects.find((item) => item.workspaceId === room?.workspaceId);
    if (!room || !project) throw Object.assign(new Error("Project context not found"), { status: 400 });
    const nextNo = this.issues.filter((issue) => issue.projectId === project.id).length + 1;
    const issue: Issue = {
      id: id("iss"),
      workspaceId: project.workspaceId,
      projectId: project.id,
      issueKey: `${project.key}-${nextNo}`,
      type: patch?.type ?? "TASK",
      title: patch?.title ?? message.content.slice(0, 80),
      description: patch?.description ?? `Created from message: ${message.content}`,
      status: patch?.status ?? "TODO",
      priority: patch?.priority ?? "MEDIUM",
      reporterId: userId,
      assigneeId: patch?.assigneeId,
      labels: patch?.labels ?? ["from-chat"],
      commentCount: 0,
      attachmentCount: 0,
      createdAt: now(),
      updatedAt: now()
    };
    this.issues.push(issue);
    message.linkedIssueId = issue.id;
    message.type = "ISSUE";
    this.activityLogs.push({ id: id("act"), workspaceId: issue.workspaceId, actorId: userId, entityType: "ISSUE", entityId: issue.id, action: "ISSUE_CREATED_FROM_MESSAGE", metadata: { messageId }, createdAt: now() });
    this.save();
    return issue;
  }

  createTaskFromMessage(messageId: string, userId: string) {
    const message = this.messages.find((item) => item.id === messageId);
    const room = this.rooms.find((item) => item.id === message?.roomId);
    if (!message || !room) throw Object.assign(new Error("Message not found"), { status: 404 });
    const task: Task = {
      id: id("tsk"),
      workspaceId: room.workspaceId,
      roomId: room.id,
      messageId,
      title: message.content.slice(0, 80),
      description: `Created from chat message ${message.id}`,
      status: "TODO",
      createdBy: userId,
      createdAt: now(),
      updatedAt: now()
    };
    this.tasks.push(task);
    this.save();
    return task;
  }

  createIssue(input: Partial<Issue> & Pick<Issue, "workspaceId" | "projectId" | "title" | "reporterId">) {
    const project = this.projects.find((item) => item.id === input.projectId);
    if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
    const nextNo = this.issues.filter((issue) => issue.projectId === project.id).length + 1;
    const issue: Issue = {
      id: id("iss"),
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      issueKey: `${project.key}-${nextNo}`,
      type: input.type ?? "TASK",
      title: input.title,
      description: input.description,
      status: input.status ?? "TODO",
      priority: input.priority ?? "MEDIUM",
      reporterId: input.reporterId,
      assigneeId: input.assigneeId,
      sprintId: input.sprintId,
      storyPoints: input.storyPoints,
      dueDate: input.dueDate,
      labels: input.labels ?? [],
      commentCount: 0,
      attachmentCount: 0,
      createdAt: now(),
      updatedAt: now()
    };
    this.issues.push(issue);
    this.save();
    return issue;
  }

  updateIssue(issueId: string, patch: Partial<Pick<Issue, "title" | "description" | "status" | "priority" | "assigneeId" | "sprintId" | "dueDate" | "labels">>, actorId: string) {
    const issue = this.issues.find((item) => item.id === issueId);
    if (!issue) throw Object.assign(new Error("Issue not found"), { status: 404 });
    Object.assign(issue, patch, { updatedAt: now() });
    this.activityLogs.push({ id: id("act"), workspaceId: issue.workspaceId, actorId, entityType: "ISSUE", entityId: issue.id, action: "ISSUE_UPDATED", metadata: patch, createdAt: now() });
    this.save();
    return issue;
  }

  addIssueComment(issueId: string, authorId: string, content: string) {
    const issue = this.issues.find((item) => item.id === issueId);
    if (!issue) throw Object.assign(new Error("Issue not found"), { status: 404 });
    const comment: IssueComment = { id: id("ic"), issueId, authorId, content, createdAt: now(), updatedAt: now() };
    this.issueComments.push(comment);
    issue.commentCount += 1;
    this.save();
    return comment;
  }

  createNotification(workspaceId: string, userId: string, type: string, title: string, body: string, data?: Record<string, unknown>) {
    const notification: Notification = { id: id("noti"), workspaceId, userId, type, title, body, read: false, data, createdAt: now() };
    this.notifications.push(notification);
    this.save();
    return notification;
  }

  createWorkspace(ownerId: string, name: string, logoUrl?: string) {
    const workspace: Workspace = { id: id("wks"), name, logoUrl, ownerId, createdAt: now(), updatedAt: now() };
    this.workspaces.push(workspace);
    this.workspaceMembers.push({ id: id("wm"), workspaceId: workspace.id, userId: ownerId, role: "OWNER", joinedAt: now() });
    this.save();
    return workspace;
  }

  updateWorkspace(workspaceId: string, patch: Partial<Pick<Workspace, "name" | "logoUrl">>) {
    const workspace = this.workspaces.find((item) => item.id === workspaceId);
    if (!workspace) throw Object.assign(new Error("Workspace not found"), { status: 404 });
    Object.assign(workspace, patch, { updatedAt: now() });
    this.save();
    return workspace;
  }

  inviteMember(workspaceId: string, userId: string, role: Role) {
    if (!this.workspaces.some((workspace) => workspace.id === workspaceId)) throw Object.assign(new Error("Workspace not found"), { status: 404 });
    const existing = this.workspaceMembers.find((member) => member.workspaceId === workspaceId && member.userId === userId);
    if (existing) {
      existing.role = role;
      this.save();
      return existing;
    }
    const member: WorkspaceMember = { id: id("wm"), workspaceId, userId, role, joinedAt: now() };
    this.workspaceMembers.push(member);
    this.save();
    return member;
  }

  updateMemberRole(workspaceId: string, userId: string, role: Role) {
    const member = this.workspaceMembers.find((item) => item.workspaceId === workspaceId && item.userId === userId);
    if (!member) throw Object.assign(new Error("Member not found"), { status: 404 });
    member.role = role;
    this.save();
    return member;
  }

  createRoom(input: Pick<Room, "workspaceId" | "type" | "name" | "createdBy"> & Partial<Room>, memberIds: string[]) {
    const room: Room = {
      id: id("room"),
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      type: input.type,
      name: input.name,
      avatarUrl: input.avatarUrl,
      createdBy: input.createdBy,
      createdAt: now(),
      updatedAt: now()
    };
    this.rooms.push(room);
    const uniqueMemberIds = [...new Set([input.createdBy, ...memberIds])];
    this.roomMembers.push(...uniqueMemberIds.map((userId) => ({ id: id("rm"), roomId: room.id, userId, role: "MEMBER" as const, muted: false, pinned: false, joinedAt: now() })));
    this.save();
    return room;
  }

  createProject(input: Pick<Project, "workspaceId" | "key" | "name" | "leadId"> & Partial<Project>) {
    if (this.projects.some((project) => project.workspaceId === input.workspaceId && project.key === input.key.toUpperCase())) {
      throw Object.assign(new Error("Project key already exists"), { status: 409 });
    }
    const project: Project = {
      id: id("prj"),
      workspaceId: input.workspaceId,
      key: input.key.toUpperCase(),
      name: input.name,
      description: input.description,
      icon: input.icon,
      color: input.color ?? "#2563eb",
      leadId: input.leadId,
      createdAt: now(),
      updatedAt: now()
    };
    this.projects.push(project);
    this.rooms.push({
      id: id("room"),
      workspaceId: project.workspaceId,
      projectId: project.id,
      type: "PROJECT",
      name: `project-${project.key.toLowerCase()}`,
      createdBy: input.leadId,
      createdAt: now(),
      updatedAt: now()
    });
    this.save();
    return project;
  }

  updateProject(projectId: string, patch: Partial<Pick<Project, "name" | "description" | "icon" | "color" | "leadId">>) {
    const project = this.projects.find((item) => item.id === projectId);
    if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
    Object.assign(project, patch, { updatedAt: now() });
    this.save();
    return project;
  }

  createSprint(input: Pick<Sprint, "workspaceId" | "projectId" | "name"> & Partial<Sprint>) {
    const sprint: Sprint = {
      id: id("spr"),
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      name: input.name,
      goal: input.goal,
      status: input.status ?? "PLANNED",
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: now(),
      updatedAt: now()
    };
    this.sprints.push(sprint);
    this.save();
    return sprint;
  }

  updateSprint(sprintId: string, patch: Partial<Pick<Sprint, "name" | "goal" | "status" | "startDate" | "endDate">>) {
    const sprint = this.sprints.find((item) => item.id === sprintId);
    if (!sprint) throw Object.assign(new Error("Sprint not found"), { status: 404 });
    Object.assign(sprint, patch, { updatedAt: now() });
    this.save();
    return sprint;
  }

  createTask(input: Pick<Task, "workspaceId" | "title" | "createdBy"> & Partial<Task>) {
    const task: Task = {
      id: id("tsk"),
      workspaceId: input.workspaceId,
      roomId: input.roomId,
      messageId: input.messageId,
      issueId: input.issueId,
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId,
      status: input.status ?? "TODO",
      dueDate: input.dueDate,
      createdBy: input.createdBy,
      createdAt: now(),
      updatedAt: now()
    };
    this.tasks.push(task);
    this.save();
    return task;
  }

  updateTask(taskId: string, patch: Partial<Pick<Task, "title" | "description" | "assigneeId" | "status" | "dueDate">>) {
    const task = this.tasks.find((item) => item.id === taskId);
    if (!task) throw Object.assign(new Error("Task not found"), { status: 404 });
    Object.assign(task, patch, { updatedAt: now() });
    this.save();
    return task;
  }

  createAttachment(input: Pick<Attachment, "workspaceId" | "uploaderId" | "fileName" | "fileUrl" | "mimeType" | "size"> & Partial<Attachment>) {
    const attachment: Attachment = { id: id("att"), createdAt: now(), ...input };
    this.attachments.push(attachment);
    if (attachment.issueId) {
      const issue = this.issues.find((item) => item.id === attachment.issueId);
      if (issue) issue.attachmentCount += 1;
    }
    this.save();
    return attachment;
  }

  moveIssue(issueId: string, status: IssueStatus, actorId: string) {
    return this.updateIssue(issueId, { status }, actorId);
  }

  setPriority(issueId: string, priority: IssuePriority, actorId: string) {
    return this.updateIssue(issueId, { priority }, actorId);
  }
}
