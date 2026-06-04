import React from "react";
import { SyncState } from "../types";
import {
  Moon,
  Sun,
  RefreshCw,
  Trash2,
  Info,
  Calendar,
  CheckCircle,
  Database
} from "lucide-react";

interface SettingsPanelProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  syncState: SyncState | null;
  onRefreshMetadata: () => void;
  onClearCache: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  darkMode,
  onToggleDarkMode,
  syncState,
  onRefreshMetadata,
  onClearCache
}) => {
  const [cacheCleared, setCacheCleared] = React.useState(false);

  const handleClearCache = () => {
    onClearCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  const formattedDate = React.useMemo(() => {
    if (!syncState?.lastSync) return "Never Synced";
    return new Date(syncState.lastSync).toLocaleString();
  }, [syncState?.lastSync]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6" id="settings-pannel-wrapper">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 shadow-lg">
        <h4 className="text-zinc-100 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-red-500" />
          General Options
        </h4>

        <div className="flex flex-col gap-4">
          {/* Light / Dark Mode Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-zinc-800/60 last:border-0">
            <div>
              <span className="text-zinc-200 text-xs font-bold block">
                Visual Interface Theme
              </span>
              <span className="text-zinc-500 text-[10.5px] mt-0.5 block max-w-sm">
                Default to Cinematic Indian OTT Dark Canvas. Switch to Standard Material Light Canvas.
              </span>
            </div>
            <button
              onClick={onToggleDarkMode}
              className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 border border-zinc-700 transition-colors"
              title="Toggle Theme Mode"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* Sync Metadata Cache */}
          <div className="flex items-center justify-between py-3 border-b border-zinc-800/60 last:border-0">
            <div>
              <span className="text-zinc-200 text-xs font-bold block">
                IPTV Metadata Autorefresh
              </span>
              <span className="text-zinc-500 text-[10.5px] mt-0.5 block max-w-sm">
                Syncs channels, streams, categories, and logo links from the public iptv-org catalogs automatically every 24 hours.
              </span>
            </div>
            <button
              onClick={onRefreshMetadata}
              className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors shadow shadow-red-950/30 ${
                syncState?.isSyncing ? "opacity-60 cursor-not-allowed" : ""
              }`}
              disabled={syncState?.isSyncing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncState?.isSyncing ? "animate-spin" : ""}`} />
              {syncState?.isSyncing ? "Syncing..." : "Sync Metadata"}
            </button>
          </div>

          {/* Clear Cache */}
          <div className="flex items-center justify-between py-3 border-b border-zinc-800/60 last:border-0">
            <div>
              <span className="text-zinc-200 text-xs font-bold block">
                Purge Database Cache
              </span>
              <span className="text-zinc-500 text-[10.5px] mt-0.5 block max-w-sm">
                Deletes cached channel rows entirely from disk and forces fallback recovery parameters.
              </span>
            </div>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
            >
              {cacheCleared ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  Cache Cleared
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  Purge Cache
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* System Sync stats and Version Info */}
      <div className="bg-zinc-900/30 border border-zinc-805/60 rounded-xl p-5 shadow-md">
        <h4 className="text-zinc-300 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Technical Telemetry & Details
        </h4>
        <div className="flex flex-col gap-2.5 font-mono text-xs text-zinc-500">
          <div className="flex items-center justify-between border-b border-zinc-805/45 pb-2">
            <span>Last Cache Synchronization:</span>
            <span className="text-zinc-300 text-right">{formattedDate}</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-805/45 pb-2">
            <span>Cache Expiry Parameter:</span>
            <span className="text-zinc-300 text-right">24 Hours (86,400s)</span>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-805/45 pb-2">
            <span>Production Version:</span>
            <span className="text-zinc-305 text-right font-bold">1.0.0 (India IPTV Hub)</span>
          </div>
          <div className="flex items-center justify-between pb-1">
            <span>Target Platform Core:</span>
            <span className="text-emerald-505 font-medium text-right bg-emerald-950/40 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/60 text-[10px]">
              KOTLIN + JETPACK COMPOSE + MEDIA3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
