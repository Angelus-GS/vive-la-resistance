// ============================================================
// Vive la Résistance! — Google Drive Sync section (Profile tab)
// Connects the app to the user's own Google Drive so the full
// state backs up automatically, and offers JSON export/import.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Cloud, RefreshCw, Download, Upload, ChevronDown, CheckCircle2,
  AlertTriangle, Link2, Unlink,
} from "lucide-react";
import { toast } from "sonner";
import {
  applyState,
  downloadBackup,
  forceUpload,
  hashState,
  loadSyncMeta,
  parseBackup,
  revokeAccessToken,
  saveSyncMeta,
  syncWithDrive,
  type BackupWrapper,
  type SyncMeta,
} from "@/lib/drive-sync";

function formatWhen(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DriveSyncSection() {
  const { state, dispatch } = useApp();
  const [meta, setMeta] = useState<SyncMeta>(() => loadSyncMeta());
  const [clientIdDraft, setClientIdDraft] = useState(meta.clientId);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [conflict, setConflict] = useState<BackupWrapper | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncingRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const metaRef = useRef(meta);
  metaRef.current = meta;

  const applyRemote = useCallback(
    (wrapper: BackupWrapper, nextMeta: SyncMeta) => {
      applyState(wrapper.state);
      dispatch({ type: "RESET_ALL" });
      setMeta(nextMeta);
      setConflict(null);
      setStatus("Downloaded the newest state from Drive.");
      toast.success("Progress restored from Google Drive");
    },
    [dispatch]
  );

  const runSync = useCallback(
    async (interactive: boolean): Promise<void> => {
      const m = metaRef.current;
      if (!m.clientId || syncingRef.current) return;
      syncingRef.current = true;
      if (interactive) setBusy(true);
      try {
        const allowDownload = !stateRef.current.activeWorkout;
        const run = await syncWithDrive(m, stateRef.current, interactive, allowDownload);
        setMeta(run.meta);
        if (run.outcome.status === "uploaded") {
          setStatus("All progress is backed up to Drive.");
          if (interactive) toast.success("Synced to Google Drive");
        } else if (run.outcome.status === "downloaded") {
          applyRemote(run.outcome.wrapper, run.meta);
        } else if (run.outcome.status === "conflict") {
          setConflict(run.outcome.remote);
          setStatus("Drive has a different version of your progress.");
        } else {
          setStatus("Already up to date with Drive.");
          if (interactive) toast.success("Already up to date");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sync failed.";
        setStatus(msg);
        if (interactive) toast.error(msg);
        if (/session expired|sign-in|popup|access_denied/i.test(msg)) {
          const nm = { ...metaRef.current, connected: false };
          saveSyncMeta(nm);
          setMeta(nm);
        }
      } finally {
        syncingRef.current = false;
        if (interactive) setBusy(false);
      }
    },
    [applyRemote]
  );

  // On mount: if previously connected, silently re-sync once.
  useEffect(() => {
    const m = loadSyncMeta();
    if (m.connected && m.clientId && m.autoSync) {
      void runSync(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-sync: whenever the state changes and we're connected, debounce
  // 5s and push/pull quietly. Hash guard prevents loops.
  useEffect(() => {
    const m = metaRef.current;
    if (!m.connected || !m.autoSync || !m.clientId) return;
    if (hashState(state) === m.lastHash) return;
    const t = setTimeout(() => void runSync(false), 5000);
    return () => clearTimeout(t);
  }, [state, meta.connected, meta.autoSync, runSync]);

  const handleSaveClientId = () => {
    const id = clientIdDraft.trim();
    if (!id) {
      toast.error("Paste your Google Client ID first");
      return;
    }
    const nm = { ...meta, clientId: id };
    saveSyncMeta(nm);
    setMeta(nm);
    toast.success("Client ID saved on this device");
  };

  const handleConnect = async () => {
    const nm = { ...meta, connected: true };
    saveSyncMeta(nm);
    setMeta(nm);
    await runSync(true);
  };

  const handleDisconnect = async () => {
    await revokeAccessToken();
    const nm = { ...meta, connected: false };
    saveSyncMeta(nm);
    setMeta(nm);
    setStatus("Disconnected. Your Drive backup file was left untouched.");
    toast.success("Disconnected from Google Drive");
  };

  const handleResolveKeepLocal = async () => {
    setBusy(true);
    try {
      const nm = await forceUpload(metaRef.current, stateRef.current);
      setMeta(nm);
      setConflict(null);
      setStatus("This device's version was uploaded to Drive.");
      toast.success("Drive now matches this device");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const handleResolveUseRemote = () => {
    if (!conflict) return;
    const nm = { ...metaRef.current, lastHash: hashState(conflict.state), lastRemoteUpdatedAt: conflict.updatedAt, lastSyncAt: new Date().toISOString() };
    saveSyncMeta(nm);
    applyRemote(conflict, nm);
  };

  const handleExportJSON = () => {
    downloadBackup(state, meta.deviceId);
    toast.success("Backup JSON downloaded");
  };

  const handleImportJSON = (file: File) => {
    file.text().then((text) => {
      try {
        const wrapper = parseBackup(text);
        if (!confirm("Importing replaces ALL current data on this device with the backup. Continue?")) return;
        const nm = { ...metaRef.current, lastHash: hashState(wrapper.state), lastRemoteUpdatedAt: wrapper.updatedAt };
        saveSyncMeta(nm);
        applyRemote(wrapper, nm);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Invalid backup file");
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Cloud className="w-5 h-5 text-primary" />
          Google Drive Sync
        </CardTitle>
        <CardDescription>
          Backs up your full progress (history, PRs, routines, streaks) to a file in your own
          Google Drive, so it survives a phone change — and so you can share your progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!meta.clientId ? (
          <div className="space-y-2">
            <Label className="text-sm">Step 1 — Google Client ID</Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The app needs a free Client ID from your own Google Cloud project (one-time setup,
              about 10 minutes). Paste it here — it stays only on this device.
            </p>
            <div className="flex gap-2">
              <Input
                value={clientIdDraft}
                onChange={(e) => setClientIdDraft(e.target.value)}
                placeholder="xxxx.apps.googleusercontent.com"
                className="text-xs"
              />
              <Button size="sm" className="text-xs shrink-0" onClick={handleSaveClientId}>
                Save
              </Button>
            </div>
            <Collapsible open={showHelp} onOpenChange={setShowHelp}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs px-0">
                  How do I get a Client ID?
                  <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${showHelp ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ol className="text-xs text-muted-foreground leading-relaxed list-decimal ml-4 space-y-1">
                  <li>Go to console.cloud.google.com and create a project (any name).</li>
                  <li>Enable the "Google Drive API" for the project.</li>
                  <li>Configure the OAuth consent screen (External, just your email).</li>
                  <li>Create credentials → OAuth client ID → Web application.</li>
                  <li>
                    Under "Authorized JavaScript origins" add: https://angelus-gs.github.io
                  </li>
                  <li>Copy the Client ID and paste it above.</li>
                </ol>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : !meta.connected ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Client ID saved. Connect your Google account to start syncing. The app only ever
              touches its own folder ("Vive la Resistance") in your Drive.
            </p>
            <Button size="sm" className="text-xs w-full" onClick={handleConnect} disabled={busy}>
              <Link2 className="w-3.5 h-3.5 mr-1.5" />
              {busy ? "Connecting…" : "Connect Google Drive"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-sage-green shrink-0" />
              <span>
                Connected · Last sync: <span className="text-muted-foreground">{formatWhen(meta.lastSyncAt)}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Auto-sync</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Syncs a few seconds after every change.
                </p>
              </div>
              <Switch
                checked={meta.autoSync}
                onCheckedChange={(checked) => {
                  const nm = { ...meta, autoSync: checked };
                  saveSyncMeta(nm);
                  setMeta(nm);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => void runSync(true)} disabled={busy}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${busy ? "animate-spin" : ""}`} />
                Sync Now
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleDisconnect} disabled={busy}>
                <Unlink className="w-3.5 h-3.5 mr-1.5" />
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {conflict && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                Drive holds a different version of your progress (updated{" "}
                {formatWhen(conflict.updatedAt)}). Which one should win? Nothing is overwritten
                until you choose.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-xs" onClick={handleResolveUseRemote} disabled={busy}>
                Use Drive version
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleResolveKeepLocal} disabled={busy}>
                Keep this device
              </Button>
            </div>
          </div>
        )}

        {status && <p className="text-xs text-muted-foreground">{status}</p>}

        <Separator />
        <div>
          <Label className="text-sm">Manual backup (JSON)</Label>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 mb-2">
            The same file Drive sync uses. Export it to keep a copy or share your progress;
            import it to restore everything on any device.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleExportJSON}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Import JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportJSON(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
