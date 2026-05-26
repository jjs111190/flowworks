import { CheckCircle2, PlugZap } from "lucide-react";
import { useState } from "react";
import { AppButton, AppCard, AppInput, Badge } from "../common/AppPrimitives";
import type { Integration } from "../../types/models";

const integrationStatusLabel: Record<Integration["status"], string> = {
  CONNECTED: "연결됨",
  DISCONNECTED: "연결 안 됨",
  ERROR: "오류"
};

export function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <AppCard className="integration-card">
      <PlugZap size={20} />
      <div>
        <strong>{integration.name}</strong>
        <p>제공자: {integration.provider}</p>
      </div>
      <Badge tone={integration.status === "CONNECTED" ? "green" : integration.status === "ERROR" ? "red" : "neutral"}>{integrationStatusLabel[integration.status]}</Badge>
    </AppCard>
  );
}

export function JiraConnectionForm({ onConnect, loading }: { onConnect: (cloudUrl: string, email: string, apiToken: string) => Promise<void>; loading: boolean }) {
  const [cloudUrl, setCloudUrl] = useState("https://example.atlassian.net");
  const [email, setEmail] = useState("admin@example.com");
  const [apiToken, setApiToken] = useState("mock-token-123456");
  return (
    <AppCard className="jira-form">
      <header><CheckCircle2 size={20} /><strong>Jira Cloud</strong></header>
      <AppInput value={cloudUrl} onChange={(event) => setCloudUrl(event.target.value)} placeholder="Jira Cloud URL" />
      <AppInput value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Jira 이메일" />
      <AppInput value={apiToken} onChange={(event) => setApiToken(event.target.value)} placeholder="API 토큰" type="password" />
      <p className="muted">토큰은 백엔드로만 전달되어 암호화 저장되도록 설계되어 있습니다. 현재 무료 MVP에서는 Mock Jira 제공자가 기본으로 동작합니다.</p>
      <AppButton disabled={loading} onClick={() => void onConnect(cloudUrl, email, apiToken)}>{loading ? "연결 중..." : "Jira 연결"}</AppButton>
    </AppCard>
  );
}
