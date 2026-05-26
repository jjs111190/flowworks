export type Role = "OWNER" | "ADMIN" | "PROJECT_MANAGER" | "MEMBER" | "GUEST";
export type PresenceStatus = "ONLINE" | "AWAY" | "IN_MEETING" | "DO_NOT_DISTURB" | "OFFLINE";
export type RoomType = "DIRECT" | "GROUP" | "CHANNEL" | "NOTICE" | "PROJECT";
export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM" | "TASK" | "NOTICE" | "ISSUE";
export type IssueType = "EPIC" | "STORY" | "TASK" | "BUG" | "IMPROVEMENT" | "SUB_TASK" | "MEETING" | "DECISION";
export type IssueStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "DONE" | "ARCHIVED";
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";
export type IntegrationProvider = "JIRA" | "GITHUB" | "GITLAB" | "SLACK" | "TEAMS" | "NOTION" | "GOOGLE_CALENDAR";
export type IntegrationStatus = "CONNECTED" | "DISCONNECTED" | "ERROR";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl?: string;
  department?: string;
  position?: string;
  statusMessage?: string;
  presenceStatus: PresenceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  logoUrl?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  joinedAt: string;
}

export interface Room {
  id: string;
  workspaceId: string;
  projectId?: string;
  type: RoomType;
  name: string;
  avatarUrl?: string;
  lastMessageId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  role: Role | "MEMBER";
  lastReadMessageId?: string;
  muted: boolean;
  pinned: boolean;
  joinedAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  type: MessageType;
  content: string;
  metadata?: Record<string, unknown>;
  replyToMessageId?: string;
  linkedIssueId?: string;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
  optimistic?: boolean;
  failed?: boolean;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  workspaceId: string;
  messageId?: string;
  issueId?: string;
  uploaderId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  leadId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  workspaceId: string;
  projectId: string;
  issueKey: string;
  type: IssueType;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  reporterId: string;
  assigneeId?: string;
  parentIssueId?: string;
  sprintId?: string;
  storyPoints?: number;
  dueDate?: string;
  labels: string[];
  commentCount: number;
  attachmentCount: number;
  externalProvider?: string;
  externalIssueKey?: string;
  externalIssueUrl?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Sprint {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  goal?: string;
  status: SprintStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  roomId?: string;
  messageId?: string;
  issueId?: string;
  title: string;
  description?: string;
  assigneeId?: string;
  status: string;
  dueDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface Integration {
  id: string;
  workspaceId: string;
  provider: IntegrationProvider;
  name: string;
  status: IntegrationStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  workspaceId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface BootstrapPayload {
  user: Omit<User, "passwordHash">;
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  users: Omit<User, "passwordHash">[];
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
  activityLogs: ActivityLog[];
}
