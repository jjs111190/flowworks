import { CalendarDays, MessageCircle, Paperclip } from "lucide-react";
import { AppCard, Avatar, PriorityBadge, StatusBadge, UserAvatarGroup } from "../common/AppPrimitives";
import type { Issue, Project, User } from "../../types/models";

export function ProjectCard({ project, issues, members, onClick }: { project: Project; issues: Issue[]; members: User[]; onClick: () => void }) {
  const done = issues.filter((issue) => issue.status === "DONE").length;
  const progress = issues.length ? Math.round((done / issues.length) * 100) : 0;
  return (
    <button className="project-card" onClick={onClick}>
      <span className="project-dot" style={{ background: project.color }} />
      <strong>{project.name}</strong>
      <small>{project.key} · 미완료 이슈 {issues.filter((issue) => issue.status !== "DONE").length}개</small>
      <div className="progress"><i style={{ width: `${progress}%` }} /></div>
      <footer><span>{progress}%</span><UserAvatarGroup users={members} /></footer>
    </button>
  );
}

export function IssueCard({ issue, assignee, onClick, draggable = false }: { issue: Issue; assignee?: User; onClick?: () => void; draggable?: boolean }) {
  return (
    <button className="issue-card" onClick={onClick} draggable={draggable} onDragStart={(event) => event.dataTransfer.setData("text/issue-id", issue.id)}>
      <header>
        <span>{issue.issueKey}</span>
        <PriorityBadge priority={issue.priority} />
      </header>
      <strong>{issue.title}</strong>
      <div className="label-row">
        {issue.labels.slice(0, 3).map((label) => <span key={label} className="label-chip">{label}</span>)}
      </div>
      <footer>
        <span><MessageCircle size={13} /> {issue.commentCount}</span>
        <span><Paperclip size={13} /> {issue.attachmentCount}</span>
        {issue.dueDate && <span><CalendarDays size={13} /> {new Date(issue.dueDate).toLocaleDateString()}</span>}
        <Avatar user={assignee} size={26} />
      </footer>
    </button>
  );
}

export function IssueListItem({ issue, assignee, active, onClick }: { issue: Issue; assignee?: User; active: boolean; onClick: () => void }) {
  return (
    <button className={`issue-row ${active ? "active" : ""}`} onClick={onClick}>
      <div>
        <strong>{issue.issueKey}</strong>
        <span>{issue.title}</span>
      </div>
      <StatusBadge status={issue.status} />
      <PriorityBadge priority={issue.priority} />
      <Avatar user={assignee} size={28} />
    </button>
  );
}

export function IssueDetailPanel({ issue, assignee, reporter, comments }: { issue?: Issue; assignee?: User; reporter?: User; comments: Array<{ id: string; content: string; authorId: string; createdAt: string }> }) {
  if (!issue) {
    return <AppCard><strong>이슈를 선택하세요</strong><p className="muted">상세 정보, 댓글, 연결 메시지, Jira 동기화 상태를 확인할 이슈를 선택하세요.</p></AppCard>;
  }
  return (
    <AppCard className="issue-detail">
      <header>
        <div>
          <small>{issue.issueKey}</small>
          <h2>{issue.title}</h2>
        </div>
        <StatusBadge status={issue.status} />
        <PriorityBadge priority={issue.priority} />
      </header>
      <p>{issue.description ?? "아직 설명이 없습니다."}</p>
      <div className="detail-grid">
        <span><small>담당자</small><b>{assignee?.name ?? "미지정"}</b></span>
        <span><small>보고자</small><b>{reporter?.name ?? "알 수 없음"}</b></span>
        <span><small>마감일</small><b>{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : "없음"}</b></span>
        <span><small>스프린트</small><b>{issue.sprintId ?? "백로그"}</b></span>
      </div>
      {issue.externalIssueKey && <a className="external-link" href={issue.externalIssueUrl} target="_blank" rel="noreferrer">외부 Jira: {issue.externalIssueKey}</a>}
      <h3>댓글</h3>
      <div className="comment-list">
        {comments.length === 0 ? <p className="muted">아직 댓글이 없습니다.</p> : comments.map((comment) => <p key={comment.id}>{comment.content}</p>)}
      </div>
    </AppCard>
  );
}
