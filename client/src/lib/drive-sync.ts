// ============================================================
// Vive la Résistance! — Google Drive Sync + JSON Backup
// Design: the whole AppState is serialized into ONE file in the
// user's own Google Drive ("Vive la Resistance/vive-estado.json").
// Auth uses Google Identity Services (token flow, no secrets, no
// backend). Scope drive.file: the app only touches files/folders
// it created. The same wrapper format is used for manual
// export/import, so a backup file is also the sync payload.
// ============================================================

import type { AppState } from "./types";
import { saveState } from "./storage";

export interface BackupWrapper {
  app: "vive-la-resistance";
  kind: "state-backup";
  version: 1;
  updatedAt: string; // ISO — freshness of the state payload
  deviceId: string;
  state: AppState;
}

export interface SyncMeta {
  clientId: string;
  connected: boolean;
  autoSync: boolean;
  folderId: string | null;
  fileId: string | null;
  deviceId: string;
  lastSyncAt: string | null;
  lastRemoteUpdatedAt: string | null;
  lastHash: string | null;
}

const META_KEY = "vive-drive-sync-v1";
export const DRIVE_FOLDER_NAME = "Vive la Resistance";
export const DRIVE_FILE_NAME = "vive-estado.json";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

// ---------- Meta (sync bookkeeping, NOT part of the synced state) ----------

function newDeviceId(): string {
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadSyncMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SyncMeta>;
      return {
        clientId: parsed.clientId || "",
        connected: !!parsed.connected,
        autoSync: parsed.autoSync !== false,
        folderId: parsed.folderId ?? null,
        fileId: parsed.fileId ?? null,
        deviceId: parsed.deviceId || newDeviceId(),
        lastSyncAt: parsed.lastSyncAt ?? null,
        lastRemoteUpdatedAt: parsed.lastRemoteUpdatedAt ?? null,
        lastHash: parsed.lastHash ?? null,
      };
    }
  } catch {
    /* fall through to defaults */
  }
  return {
    clientId: "",
    connected: false,
    autoSync: true,
    folderId: null,
    fileId: null,
    deviceId: newDeviceId(),
    lastSyncAt: null,
    lastRemoteUpdatedAt: null,
    lastHash: null,
  };
}

export function saveSyncMeta(meta: SyncMeta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* storage full/blocked — sync just won't persist bookkeeping */
  }
}

// ---------- Backup wrapper (shared by Drive sync and file export/import) ----------

/** Small deterministic string hash (FNV-1a) — change detection only. */
export function hashState(state: AppState): string {
  const s = JSON.stringify(state);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16) + ":" + s.length;
}

export function buildBackup(state: AppState, deviceId: string): BackupWrapper {
  return {
    app: "vive-la-resistance",
    kind: "state-backup",
    version: 1,
    updatedAt: new Date().toISOString(),
    deviceId,
    state,
  };
}

export function parseBackup(text: string): BackupWrapper {
  const parsed = JSON.parse(text) as Partial<BackupWrapper>;
  if (
    !parsed ||
    parsed.app !== "vive-la-resistance" ||
    parsed.kind !== "state-backup" ||
    !parsed.state ||
    typeof parsed.state !== "object" ||
    !("workoutHistory" in parsed.state)
  ) {
    throw new Error("This file is not a Vive la Résistance backup.");
  }
  return parsed as BackupWrapper;
}

export function downloadBackup(state: AppState, deviceId: string): void {
  const wrapper = buildBackup(state, deviceId);
  const blob = new Blob([JSON.stringify(wrapper, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vive-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Write a state into local persistence. Caller must then dispatch RESET_ALL
 *  so the reducer reloads it through loadState() (schema-merge safe). */
export function applyState(state: AppState): void {
  saveState(state);
}

// ---------- Google Identity Services (token flow) ----------

declare global {
  interface Window {
    google?: any;
  }
}

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google sign-in. Check your connection."));
    document.head.appendChild(script);
  });
  return gisPromise;
}

let tokenClient: any = null;
let tokenClientId = "";
let accessToken: { token: string; expiresAt: number } | null = null;

async function getTokenClient(clientId: string): Promise<any> {
  await loadGis();
  if (tokenClient && tokenClientId === clientId) return tokenClient;
  tokenClientId = clientId;
  accessToken = null;
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: DRIVE_SCOPE,
    callback: () => {
      /* replaced per-request below */
    },
  });
  return tokenClient;
}

