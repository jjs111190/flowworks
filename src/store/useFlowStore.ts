import { create } from "zustand";
import { api, clearTokens, getAccessToken } from "../services/api/client";
import { flowSocket, type FlowEvent } from "../services/websocket/client";
import type {
  ActivityLog,
  BootstrapPayload,
  Integration,
  Issue,
  IssueComment,
  IssueStatus,
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
} from "../types/models";

type View = "home" | "chat" | "projects" | "board" | "backlog" | "tasks" | "files" | "notifications" | "integrations" | "admin" | "settings";
type ThemeMode = "light" | "dark";

interface FlowState {
  booted: boolean;
  loading: boolean;
  error?: string;
  token?: string | null;
  themeMode: ThemeMode;
  activeView: View;
  activeWorkspaceId?: string;
  activeRoomId?: string;
  activeProjectId?: string;
  activeIssueId?: string;
  socketStatus: "DISCONNECTED" | "CONNECTING" | "CONNECTED";
  user?: User;
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  users: User[];
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
  offlineQueue: Array<{ id: string; roomId: string; content: string }>;
  search: string;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; name: string; workspaceName: string }) => Promise<void>;
  bootstrap: () => Promise<void>;
  logout: () => void;
  setView: (view: View) => void;
  setWorkspace: (workspaceId: string) => void;
  setRoom: (roomId: string) => void;
  setProject: (projectId: string) => void;
  setIssue: (issueId?: string) => void;
  setSearch: (value: string) => void;
  toggleTheme: () => void;
  sendMessage: (roomId: string, content: string) => Promise<void>;
  sendFileMessage: (roomId: string, file: File) => Promise<void>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  createIssueFromMessage: (messageId: string) => Promise<void>;
  createTaskFromMessage: (messageId: string) => Promise<void>;
  createIssue: (title: string) => Promise<void>;
  createProject: (input: { name: string; key: string; description?: string }) => Promise<void>;
  createSprint: (input: { name: string; goal?: string }) => Promise<void>;
  updateIssue: (issueId: string, patch: Partial<Issue>) => Promise<void>;
  moveIssue: (issueId: string, status: IssueStatus) => Promise<void>;
  addIssueComment: (issueId: string, content: string) => Promise<void>;
  updateTask: (taskId: string, status: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  connectJira: (cloudUrl: string, email: string, apiToken: string) => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (file: File) => Promise<void>;
  resetLocalData: () => Promise<void>;
  handleEvent: (event: FlowEvent) => void;
}

function applyBootstrap(payload: BootstrapPayload) {
  return {
    booted: true,
    loading: false,
    error: undefined,
    user: payload.user,
    workspaces: payload.workspaces,
    workspaceMembers: payload.workspaceMembers,
    users: payload.users,
    rooms: payload.rooms,
    roomMembers: payload.roomMembers,
    messages: payload.messages,
    projects: payload.projects,
    issues: payload.issues,
    issueComments: payload.issueComments,
    sprints: payload.sprints,
    tasks: payload.tasks,
    notifications: payload.notifications,
    integrations: payload.integrations,
    activityLogs: payload.activityLogs,
    activeWorkspaceId: payload.workspaces[0]?.id,
    activeRoomId: payload.rooms[0]?.id,
    activeProjectId: payload.projects[0]?.id,
    activeIssueId: payload.issues[0]?.id
  };
}

