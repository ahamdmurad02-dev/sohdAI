import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Code2, Play, Box, Layers, Settings, Loader2, RefreshCw, Globe, X, Music, Maximize2, Eye, Library, Skull, Image as ImageIcon, Volume2, Download, Save, Folder, Search, Pencil, Upload, Copy, Check, ExternalLink, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Editor from "@monaco-editor/react";
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface SavedProject {
  id: string;
  name: string;
  code: string;
  dimension: '2D' | '3D';
  timestamp: number;
  thumbnail?: string;
}

export function GameStudio() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [gameDimension, setGameDimension] = useState<'2D' | '3D'>('3D');
  const [gameGenre, setGameGenre] = useState<string>('RPG');
  const [showSettings, setShowSettings] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [enableMusic, setEnableMusic] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview');
  const [gameTitle, setGameTitle] = useState('My Awesome Game');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [leftTab, setLeftTab] = useState<'hierarchy' | 'assets'>('hierarchy');
  const [showProjects, setShowProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // Load initially
  const [projects, setProjects] = useState<SavedProject[]>(() => {
    try {
      const saved = localStorage.getItem('gamestudio_projects');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save projects to localStorage whenever projects state changes
  useEffect(() => {
    localStorage.setItem('gamestudio_projects', JSON.stringify(projects));
  }, [projects]);

  const latestProjectState = useRef({
    id: currentProjectId,
    name: projects.find(p => p.id === currentProjectId)?.name || 'Untitled Game',
    code,
    dimension: gameDimension,
    timestamp: Date.now(),
    thumbnail: projects.find(p => p.id === currentProjectId)?.thumbnail || null,
  });

  useEffect(() => {
    latestProjectState.current = {
      id: currentProjectId,
      name: projects.find(p => p.id === currentProjectId)?.name || 'Untitled Game',
      code,
      dimension: gameDimension,
      timestamp: Date.now(),
      thumbnail: projects.find(p => p.id === currentProjectId)?.thumbnail || null,
    };
  }, [currentProjectId, code, gameDimension, projects]);

  const saveToCloud = async () => {
    const state = latestProjectState.current;
    if (state.id && state.code && auth.currentUser) {
      try {
        const projectRef = doc(db, 'users', auth.currentUser.uid, 'projects', state.id);
        const projectData: any = {
           id: state.id,
           name: state.name || 'Untitled',
           code: state.code,
           dimension: state.dimension,
           timestamp: state.timestamp,
        };
        if (state.thumbnail) {
          projectData.thumbnail = state.thumbnail;
        }
        await setDoc(projectRef, projectData, { merge: true });
        toast.success('Project saved to cloud', { id: 'autosave', icon: '☁️', duration: 2000, position: 'bottom-right' });
      } catch (e) {
        console.error("Save to cloud failed", e);
        toast.error('Failed to save project to cloud');
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(saveToCloud, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToCloud();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const horrorAssets = [
    { id: '1', name: 'Bloody Zombie Model', type: '3D Model', icon: Skull },
    { id: '2', name: 'Creepy Doll Prop', type: '3D Model', icon: Box },
    { id: '3', name: 'Flickering Light Effect', type: 'VFX', icon: Layers },
    { id: '4', name: 'Haunted Mansion Texture', type: 'Texture', icon: ImageIcon },
    { id: '5', name: 'Eerie Ambience', type: 'Sound', icon: Volume2 },
    { id: '6', name: 'Jump Scare SFX', type: 'Sound', icon: Volume2 },
  ];

  const handleDragStart = (e: React.DragEvent, assetName: string) => {
    e.dataTransfer.setData('text/plain', `[Use Asset: ${assetName}]`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data) {
      setPrompt(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + data + ' ');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    try {
      let systemPrompt = gameDimension === '3D' 
        ? `Generate a simple 3D ${gameGenre} game using Three.js based on this description: ${prompt}. Provide ONLY the HTML/JS code in a single file structure that can be run in an iframe. Do not include markdown formatting like \`\`\`html, just the raw code.`
        : `Generate a simple 2D ${gameGenre} game using HTML5 Canvas and JavaScript based on this description: ${prompt}. Provide ONLY the HTML/JS code in a single file structure that can be run in an iframe. Do not include markdown formatting like \`\`\`html, just the raw code.`;

      if (enableMusic) {
        systemPrompt += `\n\nCRITICAL: You MUST include background music in this game. Use the Web Audio API (AudioContext) to synthesize a simple, looping chiptune or background melody that plays automatically when the user interacts with the game (e.g., on first click or keypress to bypass browser autoplay policies).`;
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.5-flash',
          contents: systemPrompt,
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error?.message || 'Failed to generate code.');
      }
      const response = await res.json();
      
      let generatedCode = response.text || '';
      // Clean up markdown if present
      if (generatedCode.startsWith('```html')) {
        generatedCode = generatedCode.replace(/```html\n?/, '').replace(/```$/, '');
      } else if (generatedCode.startsWith('```')) {
        generatedCode = generatedCode.replace(/```\w*\n?/, '').replace(/```$/, '');
      }
      
      setCode(generatedCode);
      setRefreshKey(prev => prev + 1);
      
      const newId = Date.now().toString();
      setCurrentProjectId(newId);
      
      // Auto save
      setProjects(prev => [
        {
          id: newId,
          name: prompt.slice(0, 30) || 'Untitled Game',
          code: generatedCode,
          dimension: gameDimension,
          timestamp: Date.now()
        },
        ...prev
      ]);
    } catch (error: any) {
      console.error('Game generation error:', error);
      toast.error(error.message || 'Failed to generate game code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSaveThumbnail = () => {
    if (!currentProjectId) {
      toast.error("No active project to save. Please load or generate a game first.");
      return;
    }
    
    try {
      const iframe = document.querySelector('iframe[title="Game Preview"]') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow && iframe.contentWindow.document) {
        const canvas = iframe.contentWindow.document.querySelector('canvas');
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          setProjects(prev => prev.map(p => 
            p.id === currentProjectId ? { ...p, thumbnail: dataUrl } : p
          ));
          toast.success("Thumbnail saved successfully!");
        } else {
          toast.error("No canvas found in the game to snapshot.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to capture thumbnail. The game might not be fully loaded, or there's a cross-origin restriction.");
    }
  };

  const handleRenameProject = (projectId: string) => {
    if (editingName.trim()) {
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, name: editingName.trim() } : p
      ));
    }
    setEditingProjectId(null);
  };

  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sohdAI-game-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0B0B] font-sans text-zinc-200">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FF7A00;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
        .bg-grid-white {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }
      `}</style>

      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0B0B0B]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-8 pl-16 lg:pl-8 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/10 p-2 rounded-xl border border-orange-500/20">
            <Gamepad2 className="text-[#FF7A00]" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Game Studio</h2>
            <p className="text-zinc-500 text-[11px] uppercase tracking-wider hidden sm:block font-bold">AI Engine Builder</p>
          </div>
          <div className="hidden lg:flex items-center gap-1 ml-6 bg-white/5 p-1 rounded-xl border border-white/5">
            <button className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">File</button>
            <button className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Edit</button>
            <button className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Assets</button>
            <button className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">View</button>
            <button className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Build</button>
            <button className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Help</button>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="https://buy.stripe.com/test_8x2eVd1hT5hh28M2JPcMM00"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#FF7A00]/30 text-[#FF7A00] rounded-xl text-sm font-bold transition-all items-center gap-2"
          >
            GameAI Hub Plus
          </a>
          <button 
            onClick={() => setShowProjects(true)}
            className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors flex items-center gap-2 text-zinc-300"
          >
            <Folder size={16} /> <span className="hidden sm:inline">My Projects</span>
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-white/5 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors text-zinc-300"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => setShowPublish(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] hover:scale-[1.02] active:scale-[0.98] text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-[0_4px_14px_rgba(255,122,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,122,0,0.4)]"
          >
            <Globe size={16} /> Publish
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row min-h-0 min-w-0">
        
        {/* Left Panel - Control Center */}
        <div className="w-full lg:w-80 lg:border-r border-white/5 bg-[#0B0B0B] flex flex-col shrink-0 lg:h-full p-4 gap-4 overflow-y-auto custom-scrollbar z-10 relative">
          
          {/* Game Type Selector */}
          <div className="bg-[#111] p-1 rounded-2xl border border-white/5 flex shadow-inner shrink-0">
            <button
              onClick={() => setGameDimension('2D')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${
                gameDimension === '2D' ? 'bg-[#222] text-[#FF7A00] shadow-[0_0_15px_rgba(255,122,0,0.15)] border border-[#FF7A00]/50' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              2D Game
            </button>
            <button
              onClick={() => setGameDimension('3D')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${
                gameDimension === '3D' ? 'bg-[#222] text-[#FF7A00] shadow-[0_0_15px_rgba(255,122,0,0.15)] border border-[#FF7A00]/50' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              3D Game
            </button>
          </div>

          {/* Category Buttons */}
          <div className="shrink-0">
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 block">Genre</label>
            <div className="grid grid-cols-3 gap-2">
              {['RPG', 'Horror', 'FPS', 'Racing', 'Survival'].map((genre) => (
                <button
                  key={genre}
                  onClick={() => setGameGenre(genre)}
                  className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all duration-300 flex items-center justify-center ${
                    gameGenre === genre 
                      ? 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/50 shadow-[0_0_10px_rgba(255,122,0,0.1)]' 
                      : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
          
          {/* Game Concept Section */}
          <div className="flex flex-col shrink-0 flex-1 min-h-[140px]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Game Concept</label>
              <span className="text-xs text-zinc-600 font-mono">{prompt.length}</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              placeholder={gameDimension === '3D' 
                ? "Describe your dream game...\n\ne.g., A simple 3D platformer jumping across floating islands..."
                : "Describe your dream game...\n\ne.g., A classic 2D snake game with neon graphics..."
              }
              className="w-full h-full min-h-[120px] bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-[#FF7A00]/50 focus:ring-1 focus:ring-[#FF7A00]/50 resize-none transition-all shadow-inner custom-scrollbar"
            />
          </div>
          
          {/* Generate Code Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF9500] hover:from-[#e66e00] hover:to-[#e68600] text-white rounded-2xl h-14 font-bold disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] shadow-[0_4px_20px_rgba(255,122,0,0.25)] hover:shadow-[0_6px_25px_rgba(255,122,0,0.35)] active:scale-[0.98] mt-1 shrink-0"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Code2 size={20} />}
            {isLoading ? 'Compiling Engine...' : 'Generate Game Code'}
          </button>
          
          {/* Bottom Panel (Hierarchy / Assets) */}
          <div className="flex-[0.8] flex flex-col min-h-[250px] bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden mt-2 shrink-0">
            <div className="flex bg-[#111] border-b border-white/5 p-1 gap-1">
              <button 
                onClick={() => setLeftTab('hierarchy')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                  leftTab === 'hierarchy' ? 'bg-[#222] text-[#FF7A00] shadow-sm border border-white/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                Hierarchy
              </button>
              <button 
                onClick={() => setLeftTab('assets')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  leftTab === 'assets' ? 'bg-[#222] text-[#FF7A00] shadow-sm border border-white/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                <Library size={14} /> Assets
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              {leftTab === 'hierarchy' ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-[#FF7A00] bg-[#FF7A00]/10 border border-[#FF7A00]/20 rounded-xl cursor-default transition-all">
                    <Box size={16} /> Scene
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-xl cursor-pointer ml-4 transition-all">
                    <Eye size={16} className="text-blue-400" /> Main Camera
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-xl cursor-pointer ml-4 transition-all">
                    <Settings size={16} className="text-yellow-400" /> Directional Light
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-xl cursor-pointer ml-4 transition-all">
                    <Layers size={16} className="text-green-400" /> Environment
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input type="text" placeholder="Search assets..." className="w-full bg-[#111] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF7A00]/50 transition-all shadow-inner" />
                  </div>
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      {horrorAssets.map((asset) => {
                        const Icon = asset.icon;
                        return (
                          <div 
                            key={asset.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, asset.name)}
                            className="bg-[#111] border border-white/5 hover:border-[#FF7A00]/50 hover:shadow-[0_0_15px_rgba(255,122,0,0.1)] p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all group flex flex-col items-center text-center gap-2"
                          >
                            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#FF7A00]/10 transition-colors">
                              <Icon size={20} className="text-zinc-400 group-hover:text-[#FF7A00] transition-colors" />
                            </div>
                            <div className="text-[11px] font-bold text-zinc-300 leading-tight w-full" title={asset.name}>{asset.name}</div>
                          </div>
                        );
                      })}
                    </div>
                    <button className="w-full mt-3 border border-dashed border-white/10 hover:border-[#FF7A00]/50 text-zinc-500 hover:text-[#FF7A00] rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white/5 hover:bg-[#FF7A00]/5">
                      <Upload size={14} /> Upload Asset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Workspace */}
        <div className="flex-1 bg-[#111] relative flex flex-col min-h-[500px] lg:min-h-0 lg:m-4 lg:rounded-2xl lg:border border-white/5 overflow-hidden shadow-2xl z-0">
          <div className="h-14 border-b border-white/5 flex items-center px-4 bg-[#0a0a0a] justify-between shrink-0 relative z-20">
            <div className="flex items-center gap-2">
              <div className="flex bg-[#111] p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    previewMode === 'preview' ? 'bg-[#222] text-[#FF7A00] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Eye size={14} /> Viewport
                </button>
                <button
                  onClick={() => setPreviewMode('code')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    previewMode === 'code' ? 'bg-[#222] text-[#FF7A00] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Code2 size={14} /> Source
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {code && (
                <>
                  <button 
                    onClick={handleSaveThumbnail}
                    title="Save Snapshot"
                    className="p-2 bg-white/5 border border-white/5 text-zinc-400 rounded-xl hover:bg-white/10 hover:text-white transition-all shadow-sm"
                  >
                    <ImageIcon size={16} />
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Download size={14} /> Download HTML
                  </button>
                  <button 
                    onClick={() => setIsFullscreen(true)}
                    title="Fullscreen"
                    className="p-2 bg-white/5 border border-white/5 text-zinc-400 rounded-xl hover:bg-white/10 hover:text-white transition-all shadow-sm"
                  >
                    <Maximize2 size={16} />
                  </button>
                  <button 
                    onClick={handleReload}
                    title="Run Game"
                    className="px-4 py-2 bg-[#FF7A00]/10 text-[#FF7A00] hover:bg-[#FF7A00]/20 border border-[#FF7A00]/20 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider ml-1 hover:scale-105 active:scale-95"
                  >
                    <Play size={14} className="fill-[#FF7A00]" /> Play
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex-1 relative bg-[#0B0B0B] bg-grid-white z-10">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0B0B]/80 backdrop-blur-md z-30 transition-all duration-500">
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-white/5 border-t-[#FF7A00] rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Code2 size={28} className="text-[#FF7A00] animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Generating Engine</h3>
                <p className="text-sm font-mono tracking-widest text-zinc-500 uppercase">Building Assets...</p>
              </div>
            ) : code ? (
              previewMode === 'code' ? (
                <div className="absolute inset-0 bg-[#0B0B0B]">
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      fontFamily: '"JetBrains Mono", monospace',
                      padding: { top: 16 },
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-2 md:inset-4 lg:inset-0 lg:rounded-b-xl overflow-hidden bg-black shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] border lg:border-none border-white/5 rounded-2xl">
                  <iframe 
                    key={refreshKey}
                    srcDoc={code}
                    className="w-full h-full border-none"
                    title="Game Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 transition-all duration-500">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                  <Gamepad2 size={48} className="text-zinc-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-300 mb-2">Workspace Ready</h3>
                <p className="text-sm text-zinc-500 max-w-xs text-center leading-relaxed">Describe your game concept in the left panel to generate a fully playable scene.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Game Modal */}
      {isFullscreen && code && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="h-12 border-b border-[#222] flex items-center px-4 bg-[#0a0a0a] justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 size={16} className="text-orange-500" />
              <span className="text-sm font-medium text-zinc-200">Game Playing</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleReload}
                title="Restart Game"
                className="p-1.5 bg-[#1a1a1a] border border-[#333] text-zinc-300 rounded hover:bg-[#222] hover:text-white transition-colors flex items-center gap-2 text-xs"
              >
                <RefreshCw size={14} />
              </button>
              <button 
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded hover:bg-red-500/20 transition-colors flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full bg-white">
            <iframe 
              key={refreshKey}
              srcDoc={code}
              className="w-full h-full border-none"
              title="Fullscreen Game Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublish && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Share2 size={18} className="text-orange-500" />
                Publish & Share Game
              </h3>
              <button 
                onClick={() => {
                  setShowPublish(false);
                  setGeneratedLink('');
                  setCopied(false);
                }} 
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {!generatedLink ? (
                <>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1 font-medium">Game Title</label>
                    <input 
                      type="text" 
                      value={gameTitle}
                      onChange={(e) => setGameTitle(e.target.value)}
                      placeholder="My Awesome Game" 
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1 font-medium">Platform Link Hosting</label>
                    <div className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 p-3 rounded-lg leading-relaxed">
                      This will pack your game's source files into an encrypted direct launching web query. This is playable on any mobile device or PC immediately.
                    </div>
                  </div>
                  <button 
                    onClick={() => { 
                      if (!code) {
                        toast.error('Generate a game first!');
                        return;
                      }
                      try {
                        const encoded = btoa(encodeURIComponent(code).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                          return String.fromCharCode(parseInt(p1, 16));
                        }));
                        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}&type=game&title=${encodeURIComponent(gameTitle)}`;
                        setGeneratedLink(shareUrl);
                        toast.success('Game compiled and ready for sharing!');
                      } catch (err) {
                        toast.error('Failed to encode game components into link.');
                      }
                    }} 
                    className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-lg py-2.5 font-semibold text-sm transition-all focus:outline-none flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer"
                  >
                    <Globe size={16} /> Create Live Link
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
                    <Check className="text-green-500 shrink-0 mt-0.5" size={16} />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">Your Game is Live!</p>
                      <p className="text-[11px] text-zinc-400">Share this secure link with anyone online so they can run and play your game instantly.</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 block">Copy Game URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={generatedLink}
                        className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs truncate text-zinc-400 select-all"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink);
                          setCopied(true);
                          toast.success('Link copied to clipboard!');
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="bg-zinc-800 hover:bg-[#ff7600] text-zinc-300 hover:text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 shrink-0 active:scale-95 cursor-pointer"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <a 
                      href={generatedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2.5 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-orange-500/10"
                    >
                      <ExternalLink size={14} /> Play Live Game
                    </a>
                    <button 
                      onClick={() => {
                        setGeneratedLink('');
                        setCopied(false);
                      }}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg py-2 text-xs font-semibold transition-all focus:outline-none"
                    >
                      Publish Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showProjects && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#222]">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Folder className="text-orange-500" size={20} /> My Projects
              </h3>
              <button onClick={() => setShowProjects(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-[#222]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {projects.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">
                  No projects yet. Generate a game to auto-save it!
                </div>
              ) : projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <div className="text-center text-zinc-500 py-8">
                  No projects found for "{searchQuery}".
                </div>
              ) : (
                projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(project => (
                  <div key={project.id} className="bg-[#1a1a1a] border border-[#333] hover:border-[#444] rounded-xl p-4 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt={project.name} className="w-16 h-12 object-cover rounded-md bg-[#222]" />
                      ) : (
                        <div className="w-16 h-12 bg-[#222] rounded-md flex items-center justify-center">
                          <Gamepad2 size={20} className="text-zinc-500" />
                        </div>
                      )}
                      <div>
                        {editingProjectId === project.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameProject(project.id);
                                } else if (e.key === 'Escape') {
                                  setEditingProjectId(null);
                                }
                              }}
                              onBlur={() => handleRenameProject(project.id)}
                              autoFocus
                              className="bg-[#222] border border-orange-500 rounded px-2 py-1 text-white text-sm focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-medium">{project.name}</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProjectId(project.id);
                                setEditingName(project.name);
                              }}
                              className="text-zinc-500 hover:text-orange-500 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                          <span className="bg-[#222] px-1.5 py-0.5 rounded text-[10px] uppercase">{project.dimension}</span>
                          {new Date(project.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentProjectId(project.id);
                        setPrompt(project.name);
                        setCode(project.code);
                        setGameDimension(project.dimension);
                        setShowProjects(false);
                        setRefreshKey(prev => prev + 1);
                      }}
                      className="px-3 py-1.5 bg-[#222] hover:bg-orange-500 hover:text-white text-zinc-300 rounded text-sm transition-colors"
                    >
                      Load Project
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Game Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Music size={16} className="text-orange-500" />
                    Generate Background Music
                  </label>
                  <p className="text-xs text-zinc-400 mt-1">AI will synthesize chiptune music using Web Audio API</p>
                </div>
                <button
                  onClick={() => setEnableMusic(!enableMusic)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${enableMusic ? 'bg-orange-500' : 'bg-[#333]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${enableMusic ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              <div className="pt-4 border-t border-[#333]">
                <label className="text-sm text-zinc-400 block mb-1">Default Resolution</label>
                <select className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500">
                  <option>Responsive (Auto)</option>
                  <option>1920x1080</option>
                  <option>1280x720</option>
                  <option>800x600</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-400 block mb-1">Physics Engine</label>
                <select className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500">
                  <option>Built-in (Basic)</option>
                  <option>Cannon.js (Advanced 3D)</option>
                  <option>Matter.js (Advanced 2D)</option>
                </select>
              </div>
              <button 
                onClick={() => setShowSettings(false)} 
                className="w-full bg-[#222] hover:bg-[#333] text-white rounded-lg py-2 font-medium transition-colors border border-[#444]"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
