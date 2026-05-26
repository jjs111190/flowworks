import { AtSign, FileText, Link2, MoreHorizontal, Plus, Send, SmilePlus } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { AppButton, Avatar, Badge, IconButton } from "../common/AppPrimitives";
import type { Message, Room, User } from "../../types/models";

export const ChatRoomListItem = memo(function ChatRoomListItem({
  room,
  lastMessage,
  unread,
  active,
  onClick
}: {
  room: Room;
  lastMessage?: Message;
  unread: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`room-row ${active ? "active" : ""}`} onClick={onClick}>
      <span className="room-avatar">#</span>
      <span className="room-main">
        <strong>{room.name}</strong>
        <small>{lastMessage?.content ?? "No messages yet"}</small>
      </span>
      <span className="room-meta">
        <small>{lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</small>
        {unread > 0 && <i>{unread}</i>}
      </span>
    </button>
  );
});

export function DateDivider({ date }: { date: string }) {
  return <div className="date-divider"><span>{new Date(date).toLocaleDateString()}</span></div>;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  mine,
  sender,
  onIssue,
  onTask,
  onEdit,
  onDelete
}: {
  message: Message;
  mine: boolean;
  sender?: User;
  onIssue: () => void;
  onTask: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mentions = useMemo(() => message.content.match(/(@[\w\s]+|[A-Z]+-\d+)/g) ?? [], [message.content]);
  return (
    <div className={`message-row ${mine ? "mine" : ""}`}>
      {!mine && <Avatar user={sender} size={30} />}
      <div className="message-stack">
        {!mine && <small className="sender-name">{sender?.name ?? "Unknown"}</small>}
        <div className={`message-bubble type-${message.type.toLowerCase()}`}>
          {message.type === "FILE" && (
            <div className="file-card">
              <FileText size={18} />
              <span>{String(message.metadata?.fileName ?? message.content)}</span>
            </div>
          )}
          {message.type !== "FILE" && <p>{message.content}</p>}
          {mentions.length > 0 && <div className="mention-line">{mentions.map((item) => <Badge key={item} tone="blue">{item}</Badge>)}</div>}
          <footer>
            <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            {message.editedAt && <span>edited</span>}
            {message.optimistic && <span>sending</span>}
            {message.failed && <button onClick={() => undefined}>retry</button>}
            {message.linkedIssueId && <Badge tone="green">Issue linked</Badge>}
          </footer>
        </div>
        <div className="message-actions">
          <button onClick={onIssue}>Create issue</button>
          <button onClick={onTask}>Create task</button>
          {mine && <button onClick={onEdit}>Edit</button>}
          {mine && <button onClick={onDelete}>Delete</button>}
          <button>Notice</button>
          <button>Reply</button>
        </div>
      </div>
    </div>
  );
});

export function MessageInput({ onSend }: { onSend: (value: string) => Promise<void> }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  async function submit() {
    if (!value.trim() || sending) return;
    const next = value.trim();
    setValue("");
    setSending(true);
    await onSend(next);
    setSending(false);
  }
  return (
    <div className="message-input">
      <IconButton label="Attach file"><Plus size={18} /></IconButton>
      <IconButton label="Add emoji"><SmilePlus size={18} /></IconButton>
      <IconButton label="Mention"><AtSign size={18} /></IconButton>
      <IconButton label="Link issue"><Link2 size={18} /></IconButton>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void submit();
          }
        }}
        placeholder="Message, @mention, #project, or FLOW-1"
      />
      <AppButton className="send-button" disabled={!value.trim() || sending} onClick={() => void submit()}>
        <Send size={16} />
      </AppButton>
    </div>
  );
}

export function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return <div className="typing-indicator">{names.join(", ")} typing...</div>;
}

export function ReactionBar() {
  return <div className="reaction-bar"><button>+1</button><button>eyes</button><button>done</button><MoreHorizontal size={14} /></div>;
}
