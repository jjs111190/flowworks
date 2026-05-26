import { AlertCircle, Loader2, Search } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { issueStatus } from "../../theme/issueStatus";
import { priorityColors } from "../../theme/priorityColors";
import type { IssuePriority, IssueStatus, User } from "../../types/models";

export function AppButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`app-button ${className}`} {...props} />;
}

export function IconButton({ className = "", label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className={`icon-button ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

export function AppInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`app-input ${className}`} {...props} />;
}

export function AppCard({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <section className={`app-card ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: PropsWithChildren<{ tone?: "neutral" | "blue" | "green" | "red" | "amber" }>) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  const value = issueStatus[status];
  return (
    <span className="soft-badge" style={{ color: value.color, backgroundColor: value.bg }}>
      {value.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: IssuePriority }) {
  const value = priorityColors[priority];
  return (
    <span className="soft-badge" style={{ color: value.color, backgroundColor: value.bg }}>
      {value.label}
    </span>
  );
}

export function Avatar({ user, size = 34 }: { user?: Pick<User, "name" | "avatarUrl" | "presenceStatus">; size?: number }) {
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2) || "FW";
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials}
      {user?.presenceStatus && <i className={`presence presence-${user.presenceStatus.toLowerCase()}`} />}
    </span>
  );
}

export function UserAvatarGroup({ users }: { users: User[] }) {
  return (
    <div className="avatar-group">
      {users.slice(0, 4).map((user) => (
        <Avatar key={user.id} user={user} size={28} />
      ))}
      {users.length > 4 && <span className="avatar-more">+{users.length - 4}</span>}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = "Search" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="search-bar">
      <Search size={16} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon ?? <AlertCircle size={22} />}</div>
      <strong>{title}</strong>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function LoadingView() {
  return (
    <div className="loading-view">
      <Loader2 className="spin" size={26} />
      <span>FlowWorks를 불러오는 중</span>
    </div>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="loading-view">
      <AlertCircle size={28} />
      <strong>{message}</strong>
      <AppButton onClick={onRetry}>다시 시도</AppButton>
    </div>
  );
}

export function SegmentedControl<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (value: T) => void }) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button key={option} className={value === option ? "active" : ""} onClick={() => onChange(option)}>
          {option.replaceAll("_", " ").toLowerCase()}
        </button>
      ))}
    </div>
  );
}

export function SkeletonView() {
  return (
    <div className="skeleton-stack">
      <span />
      <span />
      <span />
    </div>
  );
}
