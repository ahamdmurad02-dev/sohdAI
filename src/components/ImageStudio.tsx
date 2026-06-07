import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Wand2, Upload, Download, Loader2, Maximize, Palette, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

type Tab = 'generate' | 'edit' | 'upscale' | 'filters';

export function ImageStudio() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: prompt }],
          },
        })
      });
      if (!res.ok) throw new Error('API error');
      const response = await res.json();
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setImage(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!prompt.trim() || !sourceImage || isLoading) return;
    setIsLoading(true);
    try {
      const base64Data = sourceImage.split(',')[1];
      const mimeType = sourceImage.split(';')[0].split(':')[1];

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
              { text: prompt },
            ],
          },
        })
      });
      if (!res.ok) throw new Error('API error');
      const response = await res.json();

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setImage(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    } catch (error) {
      console.error('Image editing error:', error);
      toast.error('Failed to edit image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpscale = async () => {
    if (!sourceImage || isLoading) return;
    setIsLoading(true);
    // Simulate upscaling by running an edit prompt to enhance details
    try {
      const base64Data = sourceImage.split(',')[1];
      const mimeType = sourceImage.split(';')[0].split(':')[1];

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
              { text: "enhance details, upscale resolution, make it sharper and higher quality" },
            ],
          },
        })
      });
      if (!res.ok) throw new Error('API error');
      const response = await res.json();

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setImage(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    } catch (error) {
      console.error('Upscale error:', error);
      toast.error('Failed to upscale image.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = async (filterPrompt: string) => {
    if (!sourceImage || isLoading) return;
    setIsLoading(true);
    try {
      const base64Data = sourceImage.split(',')[1];
      const mimeType = sourceImage.split(';')[0].split(':')[1];

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
              { text: `apply a ${filterPrompt} filter, keep the original subject intact` },
            ],
          },
        })
      });
      if (!res.ok) throw new Error('API error');
      const response = await res.json();

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setImage(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    } catch (error) {
      console.error('Filter error:', error);
      toast.error('Failed to apply filter.');
    } finally {
      setIsLoading(false);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setSourceImage(reader.result as string);
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
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
      processFile(file);
    }
  };

  const handleDownload = (format: 'png' | 'jpeg', scale: number) => {
    if (!image) return;
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      if (format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL(`image/${format}`, 0.9);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `sohdAI-image-${img.width * scale}x${img.height * scale}.${format === 'jpeg' ? 'jpg' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.crossOrigin = 'anonymous';
    img.src = image;
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'generate', label: 'Generate', icon: <Wand2 size={16} /> },
    { id: 'edit', label: 'Edit', icon: <ImageIcon size={16} /> },
    { id: 'upscale', label: 'Upscale', icon: <Maximize size={16} /> },
    { id: 'filters', label: 'Filters', icon: <Palette size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <header className="pr-4 md:pr-8 py-4 md:py-6 border-b border-[#222] pl-16 md:px-8">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Image Studio</h2>
        <p className="text-zinc-400 text-xs md:text-sm mt-1">Generate, edit, upscale, and filter images with AI</p>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Controls Sidebar */}
          <div className="md:col-span-4 space-y-8">
            <div className="flex bg-[#111] p-1 rounded-lg border border-[#222]">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${
                    activeTab === tab.id ? 'bg-[#222] text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab !== 'generate' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Source Image</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-orange-500 bg-orange-500/10' 
                      : 'border-[#333] hover:border-orange-500/50 hover:bg-orange-500/5'
                  }`}
                >
                  <Upload size={24} className={isDragging ? 'text-orange-500' : 'text-zinc-500'} />
                  <div className="text-center">
                    <p className={`text-sm ${isDragging ? 'text-orange-400' : 'text-zinc-300'}`}>
                      {isDragging ? 'Drop image here' : 'Click or drag image to upload'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                {sourceImage && (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-[#333]">
                    <img src={sourceImage} alt="Source" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}

            {(activeTab === 'generate' || activeTab === 'edit') && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={activeTab === 'generate' ? "Describe the image you want to create..." : "Describe how you want to edit the image..."}
                  className="w-full h-32 bg-[#111] border border-[#333] rounded-xl p-4 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 resize-none"
                />
                <button
                  onClick={activeTab === 'generate' ? handleGenerate : handleEdit}
                  disabled={!prompt.trim() || isLoading || (activeTab === 'edit' && !sourceImage)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  {activeTab === 'generate' ? 'Generate Image' : 'Edit Image'}
                </button>
              </div>
            )}

            {activeTab === 'upscale' && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">Enhance the resolution and details of your image using AI upscaling.</p>
                <button
                  onClick={handleUpscale}
                  disabled={!sourceImage || isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Maximize size={16} />}
                  Upscale Image
                </button>
              </div>
            )}

            {activeTab === 'filters' && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400 mb-4">Apply artistic styles to your image.</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Watercolor', 'Cyberpunk', 'Oil Painting', 'Pencil Sketch', 'Anime', 'Pop Art'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => handleFilter(filter)}
                      disabled={!sourceImage || isLoading}
                      className="bg-[#111] border border-[#333] hover:border-orange-500/50 rounded-lg py-3 text-xs font-medium disabled:opacity-50 transition-colors"
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview Area */}
          <div className="md:col-span-8 flex flex-col items-center justify-center min-h-[500px] bg-[#111] border border-[#222] rounded-2xl p-4 relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <Loader2 size={32} className="text-orange-500 animate-spin mb-4" />
                <p className="text-sm text-zinc-300 font-medium animate-pulse">Processing image...</p>
              </div>
            )}
            
            {image ? (
              <div className="relative group w-full h-full flex items-center justify-center">
                <img 
                  src={image} 
                  alt="Generated" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                />
                <div className={`absolute top-4 right-4`}>
                  <div className="relative">
                    <button 
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2.5 text-white hover:bg-black/90 transition-all text-sm font-medium shadow-xl"
                    >
                      <Download size={16} />
                      Download Image
                      <ChevronDown size={14} />
                    </button>
                    
                    {showDownloadMenu && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl overflow-hidden z-20">
                        <div className="p-2 text-xs font-medium text-zinc-400 uppercase tracking-wider bg-[#111] border-b border-[#333]">Format & Size</div>
                        <button onClick={() => { handleDownload('png', 1); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-[#222] hover:text-white transition-colors">PNG (Original)</button>
                        <button onClick={() => { handleDownload('jpeg', 1); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-[#222] hover:text-white transition-colors border-b border-[#333]/50">JPG (Original)</button>
                        <button onClick={() => { handleDownload('png', 2); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-[#222] hover:text-white transition-colors">PNG (2x Enhance)</button>
                        <button onClick={() => { handleDownload('jpeg', 2); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-[#222] hover:text-white transition-colors">JPG (2x Enhance)</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-zinc-500 flex flex-col items-center">
                <ImageIcon size={48} className="mb-4 opacity-20" />
                <p>Your image will appear here</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
