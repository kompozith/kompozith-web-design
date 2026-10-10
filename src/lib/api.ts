/**
 * Typed client for the CMS API.
 *
 * All requests are same-origin with credentials, and every mutating call
 * echoes the CSRF cookie back in a header — the server rejects it otherwise.
 */
import type { Project, ProjectCard, ProjectStatus } from "../../server/types.ts";

export type { Project, ProjectCard, ProjectStatus };
export type {
  Block,
  BlockType,
  BulletItem,
  GalleryImage,
  ProcessStep,
  StatItem,
} from "../../server/types.ts";

const BASE = "/api";

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function csrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)kz_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD"].includes(method)) {
    headers.set("X-CSRF-Token", csrfToken());
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    method,
    headers,
    credentials: "same-origin",
  });

  const raw = await res.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const message =
      (payload as { error?: string } | null)?.error ??
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return payload as T;
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

/* ------------------------------------------------------------------ public */

export interface AdminUserView {
  id: string;
  username: string;
  email: string;
  role: "owner" | "editor";
  createdAt: string;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
}

export interface ProjectSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: ProjectStatus;
  coverImage: string;
  order: number;
  featured: boolean;
  updatedAt: string;
  publishedAt: string | null;
  sectionCount: number;
}

export interface MediaFile {
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export type LoginResult =
  | { status: "signed-in"; user: AdminUserView }
  | {
      status: "mfa-required";
      challengeToken: string;
      sentTo: string;
      expiresInSec: number;
    };

export const api = {
  listPublished: () =>
    request<{ projects: ProjectCard[] }>("/projects"),

  getPublished: (slug: string) =>
    request<{ project: Project; next: ProjectCard | null }>(
      `/projects/${encodeURIComponent(slug)}`,
    ),

  /* ---- auth ---- */
  authConfig: () => request<{ mfaRequired: boolean }>("/auth/config"),

  /**
   * Either signs in outright (`status: "signed-in"`) or opens a one-time-code
   * challenge, depending on whether the server requires a second factor.
   */
  login: (username: string, password: string) =>
    request<LoginResult>("/auth/login", {
      method: "POST",
      ...json({ username, password }),
    }),

  resendCode: (challengeToken: string) =>
    request<{ ok: true; expiresInSec: number }>("/auth/resend", {
      method: "POST",
      ...json({ challengeToken }),
    }),

  verifyCode: (challengeToken: string, code: string) =>
    request<{ user: AdminUserView }>("/auth/verify", {
      method: "POST",
      ...json({ challengeToken, code }),
    }),

  me: () =>
    request<{ user: AdminUserView; mfaRequired: boolean }>("/auth/me"),

  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>("/auth/password", {
      method: "POST",
      ...json({ currentPassword, newPassword }),
    }),

  sessions: () =>
    request<{
      sessions: {
        current: boolean;
        createdAt: string;
        lastSeenAt: string;
        ip: string;
        userAgent: string;
      }[];
    }>("/auth/sessions"),

  revokeOtherSessions: () =>
    request<{ ok: true }>("/auth/sessions/revoke-others", { method: "POST" }),

  /* ---- content ---- */
  overview: () =>
    request<{
      counts: { total: number; published: number; drafts: number };
      recentActivity: {
        id: string;
        at: string;
        event: string;
        detail: string;
        ip: string;
      }[];
    }>("/admin/overview"),

  listProjects: () =>
    request<{ projects: ProjectSummary[] }>("/admin/projects"),

  getProject: (id: string) =>
    request<{ project: Project }>(`/admin/projects/${id}`),

  createProject: (draft: Partial<Project>) =>
    request<{ project: Project }>("/admin/projects", {
      method: "POST",
      ...json(draft),
    }),

  saveProject: (id: string, project: Project) =>
    request<{ project: Project }>(`/admin/projects/${id}`, {
      method: "PUT",
      ...json(project),
    }),

  setProjectStatus: (id: string, status: ProjectStatus) =>
    request<{ project: Project }>(`/admin/projects/${id}/status`, {
      method: "POST",
      ...json({ status }),
    }),

  reorderProjects: (ids: string[]) =>
    request<{ ok: true }>("/admin/projects/reorder", {
      method: "POST",
      ...json({ ids }),
    }),

  deleteProject: (id: string) =>
    request<{ ok: true }>(`/admin/projects/${id}`, { method: "DELETE" }),

  /* ---- media ---- */
  listMedia: () => request<{ files: MediaFile[] }>("/admin/media"),

  uploadMedia: (data: string) =>
    request<{ file: MediaFile }>("/admin/media", {
      method: "POST",
      ...json({ data }),
    }),

  deleteMedia: (name: string) =>
    request<{ ok: true }>(`/admin/media/${encodeURIComponent(name)}`, {
      method: "DELETE",
    }),
};
