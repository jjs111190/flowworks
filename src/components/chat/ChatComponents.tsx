import { AtSign, FileText, Link2, MoreHorizontal, Plus, Send, SmilePlus } from "lucide-react";
import { memo, useMemo, useRef, useState } from "react";
import { AppButton, Avatar, Badge, IconButton } from "../common/AppPrimitives";
import type { Message, Room, User } from "../../types/models";
import { validateUploadFile } from "../../services/storage/filePolicy";

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
        <small>{lastMessage?.content ?? "아직 메시지가 없습니다"}</small>
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
        {!mine && <small className="sender-name">{sender?.name ?? "알 수 없음"}</small>}
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
            {message.editedAt && <span>수정됨</span>}
            {message.optimistic && <span>전송 중</span>}
            {message.failed && <button onClick={() => undefined}>재전송</button>}
            {message.linkedIssueId && <Badge tone="green">이슈 연결됨</Badge>}
          </footer>
        </div>
        <div className="message-actions">
          <button onClick={onIssue}>이슈로 만들기</button>
          <button onClick={onTask}>할 일로 만들기</button>
          {mine && <button onClick={onEdit}>수정</button>}
          {mine && <button onClick={onDelete}>삭제</button>}
        </div>
      </div>
    </div>
  );
});

export function MessageInput({ onSend, onSendFile }: { onSend: (value: string) => Promise<void>; onSendFile: (file: File) => Promise<void> }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  async function submit() {
    if (!value.trim() || sending) return;
    const next = value.trim();
    setValue("");
    setSending(true);
    await onSend(next);
    setSending(false);
  }
  async function submitFile(file?: File) {
    if (!file || sending) return;
    const result = validateUploadFile(file);
    if (!result.ok) {
      window.alert(result.reason);
      return;
    }
    setSending(true);
    await onSendFile(file);
    setSending(false);
  }
  return (
    <div className="message-input">
      <input
        ref={fileInputRef}
        type="file"
        className="visually-hidden"
        onChange={(event) => {
          void submitFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      <IconButton label="파일 첨부" onClick={() => fileInputRef.current?.click()}><Plus size={18} /></IconButton>
      <IconButton label="이모지 추가" onClick={() => setValue((current) => `${current} 좋아요`)}><SmilePlus size={18} /></IconButton>
      <IconButton label="멘션 추가" onClick={() => setValue((current) => `${current}@`)}><AtSign size={18} /></IconButton>
      <IconButton label="이슈 키 추가" onClick={() => setValue((current) => `${current} FLOW-`)}><Link2 size={18} /></IconButton>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void submit();
          }
        }}
        placeholder="메시지, @멘션, #프로젝트, FLOW-1을 입력하세요"
      />
      <AppButton className="send-button" disabled={!value.trim() || sending} onClick={() => void submit()}>
        <Send size={16} />
      </AppButton>
    </div>
  );
}

export function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return <div className="typing-indicator">{names.join(", ")} 입력 중...</div>;
}

export function ReactionBar() {
  return <div className="reaction-bar"><button>좋아요</button><button>확인</button><button>완료</button><MoreHorizontal size={14} /></div>;
}
