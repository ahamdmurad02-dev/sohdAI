import React, { useState } from 'react';
import { Gamepad2, Code2, Play, Box, Layers, Settings, Loader2, RefreshCw, Globe, X, Music, Maximize2, Eye, Library, Skull, Image as ImageIcon, Volume2, Save, Upload, History } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Version {
  id: string;
  timestamp: number;
  prompt: string;
  code: string;
  dimension: '2D' | '3D';
}

export function GameStudio() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [gameDimension, setGameDimension] = useState<'2D' | '3D'>('3D');
  const [showSettings, setShowSettings] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [enableMusic, setEnableMusic] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview');
  const [leftTab, setLeftTab] = useState<'hierarchy' | 'assets'>('hierarchy');

  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  const handleSaveVersion = () => {
    if (!code) {
      alert('Please generate a game before saving a version!');
      return;
    }
    const newVersion: Version = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt,
      code,
      dimension: gameDimension
    };
    setVersions(prev => [newVersion, ...prev]);
    alert('Game saved to version history!');
  };

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
        ? `Generate a simple 3D game using Three.js based on this description: ${prompt}. Provide ONLY the HTML/JS code in a single file structure that can be run in an iframe. Do not include markdown formatting like \`\`\`html, just the raw code.`
        : `Generate a simple 2D game using HTML5 Canvas and JavaScript based on this description: ${prompt}. Provide ONLY the HTML/JS code in a single file structure that can be run in an iframe. Do not include markdown formatting like \`\`\`html, just the raw code.`;

      systemPrompt += `\n\nCRITICAL: For any requested sound effects or music [Use Asset: ...] or [Use Uploaded Sound: ...], you must synthesize those sounds using Web Audio API for those associated game interactions and events (like jump, explosion, coin collect, or hovering). If it is a background music asset, synthesize a continuous loop.`;

      if (enableMusic) {
        systemPrompt += `\n\nCRITICAL: You MUST include background music in this game. Use the Web Audio API (AudioContext) to synthesize a simple, looping chiptune or background melody that plays automatically when the user interacts with the game (e.g., on first click or keypress to bypass browser autoplay policies).`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: systemPrompt,
      });
      
      let generatedCode = response.text || '';
      // Clean up markdown if present
      if (generatedCode.startsWith('```html')) {
        generatedCode = generatedCode.replace(/```html\n?/, '').replace(/```$/, '');
      } else if (generatedCode.startsWith('```')) {
        generatedCode = generatedCode.replace(/```\w*\n?/, '').replace(/```$/, '');
      }
      
      setCode(generatedCode);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Game generation error:', error);
      alert('Failed to generate game code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <header className="px-4 md:px-8 py-4 md:py-6 border-b border-[#222] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Game Studio</h2>
          <p className="text-zinc-400 text-xs md:text-sm mt-1">Generate interactive 2D and 3D experiences with AI</p>
        </div>
        <div className="flex gap-2 self-end md:self-auto">
          <button 
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-[#111] border border-[#333] rounded-lg text-sm font-medium hover:bg-[#222] transition-colors flex items-center gap-2"
          >
            <Settings size={16} /> Settings
          </button>
          <button 
            onClick={() => setShowVersions(true)}
            className="px-4 py-2 bg-[#111] hover:bg-[#222] border border-[#333] text-zinc-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
            onClick={() => setShowPublish(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Globe size={16} /> Publish
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel - Prompt & Assets */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#222] bg-[#0f0f0f] flex flex-col shrink-0">
          <div className="p-6 border-b border-[#222]">
            <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-[#333] mb-4">
              <button
                onClick={() => setGameDimension('2D')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  gameDimension === '2D' ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                2D Game
              </button>
              <button
                onClick={() => setGameDimension('3D')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  gameDimension === '3D' ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                3D Game
              </button>
            </div>
            
            <label className="text-sm font-medium text-zinc-300 block mb-2">Game Concept</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              placeholder={gameDimension === '3D' 
                ? "e.g., A simple 3D platformer where you control a red cube jumping over obstacles... (Drag & Drop assets here)"
                : "e.g., A classic 2D snake game with a green snake and red apples... (Drag & Drop assets here)"
              }
              className="w-full h-32 bg-[#1a1a1a] border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 resize-none mb-3"
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Code2 size={16} />}
              Generate Code
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex border-b border-[#222]">
              <button 
                onClick={() => setLeftTab('hierarchy')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  leftTab === 'hierarchy' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Hierarchy
              </button>
              <button 
                onClick={() => setLeftTab('assets')}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                  leftTab === 'assets' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Library size={14} /> Assets
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {leftTab === 'hierarchy' ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-300 hover:bg-[#1a1a1a] rounded cursor-pointer">
                    <Box size={14} className="text-orange-500" /> Scene
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-400 hover:bg-[#1a1a1a] rounded cursor-pointer pl-6">
                    <Box size={14} /> Main Camera
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-400 hover:bg-[#1a1a1a] rounded cursor-pointer pl-6">
                    <Box size={14} /> Directional Light
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-400 hover:bg-[#1a1a1a] rounded cursor-pointer pl-6">
                    <Layers size={14} /> Environment
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 flex items-center justify-between">
                      Horror Pack <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded">NEW</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {horrorAssets.map((asset) => {
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
                      Background Music
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'bgm1', name: 'Chiptune Loop', type: 'Music', icon: Music },
                        { id: 'bgm2', name: 'Ambient Horror', type: 'Music', icon: Music },
                        { id: 'bgm3', name: 'Action Track', type: 'Music', icon: Music },
                        { id: 'bgm4', name: 'Puzzle Theme', type: 'Music', icon: Music },
                      ].map((asset) => {
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
                      Sound Effects
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'sfx1', name: 'Jump Sound', type: 'SFX', icon: Volume2 },
                        { id: 'sfx2', name: 'Coin Collect', type: 'SFX', icon: Volume2 },
                        { id: 'sfx3', name: 'Explosion', type: 'SFX', icon: Volume2 },
                        { id: 'sfx4', name: 'Game Over', type: 'SFX', icon: Volume2 },
                      ].map((asset) => {
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
                      <label className="text-[10px] text-zinc-500 block mb-2 uppercase tracking-wide font-medium">Upload Custom Sound</label>
                      <button 
                        onClick={() => document.getElementById('sound-upload')?.click()}
                        className="w-full py-4 rounded border border-dashed border-[#333] hover:border-orange-500/50 flex flex-col items-center justify-center text-zinc-500 hover:text-orange-500 transition-colors bg-[#1a1a1a] cursor-pointer"
                      >
                        <Upload size={16} className="mb-1" />
                        <span className="text-[10px]">Select Audio File</span>
                      </button>
                      <input 
                        type="file" 
                        id="sound-upload" 
                        accept="audio/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const fileName = e.target.files[0].name;
                            setPrompt(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + `[Use Uploaded Sound: ${fileName} for interaction] `);
                            alert(`Sound effect "${fileName}" added to instructions!`);
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

        {/* Right Panel - Preview */}
        <div className="flex-1 bg-[#111] relative flex flex-col">
          <div className="h-12 border-b border-[#222] flex items-center px-4 bg-[#0a0a0a] justify-between">
            <div className="flex items-center gap-2">
              <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-[#333] mr-2">
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    previewMode === 'preview' ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Eye size={14} /> Preview
                </button>
                <button
                  onClick={() => setPreviewMode('code')}
                  className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    previewMode === 'code' ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Code2 size={14} /> Code
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {code && (
                <>
                  <button 
                    onClick={() => setIsFullscreen(true)}
                    title="Fullscreen"
                    className="p-1.5 bg-[#1a1a1a] border border-[#333] text-zinc-300 rounded hover:bg-[#222] hover:text-white transition-colors flex items-center justify-center text-xs"
                  >
                    <Maximize2 size={14} />
                  </button>
                  <button 
                    onClick={handleReload}
                    title="Run Game"
                    className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 rounded-md transition-colors flex items-center gap-2 text-xs font-bold"
                  >
                    <Play size={14} className="fill-green-500" /> Run
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex-1 relative min-h-[50vh] md:min-h-0">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 size={32} className="text-orange-500 animate-spin mb-4" />
                <p className="text-sm text-zinc-400">Writing game code...</p>
              </div>
            ) : code ? (
              previewMode === 'code' ? (
                <div className="absolute inset-0 bg-[#1e1e1e] overflow-auto p-4 text-xs font-mono text-zinc-300">
                  <pre className="whitespace-pre-wrap">{code}</pre>
                </div>
              ) : (
                <iframe 
                  key={refreshKey}
                  srcDoc={code}
                  className="w-full h-full border-none bg-white"
                  title="Game Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                <Gamepad2 size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Describe a game to generate the 3D scene</p>
              </div>
            )}
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
                  No versions saved yet. Generate a game and click Save.
                </div>
              ) : (
                versions.map((v, i) => (
                  <div key={v.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-white mb-1">Version {versions.length - i}</div>
                        <div className="text-xs text-zinc-500">{new Date(v.timestamp).toLocaleString()} • {v.dimension} Game</div>
                      </div>
                      <button 
                        onClick={() => {
                          setPrompt(v.prompt);
                          setCode(v.code);
                          setGameDimension(v.dimension);
                          setRefreshKey(prev => prev + 1);
                          setShowVersions(false);
                        }}
                        className="px-3 py-1.5 bg-[#222] hover:bg-orange-500 hover:text-white text-zinc-300 rounded text-xs font-medium transition-colors border border-[#333] hover:border-orange-500"
                      >
                        Restore
                      </button>
                    </div>
                    <div className="text-xs text-zinc-400 truncate bg-[#111] p-2 rounded border border-[#222]">
                      Prompt: {v.prompt}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Publish Game</h3>
              <button onClick={() => setShowPublish(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 block mb-1">Game Title</label>
                <input 
                  type="text" 
                  placeholder="My Awesome Game" 
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500" 
                />
              </div>
              <button 
                onClick={() => { 
                  alert('Game published successfully!'); 
                  setShowPublish(false); 
                }} 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 font-medium transition-colors"
              >
                Publish to Web
              </button>
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
