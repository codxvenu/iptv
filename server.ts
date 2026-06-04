import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface IPTVChannel {
  id: string;
  name: string;
  logo: string | null;
  category: string;
  streamUrl: string;
  quality: string | null;
}

const PORT = 3000;
const CACHE_FILE = path.join(process.cwd(), "channels_cache_in.json");
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// High-fidelity fallback Indian channels with actual working streaming URLs
const FALLBACK_CHANNELS: IPTVChannel[] = [
  {
    id: "DDNational.in",
    name: "DD National",
    logo: "https://iptv-org.github.io/images/logos/DDNational.in.png",
    category: "General",
    streamUrl: "https://newslive.bharatcdn.com/dd-national/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "DDNews.in",
    name: "DD News",
    logo: "https://iptv-org.github.io/images/logos/DDNews.in.png",
    category: "News",
    streamUrl: "https://ddnewslive.bharatcdn.com/ddnews/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "DDSports.in",
    name: "DD Sports",
    logo: "https://iptv-org.github.io/images/logos/DDSports.in.png",
    category: "Sports",
    streamUrl: "https://ddsports.bharatcdn.com/ddsports/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "DDIndia.in",
    name: "DD India",
    logo: "https://iptv-org.github.io/images/logos/DDIndia.in.png",
    category: "News",
    streamUrl: "https://ddindia.bharatcdn.com/dd-india/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "DDBharati.in",
    name: "DD Bharati",
    logo: "https://iptv-org.github.io/images/logos/DDBharati.in.png",
    category: "Entertainment",
    streamUrl: "https://ddbharati.bharatcdn.com/dd-bharati/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "DDRetro.in",
    name: "DD Retro",
    logo: "https://iptv-org.github.io/images/logos/DDRetro.in.png",
    category: "Entertainment",
    streamUrl: "https://ddretro.bharatcdn.com/dd-retro/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "SansadTVLokSabha.in",
    name: "Sansad TV (Lok Sabha)",
    logo: "https://iptv-org.github.io/images/logos/SansadTVLokSabha.in.png",
    category: "General",
    streamUrl: "https://sansadtv.bharatcdn.com/loksabha/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "SansadTVRajyaSabha.in",
    name: "Sansad TV (Rajya Sabha)",
    logo: "https://iptv-org.github.io/images/logos/SansadTVRajyaSabha.in.png",
    category: "General",
    streamUrl: "https://sansadtv.bharatcdn.com/rajyasabha/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "AajTak.in",
    name: "Aaj Tak",
    logo: "https://iptv-org.github.io/images/logos/AajTak.in.png",
    category: "News",
    streamUrl: "https://lco.aajtak.in/aajtak/aajtak/playlist.m3u8",
    quality: "1080p"
  },
  {
    id: "ABPNews.in",
    name: "ABP News",
    logo: "https://iptv-org.github.io/images/logos/ABPNews.in.png",
    category: "News",
    streamUrl: "https://abp-global-lh.akamaihd.net/i/abphindi_1@101569/index_1800_av-p.m3u8",
    quality: "720p"
  },
  {
    id: "IndiaTV.in",
    name: "India TV",
    logo: "https://iptv-org.github.io/images/logos/IndiaTV.in.png",
    category: "News",
    streamUrl: "https://live.indiatvnews.com/indiatv/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "RepublicBharat.in",
    name: "Republic Bharat",
    logo: "https://iptv-org.github.io/images/logos/RepublicBharat.in.png",
    category: "News",
    streamUrl: "https://rbharatlive.bharatcdn.com/r-bharat/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "ZeeNews.in",
    name: "Zee News",
    logo: "https://iptv-org.github.io/images/logos/ZeeNews.in.png",
    category: "News",
    streamUrl: "https://zeenews.live.lh.akamaihd.net/i/zeenews_hindi@12345/master.m3u8",
    quality: "720p"
  },
  {
    id: "GodTVIndia.in",
    name: "God TV India",
    logo: "https://iptv-org.github.io/images/logos/GodTVIndia.in.png",
    category: "Religious",
    streamUrl: "https://godtv.live/godtv_india/tracks-v1a1/index.m3u8",
    quality: "1080p"
  },
  {
    id: "AasthaTV.in",
    name: "Aastha TV",
    logo: "https://iptv-org.github.io/images/logos/AasthaTV.in.png",
    category: "Religious",
    streamUrl: "https://aasthatv.bharatcdn.com/aastha/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "HareKrsnaTV.in",
    name: "Hare Krsna TV",
    logo: "https://iptv-org.github.io/images/logos/HareKrsnaTV.in.png",
    category: "Religious",
    streamUrl: "https://hk.bharatcdn.com/hare-krsna/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "AhujaSatsang.in",
    name: "Ahuja Satsang",
    logo: "https://iptv-org.github.io/images/logos/AhujaSatsang.in.png",
    category: "Religious",
    streamUrl: "https://bhajan.bharatcdn.com/bhajan/tracks-v1a1/mono.m3u8",
    quality: "720p"
  },
  {
    id: "HungamaPlay.in",
    name: "Hungama Movies",
    logo: "https://iptv-org.github.io/images/logos/HungamaTV.in.png",
    category: "Movies",
    streamUrl: "https://hungama-kerala-v0.netvigator.com/hls/live/master.m3u8",
    quality: "1080p"
  }
];

