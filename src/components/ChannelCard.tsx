import React from "react";
import { IPTVChannel } from "../types";
import { Play, Star, Badge } from "lucide-react";

interface ChannelCardProps {
  channel: IPTVChannel;
  isFavorite: boolean;
  onSelect: (channel: IPTVChannel) => void;
  onToggleFavorite: (e: React.MouseEvent, channelId: string) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      onClick={() => onSelect(channel)}
      className="group relative flex-shrink-0 w-36 h-44 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden cursor-pointer hover:border-red-600 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 shadow-md hover:shadow-red-900/10"
      id={`channel-card-${channel.id.replace(/\./g, "-")}`}
    >
      {/* Favorite Button */}
      <button
        onClick={(e) => onToggleFavorite(e, channel.id)}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-zinc-400 hover:text-red-500 transition-all"
        id={`fav-btn-${channel.id}`}
        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      >
        <Star
          className={`w-3.5 h-3.5 transition-colors ${
            isFavorite ? "fill-red-500 text-red-500" : ""
          }`}
        />
      </button>

      {/* Quality Badge if exist */}
      {channel.quality && (
        <span className="absolute bottom-12 left-2 z-10 px-1.5 py-0.5 text-[9px] font-semibold bg-zinc-950/80 text-zinc-300 rounded border border-zinc-800 tracking-wider uppercase">
          {channel.quality}
        </span>
      )}

      {/* Brand logo Container */}
      <div className="w-full h-28 flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden group-hover:bg-zinc-900/80 transition-colors">
        {imgError ? (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-red-600 tracking-wider leading-none">TV</span>
            <span className="text-[9px] uppercase text-zinc-500 font-mono tracking-tight mt-1 truncate max-w-[100px]">
              {channel.id.split(".")[0]}
            </span>
          </div>
        ) : (
          <img
            src={channel.logo || `https://iptv-org.github.io/images/logos/${channel.id}.png`}
            alt={channel.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-300"
          />
        )}
        
        {/* Play Icon Trigger hover Overlay */}
        <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="p-2.5 rounded-full bg-red-600 text-white shadow-lg animate-pulse scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-white" />
          </div>
        </div>
      </div>

      {/* Channel metadata label */}
      <div className="h-16 px-3 py-2 flex flex-col justify-start bg-zinc-900 border-t border-zinc-800">
        <span className="text-zinc-100 text-xs font-semibold truncate leading-tight w-full mt-0.5 block group-hover:text-red-500 transition-colors">
          {channel.name}
        </span>
        <span className="text-zinc-500 text-[10px] font-medium uppercase mt-0.5 tracking-wider block">
          {channel.category}
        </span>
      </div>
    </div>
  );
};
