import { useState, useEffect } from 'react';
import { Layout, Code2, Loader2, RefreshCw, Monitor, Smartphone, Globe, X, Maximize2, Eye, Copy, Check, ExternalLink, Share2 } from 'lucide-react';
import Editor from "@monaco-editor/react";
import toast from 'react-hot-toast';

export function WebAppStudio() {
  const [prompt, setPrompt] = useState(() => {
    return localStorage.getItem('sohdAI_webapp_prompt') || '';
  });
  const [code, setCode] = useState<string | null>(() => {
    return localStorage.getItem('sohdAI_webapp_code') || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPublish, setShowPublish] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview');
  const [appName, setAppName] = useState('My Awesome Web App');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('sohdAI_webapp_prompt', prompt);
  }, [prompt]);

  useEffect(() => {
    if (code !== null) {
      localStorage.setItem('sohdAI_webapp_code', code);
    } else {
      localStorage.removeItem('sohdAI_webapp_code');
    }
  }, [code]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const systemPrompt = `Generate a fully functional, self-contained web application based on this description: ${prompt}. 
The app should be contained in a single HTML file with inline CSS and JavaScript. 
Make sure it has a modern, polished design and is responsive. 
Provide ONLY the raw HTML code. Do not include markdown formatting like \`\`\`html, just the raw code.`;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.5-flash',
          contents: systemPrompt,
        })
      });
      if (!res.ok) throw new Error('Failed to generate web app');
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
    } catch (error) {
      console.error('Web app generation error:', error);
      toast.error('Failed to generate web app code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <header className="pr-4 md:pr-8 pl-16 lg:px-8 py-4 md:py-6 border-b border-[#222] flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight truncate max-w-[150px] md:max-w-none">Web App Studio</h2>
          <p className="text-zinc-400 text-xs md:text-sm mt-1 hidden sm:block">Generate complete, single-file web applications instantly</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'desktop' ? 'bg-[#333] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Desktop View"
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'mobile' ? 'bg-[#333] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Mobile View"
            >
              <Smartphone size={16} />
            </button>
          </div>
          <button 
            onClick={() => setShowPublish(true)}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ml-2"
          >
            <Globe size={16} /> Publish
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row min-h-0 min-w-0">
        {/* Left Panel - Prompt */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#222] bg-[#0f0f0f] flex flex-col shrink-0 lg:h-full">
          <div className="p-4 lg:p-6 border-b border-[#222] flex flex-col justify-center shrink-0">
            <label className="text-sm font-medium text-zinc-300 block mb-2">App Concept</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A pomodoro timer with tasks..."
              className="w-full h-20 lg:h-40 bg-[#1a1a1a] border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 resize-none mb-4 shrink-0"
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
          <div className="hidden lg:flex flex-1 p-6 flex-col items-center justify-center text-zinc-600">
             <Layout size={48} className="mb-4 opacity-20" />
             <p className="text-sm text-center px-4">Describe the app's functionality and visual style to generate</p>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 bg-[#050505] relative flex flex-col min-h-[500px] min-w-0 p-4 md:p-8 lg:min-h-0">
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
          
          <div className={`mt-12 relative flex items-center justify-center w-full flex-1 min-h-0 transition-all duration-300`}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 size={32} className="text-orange-500 animate-spin mb-4" />
                <p className="text-sm text-zinc-400">Building your web app...</p>
              </div>
            ) : code ? (
              previewMode === 'code' ? (
                <div className="absolute inset-0 border border-[#333] border-t-0 border-l border-r border-b">
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
                    }}
                  />
                </div>
              ) : (
                <div 
                  className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 border border-[#333] ${
                    viewMode === 'mobile' ? 'w-[375px] max-w-full h-[812px] max-h-full aspect-[9/19]' : 'w-full h-full max-w-5xl'
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
              <div className="text-center text-zinc-600 h-full flex flex-col items-center justify-center">
                <Layout size={48} className="mb-4 opacity-20 mx-auto" />
                <p className="text-sm">Your web app preview will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Share2 size={18} className="text-orange-500" />
                Publish & Share App
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
                    <label className="text-xs text-zinc-400 block mb-1 font-medium">App Name</label>
                    <input 
                      type="text" 
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="My Awesome App" 
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1 font-medium">Platform Link Hosting</label>
                    <div className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 p-3 rounded-lg leading-relaxed">
                      This will package your single-file application into a custom web link. It can be opened and run on any browser instantly without hosting setups.
                    </div>
                  </div>
                  <button 
                    onClick={() => { 
                      if (!code) {
                        toast.error('Generate a web app first!');
                        return;
                      }
                      try {
                        const encoded = btoa(encodeURIComponent(code).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                          return String.fromCharCode(parseInt(p1, 16));
                        }));
                        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}&type=webapp&title=${encodeURIComponent(appName)}`;
                        setGeneratedLink(shareUrl);
                        toast.success('Live sharing link generated!');
                      } catch (err) {
                        toast.error('Failed to compile code into a link.');
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
                      <p className="text-xs font-bold text-white">Your App is Published Live!</p>
                      <p className="text-[11px] text-zinc-400">Anyone with this web link can load, run, and interact with your application immediately.</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 block">Copy Share Link</label>
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
                      <ExternalLink size={14} /> View Live App
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
    </div>
  );
}
