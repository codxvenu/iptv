import React from "react";
import { IPTVChannel, SyncState, RecentSearch, PlayHistoryItem } from "./types";
import { ChannelCard } from "./components/ChannelCard";
import { LivePlayer } from "./components/LivePlayer";
import { SearchCenter } from "./components/SearchCenter";
import { SettingsPanel } from "./components/SettingsPanel";
import {
  Tv,
  Search,
  Star,
  Settings,
  RefreshCw,
  Home,
  AlertCircle,
  Share2,
  Bookmark,
  Sparkles
} from "lucide-react";

export default function App() {
  const [channels, setChannels] = React.useState<IPTVChannel[]>([]);
  const [syncState, setSyncState] = React.useState<SyncState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Active Screen Selector: 'home' | 'favorites' | 'settings'
  const [currentTab, setCurrentTab] = React.useState<"home" | "favorites" | "settings">("home");

  // Selection state
  const [activeChannel, setActiveChannel] = React.useState<IPTVChannel | null>(null);

  // Persistence State
  const [favorites, setFavorites] = React.useState<string[]>(() => {
    const saved = localStorage.getItem("iptv_favorites");
    return saved ? JSON.parse(saved) : ["DDNational.in", "DDNews.in"];
  });

  const [history, setHistory] = React.useState<PlayHistoryItem[]>(() => {
    const saved = localStorage.getItem("iptv_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [recentSearches, setRecentSearches] = React.useState<RecentSearch[]>(() => {
    const saved = localStorage.getItem("iptv_recent_searches");
    return saved ? JSON.parse(saved) : [];
  });

  // Client-side Custom Theme Toggle
  const [darkMode, setDarkMode] = React.useState<boolean>(true);

  // Share menu popup overlay state
  const [sharedChannel, setSharedChannel] = React.useState<IPTVChannel | null>(null);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Fetch Channels list from server API
  const fetchChannels = React.useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = forceRefresh ? "/api/refresh" : "/api/channels";
      const res = await fetch(url, {
        method: forceRefresh ? "POST" : "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        setChannels(data.channels);
        setSyncState(data.syncState);
        
        // Auto select featured channel if none selected
        if (!activeChannel && data.channels.length > 0) {
          const featured = data.channels.find((c: IPTVChannel) => c.id === "DDNational.in") || data.channels[0];
          setActiveChannel(featured);
        }
      } else {
        setError(data.message || "Failed to load channel cache data");
      }
    } catch (err: any) {
      setError("Server API is starting offline. Preloading embedded fallback channels...");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeChannel]);

  React.useEffect(() => {
    fetchChannels();
  }, []);

  // Sync favorites change to disk
  React.useEffect(() => {
    localStorage.setItem("iptv_favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Sync history change is disk
  React.useEffect(() => {
    localStorage.setItem("iptv_history", JSON.stringify(history));
  }, [history]);

  // Sync searches
  React.useEffect(() => {
    localStorage.setItem("iptv_recent_searches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Helper selectors
  const toggleFavoriteChannel = (channelId: string) => {
    setFavorites((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const selectChannelPlay = (channel: IPTVChannel) => {
    setActiveChannel(channel);
    // Add to history list
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.channelId !== channel.id);
      return [{ channelId: channel.id, playedAt: Date.now() }, ...filtered].slice(0, 20);
    });

    // Automatically scroll page up to player anchor smoothly
    const playerNode = document.getElementById("live-ott-player-frame");
    if (playerNode) {
      playerNode.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleAddSearchQuery = (query: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== query.toLowerCase());
      return [{ query, timestamp: Date.now() }, ...filtered].slice(0, 8);
    });
  };

  const handleClearSearches = () => {
    setRecentSearches([]);
  };

  const handleTriggerShare = (channel: IPTVChannel) => {
    setSharedChannel(channel);
    setCopiedLink(false);
  };

  const copyShareLink = () => {
    if (!sharedChannel) return;
    const shareText = `Hey! Watch ${sharedChannel.name} Live Stream on India IPTV Hub: ${sharedChannel.streamUrl} #IPTVIndia #${sharedChannel.category}`;
    navigator.clipboard.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Grouping categories and statistics
  const categoriesList = React.useMemo(() => {
    const list = new Set<string>();
    channels.forEach((c) => {
      if (c.category) list.add(c.category);
    });
    return Array.from(list).sort();
  }, [channels]);

  const categoriesWithCount = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    channels.forEach((c) => {
      if (c.category) {
        counts[c.category] = (counts[c.category] || 0) + 1;
      }
    });
    return counts;
  }, [channels]);

  // Historical lists joined
  const joinedHistoryChannels = React.useMemo(() => {
    return history
      .map((item) => {
        const chan = channels.find((c) => c.id === item.channelId);
        return chan ? { ...chan, ...item } : null;
      })
      .filter((c): c is IPTVChannel => c !== null);
  }, [history, channels]);

  const favoriteChannels = React.useMemo(() => {
    return channels.filter((c) => favorites.includes(c.id));
  }, [favorites, channels]);

  const trendingChannels = React.useMemo(() => {
    // DD National, News channels, Zee News high ranking fallback watch weight
    return [...channels]
      .map((c) => {
        const watchModifier = c.id.includes("National")
          ? 25
          : c.id.includes("News")
          ? 18
          : c.id.includes("AajTak")
          ? 22
          : Math.floor(Math.random() * 8);
        return { ...c, watchCount: watchModifier };
      })
      .sort((a, b) => (b.watchCount || 0) - (a.watchCount || 0));
  }, [channels]);

  // Clean the local cache Row
  const clearDatabaseCache = async () => {
    // Call server restart sync with fallback data or clear local states
    setHistory([]);
    setFavorites(["DDNational.in", "DDNews.in"]);
    setRecentSearches([]);
    await fetchChannels(true);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        darkMode ? "bg-zinc-950 text-zinc-100" : "bg-neutral-50 text-neutral-900"
      }`}
    >
      {/* Dynamic Navigation Top Rail Header */}
      <header
        className={`sticky top-0 z-40 border-b shadow-sm backdrop-blur-md transition-colors ${
          darkMode ? "bg-zinc-950/85 border-zinc-900" : "bg-white/85 border-zinc-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo brand label */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentTab("home")}>
            <div className="p-2 bg-red-600 rounded-lg text-white shadow-md animate-pulse">
              <Tv className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight leading-none uppercase">
                IPTV <span className="text-red-500">India</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">
                Ott Streaming Hub
              </span>
            </div>
          </div>

          {/* Nav Tabs layout */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold uppercase transition-all select-none">
            <button
              onClick={() => setCurrentTab("home")}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === "home"
                  ? "bg-red-650/15 text-red-500"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
            >
              <Home className="w-4 h-4" />
              Home (Categories)
            </button>
            <button
              onClick={() => setCurrentTab("favorites")}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === "favorites"
                  ? "bg-red-650/15 text-red-500"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
            >
              <Star className="w-4 h-4" />
              My Favorites ({favorites.length})
            </button>
            <button
              onClick={() => setCurrentTab("settings")}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                currentTab === "settings"
                  ? "bg-red-650/15 text-red-500"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </nav>

          {/* Quick sync & status indicators */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchChannels(true)}
              disabled={loading}
              className={`p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors ${
                loading ? "opacity-45" : ""
              }`}
              title="Refresh IPTV Metadata Cache"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="block md:hidden border-t border-zinc-900 bg-zinc-950/90 text-[10px] py-1.5 px-2">
          <div className="grid grid-cols-3 text-center text-zinc-500 font-bold uppercase gap-1">
            <button
              onClick={() => setCurrentTab("home")}
              className={`py-1.5 rounded flex flex-col items-center gap-1 ${
                currentTab === "home" ? "text-red-500" : ""
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <button
              onClick={() => setCurrentTab("favorites")}
              className={`py-1.5 rounded flex flex-col items-center gap-1 ${
                currentTab === "favorites" ? "text-red-500" : ""
              }`}
            >
              <Star className="w-4 h-4" />
              Favorites
            </button>
            <button
              onClick={() => setCurrentTab("settings")}
              className={`py-1.5 rounded flex flex-col items-center gap-1 ${
                currentTab === "settings" ? "text-red-500" : ""
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* CINEMATIC HERO PLAYER PANEL WRAPPER (Auto anchors active channels stream playable) */}
        {activeChannel && (
          <div className="mb-8" id="cinematic-broadcasting-player">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                Live Broadcast Console
              </span>
              <span className="text-red-500 font-mono text-[10px] font-bold tracking-widest bg-red-950/40 border border-red-900/60 px-2 py-0.5 rounded animate-pulse">
                • BROADCAST
              </span>
            </div>
            <LivePlayer
              channel={activeChannel}
              isFavorite={favorites.includes(activeChannel.id)}
              onToggleFavorite={() => toggleFavoriteChannel(activeChannel.id)}
              onShare={() => handleTriggerShare(activeChannel)}
              onClose={() => setActiveChannel(null)}
            />
          </div>
        )}

        {/* LOADING SHADOW LOADS SKELETON */}
        {loading && channels.length === 0 ? (
          <div className="flex flex-col gap-6 py-12 items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin" />
              <Tv className="w-6 h-6 text-red-650 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <span className="text-zinc-100 font-bold block">Aggregating Indian Live TV Streams...</span>
              <span className="text-zinc-500 text-xs mt-1 block">Fusing channels, stream resolutions, and categories in real-time.</span>
            </div>
          </div>
        ) : error && channels.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-yellow-500 mb-3" />
            <h4 className="text-zinc-200 font-bold text-sm">{error}</h4>
            <span className="text-zinc-500 text-xs mt-1 leading-relaxed">
              We will load the preloaded channels database to continue streaming available networks. Please ensure your backend container is properly initialized.
            </span>
            <button
              onClick={() => fetchChannels(true)}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold uppercase"
            >
              Verify Connectivity Cache
            </button>
          </div>
        ) : (
          /* STANDARD TAB CONTAINER ENGINE */
          <div className="transition-all duration-300">
                       {/* 1. HOME TAB (SEARCH & CATEGORIES) */}
            {currentTab === "home" && (
              <div id="ott-tab-home">
                <SearchCenter
                  channels={channels}
                  categories={categoriesList}
                  recentSearches={recentSearches}
                  onSelectChannel={selectChannelPlay}
                  onAddSearchQuery={handleAddSearchQuery}
                  onClearRecentSearches={handleClearSearches}
                  categoriesWithCount={categoriesWithCount}
                />
              </div>
            )}

            {/* 2. MY FAVORITES TAB */}
            {currentTab === "favorites" && (
              <div id="ott-tab-favs" className="flex flex-col gap-6">
                <div>
                  <h4 className="text-zinc-200 font-bold text-base uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Star className="w-5 h-5 text-red-500 fill-red-500" />
                    My Persisted Favorites
                  </h4>
                  <span className="text-zinc-500 text-xs block">
                    Your customized live channels bookmarked and synced in native database storage.
                  </span>
                </div>

                {favoriteChannels.length === 0 ? (
                  <div className="p-12 text-center border border-zinc-800/40 rounded-xl bg-zinc-900/10">
                    <Bookmark className="w-12 h-12 text-zinc-650 mb-3 mx-auto animate-bounce" />
                    <span className="text-zinc-300 font-bold block text-sm">
                      Your Favorite List is Empty
                    </span>
                    <span className="text-zinc-500 text-xs mt-1 block">
                      Add channels to favorites by clicking the star indicators on cards or inside the streaming player console.
                    </span>
                    <button
                      onClick={() => setCurrentTab("home")}
                      className="mt-4 px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold uppercase rounded"
                    >
                      Browse Channels List
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {favoriteChannels.map((chan) => (
                      <ChannelCard
                        key={`fav-card-${chan.id}`}
                        channel={chan}
                        isFavorite={true}
                        onSelect={selectChannelPlay}
                        onToggleFavorite={(e, id) => {
                          e.stopPropagation();
                          toggleFavoriteChannel(id);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. CONFIG SETTINGS TAB */}
            {currentTab === "settings" && (
              <div id="ott-tab-settings">
                <SettingsPanel
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
                  syncState={syncState}
                  onRefreshMetadata={() => fetchChannels(true)}
                  onClearCache={clearDatabaseCache}
                />
              </div>
            )}

          </div>
        )}
      </main>

      {/* SHARE MODAL BOX ACTION ACTION OVERLAY */}
      {sharedChannel && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <h4 className="text-zinc-100 font-black text-base flex items-center gap-2 mb-2">
              <Share2 className="w-5 h-5 text-red-500" />
              Broadcasting Share Center
            </h4>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              Share the direct public m3u8 stream parameters and channel links with your network.
            </p>

            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 font-mono text-zinc-400 text-[10px] break-all leading-normal">
              {`Watch ${sharedChannel.name} Live: ${sharedChannel.streamUrl}`}
            </div>

            <div className="flex items-center gap-3 justify-end mt-6">
              <button
                onClick={() => setSharedChannel(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={copyShareLink}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                {copiedLink ? "Link Copied!" : "Copy Stream Parameters"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer system credit line */}
      <footer className="mt-16 py-8 border-t border-zinc-900 bg-zinc-950 text-center text-[10px] text-zinc-600 font-medium tracking-wide">
        <span>© 2026 INDIA IPTV DISCOVERY NETWORKS. POWERED BY MVVM & EXOPLAYER REPRODUCTIONS.</span>
      </footer>
    </div>
  );
}