/** Request an access token. interactive=false tries silently first-class:
 *  GIS still shows its own UI if Google decides interaction is required. */
export async function requestAccessToken(clientId: string, interactive: boolean): Promise<string> {
  if (accessToken && accessToken.expiresAt > Date.now() + 30_000) {
    return accessToken.token;
  }
  const client = await getTokenClient(clientId);
  return new Promise<string>((resolve, reject) => {
    client.callback = (resp: any) => {
      if (resp?.error) {
        reject(new Error(resp.error_description || resp.error || "Google sign-in failed."));
        return;
      }
      accessToken = {
        token: resp.access_token,
        expiresAt: Date.now() + (Number(resp.expires_in) || 3600) * 1000,
      };
      resolve(resp.access_token);
    };
    try {
      client.requestAccessToken({ prompt: interactive ? "" : "" });
    } catch (e) {
      reject(e instanceof Error ? e : new Error("Google sign-in failed."));
    }
  });
}

export async function revokeAccessToken(): Promise<void> {
  if (accessToken && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(accessToken.token, () => undefined);
    } catch {
      /* ignore */
    }
  }
  accessToken = null;
}

// ---------- Drive REST ----------

async function driveFetch(token: string, url: string, init?: RequestInit): Promise<Response> {
  const resp = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
  if (resp.status === 401) {
    accessToken = null;
    throw new Error("Google session expired. Tap Connect to sign in again.");
  }
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Drive error ${resp.status}: ${body.slice(0, 160)}`);
  }
  return resp;
}

async function ensureFolder(token: string, meta: SyncMeta): Promise<string> {
  if (meta.folderId) return meta.folderId;
  const q = encodeURIComponent(
    `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const list = await (await driveFetch(token, `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`)).json();
  if (list.files?.length) return list.files[0].id as string;
  const created = await (
    await driveFetch(token, "https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: DRIVE_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
    })
  ).json();
  return created.id as string;
}

async function findStateFile(token: string, folderId: string, meta: SyncMeta): Promise<string | null> {
  if (meta.fileId) return meta.fileId;
  const q = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and '${folderId}' in parents and trashed=false`);
  const list = await (await driveFetch(token, `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`)).json();
  return (list.files?.[0]?.id as string) ?? null;
}

async function downloadRemote(token: string, fileId: string): Promise<BackupWrapper> {
  const resp = await driveFetch(token, `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
  const text = await resp.text();
  return parseBackup(text);
}

