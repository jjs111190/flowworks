import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckSquare,
  Files,
  Home,
  KanbanSquare,
  LogOut,
  MessageCircle,
  Moon,
  PanelLeft,
  Plug,
  Search,
  Settings,
  Shield,
  Sun,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { KanbanBoard } from "./components/board/KanbanBoard";
import { ChatRoomListItem, DateDivider, MessageBubble, MessageInput } from "./components/chat/ChatComponents";
import { AppButton, AppCard, AppInput, EmptyState, ErrorView, LoadingView, SearchBar, SkeletonView, StatusBadge, PriorityBadge, Avatar } from "./components/common/AppPrimitives";
import { IntegrationCard, JiraConnectionForm } from "./components/integration/IntegrationComponents";
import { IssueDetailPanel, IssueListItem, ProjectCard } from "./components/project/ProjectComponents";
import { useFlowStore } from "./store/useFlowStore";
import type { IssueStatus, Message } from "./types/models";

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "projects", label: "Projects", icon: BriefcaseBusiness },
  { id: "board", label: "Board", icon: KanbanSquare },
  { id: "backlog", label: "Backlog", icon: CheckSquare },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "files", label: "Files", icon: Files },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "admin", label: "Admin", icon: Shield },
  { id: "settings", label: "Settings", icon: Settings }
] as const;

export function App() {
  const store = useFlowStore();

  useEffect(() => {
    document.documentElement.dataset.theme = store.themeMode;
  }, [store.themeMode]);

  useEffect(() => {
    void store.bootstrap();
  }, []);

  if (!store.booted && store.loading) return <LoadingView />;
  if (!store.user) return <AuthScreen />;
  if (store.error && !store.booted) return <ErrorView message={store.error} onRetry={() => void store.bootstrap()} />;

  const activeWorkspace = store.workspaces.find((workspace) => workspace.id === store.activeWorkspaceId);
  const activeProject = store.projects.find((project) => project.id === store.activeProjectId);
  const activeRoom = store.rooms.find((room) => room.id === store.activeRoomId);

  return (
    <div className="app-shell">
      <aside className="workspace-rail">
        <div className="brand">FW</div>
        {store.workspaces.map((workspace) => (
          <button key={workspace.id} className={workspace.id === store.activeWorkspaceId ? "active" : ""} title={workspace.name} onClick={() => store.setWorkspace(workspace.id)}>
            {workspace.name.slice(0, 2).toUpperCase()}
          </button>
        ))}
        <button title="Theme" onClick={store.toggleTheme}>{store.themeMode === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
      </aside>

      <aside className="side-panel">
        <header className="side-header">
          <div>
            <small>{activeWorkspace?.name}</small>
            <h1>FlowWorks</h1>
          </div>
          <Avatar user={store.user} />
        </header>
        <SearchBar value={store.search} onChange={store.setSearch} placeholder="Search messages, issues, files" />
        <nav className="app-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={store.activeView === id ? "active" : ""} onClick={() => store.setView(id)}>
              <Icon size={17} />
              <span>{label}</span>
              {id === "notifications" && store.notifications.some((item) => !item.read) && <i />}
            </button>
          ))}
        </nav>
        <ContextList />
      </aside>

      <main className="detail-panel">
        <TopBar workspaceName={activeWorkspace?.name ?? "Workspace"} projectName={activeProject?.name} roomName={activeRoom?.name} />
        {store.loading && !store.booted ? <SkeletonView /> : <ActiveView />}
      </main>

      <MobileTabs />
    </div>
  );
}

function AuthScreen() {
  const store = useFlowStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("jae@flowworks.local");
  const [password, setPassword] = useState("flowworks123!");
  const [name, setName] = useState("New Member");
  const [workspaceName, setWorkspaceName] = useState("FlowWorks Team");

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <span>FlowWorks</span>
        <h1>Chat, work, issues, and sprints in one clean workspace.</h1>
        <p>Built for teams that need fast messaging, structured collaboration, and Jira-style execution without the clutter.</p>
      </section>
      <AppCard className="auth-card">
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Sign up</button>
        </div>
        {mode === "register" && <AppInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />}
        {mode === "register" && <AppInput value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Workspace name" />}
        <AppInput value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <AppInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        {store.error && <p className="form-error">{store.error}</p>}
        <AppButton onClick={() => mode === "login" ? void store.login(email, password) : void store.register({ email, password, name, workspaceName })}>
          {store.loading ? "Please wait..." : mode === "login" ? "Login" : "Create workspace"}
        </AppButton>
        <p className="muted">Demo account: jae@flowworks.local / flowworks123!</p>
      </AppCard>
    </div>
  );
}

