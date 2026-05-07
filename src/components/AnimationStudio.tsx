import React, { useState, useRef } from 'react';
import { Film, Play, Pause, SkipBack, SkipForward, Layers, Settings, Wand2, Loader2, RefreshCw, Upload, X, ChevronDown, Download, Youtube, Instagram, Twitter, Facebook, Smartphone, Diamond, User, Sparkles, Camera, Image as ImageIcon, Library, Save, History, Music, Volume2, Video } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Keyframe {
  id: string;
  time: number; // 0 to 100 percentage
  prompt: string;
}

interface CustomAudio {
  id: string;
  name: string;
  file: File;
}

interface TimelineAudio {
  id: string;
  name: string;
  startPercent: number;
}

interface Version {
  id: string;
  timestamp: number;
  prompt: string;
  code: string;
  keyframes: Keyframe[];
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function AnimationStudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [rightTab, setRightTab] = useState<'properties' | 'assets'>('properties');
  
  // Keyframe and Timeline State
  const [playheadPosition, setPlayheadPosition] = useState(10);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [customAudios, setCustomAudios] = useState<CustomAudio[]>([]);
  const [timelineAudios, setTimelineAudios] = useState<TimelineAudio[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  const handleSaveVersion = () => {
    if (!code) {
      alert('Please generate an animation before saving a version!');
      return;
    }
    const newVersion: Version = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt,
      code,
      keyframes: [...keyframes]
    };
    setVersions(prev => [newVersion, ...prev]);
    alert('Animation saved to version history!');
  };

  const animationAssets = [
    { id: 'a1', name: 'Hero Character', type: 'Sprite', icon: User },
    { id: 'a2', name: 'Villain Character', type: 'Sprite', icon: User },
    { id: 'a3', name: 'Sci-Fi Background', type: 'Background', icon: ImageIcon },
    { id: 'a4', name: 'Explosion VFX', type: 'Effect', icon: Sparkles },
    { id: 'a5', name: 'Cinematic Camera', type: 'Camera', icon: Camera },
  ];

  const videoAssets = [
    { id: 'v1', name: 'Cinematic Video Clip', type: 'Video', icon: Video },
    { id: 'v2', name: 'Action Sequence', type: 'Video', icon: Video },
    { id: 'v3', name: 'B-Roll Footage', type: 'Video', icon: Video },
  ];

  const audioAssets = [
    { id: 'au1', name: 'Cinematic Score', type: 'Music', icon: Music },
    { id: 'au2', name: 'Suspense Build', type: 'Music', icon: Music },
    { id: 'au3', name: 'Whoosh Transition', type: 'SFX', icon: Volume2 },
    { id: 'au4', name: 'Impact Hit', type: 'SFX', icon: Volume2 },
  ];

