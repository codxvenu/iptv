import React from "react";
import { IPTVChannel, RecentSearch } from "../types";
import { Search, RotateCcw, HelpCircle, X, Compass } from "lucide-react";

interface SearchCenterProps {
  channels: IPTVChannel[];
  categories: string[];
  recentSearches: RecentSearch[];
  onSelectChannel: (channel: IPTVChannel) => void;
  onAddSearchQuery: (query: string) => void;
  onClearRecentSearches: () => void;
  categoriesWithCount: { [key: string]: number };
}

export const SearchCenter: React.FC<SearchCenterProps> = ({
  channels,
  categories,
  recentSearches,
  onSelectChannel,
  onAddSearchQuery,
  onClearRecentSearches,
  categoriesWithCount
}) => {
  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  // Suggestions list based on matches
  const suggestions = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return channels
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query, channels]);

  // Combined search filtering matching both query and active category
  const filteredChannels = React.useMemo(() => {
    let result = channels;
    if (activeCategory) {
      result = result.filter((c) => c.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [query, activeCategory, channels]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearchTrigger = (text: string) => {
    setQuery(text);
    if (text.trim()) {
      onAddSearchQuery(text.trim());
    }
  };

  const clearSearch = () => {
    setQuery("");
    setActiveCategory(null);
  };

  return (
    <div className="w-full flex flex-col gap-6" id="search-center-wrapper">
      {/* Real-time search bar bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearchTrigger(query);
          }}
          placeholder="Search Indian channels, category, news networks, sports streams..."
          className="w-full pl-12 pr-12 py-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 outline-none focus:border-red-600 focus:bg-zinc-900 transition-all text-sm shadow-xl"
          id="search-input-field"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Auto Suggestions Overlay Bar */}
      {suggestions.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden -mt-4 shadow-2xl relative z-10">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
            <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
              Channel Match Suggestions
            </span>
          </div>
          <div className="flex flex-col">
            {suggestions.map((chan) => (
              <div
                key={chan.id}
                onClick={() => {
                  onSelectChannel(chan);
                  handleSearchTrigger(chan.name);
                }}
                className="px-4 py-2.5 hover:bg-zinc-800/60 cursor-pointer flex items-center justify-between text-zinc-300 hover:text-white transition-colors border-b border-zinc-800/40 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={chan.logo || ""}
                    alt={chan.name}
                    className="w-6 h-6 object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="text-xs font-semibold">{chan.name}</span>
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                  {chan.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-Column Panel (Left Grid Filter, Right Listings) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side Sidebar - Quick Filter Categories */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4">
            <h5 className="text-zinc-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-red-500" />
              Categories List
            </h5>
            <div className="flex flex-wrap lg:flex-col gap-1.5">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg text-left flex items-center justify-between transition-colors ${
                  activeCategory === null
                    ? "bg-red-950/50 text-red-500 border border-red-900/65"
                    : "bg-zinc-900/30 hover:bg-zinc-805 text-zinc-400 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] bg-zinc-950/50 px-1.5 py-0.5 rounded text-zinc-500 font-mono">
                  {channels.length}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg text-left flex items-center justify-between transition-colors ${
                    activeCategory === cat
                      ? "bg-red-950/50 text-red-500 border border-red-900/65"
                      : "bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] bg-zinc-950/50 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
                    {categoriesWithCount[cat] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick History Log */}
          {recentSearches.length > 0 && (
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-zinc-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-zinc-400" />
                  Recent Searches
                </h5>
                <button
                  onClick={onClearRecentSearches}
                  className="text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((item, index) => (
                  <button
                    key={`${item.query}-${index}`}
                    onClick={() => handleSearchTrigger(item.query)}
                    className="px-2.5 py-1 text-[11px] bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-800 font-medium transition-colors"
                  >
                    {item.query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side Column - Search Results Row/Grid */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <span className="text-zinc-400 text-xs font-medium">
              Showing{" "}
              <strong className="text-zinc-100">{filteredChannels.length}</strong>{" "}
              channels found
            </span>
            {(query || activeCategory) && (
              <button
                onClick={clearSearch}
                className="text-xs text-red-500 hover:text-red-400 font-bold transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/10 border border-zinc-800/40 rounded-xl">
              <HelpCircle className="w-12 h-12 text-zinc-650 animate-pulse mb-3" />
              <span className="text-base text-zinc-300 font-bold">
                No IPTV Streams Match Your Filters
              </span>
              <span className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
                Try searching other keywords like "DD", "Aaj Tak", "Movies", or clearing active category filters.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredChannels.map((chan) => (
                <div
                  key={chan.id}
                  onClick={() => onSelectChannel(chan)}
                  className="p-3 bg-zinc-900 border border-zinc-800/60 hover:border-red-600 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02] shadow-sm select-none"
                >
                  <div className="w-10 h-10 flex-shrink-0 bg-black p-1.5 rounded-lg border border-zinc-800">
                    <img
                      src={chan.logo || ""}
                      alt={chan.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="truncate flex-1">
                    <span className="text-zinc-100 text-xs font-bold truncate block">
                      {chan.name}
                    </span>
                    <span className="text-zinc-500 text-[10px] mt-0.5 tracking-wider uppercase font-semibold">
                      {chan.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
