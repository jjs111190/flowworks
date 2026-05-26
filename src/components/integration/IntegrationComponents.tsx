import { CheckCircle2, PlugZap } from "lucide-react";
import { useState } from "react";
import { AppButton, AppCard, AppInput, Badge } from "../common/AppPrimitives";
import type { Integration } from "../../types/models";

export function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <AppCard className="integration-card">
      <PlugZap size={20} />
      <div>
        <strong>{integration.name}</strong>
        <p>Provider: {integration.provider}</p>
      </div>
      <Badge tone={integration.status === "CONNECTED" ? "green" : integration.status === "ERROR" ? "red" : "neutral"}>{integration.status}</Badge>
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
      <AppInput value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Jira email" />
      <AppInput value={apiToken} onChange={(event) => setApiToken(event.target.value)} placeholder="API token" type="password" />
      <p className="muted">Token is posted to the backend and encrypted before storage. The mock provider is active by default.</p>
      <AppButton disabled={loading} onClick={() => void onConnect(cloudUrl, email, apiToken)}>{loading ? "Connecting..." : "Connect Jira"}</AppButton>
    </AppCard>
  );
}
