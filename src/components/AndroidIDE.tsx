import React from "react";
import { KotlinFile } from "../types";
import { ANDROID_FILES } from "../data/androidCode";
import {
  FileCode,
  Folder,
  FolderOpen,
  Copy,
  Check,
  Cpu,
  RefreshCw,
  BookOpen,
  Settings
} from "lucide-react";

export const AndroidIDE: React.FC = () => {
  const [selectedFile, setSelectedFile] = React.useState<KotlinFile>(ANDROID_FILES[0]);
  const [copied, setCopied] = React.useState(false);
  const [openFolders, setOpenFolders] = React.useState<{ [key: string]: boolean }>({
    "app": true,
    "app/src": true,
    "app/src/main": true,
    "app/src/main/java": true,
    "domain": true,
    "data": true,
    "presentation": true,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFolder = (folderKey: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  // Convert files list to directory tree layout representation
  const treeNodes = React.useMemo(() => {
    const list: { key: string; name: string; isFolder: boolean; fileRef?: KotlinFile; indent: number }[] = [];
    
    // Virtual nodes for directory mapping
    list.push({ key: "app", name: "app", isFolder: true, indent: 0 });
    
    if (openFolders["app"]) {
      list.push({ key: "app/build.gradle.kts", name: "build.gradle.kts", isFolder: false, fileRef: ANDROID_FILES[0], indent: 1 });
      list.push({ key: "app/src", name: "src", isFolder: true, indent: 1 });
      
      if (openFolders["app/src"]) {
        list.push({ key: "app/src/main", name: "main", isFolder: true, indent: 2 });
        
        if (openFolders["app/src/main"]) {
          list.push({ key: "app/src/main/java", name: "java (Kotlin Source code)", isFolder: true, indent: 3 });
          
          if (openFolders["app/src/main/java"]) {
            
            // Domain
            list.push({ key: "domain", name: "domain / models", isFolder: true, indent: 4 });
            if (openFolders["domain"]) {
              list.push({ key: "domain/IPTVChannel.kt", name: "IPTVChannel.kt", isFolder: false, fileRef: ANDROID_FILES[1], indent: 5 });
            }

            // Data
            list.push({ key: "data", name: "data (API, Database, Repos)", isFolder: true, indent: 4 });
            if (openFolders["data"]) {
              list.push({ key: "data/IPTVApiService.kt", name: "IPTVApiService.kt", isFolder: false, fileRef: ANDROID_FILES[2], indent: 5 });
              list.push({ key: "data/IPTVDatabase.kt", name: "IPTVDatabase.kt", isFolder: false, fileRef: ANDROID_FILES[3], indent: 5 });
              list.push({ key: "data/IPTVRepository.kt", name: "IPTVRepository.kt", isFolder: false, fileRef: ANDROID_FILES[4], indent: 5 });
            }

            // Presentation
            list.push({ key: "presentation", name: "presentation", isFolder: true, indent: 4 });
            if (openFolders["presentation"]) {
              list.push({ key: "presentation/IPTVViewModel.kt", name: "IPTVViewModel.kt", isFolder: false, fileRef: ANDROID_FILES[5], indent: 5 });
              list.push({ key: "presentation/PlayerScreen.kt", name: "PlayerScreen.kt", isFolder: false, fileRef: ANDROID_FILES[6], indent: 5 });
              list.push({ key: "presentation/HomeScreen.kt", name: "HomeScreen.kt", isFolder: false, fileRef: ANDROID_FILES[7], indent: 5 });
            }

          }
        }
      }
    }
    return list;
  }, [openFolders]);

  return (
    <div className="w-full flex flex-col gap-6" id="ide-workspace-section">
      
      {/* Jetpack MVVM Design architecture summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-900/40 p-4 border border-zinc-805/85 rounded-xl">
        <div className="flex gap-3">
          <BookOpen className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h6 className="text-zinc-205 text-xs font-bold leading-tight uppercase tracking-wider mb-1">
              MVVM & Android Jetpack
            </h6>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              Exposes immutable UI states from ViewModel using Kotlin Coroutine Flows. The views listen using Compose <code>collectAsStateWithLifecycle()</code>.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Cpu className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <h6 className="text-zinc-205 text-xs font-bold leading-tight uppercase tracking-wider mb-1">
              Retrofit & Room Join Caching
            </h6>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              Downloads JSON channels, streams, and logos via Retrofit, aggregates by country-code 'IN', caches locally inside Room DB, and expires after 24 hrs automatically.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Settings className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
          <div>
            <h6 className="text-zinc-205 text-xs font-bold leading-tight uppercase tracking-wider mb-1">
              Media3 ExoPlayer Engine
            </h6>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              Loads adaptive HLS (m3u8) feeds via Media3 Player SDK in Jetpack Compose, handling vertical bright-volume gestures and automated reconnection recovery triggers.
            </p>
          </div>
        </div>
      </div>

      {/* Main IDE Workspace */}
      <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[550px]">
        
        {/* Left column - IDE Solution explorer tree */}
        <div className="w-full lg:w-72 bg-zinc-900/80 border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Android Project Explorer
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] text-zinc-400 select-none">
            {treeNodes.map((node) => {
              const isSelected = !node.isFolder && selectedFile.path === node.fileRef?.path;
              return (
                <div
                  key={node.key}
                  style={{ paddingLeft: `${node.indent * 12}px` }}
                  onClick={() => {
                    if (node.isFolder) {
                      toggleFolder(node.key);
                    } else if (node.fileRef) {
                      setSelectedFile(node.fileRef);
                    }
                  }}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-red-950/40 text-red-400 font-bold border-l-2 border-red-650"
                      : "hover:bg-zinc-850/60"
                  }`}
                >
                  {node.isFolder ? (
                    openFolders[node.key] ? (
                      <FolderOpen className="w-3.5 h-3.5 text-zinc-500 text-yellow-650" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-zinc-500 text-yellow-500" />
                    )
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-zinc-400 text-cyan-500" />
                  )}
                  <span className="truncate">{node.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column - Code highlighting and detail summaries */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950 select-text">
          {/* File Header */}
          <div className="p-3 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-zinc-200 text-xs font-bold tracking-tight">
                  {selectedFile.name}
                </span>
                <span className="text-zinc-500 text-[10px] lowercase block tracking-tight">
                  {selectedFile.path}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Code Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy File
                </>
              )}
            </button>
          </div>

          {/* Description HUD */}
          <div className="px-4 py-2.5 bg-red-950/20 border-b border-red-900/30 text-zinc-400 text-[11px] leading-relaxed flex items-start gap-2 flex-shrink-0">
            <BookOpen className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span>
              <strong>File Role:</strong> {selectedFile.description}
            </span>
          </div>

          {/* Text Code block Render */}
          <div className="flex-1 overflow-auto p-4 font-mono text-[11.5px] leading-relaxed bg-[#0c0d0e] text-zinc-300">
            <pre className="whitespace-pre-wrap select-all selection:bg-red-800 selection:text-white">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