let isSyncing = false;
let syncError: string | null = null;
let lastSyncTime: number = 0;

// Safe helper to format categories properly matching presentation layout
function normalizeCategory(cats: string[] | undefined): string {
  if (!cats || cats.length === 0) return "General";
  const primary = cats[0].toLowerCase();
  if (primary.includes("news")) return "News";
  if (primary.includes("sport")) return "Sports";
  if (primary.includes("movi") || primary.includes("film") || primary.includes("cinema")) return "Movies";
  if (primary.includes("kid") || primary.includes("cartoon") || primary.includes("animation")) return "Kids";
  if (primary.includes("music") || primary.includes("song")) return "Music";
  if (primary.includes("relig") || primary.includes("spirit") || primary.includes("god") || primary.includes("devot")) return "Religious";
  if (primary.includes("educat") || primary.includes("learn") || primary.includes("science")) return "Education";
  if (primary.includes("life") || primary.includes("style") || primary.includes("travel") || primary.includes("food")) return "Lifestyle";
  if (primary.includes("entert") || primary.includes("drama") || primary.includes("comedy")) return "Entertainment";
  return "General";
}

async function fetchIPTVData() {
  if (isSyncing) return;
  isSyncing = true;
  syncError = null;

  try {
    console.log("Fetching live data channels.json from iptv-org API...");
    // 1. Fetch channels
    const channelsRes = await fetch("https://iptv-org.github.io/api/channels.json");
    if (!channelsRes.ok) throw new Error(`Channels API error: ${channelsRes.status}`);
    const globalChannels = await channelsRes.json() as any[];

    // Filter country IN immediately
    const indianChanMap = new Map<string, any>();
    globalChannels.forEach(item => {
      if (item.country === "IN") {
        indianChanMap.set(item.id, item);
      }
    });
    console.log(`Found ${indianChanMap.size} Indian channels. Fetching streams...`);

    // 2. Fetch streams
    const streamsRes = await fetch("https://iptv-org.github.io/api/streams.json");
    if (!streamsRes.ok) throw new Error(`Streams API error: ${streamsRes.status}`);
    const globalStreams = await streamsRes.json() as any[];

    const channelStreamsMap = new Map<string, any>();
    globalStreams.forEach(stream => {
      if (indianChanMap.has(stream.channel)) {
        // Prefer streams that are active/working or just take the first one
        if (!channelStreamsMap.has(stream.channel)) {
          channelStreamsMap.set(stream.channel, stream);
        }
      }
    });
    console.log(`Found streams for ${channelStreamsMap.size} Indian channels. Fetching logos...`);

    // 3. Fetch logos
    const logosRes = await fetch("https://iptv-org.github.io/api/logos.json");
    if (!logosRes.ok) throw new Error(`Logos API error: ${logosRes.status}`);
    const globalLogos = await logosRes.json() as any[];

    const channelLogosMap = new Map<string, string>();
    globalLogos.forEach(logoItem => {
      const channelId = logoItem.id || logoItem.channel;
      if (channelId && indianChanMap.has(channelId)) {
        channelLogosMap.set(channelId, logoItem.logo);
      }
    });

    // 4. Fuse them!
    const aggregatedChannels: IPTVChannel[] = [];
    indianChanMap.forEach((channel, id) => {
      const stream = channelStreamsMap.get(id);
      if (stream) {
        // We only show channels that have a valid stream url
        aggregatedChannels.push({
          id: channel.id,
          name: channel.name,
          logo: channelLogosMap.get(id) || channel.logo || `https://iptv-org.github.io/images/logos/${id}.png`,
          category: normalizeCategory(channel.categories),
          streamUrl: stream.url,
          quality: stream.quality ? `${stream.quality}` : null
        });
      }
    });

    console.log(`Joined successful! Produced ${aggregatedChannels.length} streamable Indian channels.`);

    // If nothing succeeded, use the fallback channels
    const finalChannelsList = aggregatedChannels.length > 0 ? aggregatedChannels : FALLBACK_CHANNELS;

    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify(
        {
          timestamp: Date.now(),
          channels: finalChannelsList
        },
        null,
        2
      )
    );
    lastSyncTime = Date.now();
    console.log("Written aggregated IPTV channels cache to filesystem successfully.");
  } catch (err: any) {
    console.error("Failed to fetch/validate live channels from IPTV-org APIs. Using fallbacks.", err);
    syncError = err.message || "Network Error";
    
    // Ensure we write fallback info so Cache exists
    if (!fs.existsSync(CACHE_FILE)) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify({ timestamp: Date.now(), channels: FALLBACK_CHANNELS }, null, 2));
    }
  } finally {
    isSyncing = false;
  }
}