async function uploadRemote(
  token: string,
  folderId: string,
  fileId: string | null,
  wrapper: BackupWrapper
): Promise<string> {
  const body = JSON.stringify(wrapper);
  if (fileId) {
    await driveFetch(token, `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });
    return fileId;
  }
  const boundary = "vive_boundary_42";
  const metadata = JSON.stringify({ name: DRIVE_FILE_NAME, parents: [folderId] });
  const multipart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
  const created = await (
    await driveFetch(token, "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body: multipart,
    })
  ).json();
  return created.id as string;
}

// ---------- Sync orchestration ----------

export type SyncOutcome =
  | { status: "uploaded" }
  | { status: "downloaded"; wrapper: BackupWrapper }
  | { status: "current" }
  | { status: "conflict"; remote: BackupWrapper };

export interface SyncRun {
  outcome: SyncOutcome;
  meta: SyncMeta;
}

/**
 * One sync pass. Downloads only apply automatically when the local state
 * has not changed since the last successful sync; otherwise a conflict is
 * reported (never silently overwrites local data). `allowDownload=false`
 * (e.g. mid-workout) turns a would-be download into a conflict report so
 * the UI can defer it.
 */
export async function syncWithDrive(
  metaIn: SyncMeta,
  localState: AppState,
  interactive: boolean,
  allowDownload: boolean
): Promise<SyncRun> {
  const meta: SyncMeta = { ...metaIn };
  const token = await requestAccessToken(meta.clientId, interactive);

  meta.folderId = await ensureFolder(token, meta);
  meta.fileId = await findStateFile(token, meta.folderId, meta);

  const localHash = hashState(localState);
  const localChanged = meta.lastHash !== null && localHash !== meta.lastHash;
  const neverSynced = meta.lastHash === null;

  let remote: BackupWrapper | null = null;
  if (meta.fileId) {
    remote = await downloadRemote(token, meta.fileId);
  }

  const finish = (outcome: SyncOutcome): SyncRun => {
    meta.lastSyncAt = new Date().toISOString();
    saveSyncMeta(meta);
    return { outcome, meta };
  };

  // No remote yet → upload local.
  if (!remote) {
    const wrapper = buildBackup(localState, meta.deviceId);
    meta.fileId = await uploadRemote(token, meta.folderId, null, wrapper);
    meta.lastHash = localHash;
    meta.lastRemoteUpdatedAt = wrapper.updatedAt;
    return finish({ status: "uploaded" });
  }

  meta.lastRemoteUpdatedAt = remote.updatedAt;
  const remoteHash = hashState(remote.state);
  const remoteIsNewerVersion = remote.updatedAt !== metaIn.lastRemoteUpdatedAt;

  // Same content on both sides → just refresh bookkeeping.
  if (remoteHash === localHash) {
    meta.lastHash = localHash;
    return finish({ status: "current" });
  }

  if (remoteIsNewerVersion || neverSynced) {
    // Remote moved since we last synced. If local is untouched since the
    // last sync (or we never synced but local is just the default-ish
    // state the caller vouched for), it's safe to take the remote.
    if (!localChanged && allowDownload) {
      meta.lastHash = remoteHash;
      return finish({ status: "downloaded", wrapper: remote });
    }
    if (!allowDownload && !localChanged) {
      return { outcome: { status: "conflict", remote }, meta };
    }
    if (neverSynced && !localChanged) {
      return { outcome: { status: "conflict", remote }, meta };
    }
    if (localChanged) {
      return { outcome: { status: "conflict", remote }, meta };
    }
    return finish({ status: "downloaded", wrapper: remote });
  }

  // Remote is the version we already know; upload if local moved.
  if (localChanged || neverSynced) {
    const wrapper = buildBackup(localState, meta.deviceId);
    meta.fileId = await uploadRemote(token, meta.folderId, meta.fileId, wrapper);
    meta.lastHash = localHash;
    meta.lastRemoteUpdatedAt = wrapper.updatedAt;
    return finish({ status: "uploaded" });
  }

  return finish({ status: "current" });
}

/** Force-upload the local state regardless of conflicts. */
export async function forceUpload(metaIn: SyncMeta, localState: AppState): Promise<SyncMeta> {
  const meta: SyncMeta = { ...metaIn };
  const token = await requestAccessToken(meta.clientId, true);
  meta.folderId = await ensureFolder(token, meta);
  meta.fileId = await findStateFile(token, meta.folderId, meta);
  const wrapper = buildBackup(localState, meta.deviceId);
  meta.fileId = await uploadRemote(token, meta.folderId, meta.fileId, wrapper);
  meta.lastHash = hashState(localState);
  meta.lastRemoteUpdatedAt = wrapper.updatedAt;
  meta.lastSyncAt = new Date().toISOString();
  saveSyncMeta(meta);
  return meta;
}
