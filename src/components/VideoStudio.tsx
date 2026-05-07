import React, { useState } from 'react';
import { Film, Wand2, Upload, Download, Loader2, Play, Pause, Save, Layout } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Tab = 'generate' | 'edit';

export function VideoStudio() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [createdVideo, setCreatedVideo] = useState(false);
  const [videoScript, setVideoScript] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following user prompt for a cinematic video clip: "${prompt}", generate a brief director's note or visual description of the scene that would be rendered. Provide a short paragraph.`,
      });
      
      const text = response.text;
      if (text) {
        setVideoScript(text);
        setCreatedVideo(true);
      }
    } catch (error) {
      console.error('Video generation error:', error);
      alert('Failed to generate video metadata.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <header className="px-4 md:px-8 py-4 md:py-6 border-b border-[#222] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">Cinematic Clip Studio</h2>
          <p className="text-zinc-400 text-xs md:text-sm mt-1">Generate stunning short videos from text prompts</p>
        </div>
        <div className="flex gap-2 self-end md:self-auto">
          <button 
            onClick={() => alert('Video saved!')}
            className="px-4 py-2 bg-[#111] hover:bg-[#222] border border-[#333] text-zinc-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Save size={16} /> Save
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-8">
            <div className="flex bg-[#111] p-1 rounded-lg border border-[#222]">
              {[
                { id: 'generate', label: 'Create', icon: <Film size={16} /> },
                { id: 'edit', label: 'Edit & Effects', icon: <Wand2 size={16} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${
                    activeTab === tab.id ? 'bg-[#222] text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300">Cinematic Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Drone shot flying over a futuristic neon city at night, 4k cinematic grading..."
                className="w-full h-32 bg-[#111] border border-[#333] rounded-xl p-4 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 resize-none text-white"
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 border border-orange-400/30"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />}
                Generate Clip (5s)
              </button>
            </div>
            
            <div className="space-y-3">
               <label className="text-sm font-medium text-zinc-300">Style / Camera Flow</label>
               <select className="w-full bg-[#111] border border-[#333] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50">
                  <option>Drone Shot (Aerial)</option>
                  <option>Pan Right (Slow)</option>
                  <option>Zoom In (Dramatic)</option>
                  <option>Handheld (Shaky)</option>
               </select>
            </div>
               
             <div className="space-y-3">
               <label className="text-sm font-medium text-zinc-300">Aspect Ratio</label>
               <div className="grid grid-cols-2 gap-2">
                 <button 
                   onClick={() => setAspectRatio('16:9')}
                   className={`${aspectRatio === '16:9' ? 'bg-[#222] border-orange-500 text-white' : 'bg-[#111] border-[#333] hover:border-zinc-500 text-zinc-300'} border rounded-lg py-2 text-xs flex flex-col items-center justify-center gap-1 transition-colors`}
                 >
                   <Layout size={16} className="rotate-90" />
                   16:9 Landscape
                 </button>
                 <button 
                   onClick={() => setAspectRatio('9:16')}
                   className={`${aspectRatio === '9:16' ? 'bg-[#222] border-orange-500 text-white' : 'bg-[#111] border-[#333] hover:border-zinc-500 text-zinc-300'} border rounded-lg py-2 text-xs flex flex-col items-center justify-center gap-1 transition-colors`}
                 >
                   <Layout size={16} />
                   9:16 Vertical
                 </button>
               </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col items-center justify-center min-h-[500px] bg-[#111] border border-[#222] rounded-2xl p-4 relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <Loader2 size={32} className="text-orange-500 animate-spin mb-4" />
                <p className="text-sm text-zinc-300 font-medium animate-pulse">Rendering video frames...</p>
              </div>
            )}
            
            {createdVideo ? (
              <div className="w-full flex flex-col items-center justify-center h-full">
                <div className={`relative rounded-xl overflow-hidden bg-black border border-[#333] shadow-2xl flex items-center justify-center group ${aspectRatio === '16:9' ? 'w-full aspect-video' : 'h-[450px] aspect-[9/16]'}`}>
                   {/* Fake Video Box */}
                 <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80')] bg-cover bg-center" />
                 
                 {isPlaying && (
                   <motion.div 
                     className="absolute inset-0 bg-white/10" 
                     animate={{ opacity: [0, 0.1, 0, 0.05, 0] }}
                     transition={{ duration: 2, repeat: Infinity }}
                   />
                 )}
                 
                 <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity opacity-0 group-hover:opacity-100">
                   <div className="flex items-center justify-between">
                     <button 
                       onClick={() => setIsPlaying(!isPlaying)}
                       className="text-white hover:text-orange-400 transition-colors"
                     >
                       {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                     </button>
                     <div className="flex-1 mx-4 h-1 bg-[#333] rounded-full overflow-hidden relative">
                       <motion.div 
                         className="absolute inset-y-0 left-0 bg-orange-500"
                         animate={isPlaying ? { width: '100%' } : { width: '0%' }}
                         transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                       />
                     </div>
                     <button 
                       onClick={() => alert('Downloading video clip...')}
                       className="text-white hover:text-orange-400 transition-colors" title="Download">
                       <Download size={20} />
                     </button>
                   </div>
                 </div>
                 
                 {!isPlaying && (
                   <button 
                     onClick={() => setIsPlaying(true)}
                     className="w-16 h-16 bg-orange-500/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform relative z-10 pl-1 shadow-lg shadow-black/50"
                   >
                     <Play size={32} fill="currentColor" />
                   </button>
                 )}
              </div>
              {videoScript && (
                <div className="w-full mt-4 bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
                  <h3 className="text-white text-sm font-semibold mb-2">Director's Notes</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">{videoScript}</p>
                </div>
              )}
            </div>
            ) : (
              <div className="text-center text-zinc-500 flex flex-col items-center">
                <Film size={48} className="mb-4 opacity-20" />
                <p>Your cinematic video will appear here</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
