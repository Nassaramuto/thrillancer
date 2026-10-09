import type { PublicProfile, SessionUser } from "@thrillancer/contracts";

export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:2567";
export const COLYSEUS_URL: string = (import.meta.env.VITE_COLYSEUS_URL as string | undefined) ?? API_URL.replace(/^http/, "ws");

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "network", `Cannot reach the game server at ${API_URL}. Is it running?`);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string } & T;
  if (!res.ok) throw new ApiError(res.status, data.error ?? "error", data.message ?? data.error ?? `Request failed (${res.status})`);
  return data;
}

export const api = {
  session: () => call<{ user: SessionUser | null }>("GET", "/session"),
  guest: (nickname: string) => call<{ user: SessionUser; reused: boolean }>("POST", "/session/guest", { nickname }),
  signOut: () => call<{ ok: true }>("POST", "/session/signout", {}),
  ticket: () => call<{ ticket: string }>("POST", "/room-ticket", {}),
  profile: (id: string) => call<{ profile: PublicProfile }>("GET", `/profile/${encodeURIComponent(id)}`),
};
