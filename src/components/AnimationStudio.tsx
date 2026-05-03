import React, { useState, useRef } from 'react';
import { Film, Play, Pause, SkipBack, SkipForward, Layers, Settings, Wand2, Loader2, RefreshCw, Upload, X, ChevronDown, Download, Youtube, Instagram, Twitter, Facebook, Smartphone, Diamond, User, Sparkles, Camera, Image as ImageIcon, Library } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Keyframe {
  id: string;
  time: number; // 0 to 100 percentage
  prompt: string;
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
  const timelineRef = useRef<HTMLDivElement>(null);

  const animationAssets = [
    { id: 'a1', name: 'Hero Character', type: 'Sprite', icon: User },
    { id: 'a2', name: 'Villain Character', type: 'Sprite', icon: User },
    { id: 'a3', name: 'Sci-Fi Background', type: 'Background', icon: ImageIcon },
    { id: 'a4', name: 'Explosion VFX', type: 'Effect', icon: Sparkles },
    { id: 'a5', name: 'Cinematic Camera', type: 'Camera', icon: Camera },
  ];

  const handleDragStart = (e: React.DragEvent, assetName: string) => {
    e.dataTransfer.setData('text/plain', `[Use Asset: ${assetName}]`);
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

  const handleReload = () => {
    setRefreshKey(prev => prev + 1);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <header className="px-8 py-6 border-b border-[#222] flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Animation Studio</h2>
          <p className="text-zinc-400 text-sm mt-1">Create and edit animations with AI assistance</p>
        </div>
        <div className="flex gap-2 relative">
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
        <div className="flex-1 flex min-h-0">
          {/* Main Preview */}
          <div 
            className={`flex-1 relative flex items-center justify-center border-r border-[#222] transition-colors ${isDragging ? 'bg-orange-500/10 border-orange-500' : 'bg-[#111]'}`}
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
          <div className="w-72 bg-[#0f0f0f] flex flex-col border-l border-[#222]">
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
                <div className="p-4 space-y-4">
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
          <div className="flex-1 flex overflow-hidden">
            {/* Track Headers */}
            <div className="w-48 border-r border-[#222] bg-[#151515] flex flex-col">
              <div className="h-8 border-b border-[#222] flex items-center px-3 text-xs text-zinc-500">
                Tracks
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="h-10 border-b border-[#222] flex items-center px-3 gap-2 bg-[#1a1a1a]">
                  <Layers size={14} className="text-orange-500" />
                  <span className="text-xs text-zinc-300">Generated Animation</span>
                </div>
                <div className="h-10 border-b border-[#222] flex items-center px-3 gap-2">
                  <Layers size={14} className="text-zinc-500" />
                  <span className="text-xs text-zinc-400">Background</span>
                </div>
                <div className="h-10 border-b border-[#222] flex items-center px-3 gap-2">
                  <Layers size={14} className="text-zinc-500" />
                  <span className="text-xs text-zinc-400">Camera</span>
                </div>
              </div>
            </div>

            {/* Track Content */}
            <div className="flex-1 bg-[#0a0a0a] relative overflow-hidden">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