// Check cache status and preload
function loadCachedChannels(): { channels: IPTVChannel[]; timestamp: number } {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      lastSyncTime = parsed.timestamp || 0;
      return {
        channels: parsed.channels || FALLBACK_CHANNELS,
        timestamp: lastSyncTime
      };
    }
  } catch (e) {
    console.warn("Could not read local JSON cache file, using custom embed channels", e);
  }
  return { channels: FALLBACK_CHANNELS, timestamp: 0 };
}

// Background startup check
const cacheData = loadCachedChannels();
if (Date.now() - cacheData.timestamp > CACHE_DURATION_MS) {
  fetchIPTVData();
}

async function startServer() {
  const app = express();

  app.use(express.json());

  // API Route: Channels listing
  app.get("/api/channels", (req, res) => {
    const data = loadCachedChannels();
    const isCacheExpired = Date.now() - data.timestamp > CACHE_DURATION_MS;
    
    // If cache is expired, trigger refresh in the background
    if (isCacheExpired && !isSyncing) {
      fetchIPTVData();
    }

    res.json({
      success: true,
      syncState: {
        lastSync: data.timestamp,
        isSyncing: isSyncing,
        error: syncError,
        cacheDurationMs: CACHE_DURATION_MS
      },
      channels: data.channels
    });
  });

  // API Route: Force Refresh Trigger
  app.post("/api/refresh", async (req, res) => {
    if (isSyncing) {
      return res.status(409).json({ success: false, message: "Sync already in progress" });
    }
    // Fire-and-forget sync or wait for it? We will wait briefly and update
    await fetchIPTVData();
    const data = loadCachedChannels();
    res.json({
      success: true,
      syncState: {
        lastSync: data.timestamp,
        isSyncing: isSyncing,
        error: syncError
      },
      channels: data.channels
    });
  });

  // API Route: Health checks on individual streams
  app.post("/api/healthcheck", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }
    try {
      // Fast HEAD request to check availability (timeout 4s)
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal
      });
      clearTimeout(id);
      res.json({
        success: true,
        online: response.ok,
        status: response.status
      });
    } catch {
      res.json({
        success: true,
        online: false,
        status: 500
      });
    }
  });

  // Mount Vite development server when not in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IPTV India Hub Server running on http://localhost:${PORT}`);
  });
}

startServer();