function TopBar({ workspaceName, projectName, roomName }: { workspaceName: string; projectName?: string; roomName?: string }) {
  const store = useFlowStore();
  return (
    <header className="top-bar">
      <div>
        <small>{workspaceName}</small>
        <strong>{store.activeView === "chat" ? `#${roomName}` : projectName ?? "Dashboard"}</strong>
      </div>
      <div className="top-actions">
        <span className={`socket-pill ${store.socketStatus.toLowerCase()}`}>{store.socketStatus.toLowerCase()}</span>
        <AppButton onClick={() => void store.createIssue("New issue from quick add")}>New issue</AppButton>
      </div>
    </header>
  );
}

function ContextList() {
  const store = useFlowStore();
  const rooms = store.rooms.filter((room) => room.workspaceId === store.activeWorkspaceId);
  const projects = store.projects.filter((project) => project.workspaceId === store.activeWorkspaceId);
  const filteredIssues = store.issues.filter((issue) => issue.title.toLowerCase().includes(store.search.toLowerCase()) || issue.issueKey.toLowerCase().includes(store.search.toLowerCase()));

  if (store.activeView === "chat") {
    return (
      <div className="context-list">
        <h2>Rooms</h2>
        {rooms.map((room) => (
          <ChatRoomListItem
            key={room.id}
            room={room}
            active={room.id === store.activeRoomId}
            lastMessage={store.messages.filter((message) => message.roomId === room.id).at(-1)}
            unread={room.id === store.activeRoomId ? 0 : store.messages.filter((message) => message.roomId === room.id).length % 3}
            onClick={() => store.setRoom(room.id)}
          />
        ))}
      </div>
    );
  }

  if (["projects", "board", "backlog"].includes(store.activeView)) {
    return (
      <div className="context-list">
        <h2>Projects</h2>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            issues={store.issues.filter((issue) => issue.projectId === project.id)}
            members={store.users}
            onClick={() => store.setProject(project.id)}
          />
        ))}
        <h2>Issues</h2>
        {filteredIssues.slice(0, 8).map((issue) => (
          <IssueListItem
            key={issue.id}
            issue={issue}
            assignee={store.users.find((user) => user.id === issue.assigneeId)}
            active={store.activeIssueId === issue.id}
            onClick={() => store.setIssue(issue.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="context-list">
      <h2>Quick status</h2>
      <AppCard>
        <strong>{store.notifications.filter((item) => !item.read).length} unread alerts</strong>
        <p className="muted">{store.issues.filter((issue) => issue.assigneeId === store.user?.id && issue.status !== "DONE").length} open assigned issues</p>
      </AppCard>
    </div>
  );
}

function ActiveView() {
  const store = useFlowStore();
  if (store.activeView === "home") return <HomeDashboard />;
  if (store.activeView === "chat") return <ChatView />;
  if (store.activeView === "projects") return <ProjectsView />;
  if (store.activeView === "board") return <BoardView />;
  if (store.activeView === "backlog") return <BacklogView />;
  if (store.activeView === "tasks") return <TasksView />;
  if (store.activeView === "files") return <FilesView />;
  if (store.activeView === "notifications") return <NotificationsView />;
  if (store.activeView === "integrations") return <IntegrationsView />;
  if (store.activeView === "admin") return <AdminView />;
  return <SettingsView />;
}

function HomeDashboard() {
  const store = useFlowStore();
  const assigned = store.issues.filter((issue) => issue.assigneeId === store.user?.id && issue.status !== "DONE");
  const dueSoon = assigned.filter((issue) => issue.dueDate && new Date(issue.dueDate).getTime() < Date.now() + 1000 * 60 * 60 * 48);
  return (
    <div className="dashboard-grid">
      <Metric title="Unread alerts" value={store.notifications.filter((item) => !item.read).length} />
      <Metric title="Assigned issues" value={assigned.length} />
      <Metric title="Due soon" value={dueSoon.length} />
      <Metric title="Active projects" value={store.projects.length} />
      <AppCard className="wide-card">
        <h2>Today</h2>
        {dueSoon.length === 0 ? <EmptyState title="No urgent work" body="Your current sprint has no items due in the next 48 hours." /> : dueSoon.map((issue) => <IssueListItem key={issue.id} issue={issue} assignee={store.user} active={false} onClick={() => store.setIssue(issue.id)} />)}
      </AppCard>
      <AppCard>
        <h2>Recent activity</h2>
        {store.activityLogs.slice(-5).map((log) => <p key={log.id} className="activity-line">{log.action.replaceAll("_", " ")} · {new Date(log.createdAt).toLocaleTimeString()}</p>)}
      </AppCard>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return <AppCard className="metric-card"><small>{title}</small><strong>{value}</strong></AppCard>;
}

function ChatView() {
  const store = useFlowStore();
  const messages = store.messages.filter((message) => message.roomId === store.activeRoomId);
  let lastDate = "";
  return (
    <div className="chat-view">
      <div className="message-list">
        {messages.length === 0 && <EmptyState title="Start the conversation" body="Send a message, share a file, or create an issue from chat." />}
        {messages.map((message) => {
          const date = new Date(message.createdAt).toDateString();
          const showDate = date !== lastDate;
          lastDate = date;
          return (
            <div key={message.id}>
              {showDate && <DateDivider date={message.createdAt} />}
              <MessageBubble
                message={message}
                mine={message.senderId === store.user?.id}
                sender={store.users.find((user) => user.id === message.senderId)}
                onIssue={() => void store.createIssueFromMessage(message.id)}
                onTask={() => void store.createTaskFromMessage(message.id)}
                onEdit={() => {
                  const next = window.prompt("Edit message", message.content);
                  if (next?.trim()) void store.updateMessage(message.id, next.trim());
                }}
                onDelete={() => {
                  if (window.confirm("Delete this message?")) void store.deleteMessage(message.id);
                }}
              />
            </div>
          );
        })}
      </div>
      {store.activeRoomId && <MessageInput onSend={(value) => store.sendMessage(store.activeRoomId!, value)} />}
    </div>
  );
}

function ProjectsView() {
  const store = useFlowStore();
  const project = store.projects.find((item) => item.id === store.activeProjectId);
  const projectIssues = store.issues.filter((issue) => issue.projectId === project?.id);
  const detail = store.issues.find((issue) => issue.id === store.activeIssueId);
  return (
    <div className="split-view">
      <section className="content-list">
        <h2>{project?.name ?? "Projects"}</h2>
        {projectIssues.map((issue) => (
          <IssueListItem key={issue.id} issue={issue} assignee={store.users.find((user) => user.id === issue.assigneeId)} active={detail?.id === issue.id} onClick={() => store.setIssue(issue.id)} />
        ))}
      </section>
      <IssueDetailPanel issue={detail} assignee={store.users.find((user) => user.id === detail?.assigneeId)} reporter={store.users.find((user) => user.id === detail?.reporterId)} comments={store.issueComments.filter((comment) => comment.issueId === detail?.id)} />
    </div>
  );
}

function BoardView() {
  const store = useFlowStore();
  const issues = store.issues.filter((issue) => issue.projectId === store.activeProjectId);
  return (
    <KanbanBoard
      issues={issues}
      users={store.users}
      onMove={(issueId, status: IssueStatus) => void store.moveIssue(issueId, status)}
      onSelect={(issueId) => store.setIssue(issueId)}
      onCreate={() => void store.createIssue("New board issue")}
    />
  );
}

function BacklogView() {
  const store = useFlowStore();
  const backlog = store.issues.filter((issue) => !issue.sprintId);
  const sprints = store.sprints.filter((sprint) => sprint.projectId === store.activeProjectId);
  return (
    <div className="split-view">
      <section className="content-list">
        <h2>Backlog</h2>
        {backlog.length === 0 ? <EmptyState title="Backlog is clear" body="Unplanned issues will appear here." /> : backlog.map((issue) => <IssueListItem key={issue.id} issue={issue} assignee={store.users.find((user) => user.id === issue.assigneeId)} active={false} onClick={() => store.setIssue(issue.id)} />)}
      </section>
      <section className="content-list">
        <h2>Sprints</h2>
        {sprints.map((sprint) => {
          const sprintIssues = store.issues.filter((issue) => issue.sprintId === sprint.id);
          const done = sprintIssues.filter((issue) => issue.status === "DONE").length;
          return (
            <AppCard key={sprint.id}>
              <strong>{sprint.name}</strong>
              <p className="muted">{sprint.goal}</p>
              <div className="progress"><i style={{ width: `${sprintIssues.length ? (done / sprintIssues.length) * 100 : 0}%` }} /></div>
              <small>{done}/{sprintIssues.length} complete · {sprint.status}</small>
            </AppCard>
          );
        })}
      </section>
    </div>
  );
}

function TasksView() {
  const store = useFlowStore();
  return (
    <div className="content-list">
      <h2>Tasks</h2>
      {store.tasks.map((task) => (
        <AppCard key={task.id}>
          <strong>{task.title}</strong>
          <p className="muted">{task.description ?? "No description"}</p>
          <StatusBadge status={(task.status === "IN_PROGRESS" ? "IN_PROGRESS" : task.status === "DONE" ? "DONE" : "TODO") as IssueStatus} />
        </AppCard>
      ))}
    </div>
  );
}

function FilesView() {
  const files = useFlowStore().messages.filter((message) => message.type === "FILE");
  return (
    <div className="content-list">
      <h2>Files</h2>
      {files.length === 0 ? <EmptyState title="No files yet" body="Shared chat and issue attachments will be grouped here." /> : files.map((message) => <AppCard key={message.id}><strong>{String(message.metadata?.fileName ?? message.content)}</strong><p className="muted">{String(message.metadata?.size ?? "Unknown size")}</p></AppCard>)}
    </div>
  );
}

function NotificationsView() {
  const store = useFlowStore();
  return (
    <div className="content-list">
      <h2>Notifications</h2>
      {store.notifications.map((item) => (
        <AppCard key={item.id} className={item.read ? "" : "unread-card"}>
          <strong>{item.title}</strong>
          <p>{item.body}</p>
          {!item.read && <AppButton onClick={() => void store.addIssueComment(String(item.data?.issueId ?? store.activeIssueId), "Acknowledged from notification center")}>Acknowledge</AppButton>}
        </AppCard>
      ))}
    </div>
  );
}

function IntegrationsView() {
  const store = useFlowStore();
  const [loading, setLoading] = useState(false);
  return (
    <div className="split-view">
      <section className="content-list">
        <h2>Connected services</h2>
        {store.integrations.map((integration) => <IntegrationCard key={integration.id} integration={integration} />)}
        {["GitHub", "GitLab", "Slack", "Teams", "Notion", "Google Calendar", "Webhook"].map((name) => <AppCard key={name}><strong>{name}</strong><p className="muted">Provider boundary ready for API and webhook expansion.</p></AppCard>)}
      </section>
      <JiraConnectionForm loading={loading} onConnect={async (cloudUrl, email, apiToken) => { setLoading(true); await store.connectJira(cloudUrl, email, apiToken); setLoading(false); }} />
    </div>
  );
}

function AdminView() {
  const store = useFlowStore();
  const members = store.workspaceMembers.filter((member) => member.workspaceId === store.activeWorkspaceId);
  return (
    <div className="content-list">
      <h2>Workspace admin</h2>
      <AppCard><strong>Invite link</strong><p className="muted">https://flowworks.local/invite/{store.activeWorkspaceId}</p><AppButton>Copy invite</AppButton></AppCard>
      {members.map((member) => {
        const user = store.users.find((item) => item.id === member.userId);
        return <AppCard key={member.id} className="member-row"><Avatar user={user} /><strong>{user?.name}</strong><span>{member.role}</span></AppCard>;
      })}
    </div>
  );
}

function SettingsView() {
  const store = useFlowStore();
  return (
    <div className="content-list">
      <h2>Settings</h2>
      <AppCard className="profile-card">
        <Avatar user={store.user} size={54} />
        <div><strong>{store.user?.name}</strong><p className="muted">{store.user?.department} · {store.user?.position}</p></div>
      </AppCard>
      <AppCard><strong>Notifications</strong><p className="muted">Room mute, issue mention only, DND, work-hour limits, desktop and push channels are modeled for expansion.</p></AppCard>
      <AppCard><strong>Security</strong><p className="muted">JWT, refresh token, workspace ACL, rate limiting, webhook secrets, and encrypted integration config are handled by the API layer.</p></AppCard>
      <AppCard className="backup-card">
        <strong>Local backup</strong>
        <p className="muted">Export or import all standalone data without any paid API or server.</p>
        <div className="backup-actions">
          <AppButton onClick={() => void store.exportBackup()}>Export JSON</AppButton>
          <label className="file-import">
            Import JSON
            <input type="file" accept="application/json" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void store.importBackup(file);
              event.currentTarget.value = "";
            }} />
          </label>
          <AppButton className="danger" onClick={() => {
            if (window.confirm("Reset local FlowWorks data on this device?")) void store.resetLocalData();
          }}>Reset local data</AppButton>
        </div>
      </AppCard>
      <AppButton className="danger" onClick={store.logout}><LogOut size={16} /> Logout</AppButton>
    </div>
  );
}

function MobileTabs() {
  const store = useFlowStore();
  const tabs = [
    ["chat", MessageCircle],
    ["projects", BriefcaseBusiness],
    ["tasks", CheckSquare],
    ["files", Files],
    ["settings", PanelLeft]
  ] as const;
  return (
    <nav className="mobile-tabs">
      {tabs.map(([id, Icon]) => (
        <button key={id} className={store.activeView === id ? "active" : ""} onClick={() => store.setView(id)}>
          <Icon size={20} />
        </button>
      ))}
    </nav>
  );
}
