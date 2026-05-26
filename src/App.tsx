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
  { id: "home", label: "홈", icon: Home },
  { id: "chat", label: "채팅", icon: MessageCircle },
  { id: "projects", label: "프로젝트", icon: BriefcaseBusiness },
  { id: "board", label: "보드", icon: KanbanSquare },
  { id: "backlog", label: "백로그", icon: CheckSquare },
  { id: "tasks", label: "업무", icon: CheckSquare },
  { id: "files", label: "파일", icon: Files },
  { id: "notifications", label: "알림", icon: Bell },
  { id: "integrations", label: "연동", icon: Plug },
  { id: "admin", label: "관리자", icon: Shield },
  { id: "settings", label: "설정", icon: Settings }
] as const;

const socketStatusLabel = {
  CONNECTED: "연결됨",
  CONNECTING: "연결 중",
  DISCONNECTED: "오프라인"
} as const;

const sprintStatusLabel: Record<string, string> = {
  PLANNED: "계획됨",
  ACTIVE: "진행 중",
  COMPLETED: "완료"
};

const roleLabel: Record<string, string> = {
  OWNER: "소유자",
  ADMIN: "관리자",
  PROJECT_MANAGER: "프로젝트 관리자",
  MEMBER: "멤버",
  GUEST: "게스트"
};

