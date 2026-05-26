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
      name: "김재석",
      department: "제품팀",
      position: "제품 리드",
      statusMessage: "서버 없이 쓰는 로컬 워크스페이스",
      presenceStatus: "ONLINE",
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: "usr_mina",
      email: "mina@flowworks.local",
      password: "flowworks123!",
      name: "박미나",
      department: "개발팀",
      position: "프론트엔드 엔지니어",
      presenceStatus: "IN_MEETING",
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: "usr_daniel",
      email: "daniel@flowworks.local",
      password: "flowworks123!",
      name: "이도현",
      department: "디자인팀",
      position: "제품 디자이너",
      presenceStatus: "AWAY",
      createdAt: now(),
      updatedAt: now()
    }
  ];
  const workspace: Workspace = { id: "wks_flow", name: "FlowWorks 로컬", ownerId: "usr_jae", createdAt: now(), updatedAt: now() };
  const project: Project = {
    id: "prj_flow",
    workspaceId: workspace.id,
    key: "FLOW",
    name: "오프라인 MVP",
    description: "이 기기에서 서버 없이 실행되는 FlowWorks 워크스페이스입니다.",
    color: "#2563eb",
    leadId: "usr_jae",
    createdAt: now(),
    updatedAt: now()
  };
  const rooms: Room[] = [
    { id: "room_general", workspaceId: workspace.id, type: "CHANNEL", name: "전체", lastMessageId: "msg_2", createdBy: "usr_jae", createdAt: now(), updatedAt: now() },
    { id: "room_project_flow", workspaceId: workspace.id, projectId: project.id, type: "PROJECT", name: "프로젝트-flow", lastMessageId: "msg_3", createdBy: "usr_jae", createdAt: now(), updatedAt: now() }
  ];
  const issues: Issue[] = [
    {
      id: "iss_flow_1",
      workspaceId: workspace.id,
      projectId: project.id,
      issueKey: "FLOW-1",
      type: "STORY",
      title: "설치 가능한 모바일 워크스페이스",
      description: "백엔드 서버 없이 FlowWorks를 PWA로 실행합니다.",
      status: "IN_REVIEW",
      priority: "HIGH",
      reporterId: "usr_jae",
      assigneeId: "usr_mina",
      sprintId: "spr_1",
      storyPoints: 5,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      labels: ["PWA", "오프라인"],
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
      title: "로컬 우선 채팅과 이슈 데이터",
      description: "메시지, 이슈, 스프린트, 업무를 이 기기에 저장합니다.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      reporterId: "usr_jae",
      assigneeId: "usr_jae",
      sprintId: "spr_1",
      labels: ["로컬DB"],
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
      title: "오프라인 큐가 메시지 전송을 막지 않게 하기",
      status: "TODO",
      priority: "MEDIUM",
      reporterId: "usr_mina",
      assigneeId: "usr_daniel",
      labels: ["채팅"],
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
      { id: "msg_1", roomId: "room_general", senderId: "usr_jae", type: "TEXT", content: "FlowWorks는 이제 백엔드 서버를 열지 않아도 작동합니다.", createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
      { id: "msg_2", roomId: "room_general", senderId: "usr_mina", type: "TEXT", content: "@김재석 FLOW-1 이슈는 iPhone과 Android에서 PWA로 설치할 준비가 됐습니다.", linkedIssueId: "iss_flow_1", createdAt: new Date(Date.now() - 1000 * 60 * 24).toISOString() },
      { id: "msg_3", roomId: "room_project_flow", senderId: "usr_daniel", type: "TEXT", content: "모바일 화면 폭에서 디자인을 확인했습니다. 보드와 채팅은 오프라인에서도 사용할 수 있습니다.", createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString() }
    ],
    projects: [project],
    issues,
    issueComments: [{ id: id("ic"), issueId: "iss_flow_1", authorId: "usr_jae", content: "설치를 위해 PWA 매니페스트와 서비스 워커가 필요합니다.", createdAt: now(), updatedAt: now() }],
    sprints: [{ id: "spr_1", workspaceId: workspace.id, projectId: project.id, name: "Standalone 스프린트", goal: "서버 없이 설치 가능한 앱", status: "ACTIVE", startDate: now(), endDate: new Date(Date.now() + 86400000 * 10).toISOString(), createdAt: now(), updatedAt: now() }],
    tasks: [{ id: "tsk_1", workspaceId: workspace.id, roomId: "room_general", messageId: "msg_2", issueId: "iss_flow_1", title: "휴대폰에 FlowWorks 설치", assigneeId: "usr_jae", status: "IN_PROGRESS", createdBy: "usr_mina", createdAt: now(), updatedAt: now() }],
    notifications: [{ id: id("noti"), workspaceId: workspace.id, userId: "usr_jae", type: "PWA_READY", title: "Standalone 앱 준비 완료", body: "FlowWorks는 백엔드 서버 없이 이 기기에서 실행할 수 있습니다.", read: false, createdAt: now() }],
    integrations: [{ id: "int_jira", workspaceId: workspace.id, provider: "JIRA", name: "Jira 모의 연동", status: "DISCONNECTED", createdBy: "usr_jae", createdAt: now(), updatedAt: now() }],
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
    if (!user) throw new Error("로그인이 필요합니다");
  return user;
}

export const standaloneApi = {
  async login(email: string, password: string) {
    const db = readDb();
    const user = db.users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
    if (!user) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다");
    user.presenceStatus = "ONLINE";
    user.updatedAt = now();
    writeDb(db);
    localStorage.setItem(SESSION_KEY, user.id);
    return { accessToken: `standalone.${user.id}`, refreshToken: `standalone.refresh.${user.id}`, user: safeUser(user) };
  },
  async register(input: { email: string; password: string; name: string; workspaceName: string }) {
    const db = readDb();
    if (db.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) throw new Error("이미 가입된 이메일입니다");
    const user: StandaloneUser = { id: id("usr"), email: input.email, password: input.password, name: input.name, presenceStatus: "ONLINE", createdAt: now(), updatedAt: now() };
    const workspace: Workspace = { id: id("wks"), name: input.workspaceName, ownerId: user.id, createdAt: now(), updatedAt: now() };
    const project: Project = { id: id("prj"), workspaceId: workspace.id, key: "APP", name: "앱 출시", color: "#2563eb", leadId: user.id, createdAt: now(), updatedAt: now() };
    const room: Room = { id: id("room"), workspaceId: workspace.id, projectId: project.id, type: "PROJECT", name: "프로젝트-app", createdBy: user.id, createdAt: now(), updatedAt: now() };
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
    if (!message) throw new Error("메시지를 찾을 수 없습니다");
    message.content = content;
    message.editedAt = now();
    writeDb(db);
    return message;
  },
  async deleteMessage(messageId: string) {
    const db = readDb();
    const user = currentUser(db);
    const message = db.messages.find((item) => item.id === messageId && item.senderId === user.id && !item.deletedAt);
    if (!message) throw new Error("메시지를 찾을 수 없습니다");
    message.deletedAt = now();
    writeDb(db);
    return message;
  },
  async createIssueFromMessage(messageId: string, title?: string) {
    const db = readDb();
    const user = currentUser(db);
    const message = db.messages.find((item) => item.id === messageId);
    if (!message) throw new Error("메시지를 찾을 수 없습니다");
    const room = db.rooms.find((item) => item.id === message.roomId);
    const project = db.projects.find((item) => item.id === room?.projectId) ?? db.projects.find((item) => item.workspaceId === room?.workspaceId);
    if (!room || !project) throw new Error("프로젝트 정보를 찾을 수 없습니다");
    const nextNumber = db.issues.filter((issue) => issue.projectId === project.id).length + 1;
    const issue: Issue = {
      id: id("iss"),
      workspaceId: project.workspaceId,
      projectId: project.id,
      issueKey: `${project.key}-${nextNumber}`,
      type: "TASK",
      title: title || message.content.slice(0, 80),
      description: `채팅 메시지에서 생성됨: ${message.content}`,
      status: "TODO",
      priority: "MEDIUM",
      reporterId: user.id,
      labels: ["채팅생성"],
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
    if (!message || !room) throw new Error("메시지를 찾을 수 없습니다");
    const task: Task = { id: id("tsk"), workspaceId: room.workspaceId, roomId: room.id, messageId, title: message.content.slice(0, 80), status: "TODO", createdBy: user.id, createdAt: now(), updatedAt: now() };
    db.tasks.push(task);
    writeDb(db);
    return task;
  },
  async createIssue(input: Partial<Issue> & Pick<Issue, "workspaceId" | "projectId" | "title">) {
    const db = readDb();
    const user = currentUser(db);
    const project = db.projects.find((item) => item.id === input.projectId);
    if (!project) throw new Error("프로젝트를 찾을 수 없습니다");
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
    if (!issue) throw new Error("이슈를 찾을 수 없습니다");
    Object.assign(issue, patch, { updatedAt: now() });
    writeDb(db);
    return issue;
  },
  async addIssueComment(issueId: string, content: string) {
    const db = readDb();
    const user = currentUser(db);
    const issue = db.issues.find((item) => item.id === issueId);
    if (!issue) throw new Error("이슈를 찾을 수 없습니다");
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
    if (!notification) throw new Error("알림을 찾을 수 없습니다");
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
      { id: "mock-2", key: "MOB", name: "모바일 앱 Mock" }
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
    if (!parsed.db?.users || !parsed.db?.workspaces || !parsed.db?.messages) throw new Error("올바른 FlowWorks 백업 파일이 아닙니다");
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