export const useFlowStore = create<FlowState>((set, get) => ({
  booted: false,
  loading: false,
  token: getAccessToken(),
  themeMode: (localStorage.getItem("flowworks.theme") as ThemeMode) || "light",
  activeView: "home",
  socketStatus: "DISCONNECTED",
  workspaces: [],
  workspaceMembers: [],
  users: [],
  rooms: [],
  roomMembers: [],
  messages: [],
  projects: [],
  issues: [],
  issueComments: [],
  sprints: [],
  tasks: [],
  notifications: [],
  integrations: [],
  activityLogs: [],
  offlineQueue: JSON.parse(localStorage.getItem("flowworks.offlineQueue") ?? "[]") as Array<{ id: string; roomId: string; content: string }>,
  search: "",
  async login(email, password) {
    set({ loading: true, error: undefined });
    try {
      await api.login(email, password);
      await get().bootstrap();
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "로그인에 실패했습니다" });
    }
  },
  async register(input) {
    set({ loading: true, error: undefined });
    try {
      await api.register(input);
      await get().bootstrap();
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "회원가입에 실패했습니다" });
    }
  },
  async bootstrap() {
    if (!getAccessToken()) return set({ booted: true, loading: false });
    set({ loading: true, error: undefined });
    try {
      const payload = await api.bootstrap();
      set(applyBootstrap(payload));
      flowSocket.connect();
      payload.rooms.forEach((room) => flowSocket.join(room.id));
      flowSocket.on((event) => get().handleEvent(event));
      set({ socketStatus: flowSocket.status });
    } catch (error) {
      set({ booted: true, loading: false, error: error instanceof Error ? error.message : "앱 데이터를 불러오지 못했습니다" });
    }
  },
  logout() {
    clearTokens();
    set({ token: null, user: undefined, booted: true, activeView: "home" });
  },
  setView: (activeView) => set({ activeView }),
  setWorkspace: (activeWorkspaceId) => {
    const rooms = get().rooms.filter((room) => room.workspaceId === activeWorkspaceId);
    const projects = get().projects.filter((project) => project.workspaceId === activeWorkspaceId);
    set({ activeWorkspaceId, activeRoomId: rooms[0]?.id, activeProjectId: projects[0]?.id, activeIssueId: get().issues.find((issue) => issue.workspaceId === activeWorkspaceId)?.id });
  },
  setRoom: (activeRoomId) => {
    flowSocket.join(activeRoomId);
    set({ activeRoomId, activeView: "chat" });
  },
  setProject: (activeProjectId) => set({ activeProjectId, activeView: "projects", activeIssueId: get().issues.find((issue) => issue.projectId === activeProjectId)?.id }),
  setIssue: (activeIssueId) => set({ activeIssueId }),
  setSearch: (search) => set({ search }),
  toggleTheme() {
    const themeMode = get().themeMode === "light" ? "dark" : "light";
    localStorage.setItem("flowworks.theme", themeMode);
    set({ themeMode });
  },
  async sendMessage(roomId, content) {
    const tempId = `temp_${Date.now()}`;
    const user = get().user;
    if (!user) return;
    const optimistic: Message = { id: tempId, roomId, senderId: user.id, content, type: "TEXT", createdAt: new Date().toISOString(), optimistic: true };
    set({ messages: [...get().messages, optimistic] });
    try {
      const message = await api.sendMessage(roomId, content);
      set({ messages: get().messages.map((item) => (item.id === tempId ? message : item)) });
    } catch {
      const offlineQueue = [...get().offlineQueue, { id: tempId, roomId, content }];
      localStorage.setItem("flowworks.offlineQueue", JSON.stringify(offlineQueue));
      set({ offlineQueue, messages: get().messages.map((item) => (item.id === tempId ? { ...item, optimistic: false, failed: true } : item)) });
    }
  },
  async sendFileMessage(roomId, file) {
    const content = file.name;
    const tempId = `temp_file_${Date.now()}`;
    const user = get().user;
    if (!user) return;
    const metadata = { fileName: file.name, size: `${Math.round(file.size / 1024)}KB`, mimeType: file.type || "application/octet-stream" };
    const optimistic: Message = { id: tempId, roomId, senderId: user.id, content, metadata, type: "FILE", createdAt: new Date().toISOString(), optimistic: true };
    set({ messages: [...get().messages, optimistic] });
    try {
      const message = await api.sendMessage(roomId, content, metadata);
      set({ messages: get().messages.map((item) => (item.id === tempId ? message : item)) });
    } catch {
      set({ messages: get().messages.map((item) => (item.id === tempId ? { ...item, optimistic: false, failed: true } : item)) });
    }
  },
  async updateMessage(messageId, content) {
    const updated = await api.updateMessage(messageId, content);
    set({ messages: get().messages.map((message) => (message.id === updated.id ? updated : message)) });
  },
  async deleteMessage(messageId) {
    const deleted = await api.deleteMessage(messageId);
    set({ messages: get().messages.filter((message) => message.id !== deleted.id) });
  },
  async createIssueFromMessage(messageId) {
    const issue = await api.createIssueFromMessage(messageId);
    set({ issues: [...get().issues, issue], activeIssueId: issue.id, activeView: "board" });
  },
  async createTaskFromMessage(messageId) {
    const task = await api.createTaskFromMessage(messageId);
    set({ tasks: [...get().tasks, task], activeView: "tasks" });
  },
  async createIssue(title) {
    const workspaceId = get().activeWorkspaceId;
    const projectId = get().activeProjectId;
    if (!workspaceId || !projectId) return;
    const issue = await api.createIssue({ workspaceId, projectId, title });
    set({ issues: [...get().issues, issue], activeIssueId: issue.id });
  },
  async createProject(input) {
    const workspaceId = get().activeWorkspaceId;
    if (!workspaceId) return;
    const { project, room } = await api.createProject({ workspaceId, ...input });
    set({
      projects: [...get().projects, project],
      rooms: [...get().rooms, room],
      activeProjectId: project.id,
      activeRoomId: room.id,
      activeView: "projects"
    });
  },
  async createSprint(input) {
    const workspaceId = get().activeWorkspaceId;
    const projectId = get().activeProjectId;
    if (!workspaceId || !projectId) return;
    const sprint = await api.createSprint({ workspaceId, projectId, ...input });
    set({ sprints: [...get().sprints, sprint], activeView: "backlog" });
  },
  async updateIssue(issueId, patch) {
    const updated = await api.updateIssue(issueId, patch);
    set({ issues: get().issues.map((issue) => (issue.id === updated.id ? updated : issue)), activeIssueId: updated.id });
  },
  async moveIssue(issueId, status) {
    const previous = get().issues;
    set({ issues: previous.map((issue) => (issue.id === issueId ? { ...issue, status } : issue)) });
    try {
      const updated = await api.updateIssue(issueId, { status });
      set({ issues: get().issues.map((issue) => (issue.id === updated.id ? updated : issue)) });
      flowSocket.send({ type: "issue_updated", payload: { id: issueId, status } });
    } catch {
      set({ issues: previous });
    }
  },
  async addIssueComment(issueId, content) {
    const comment = await api.addIssueComment(issueId, content);
    set({
      issueComments: [...get().issueComments, comment],
      issues: get().issues.map((issue) => (issue.id === issueId ? { ...issue, commentCount: issue.commentCount + 1 } : issue))
    });
  },
  async updateTask(taskId, status) {
    const updated = await api.updateTask(taskId, { status });
    set({ tasks: get().tasks.map((task) => (task.id === updated.id ? updated : task)) });
  },
  async markNotificationRead(notificationId) {
    const notification = await api.markNotificationRead(notificationId);
    set({ notifications: get().notifications.map((item) => (item.id === notification.id ? notification : item)) });
  },
  async markAllNotificationsRead() {
    const workspaceId = get().activeWorkspaceId;
    if (!workspaceId) return;
    const notifications = await api.markAllNotificationsRead(workspaceId);
    set({ notifications });
  },
  async connectJira(cloudUrl, email, apiToken) {
    const workspaceId = get().activeWorkspaceId;
    if (!workspaceId) return;
    await api.connectJira({ workspaceId, cloudUrl, email, apiToken });
    const payload = await api.bootstrap();
    set(applyBootstrap(payload));
  },
  async exportBackup() {
    const raw = await api.exportBackup();
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `flowworks-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
  async importBackup(file) {
    const raw = await file.text();
    await api.importBackup(raw);
    const payload = await api.bootstrap();
    set(applyBootstrap(payload));
  },
  async resetLocalData() {
    api.resetStandalone();
    clearTokens();
    set({ user: undefined, booted: true, activeView: "home", messages: [], issues: [], tasks: [], workspaces: [] });
  },
  handleEvent(event) {
    if (event.type === "message_created") {
      const message = event.payload as Message;
      if (!get().messages.some((item) => item.id === message.id)) set({ messages: [...get().messages, message] });
    }
    if (event.type === "message_updated" || event.type === "message_deleted") {
      const message = event.payload as Message;
      set({ messages: get().messages.map((item) => (item.id === message.id ? message : item)).filter((item) => !item.deletedAt) });
    }
    if (event.type === "issue_created") {
      const issue = event.payload as Issue;
      if (!get().issues.some((item) => item.id === issue.id)) set({ issues: [...get().issues, issue] });
    }
    if (event.type === "issue_updated") {
      const issue = event.payload as Issue;
      set({ issues: get().issues.map((item) => (item.id === issue.id ? issue : item)) });
    }
    if (event.type === "issue_commented") {
      const comment = event.payload as IssueComment;
      if (!get().issueComments.some((item) => item.id === comment.id)) set({ issueComments: [...get().issueComments, comment] });
    }
  }
}));
