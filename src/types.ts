export interface IPTVChannel {
  id: string;
  name: string;
  logo: string | null;
  category: string;
  streamUrl: string;
  quality: string | null;
  watchCount?: number;
}

export interface SyncState {
  lastSync: number;
  isSyncing: boolean;
  error: string | null;
  cacheDurationMs: number;
}

export interface RecentSearch {
  query: string;
  timestamp: number;
}

export interface PlayHistoryItem {
  channelId: string;
  playedAt: number;
  lastPositionSeconds?: number;
}

export interface KotlinFile {
  path: string;
  name: string;
  language: string;
  code: string;
  description: string;
}