const activityLabel: Record<string, string> = {
  STANDALONE_READY: "서버 없는 앱 준비 완료"
};

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
        <button title="테마 변경" onClick={store.toggleTheme}>{store.themeMode === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
      </aside>

      <aside className="side-panel">
        <header className="side-header">
          <div>
            <small>{activeWorkspace?.name}</small>
            <h1>FlowWorks</h1>
          </div>
          <Avatar user={store.user} />
        </header>
        <SearchBar value={store.search} onChange={store.setSearch} placeholder="메시지, 이슈, 파일 검색" />
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
        <TopBar workspaceName={activeWorkspace?.name ?? "워크스페이스"} projectName={activeProject?.name} roomName={activeRoom?.name} />
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
  const [name, setName] = useState("새 멤버");
  const [workspaceName, setWorkspaceName] = useState("FlowWorks 팀");

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <span>FlowWorks</span>
        <h1>채팅, 업무, 이슈, 스프린트를 하나의 깔끔한 워크스페이스에서 관리하세요.</h1>
        <p>빠른 업무 채팅, 구조화된 협업, Jira형 실행 관리를 복잡함 없이 사용할 수 있도록 만든 무료 로컬 우선 앱입니다.</p>
      </section>
      <AppCard className="auth-card">
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>로그인</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>회원가입</button>
        </div>
        {mode === "register" && <AppInput value={name} onChange={(event) => setName(event.target.value)} placeholder="이름" />}
        {mode === "register" && <AppInput value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="워크스페이스 이름" />}
        <AppInput value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일" />
        <AppInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" type="password" />
        {store.error && <p className="form-error">{store.error}</p>}
        <AppButton onClick={() => mode === "login" ? void store.login(email, password) : void store.register({ email, password, name, workspaceName })}>
          {store.loading ? "처리 중..." : mode === "login" ? "로그인" : "워크스페이스 만들기"}
        </AppButton>
        <p className="muted">데모 계정: jae@flowworks.local / flowworks123!</p>
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
        <strong>{store.activeView === "chat" ? `#${roomName}` : projectName ?? "대시보드"}</strong>
      </div>
      <div className="top-actions">
        <span className={`socket-pill ${store.socketStatus.toLowerCase()}`}>{socketStatusLabel[store.socketStatus]}</span>
        <AppButton onClick={() => void store.createIssue("빠른 추가 이슈")}>새 이슈</AppButton>
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
        <h2>채팅방</h2>
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
        <h2>프로젝트</h2>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            issues={store.issues.filter((issue) => issue.projectId === project.id)}
            members={store.users}
            onClick={() => store.setProject(project.id)}
          />
        ))}
        <h2>이슈</h2>
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
      <h2>요약 상태</h2>
      <AppCard>
        <strong>읽지 않은 알림 {store.notifications.filter((item) => !item.read).length}개</strong>
        <p className="muted">내 미완료 이슈 {store.issues.filter((issue) => issue.assigneeId === store.user?.id && issue.status !== "DONE").length}개</p>
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
      <Metric title="읽지 않은 알림" value={store.notifications.filter((item) => !item.read).length} />
      <Metric title="내 담당 이슈" value={assigned.length} />
      <Metric title="마감 임박" value={dueSoon.length} />
      <Metric title="진행 프로젝트" value={store.projects.length} />
      <AppCard className="wide-card">
        <h2>오늘</h2>
        {dueSoon.length === 0 ? <EmptyState title="긴급 업무가 없습니다" body="앞으로 48시간 안에 마감되는 스프린트 항목이 없습니다." /> : dueSoon.map((issue) => <IssueListItem key={issue.id} issue={issue} assignee={store.user} active={false} onClick={() => store.setIssue(issue.id)} />)}
      </AppCard>
      <AppCard>
        <h2>최근 활동</h2>
        {store.activityLogs.slice(-5).map((log) => <p key={log.id} className="activity-line">{activityLabel[log.action] ?? log.action.replaceAll("_", " ")} · {new Date(log.createdAt).toLocaleTimeString()}</p>)}
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
        {messages.length === 0 && <EmptyState title="대화를 시작하세요" body="메시지를 보내고, 파일을 공유하고, 채팅에서 바로 이슈를 만들 수 있습니다." />}
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
                  const next = window.prompt("메시지 수정", message.content);
                  if (next?.trim()) void store.updateMessage(message.id, next.trim());
                }}
                onDelete={() => {
                  if (window.confirm("이 메시지를 삭제할까요?")) void store.deleteMessage(message.id);
                }}
              />
            </div>
          );
        })}
      </div>
      {store.activeRoomId && <MessageInput onSend={(value) => store.sendMessage(store.activeRoomId!, value)} onSendFile={(file) => store.sendFileMessage(store.activeRoomId!, file)} />}
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
        <h2>{project?.name ?? "프로젝트"}</h2>
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
      onCreate={() => void store.createIssue("보드에서 만든 새 이슈")}
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
        <h2>백로그</h2>
        {backlog.length === 0 ? <EmptyState title="백로그가 비어 있습니다" body="아직 스프린트에 포함되지 않은 이슈가 여기에 표시됩니다." /> : backlog.map((issue) => <IssueListItem key={issue.id} issue={issue} assignee={store.users.find((user) => user.id === issue.assigneeId)} active={false} onClick={() => store.setIssue(issue.id)} />)}
      </section>
      <section className="content-list">
        <h2>스프린트</h2>
        {sprints.map((sprint) => {
          const sprintIssues = store.issues.filter((issue) => issue.sprintId === sprint.id);
          const done = sprintIssues.filter((issue) => issue.status === "DONE").length;
          return (
            <AppCard key={sprint.id}>
              <strong>{sprint.name}</strong>
              <p className="muted">{sprint.goal}</p>
              <div className="progress"><i style={{ width: `${sprintIssues.length ? (done / sprintIssues.length) * 100 : 0}%` }} /></div>
              <small>{done}/{sprintIssues.length} 완료 · {sprintStatusLabel[sprint.status] ?? sprint.status}</small>
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
      <h2>업무</h2>
      {store.tasks.map((task) => (
        <AppCard key={task.id}>
          <strong>{task.title}</strong>
          <p className="muted">{task.description ?? "설명이 없습니다"}</p>
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
      <h2>파일</h2>
      {files.length === 0 ? <EmptyState title="아직 파일이 없습니다" body="채팅과 이슈에서 공유한 첨부파일이 여기에 모입니다." /> : files.map((message) => <AppCard key={message.id}><strong>{String(message.metadata?.fileName ?? message.content)}</strong><p className="muted">{String(message.metadata?.size ?? "크기 알 수 없음")}</p></AppCard>)}
    </div>
  );
}

function NotificationsView() {
  const store = useFlowStore();
  return (
    <div className="content-list">
      <h2>알림</h2>
      {store.notifications.map((item) => (
        <AppCard key={item.id} className={item.read ? "" : "unread-card"}>
          <strong>{item.title}</strong>
          <p>{item.body}</p>
          {!item.read && <AppButton onClick={() => void store.markNotificationRead(item.id)}>확인</AppButton>}
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
        <h2>연결된 서비스</h2>
        {store.integrations.map((integration) => <IntegrationCard key={integration.id} integration={integration} />)}
        {["GitHub", "GitLab", "Slack", "Teams", "Notion", "Google Calendar", "Webhook"].map((name) => <AppCard key={name}><strong>{name}</strong><p className="muted">API와 Webhook 확장을 위한 제공자 구조가 준비되어 있습니다.</p></AppCard>)}
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
      <h2>워크스페이스 관리자</h2>
      <AppCard><strong>초대 링크</strong><p className="muted">https://flowworks.local/invite/{store.activeWorkspaceId}</p><AppButton onClick={() => void navigator.clipboard?.writeText(`https://flowworks.local/invite/${store.activeWorkspaceId}`)}>초대 링크 복사</AppButton></AppCard>
      {members.map((member) => {
        const user = store.users.find((item) => item.id === member.userId);
        return <AppCard key={member.id} className="member-row"><Avatar user={user} /><strong>{user?.name}</strong><span>{roleLabel[member.role] ?? member.role}</span></AppCard>;
      })}
    </div>
  );
}

function SettingsView() {
  const store = useFlowStore();
  return (
    <div className="content-list">
      <h2>설정</h2>
      <AppCard className="profile-card">
        <Avatar user={store.user} size={54} />
        <div><strong>{store.user?.name}</strong><p className="muted">{store.user?.department} · {store.user?.position}</p></div>
      </AppCard>
      <AppCard><strong>알림</strong><p className="muted">채팅방 음소거, 이슈 멘션만 받기, 방해금지, 근무시간 제한, 데스크톱/푸시 알림 확장 구조가 준비되어 있습니다.</p></AppCard>
      <AppCard><strong>보안</strong><p className="muted">JWT, Refresh Token, 워크스페이스 권한, 요청 제한, Webhook Secret, 연동 설정 암호화는 API 계층에서 처리하도록 설계했습니다.</p></AppCard>
      <AppCard className="backup-card">
        <strong>로컬 백업</strong>
        <p className="muted">유료 API나 서버 없이 현재 기기의 데이터를 JSON으로 내보내거나 가져올 수 있습니다.</p>
        <div className="backup-actions">
          <AppButton onClick={() => void store.exportBackup()}>JSON 내보내기</AppButton>
          <label className="file-import">
            JSON 가져오기
            <input type="file" accept="application/json" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void store.importBackup(file);
              event.currentTarget.value = "";
            }} />
          </label>
          <AppButton className="danger" onClick={() => {
            if (window.confirm("이 기기의 FlowWorks 로컬 데이터를 초기화할까요?")) void store.resetLocalData();
          }}>로컬 데이터 초기화</AppButton>
        </div>
      </AppCard>
      <AppButton className="danger" onClick={store.logout}><LogOut size={16} /> 로그아웃</AppButton>
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
