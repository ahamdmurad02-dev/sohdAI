import React, { useState } from 'react';
import { Music, Wand2, Upload, Download, Loader2, Play, Pause, Save, Volume2, Mic } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Tab = 'generate' | 'edit' | 'voiceover';

export function AudioStudio() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [createdAudio, setCreatedAudio] = useState(false);
  const [generatedInfo, setGeneratedInfo] = useState<{ title: string; duration: string } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following user prompt for generating an audio track or voiceover: "${prompt}", generate a JSON object with two fields:
        - "title": A short, catchy title representing the audio.
        - "duration": A realistic duration string (like "0:30", "1:15", "2:00").
        Respond ONLY with a valid JSON object.`,
        config: { responseMimeType: "application/json" }
      });
      
      const text = response.text;
      if (text) {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const info = JSON.parse(cleanedText);
        setGeneratedInfo({ title: info.title, duration: info.duration });
        setCreatedAudio(true);
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      alert('Failed to generate audio metadata.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <header className="px-4 md:px-8 py-4 md:py-6 border-b border-[#222] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">Music & Audio Studio</h2>
          <p className="text-zinc-400 text-xs md:text-sm mt-1">Generate music, sound effects, and voiceovers</p>
        </div>
        <div className="flex gap-2 self-end md:self-auto">
          <button 
            onClick={() => alert('Audio saved!')}
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
                { id: 'generate', label: 'Music & SFX', icon: <Music size={16} /> },
                { id: 'voiceover', label: 'Voiceover', icon: <Mic size={16} /> },
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
              <label className="text-sm font-medium text-zinc-300">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeTab === 'generate' ? "E.g., An epic orchestral battle theme, 120 bpm..." : "Type text for AI voiceover..."}
                className="w-full h-32 bg-[#111] border border-[#333] rounded-xl p-4 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 resize-none text-white"
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 border border-orange-400/30"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                Generate Audio
              </button>
            </div>
            
            {activeTab === 'voiceover' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Voice Persona</label>
                <select className="w-full bg-[#111] border border-[#333] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50">
                  <option>Narrator (Deep, Calm)</option>
                  <option>Character (Energetic)</option>
                  <option>News Anchor (Professional)</option>
                </select>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 flex flex-col items-center justify-center min-h-[500px] bg-[#111] border border-[#222] rounded-2xl p-4 relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <Loader2 size={32} className="text-orange-500 animate-spin mb-4" />
                <p className="text-sm text-zinc-300 font-medium animate-pulse">Synthesizing audio...</p>
              </div>
            )}
            
            {createdAudio ? (
              <div className="w-full max-w-md bg-[#1a1a1a] rounded-2xl p-6 border border-[#333] shadow-2xl relative">
                <div className="absolute top-4 right-4">
                   <button 
                     onClick={() => alert('Downloading audio file...')}
                     className="text-zinc-400 hover:text-white transition-colors" title="Download"
                   >
                      <Download size={18} />
                   </button>
                </div>
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 mb-6">
                  <Music size={32} className="text-white" />
                </div>
                <div className="text-center mb-8">
                  <h3 className="text-white font-bold text-lg truncate">{generatedInfo ? generatedInfo.title : "Generated Audio"}</h3>
                  <p className="text-zinc-400 text-xs mt-1">Duration: {generatedInfo ? generatedInfo.duration : "0:30"}</p>
                </div>
                
                {/* Simulated waveform */}
                <div className="flex items-end justify-center gap-1 h-12 mb-6">
                  {Array.from({ length: 40 }).map((_, i) => (
                     <motion.div 
                        key={i}
                        className="w-1.5 bg-orange-500 rounded-full origin-bottom"
                        animate={isPlaying ? { height: ['20%', '80%', '40%', '100%', '30%'][i % 5] } : { height: '30%' }}
                        transition={{ repeat: Infinity, duration: 0.5 + (i % 3) * 0.2, ease: "easeInOut" }}
                     />
                  ))}
                </div>
                
                <div className="flex items-center justify-center gap-6">
                  <button className="text-zinc-400 hover:text-white transition-colors">
                    <Volume2 size={24} />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 hover:scale-105 transition-all shadow-lg shadow-orange-500/20"
                  >
                    {isPlaying ? <Pause size={24} className="fill-white" /> : <Play size={24} className="fill-white ml-1" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-zinc-500 flex flex-col items-center">
                <Volume2 size={48} className="mb-4 opacity-20" />
                <p>Your generated audio will appear here</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
