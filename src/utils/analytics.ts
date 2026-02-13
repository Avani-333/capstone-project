type AnalyticsPayload = {
  event: string;
  props?: Record<string, unknown>;
  ts: string;
};

function endpoint(): string | null {
  const raw = (import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined) ?? "";
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

export function track(event: string, props: Record<string, unknown> = {}) {
  const url = endpoint();
  if (!url) return;

  const payload: AnalyticsPayload = {
    event,
    props,
    ts: new Date().toISOString(),
  };

  try {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }

    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // ignore analytics failures
  }
}
