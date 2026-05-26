import { Plus } from "lucide-react";
import { issueStatus } from "../../theme/issueStatus";
import type { Issue, IssueStatus, User } from "../../types/models";
import { IconButton } from "../common/AppPrimitives";
import { IssueCard } from "../project/ProjectComponents";

const columns: IssueStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"];

export function KanbanBoard({
  issues,
  users,
  onMove,
  onSelect,
  onCreate
}: {
  issues: Issue[];
  users: User[];
  onMove: (issueId: string, status: IssueStatus) => void;
  onSelect: (issueId: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="kanban-board">
      {columns.map((status) => {
        const columnIssues = issues.filter((issue) => issue.status === status);
        const statusMeta = issueStatus[status];
        return (
          <section
            key={status}
            className="kanban-column"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const issueId = event.dataTransfer.getData("text/issue-id");
              if (issueId) onMove(issueId, status);
            }}
          >
            <header>
              <span style={{ background: statusMeta.bg, color: statusMeta.color }}>{statusMeta.label}</span>
              <b>{columnIssues.length}</b>
              <IconButton label={`${statusMeta.label}에 이슈 만들기`} onClick={onCreate}><Plus size={16} /></IconButton>
            </header>
            <div className="kanban-list">
              {columnIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} assignee={users.find((user) => user.id === issue.assigneeId)} onClick={() => onSelect(issue.id)} draggable />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
