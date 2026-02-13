export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type Json = Record<string, unknown> | unknown[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (fromEnv ?? "").replace(/\/$/, "");
}

export async function httpJson<TResponse>(
  path: string,
  options: { method?: HttpMethod; body?: Json } = {},
): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const message =
      (isRecord(json) && "error" in json && typeof json.error === "string"
        ? json.error
        : `Request failed (${res.status})`) as string;
    throw new Error(message);
  }

  return json as TResponse;
}
