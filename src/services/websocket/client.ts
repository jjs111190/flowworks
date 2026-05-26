import { getAccessToken, isStandaloneMode } from "../api/client";

export type FlowEvent =
  | { type: "connect"; payload: { userId: string } }
  | { type: "message_created" | "message_updated" | "message_deleted"; roomId: string; payload: unknown; ackId?: string }
  | { type: "message_read" | "typing_start" | "typing_stop"; roomId: string; payload: unknown }
  | { type: "issue_created" | "issue_updated" | "issue_commented"; payload: unknown };

export class FlowSocket {
  private socket?: WebSocket;
  private listeners = new Set<(event: FlowEvent) => void>();
  private joinedRooms = new Set<string>();
  private retryTimer?: number;
  status: "DISCONNECTED" | "CONNECTING" | "CONNECTED" = "DISCONNECTED";

  connect() {
    const token = getAccessToken();
    if (!token || this.status === "CONNECTING" || this.status === "CONNECTED") return;
    if (isStandaloneMode) {
      this.status = "CONNECTED";
      this.listeners.forEach((listener) => listener({ type: "connect", payload: { userId: "standalone" } }));
      return;
    }
    this.status = "CONNECTING";
    const base = import.meta.env.VITE_WS_URL ?? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;
    this.socket = new WebSocket(`${base}?token=${encodeURIComponent(token)}`);
    this.socket.onopen = () => {
      this.status = "CONNECTED";
      this.joinedRooms.forEach((roomId) => this.send({ type: "join_room", roomId }));
    };
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as FlowEvent;
      this.listeners.forEach((listener) => listener(data));
    };
    this.socket.onclose = () => {
      this.status = "DISCONNECTED";
      window.clearTimeout(this.retryTimer);
      this.retryTimer = window.setTimeout(() => this.connect(), 1200);
    };
  }

  on(listener: (event: FlowEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  join(roomId: string) {
    this.joinedRooms.add(roomId);
    this.send({ type: "join_room", roomId });
  }

  leave(roomId: string) {
    this.joinedRooms.delete(roomId);
    this.send({ type: "leave_room", roomId });
  }

  send(payload: Record<string, unknown>) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }
}

export const flowSocket = new FlowSocket();
