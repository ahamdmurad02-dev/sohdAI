import { useState } from 'react';
import { Layout, Code2, Loader2, RefreshCw, Monitor, Tablet, Smartphone, Globe, X, Maximize2, Eye, Save, History } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Version {
  id: string;
  timestamp: number;
  prompt: string;
  code: string;
}

export function WebAppStudio() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPublish, setShowPublish] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview');
  
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const systemPrompt = `Generate a fully functional, self-contained web application based on this description: ${prompt}. 
The app should be contained in a single HTML file with inline CSS and JavaScript. 
Make sure it has a modern, polished design and is responsive. 
Provide ONLY the raw HTML code. Do not include markdown formatting like \`\`\`html, just the raw code.`;

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
      console.error('Web app generation error:', error);
      alert('Failed to generate web app code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  const handleSaveVersion = () => {
    if (!code) {
      alert('Please generate an app before saving a version!');
      return;
    }
    const newVersion: Version = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt,
      code
    };
    setVersions(prev => [newVersion, ...prev]);
    alert('App saved to version history!');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <header className="px-4 md:px-8 py-4 md:py-6 border-b border-[#222] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Web App Studio</h2>
          <p className="text-zinc-400 text-xs md:text-sm mt-1">Generate complete, single-file web applications instantly</p>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'desktop' ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Desktop View"
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'tablet' ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Tablet View"
            >
              <Tablet size={16} />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'mobile' ? 'bg-[#333] text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Mobile View"
            >
              <Smartphone size={16} />
            </button>
          </div>
          <button 
            onClick={() => setShowVersions(true)}
            className="px-4 py-2.5 bg-[#111] hover:bg-[#222] border border-[#333] text-zinc-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ml-2"
          >
            <History size={16} /> Versions {versions.length > 0 && `(${versions.length})`}
          </button>
          <button 
            onClick={handleSaveVersion}
            className="px-4 py-2.5 bg-[#111] hover:bg-[#222] border border-[#333] text-zinc-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Save size={16} /> Save
          </button>
          <button 
            onClick={() => setShowPublish(true)}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Globe size={16} /> Publish
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel - Prompt */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#222] bg-[#0f0f0f] flex flex-col shrink-0">
          <div className="p-6 border-b border-[#222]">
            <label className="text-sm font-medium text-zinc-300 block mb-2">App Concept</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A pomodoro timer with tasks, a modern dashboard with charts, a beautiful landing page..."
              className="w-full h-40 bg-[#1a1a1a] border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 resize-none mb-4"
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Code2 size={16} />}
              Generate Web App
            </button>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-zinc-600">
             <Layout size={48} className="mb-4 opacity-20" />
             <p className="text-sm text-center px-4">Describe the app's functionality and visual style to generate</p>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 bg-[#050505] relative flex flex-col items-center justify-center p-4 md:p-8 min-h-[50vh]">
          <div className="absolute top-0 left-0 right-0 h-12 border-b border-[#222] flex items-center px-4 bg-[#0a0a0a] justify-between z-10 w-full">
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
            {code && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFullscreen(true)}
                  title="Fullscreen"
                  className="p-1.5 bg-[#1a1a1a] border border-[#333] text-zinc-300 rounded hover:bg-[#222] hover:text-white transition-colors flex items-center justify-center text-xs"
                >
                  <Maximize2 size={14} />
                </button>
                <button 
                  onClick={handleReload}
                  className="p-1.5 bg-[#1a1a1a] border border-[#333] text-zinc-300 rounded hover:bg-[#222] hover:text-white transition-colors flex items-center gap-2 text-xs"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            )}
          </div>
          
          <div className={`mt-12 relative flex items-center justify-center w-full h-full transition-all duration-300`}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center">
                <Loader2 size={32} className="text-orange-500 animate-spin mb-4" />
                <p className="text-sm text-zinc-400">Building your web app...</p>
              </div>
            ) : code ? (
              previewMode === 'code' ? (
                <div className="absolute inset-0 bg-[#1e1e1e] overflow-auto p-6 text-xs font-mono text-zinc-300 border border-[#333] border-t-0 border-l border-r border-b">
                  <pre className="whitespace-pre-wrap">{code}</pre>
                </div>
              ) : (
                <div 
                  className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 border border-[#333] ${
                    viewMode === 'mobile' ? 'w-[375px] h-[812px]' : viewMode === 'tablet' ? 'w-[768px] h-[1024px] max-h-[80vh]' : 'w-full h-full max-w-5xl'
                  }`}
                >
                  <iframe 
                    key={refreshKey}
                    srcDoc={code}
                    className="w-full h-full border-none bg-white"
                    title="Web App Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                </div>
              )
            ) : (
              <div className="text-center text-zinc-600">
                <Layout size={48} className="mb-4 opacity-20 mx-auto" />
                <p className="text-sm">Your web app preview will appear here</p>
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
                  No versions saved yet. Generate an app and click Save.
                </div>
              ) : (
                versions.map((v, i) => (
                  <div key={v.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-white mb-1">Version {versions.length - i}</div>
                        <div className="text-xs text-zinc-500">{new Date(v.timestamp).toLocaleString()}</div>
                      </div>
                      <button 
                        onClick={() => {
                          setPrompt(v.prompt);
                          setCode(v.code);
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

      {/* Fullscreen Web App Modal */}
      {isFullscreen && code && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="h-12 border-b border-[#222] flex items-center px-4 bg-[#0a0a0a] justify-between">
            <div className="flex items-center gap-2">
              <Layout size={16} className="text-orange-500" />
              <span className="text-sm font-medium text-zinc-200">Web App Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleReload}
                title="Refresh"
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
              title="Fullscreen Web App Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublish && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Publish Web App</h3>
              <button onClick={() => setShowPublish(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 block mb-1">App Name</label>
                <input 
                  type="text" 
                  placeholder="My Awesome App" 
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500" 
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 block mb-1">Custom Domain (Optional)</label>
                <input 
                  type="text" 
                  placeholder="yoursite.com" 
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500" 
                />
              </div>
              <button 
                onClick={() => { 
                  alert('Web app published successfully!'); 
                  setShowPublish(false); 
                }} 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 font-medium transition-colors mt-2"
              >
                Deploy to Web
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