  const handleDragStart = (e: React.DragEvent, assetName: string, assetType?: string) => {
    e.dataTransfer.setData('text/plain', `[Use Asset: ${assetName}]`);
    if (assetType === 'Audio') {
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'audio-asset', name: assetName }));
    }
  };

  const handleAddKeyframe = () => {
    const newKeyframe: Keyframe = {
      id: Math.random().toString(36).substr(2, 9),
      time: playheadPosition,
      prompt: prompt || 'New keyframe state',
    };
    setKeyframes(prev => [...prev, newKeyframe].sort((a, b) => a.time - b.time));
    setSelectedKeyframeId(newKeyframe.id);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPlayheadPosition(percentage);
  };

  const handleExport = (platform: string) => {
    setShowExportMenu(false);
    alert(`Preparing animation export for ${platform}...`);
  };

  const handleGenerate = async () => {
    if ((!prompt.trim() && keyframes.length === 0) || isLoading) return;
    setIsLoading(true);
    try {
      let promptText = `Generate a self-contained HTML/CSS/JS animation. Provide ONLY the raw HTML code containing inline CSS and JS. Do not include markdown formatting like \`\`\`html. Make it visually appealing, centered, and responsive to the window size.`;
      
      if (keyframes.length > 0) {
        promptText += `\n\nThe animation MUST transition through these specific keyframes over its duration:\n`;
        keyframes.forEach(kf => {
          promptText += `- At ${Math.round(kf.time)}% of the animation: ${kf.prompt}\n`;
        });
        promptText += `\nEnsure smooth transitions between these states.`;
      } else {
        promptText += `\n\nBased on this description: ${prompt}`;
      }
      
      const parts: any[] = [{ text: promptText }];

      if (sourceImage) {
        parts[0].text += `\n\nI have provided an image asset. Use the exact string 'ASSET_URL' as the src for the image you are animating. For example: <img src="ASSET_URL" />.`;
        
        const base64Data = sourceImage.split(',')[1];
        const mimeType = sourceImage.split(';')[0].split(':')[1];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          }
        });
      }

      parts[0].text += `\n\nCRITICAL: For any requested sound effects or music [Use Asset: ...] or [Use Uploaded Sound: ...], you must synthesize those sounds using Web Audio API to play during the animation. If it is a cinematic video request, you can use a placeholder video element or CSS animations mimicking a video playing.`;


      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts },
      });
      
      let generatedCode = response.text || '';
      // Clean up markdown if present
      if (generatedCode.startsWith('```html')) {
        generatedCode = generatedCode.replace(/```html\n?/, '').replace(/```$/, '');
      } else if (generatedCode.startsWith('```')) {
        generatedCode = generatedCode.replace(/```\w*\n?/, '').replace(/```$/, '');
      }
      
      if (sourceImage) {
        generatedCode = generatedCode.replace(/ASSET_URL/g, sourceImage);
      }
      
      setCode(generatedCode);
      setRefreshKey(prev => prev + 1);
      setIsPlaying(true);
    } catch (error) {
      console.error('Animation generation error:', error);
      alert('Failed to generate animation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      const data = e.dataTransfer.getData('text/plain');
      if (data) {
        if (selectedKeyframeId) {
          setKeyframes(prev => prev.map(k => k.id === selectedKeyframeId ? { ...k, prompt: k.prompt + (k.prompt.endsWith(' ') || k.prompt.length === 0 ? '' : ' ') + data + ' ' } : k));
        } else {
          setPrompt(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + data + ' ');
        }
      }
    }
  };

  const handleTimelineAudioDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTimelineAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        const id = Math.random().toString(36).substr(2, 9);
        setTimelineAudios(prev => [...prev, { id, name: file.name, startPercent: percentage }]);
        setPrompt(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + `\n[Play audio '${file.name}' at ${Math.round(percentage)}% of animation] `);
        
        setCustomAudios(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: file.name, file }]);
      }
      return;
    }
    
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.type === 'uploaded-audio' || data.type === 'audio-asset') {
          const id = Math.random().toString(36).substr(2, 9);
          setTimelineAudios(prev => [...prev, { id, name: data.name, startPercent: percentage }]);
          setPrompt(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + `\n[Play audio '${data.name}' at ${Math.round(percentage)}% of animation] `);
        }
      }
    } catch (err) {
      // ignore
    }
  };

  const handleReload = () => {
    setRefreshKey(prev => prev + 1);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <header className="px-4 md:px-8 py-4 md:py-6 border-b border-[#222] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Animation Studio</h2>
          <p className="text-zinc-400 text-xs md:text-sm mt-1">Create and edit animations with AI assistance</p>
        </div>
        <div className="flex gap-2 relative self-end md:self-auto">
          <button 
            onClick={() => setShowVersions(true)}
            className="px-4 py-2 bg-[#111] border border-[#333] hover:bg-[#222] text-zinc-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <History size={16} /> Versions {versions.length > 0 && `(${versions.length})`}
          </button>
          <button 
            onClick={handleSaveVersion}
            className="px-4 py-2 bg-[#111] hover:bg-[#222] border border-[#333] text-zinc-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Save size={16} /> Save
          </button>
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Export
            <ChevronDown size={14} />
          </button>

          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-3 py-2 border-b border-[#333] text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Export Format
                </div>
                <button onClick={() => handleExport('YouTube')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-[#222] hover:text-white transition-colors">
                  <Youtube size={16} className="text-red-500" /> YouTube (16:9)
                </button>
                <button onClick={() => handleExport('Instagram')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-[#222] hover:text-white transition-colors">
                  <Instagram size={16} className="text-pink-500" /> Instagram (1:1)
                </button>
                <button onClick={() => handleExport('TikTok')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-[#222] hover:text-white transition-colors">
                  <Smartphone size={16} className="text-zinc-100" /> TikTok (9:16)
                </button>
                <button onClick={() => handleExport('Twitter')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-[#222] hover:text-white transition-colors">
                  <Twitter size={16} className="text-blue-400" /> Twitter (16:9)
                </button>
                <button onClick={() => handleExport('Facebook')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-[#222] hover:text-white transition-colors">
                  <Facebook size={16} className="text-blue-600" /> Facebook (4:5)
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Section: Preview & Properties */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Main Preview */}
          <div 
            className={`flex-1 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-[#222] transition-colors min-h-[50vh] md:min-h-0 ${isDragging ? 'bg-orange-500/10 border-orange-500' : 'bg-[#111]'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10">
                <Loader2 size={32} className="text-orange-500 animate-spin mb-4" />
                <p className="text-sm text-zinc-400">Generating animation...</p>
              </div>
            ) : code ? (
              <iframe 
                key={refreshKey}
                srcDoc={code}
                className="w-full h-full border-none bg-white"
                title="Animation Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="text-center text-zinc-600">
                <Film size={48} className="mb-4 opacity-20 mx-auto" />
                <p className="text-sm">Animation Canvas</p>
              </div>
            )}
            
            {/* AI Prompt Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-20">
              <div className="bg-[#1a1a1a]/90 backdrop-blur-md border border-[#333] rounded-2xl p-3 flex flex-col gap-2 shadow-2xl">
                {selectedKeyframeId ? (
                  <div className="flex items-center justify-between px-2 pb-2 border-b border-[#333]">
                    <span className="text-xs font-medium text-orange-400 flex items-center gap-1">
                      <Diamond size={12} className="fill-orange-400" />
                      Editing Keyframe at {Math.round(keyframes.find(k => k.id === selectedKeyframeId)?.time || 0)}%
                    </span>
                    <button 
                      onClick={() => {
                        setKeyframes(prev => prev.filter(k => k.id !== selectedKeyframeId));
                        setSelectedKeyframeId(null);
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete Keyframe
                    </button>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedKeyframeId ? (keyframes.find(k => k.id === selectedKeyframeId)?.prompt || '') : prompt}
                    onChange={(e) => {
                      if (selectedKeyframeId) {
                        setKeyframes(prev => prev.map(k => k.id === selectedKeyframeId ? { ...k, prompt: e.target.value } : k));
                      } else {
                        setPrompt(e.target.value);
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder={selectedKeyframeId ? "Describe the state at this keyframe..." : "Describe an animation to generate..."}
                    className="flex-1 bg-transparent border-none px-2 text-sm focus:outline-none text-white placeholder:text-zinc-500"
                  />
                  <button 
                    onClick={handleGenerate}
                    disabled={(!prompt.trim() && keyframes.length === 0) || isLoading}
                    className="w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center text-white transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Properties or Assets */}
          <div className="w-full md:w-72 bg-[#0f0f0f] flex flex-col md:border-l border-[#222] shrink-0">
            <div className="flex border-b border-[#222]">
              <button 
                onClick={() => setRightTab('properties')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                  rightTab === 'properties' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Settings size={14} /> Properties
              </button>
              <button 
                onClick={() => setRightTab('assets')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                  rightTab === 'assets' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Library size={14} /> Assets
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {rightTab === 'properties' ? (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Duration</label>
                    <div className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-zinc-300">
                      00:05:00
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Frame Rate</label>
                    <select className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-orange-500/50">
                      <option>24 fps</option>
                      <option>30 fps</option>
                      <option>60 fps</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Resolution</label>
                    <select className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-orange-500/50">
                      <option>1920 x 1080</option>
                      <option>1080 x 1920</option>
                      <option>1080 x 1080</option>
                    </select>
                  </div>
                  <div className="pt-4 border-t border-[#222]">
                    <label className="text-xs text-zinc-500 block mb-2">Import Image Asset</label>
                    {sourceImage ? (
                      <div className="relative w-full h-24 rounded bg-[#1a1a1a] border border-[#333] overflow-hidden group">
                        <img src={sourceImage} alt="Asset" className="w-full h-full object-contain" />
                        <button 
                          onClick={() => setSourceImage(null)}
                          className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-24 rounded border border-dashed border-[#333] flex flex-col items-center justify-center text-zinc-500 bg-[#1a1a1a]">
                        <Upload size={16} className="mb-1" />
                        <span className="text-[10px]">Drop image here</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-6">
                  <div>
                    <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                       Animation Pack
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {animationAssets.map((asset) => {
                        const Icon = asset.icon;
                        return (
                          <div 
                            key={asset.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, asset.name)}
                            className="bg-[#1a1a1a] border border-[#333] hover:border-orange-500/50 hover:bg-[#222] p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all group"
                          >
                            <Icon size={20} className="text-zinc-400 group-hover:text-orange-500 mb-2 transition-colors" />
                            <div className="text-xs font-medium text-zinc-300 truncate" title={asset.name}>{asset.name}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">{asset.type}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 flex items-center justify-between">
                       Video Clips
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {videoAssets.map((asset) => {
                        const Icon = asset.icon;
                        return (
                          <div 
                            key={asset.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, asset.name)}
                            className="bg-[#1a1a1a] border border-[#333] hover:border-orange-500/50 hover:bg-[#222] p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all group"
                          >
                            <Icon size={20} className="text-zinc-400 group-hover:text-orange-500 mb-2 transition-colors" />
                            <div className="text-xs font-medium text-zinc-300 truncate" title={asset.name}>{asset.name}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">{asset.type}</div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-[#222]">
                      <button 
                        onClick={() => document.getElementById('video-upload')?.click()}
                        className="w-full py-3 rounded border border-dashed border-[#333] hover:border-orange-500/50 flex flex-col items-center justify-center text-zinc-500 hover:text-orange-500 transition-colors bg-[#1a1a1a] cursor-pointer"
                      >
                        <Upload size={16} className="mb-1" />
                        <span className="text-[10px] uppercase font-medium">Upload Custom Video</span>
                      </button>
                      <input 
                        type="file" 
                        id="video-upload" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const fileName = e.target.files[0].name;
                            setPrompt(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + `[Use Uploaded Video: ${fileName}] `);
                            alert(`Video "${fileName}" added to instructions!`);
                            e.target.value = '';
                          }
                        }} 
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 flex items-center justify-between">
                       Audio & Music
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {audioAssets.map((asset) => {
                        const Icon = asset.icon;
                        return (
                          <div 
                            key={asset.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, asset.name, 'Audio')}
                            className="bg-[#1a1a1a] border border-[#333] hover:border-orange-500/50 hover:bg-[#222] p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all group"
                          >
                            <Icon size={20} className="text-zinc-400 group-hover:text-orange-500 mb-2 transition-colors" />
                            <div className="text-xs font-medium text-zinc-300 truncate" title={asset.name}>{asset.name}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">{asset.type}</div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {customAudios.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {customAudios.map((audio) => (
                          <div 
                            key={audio.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, audio.name, 'Audio')}
                            className="bg-[#1a1a1a] border border-[#333] hover:border-orange-500/50 hover:bg-[#222] p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all group"
                          >
                            <Volume2 size={20} className="text-zinc-400 group-hover:text-orange-500 mb-2 transition-colors" />
                            <div className="text-xs font-medium text-zinc-300 truncate" title={audio.name}>{audio.name}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">Uploaded</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-[#222]">
                      <button 
                        onClick={() => document.getElementById('audio-upload')?.click()}
                        className="w-full py-3 rounded border border-dashed border-[#333] hover:border-orange-500/50 flex flex-col items-center justify-center text-zinc-500 hover:text-orange-500 transition-colors bg-[#1a1a1a] cursor-pointer"
                      >
                        <Upload size={16} className="mb-1" />
                        <span className="text-[10px] uppercase font-medium">Upload Custom Audio</span>
                      </button>
                      <input 
                        type="file" 
                        id="audio-upload" 
                        accept="audio/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setCustomAudios(prev => [...prev, {
                                id: Math.random().toString(36).substr(2, 9),
                                name: file.name,
                                file
                            }]);
                            e.target.value = '';
                          }
                        }} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Timeline */}
        <div className="h-64 bg-[#0f0f0f] border-t border-[#222] flex flex-col">
          {/* Timeline Controls */}
          <div className="h-12 border-b border-[#222] flex items-center px-4 justify-between bg-[#111]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222] rounded transition-colors">
                  <SkipBack size={16} />
                </button>
                <button 
                  onClick={handleReload}
                  disabled={!code}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222] rounded transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} />
                </button>
                <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222] rounded transition-colors">
                  <SkipForward size={16} />
                </button>
              </div>
              <div className="text-xs font-mono text-zinc-500">
                00:00:00 / 00:05:00
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleAddKeyframe}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-[#222] transition-colors flex items-center gap-1"
              >
                <Diamond size={12} />
                Add Keyframe
              </button>
            </div>
          </div>

          {/* Timeline Tracks */}
          <div className="flex-1 flex overflow-x-auto md:overflow-hidden">
            {/* Track Headers */}
            <div className="w-24 md:w-48 border-r border-[#222] bg-[#151515] flex flex-col shrink-0">
              <div className="h-8 border-b border-[#222] flex items-center px-2 md:px-3 text-[10px] md:text-xs text-zinc-500">
                Tracks
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="h-10 border-b border-[#222] flex items-center px-2 md:px-3 gap-1 md:gap-2 bg-[#1a1a1a]">
                  <Layers size={14} className="text-orange-500 shrink-0" />
                  <span className="text-[10px] md:text-xs text-zinc-300 truncate">Generated Animation</span>
                </div>
                <div className="h-10 border-b border-[#222] flex items-center px-2 md:px-3 gap-1 md:gap-2">
                  <Layers size={14} className="text-zinc-500 shrink-0" />
                  <span className="text-[10px] md:text-xs text-zinc-400 truncate">Background</span>
                </div>
                <div className="h-10 border-b border-[#222] flex items-center px-2 md:px-3 gap-1 md:gap-2">
                  <Layers size={14} className="text-zinc-500 shrink-0" />
                  <span className="text-[10px] md:text-xs text-zinc-400 truncate">Camera</span>
                </div>
                <div className="h-10 border-b border-[#222] flex items-center px-2 md:px-3 gap-1 md:gap-2">
                  <Volume2 size={14} className="text-zinc-500 shrink-0" />
                  <span className="text-[10px] md:text-xs text-zinc-400 truncate">Audio track</span>
                </div>
              </div>
            </div>

            {/* Track Content */}
            <div className="flex-1 bg-[#0a0a0a] relative overflow-x-auto overflow-y-hidden min-w-[300px]">
              {/* Time Ruler */}
              <div 
                ref={timelineRef}
                onClick={handleTimelineClick}
                className="h-8 border-b border-[#222] bg-[#111] flex items-end cursor-pointer relative"
              >
                {/* Mock ruler ticks */}
                <div className="w-full h-2 border-l border-[#333] relative pointer-events-none">
                  <div className="absolute left-[20%] h-full border-l border-[#333]" />
                  <div className="absolute left-[40%] h-full border-l border-[#333]" />
                  <div className="absolute left-[60%] h-full border-l border-[#333]" />
                  <div className="absolute left-[80%] h-full border-l border-[#333]" />
                </div>
              </div>
              
              {/* Playhead */}
              <div 
                className="absolute top-0 bottom-0 w-px bg-orange-500 z-10 pointer-events-none transition-all duration-75"
                style={{ left: `${playheadPosition}%` }}
              >
                <div className="absolute top-0 -translate-x-1/2 w-3 h-3 bg-orange-500 rounded-sm" />
              </div>

              {/* Clips */}
              <div className="h-10 border-b border-[#222] relative">
                {code && (
                  <div className="absolute top-1.5 bottom-1.5 left-[5%] w-[90%] bg-orange-500/20 border border-orange-500/50 rounded flex items-center px-2">
                    <span className="text-[10px] text-orange-200">AI Animation Clip</span>
                  </div>
                )}
                {/* Keyframes */}
                {keyframes.map(kf => (
                  <div
                    key={kf.id}
                    onClick={() => {
                      setSelectedKeyframeId(kf.id);
                      setPlayheadPosition(kf.time);
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-20 transition-transform hover:scale-125 ${selectedKeyframeId === kf.id ? 'text-orange-400' : 'text-zinc-400'}`}
                    style={{ left: `${kf.time}%` }}
                  >
                    <Diamond size={14} className={selectedKeyframeId === kf.id ? 'fill-orange-400' : 'fill-zinc-800'} />
                  </div>
                ))}
              </div>
              <div className="h-10 border-b border-[#222] relative">
                <div className="absolute top-1.5 bottom-1.5 left-0 w-full bg-blue-500/10 border border-blue-500/30 rounded flex items-center px-2">
                  <span className="text-[10px] text-blue-200">Static BG</span>
                </div>
              </div>
              <div className="h-10 border-b border-[#222] relative">
                <div className="absolute top-1.5 bottom-1.5 left-[10%] w-[20%] bg-purple-500/20 border border-purple-500/50 rounded flex items-center px-2">
                  <span className="text-[10px] text-purple-200">Pan Right</span>
                </div>
              </div>
              <div 
                className="h-10 border-b border-[#222] relative bg-[#111]/50 border-dashed border-[#333] hover:bg-[#222]/50 transition-colors"
                onDragOver={handleTimelineAudioDragOver}
                onDrop={handleTimelineAudioDrop}
              >
                {timelineAudios.length === 0 && (
                   <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600 pointer-events-none">
                     Drop audio clips here
                   </div>
                )}
                {timelineAudios.map(audio => (
                  <div 
                    key={audio.id}
                    className="absolute top-1.5 bottom-1.5 min-w-[100px] max-w-[200px] bg-green-500/20 border border-green-500/50 rounded flex items-center px-2 z-20"
                    style={{ left: `${audio.startPercent}%` }}
                    title={audio.name}
                  >
                    <span className="text-[10px] text-green-200 truncate pr-4">{audio.name}</span>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setTimelineAudios(prev => prev.filter(a => a.id !== audio.id));
                        }}
                        className="absolute right-1 text-green-400 hover:text-green-200"
                    >
                        <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Versions Modal */}
      {showVersions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2"><History size={20} className="text-orange-500"/> Version History</h3>
              <button onClick={() => setShowVersions(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 flex-1 min-h-0">
              {versions.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">
                  No versions saved yet. Generate an animation and click Save.
                </div>
              ) : (
                versions.map((v, i) => (
                  <div key={v.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-white mb-1">Version {versions.length - i}</div>
                        <div className="text-xs text-zinc-500">{new Date(v.timestamp).toLocaleString()} • {v.keyframes.length} Keyframes</div>
                      </div>
                      <button 
                        onClick={() => {
                          setPrompt(v.prompt);
                          setCode(v.code);
                          setKeyframes(v.keyframes);
                          setRefreshKey(prev => prev + 1);
                          setShowVersions(false);
                          setIsPlaying(true);
                        }}
                        className="px-3 py-1.5 bg-[#222] hover:bg-orange-500 hover:text-white text-zinc-300 rounded text-xs font-medium transition-colors border border-[#333] hover:border-orange-500"
                      >
                        Restore
                      </button>
                    </div>
                    <div className="text-xs text-zinc-400 truncate bg-[#111] p-2 rounded border border-[#222]">
                      Prompt: {v.prompt || '(Used Keyframes)'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
