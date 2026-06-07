import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Search, Filter, Download, Star, Upload, TrendingUp, Sparkles, Box, FileText, Code, ChevronRight, Hash, Play, Grid, Share2, Check, X, Trash2, Archive, FileCode, Image as ImageIcon } from 'lucide-react';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  category: 'tools' | 'assets' | 'prompts' | 'templates';
  author: string;
  downloads: number;
  rating: number;
  reviews: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  image: string;
  fileName?: string;
  fileContent?: string;
  fileSize?: number;
}

const DUMMY_ITEMS: MarketplaceItem[] = [
  {
    id: '1',
    title: 'Horror Game Asset Pack',
    description: 'A complete collection of spooky 3D models and sound effects for your horror genre games.',
    category: 'assets',
    author: 'DarkArts Studio',
    downloads: 1245,
    rating: 4.8,
    reviews: 156,
    isFeatured: true,
    image: 'https://images.unsplash.com/photo-1542833278-f4c36d22c957?w=500&q=80',
  },
  {
    id: '2',
    title: 'Advanced AI Chat Prompts',
    description: 'Unlock the full potential of language models with this curated list of advanced prompts.',
    category: 'prompts',
    author: 'PromptMaster',
    downloads: 3400,
    rating: 4.9,
    reviews: 412,
    isTrending: true,
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&q=80',
  },
  {
    id: '3',
    title: 'Retro Platformer Template',
    description: 'Jumpstart your 2D platformer with this fully configured game template using React and Canvas.',
    category: 'templates',
    author: 'BitCoders',
    downloads: 856,
    rating: 4.6,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
  },
  {
    id: '4',
    title: 'Text-to-Video Engine',
    description: 'Custom AI tool wrapper for generating short video clips from text descriptions.',
    category: 'tools',
    author: 'SohdAI Labs',
    downloads: 5621,
    rating: 4.9,
    reviews: 892,
    isFeatured: true,
    isTrending: true,
    image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=500&q=80',
  },
  {
    id: '5',
    title: 'Neon UI Component Library',
    description: 'A glowing, cyberpunk-inspired UI library for your next futuristic web app.',
    category: 'templates',
    author: 'CyberDesign',
    downloads: 432,
    rating: 4.5,
    reviews: 45,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80',
  },
  {
    id: '6',
    title: 'Sci-Fi Weapon Sounds',
    description: 'High-quality laser shots, explosions, and spaceship engine sounds.',
    category: 'assets',
    author: 'AudioVisions',
    downloads: 2100,
    rating: 4.7,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1614917631776-65be797fc7fc?w=500&q=80',
  }
];

export function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'tools' | 'assets' | 'prompts' | 'templates'>('all');
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Persistence/State for Marketplace Items
  const [items, setItems] = useState<MarketplaceItem[]>(() => {
    try {
      const saved = localStorage.getItem('sohdai_marketplace_items');
      return saved ? JSON.parse(saved) : DUMMY_ITEMS;
    } catch {
      return DUMMY_ITEMS;
    }
  });

  useEffect(() => {
    localStorage.setItem('sohdai_marketplace_items', JSON.stringify(items));
  }, [items]);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'tools' | 'assets' | 'prompts' | 'templates'>('tools');
  const [newAuthor, setNewAuthor] = useState('You');
  const [newDescription, setNewDescription] = useState('');
  
  // File upload state for attachment
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: number;
    type: string;
    content: string; // base64 / text url
  } | null>(null);
  const [isDragOverFile, setIsDragOverFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload state for custom thumbnail image
  const [attachedImage, setAttachedImage] = useState<string | null>(null); 
  const [isDragOverImage, setIsDragOverImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleShare = (itemId: string) => {
    const url = `${window.location.origin}/marketplace/item/${itemId}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy', err);
    });
  };

  const categories = [
    { id: 'all', label: 'All Items', icon: Grid },
    { id: 'tools', label: 'AI Tools', icon: Sparkles },
    { id: 'assets', label: 'Game Assets', icon: Box },
    { id: 'prompts', label: 'Prompts', icon: FileText },
    { id: 'templates', label: 'Templates', icon: Code },
  ] as const;

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const trendingItems = items.filter(item => item.isTrending);
  const featuredItems = items.filter(item => item.isFeatured);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center text-yellow-500">
        <Star size={14} className="fill-current" />
        <span className="ml-1 text-sm font-medium text-white">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type || getFallbackFileType(file.name),
        content: reader.result as string,
      });
      toast.success(`File "${file.name}" attached successfully!`);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const getFallbackFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'zip' || ext === 'rar' || ext === 'gz' || ext === 'tar') return 'application/zip';
    if (ext === 'js' || ext === 'ts' || ext === 'tsx' || ext === 'html' || ext === 'css') return 'text/plain';
    if (ext === 'glb' || ext === 'gltf' || ext === 'obj' || ext === 'fbx') return 'model/gltf-binary';
    return 'application/octet-stream';
  };

  const handleDragOverFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverFile(true);
  };

  const handleDragLeaveFile = () => {
    setIsDragOverFile(false);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImage(e.target.files[0]);
    }
  };

  const processImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG/JPG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      toast.success('Preview image uploaded!');
    };
    reader.onerror = () => {
      toast.error('Failed to read image');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOverImage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverImage(true);
  };

  const handleDragLeaveImage = () => {
    setIsDragOverImage(false);
  };

  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewCategory('tools');
    setNewAuthor('You');
    setNewDescription('');
    setAttachedFile(null);
    setAttachedImage(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Please enter an item title');
      return;
    }
    if (!newDescription.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!attachedFile) {
      toast.error('Please upload a file (ZIP, model, or code file)');
      return;
    }

    let previewImage = attachedImage;
    if (!previewImage) {
      const fallbacks = {
        tools: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&q=80',
        assets: 'https://images.unsplash.com/photo-1542833278-f4c36d22c957?w=500&q=80',
        prompts: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
        templates: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80'
      };
      previewImage = fallbacks[newCategory];
    }

    const newItem: MarketplaceItem = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDescription,
      category: newCategory,
      author: newAuthor || 'You',
      downloads: 0,
      rating: 5.0,
      reviews: 0,
      image: previewImage,
      fileName: attachedFile.name,
      fileContent: attachedFile.content,
      fileSize: attachedFile.size,
    };

    setItems(prev => [newItem, ...prev]);
    toast.success('Successfully uploaded item to the marketplace!');
    setIsUploadModalOpen(false);
    resetForm();
  };

  const handleDownload = (item: MarketplaceItem) => {
    if (item.fileContent && item.fileName) {
      const link = document.createElement('a');
      link.href = item.fileContent;
      link.download = item.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded ${item.fileName}`);
    } else {
      const dummyContent = `Mock item content for ${item.title}`;
      const blob = new Blob([dummyContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.title.toLowerCase().replace(/\s+/g, '-')}-pack.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded asset pack!`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'zip' || ext === 'rar' || ext === 'gz' || ext === 'tar') {
      return <Archive className="text-amber-500 w-8 h-8 shrink-0" />;
    }
    if (ext === 'js' || ext === 'ts' || ext === 'tsx' || ext === 'html' || ext === 'css' || ext === 'json' || ext === 'py') {
      return <FileCode className="text-teal-400 w-8 h-8 shrink-0" />;
    }
    return <Box className="text-blue-500 w-8 h-8 shrink-0" />;
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="p-6 border-b border-[#222] bg-[#111] shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-orange-500" /> Marketplace
            </h1>
            <p className="text-zinc-400 mt-1">Discover tools, assets, and templates for your projects.</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="Search the marketplace..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Upload size={16} /> <span className="hidden sm:inline">Upload Item</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                  activeCategory === cat.id 
                    ? 'bg-white text-black' 
                    : 'bg-[#111] text-zinc-400 border border-[#333] hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <cat.icon size={16} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Featured Sections (Only show if searching all and no query) */}
          {activeCategory === 'all' && !searchQuery && (
            <div className="space-y-10 mb-10">
              {/* Featured */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Star className="text-orange-500" /> Featured Items
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredItems.map(item => <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}
                </div>
              </section>

              {/* Trending */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="text-pink-500" /> Trending Now
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingItems.map(item => <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}
                </div>
              </section>
            </div>
          )}

          {/* All/Filtered Items */}
          <section>
            <h2 className="text-xl font-bold mb-4">
              {activeCategory !== 'all' ? categories.find(c => c.id === activeCategory)?.label : searchQuery ? 'Search Results' : 'Browse All'}
            </h2>
            
            {filteredItems.length === 0 ? (
              <div className="text-center py-20 bg-[#111] rounded-2xl border border-[#333]">
                <Search size={48} className="mx-auto text-zinc-500 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No items found</h3>
                <p className="text-zinc-400">Try adjusting your search query or category filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                  <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex flex-col md:flex-row h-full overflow-auto">
              <div className="w-full md:w-1/2 p-6 bg-[#0a0a0a] flex flex-col justify-center items-center">
                <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-auto object-cover rounded-xl shadow-2xl animate-fade-in" />
              </div>
              <div className="w-full md:w-1/2 p-8 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-[#222] text-xs font-medium uppercase tracking-wider rounded text-zinc-300 mb-3">
                      {selectedItem.category}
                    </span>
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedItem.title}</h2>
                    <p className="text-zinc-400 font-medium">by {selectedItem.author}</p>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-[#222] rounded-lg transition-colors text-zinc-400">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="flex items-center gap-6 mb-6 pb-6 border-b border-[#222]">
                  {renderStars(selectedItem.rating)}
                  <span className="text-sm text-zinc-400">{selectedItem.reviews} reviews</span>
                  <span className="text-sm text-zinc-400 flex items-center gap-1">
                    <Download size={14} /> {selectedItem.downloads.toLocaleString()}
                  </span>
                </div>

                {selectedItem.fileName && (
                  <div className="p-3 bg-[#161616] border border-[#2b2b2b] rounded-xl flex items-center gap-3 mb-6">
                    {getFileIcon(selectedItem.fileName)}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Attachment</p>
                      <p className="text-sm font-semibold text-zinc-100 truncate">{selectedItem.fileName}</p>
                      {selectedItem.fileSize && (
                        <p className="text-xs text-zinc-400">{formatBytes(selectedItem.fileSize)}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="prose prose-invert mt-4 mb-8 flex-1 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
                  <h3 className="text-lg font-medium text-white mb-2">Description</h3>
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedItem.description}</p>
                </div>

                <div className="mt-auto pt-6 flex gap-3 shrink-0">
                  <button 
                    onClick={() => handleDownload(selectedItem)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2 animate-pulse hover:animate-none"
                  >
                    <Download size={18} /> Download Item
                  </button>
                  <button 
                    onClick={() => handleShare(selectedItem.id)}
                    className="flex-1 bg-[#222] hover:bg-[#333] border border-[#444] text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
                  >
                    {isCopied ? (
                      <>
                        <Check size={18} className="text-green-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Share2 size={18} /> Share
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal (ZIP, models, code files) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Upload className="text-orange-500 animate-pulse" /> Upload to Marketplace
                </h2>
                <button 
                  onClick={() => { setIsUploadModalOpen(false); resetForm(); }}
                  className="p-1.5 hover:bg-[#222] rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleFormSubmit} className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Item Title *</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#161616] border border-[#333] rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500 transition-colors" 
                    placeholder="e.g. Scary Zombie 3D Pack" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
                    <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-[#161616] border border-[#333] rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500 transition-colors"
                    >
                      <option value="tools">AI Tool</option>
                      <option value="assets">Game Asset</option>
                      <option value="prompts">Prompts</option>
                      <option value="templates">Template</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Creator Name</label>
                    <input 
                      type="text" 
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="w-full bg-[#161616] border border-[#333] rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500 transition-colors" 
                      placeholder="e.g. SohdAI Warrior" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Description *</label>
                  <textarea 
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-[#161616] border border-[#333] rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500 h-24 transition-colors resize-none" 
                    placeholder="Explain what the asset does, how to use it, or how it integrates..." 
                    required
                  ></textarea>
                </div>

                {/* Main Asset File Input with Drag and Drop support */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Package File *</label>
                  {!attachedFile ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOverFile}
                      onDragLeave={handleDragLeaveFile}
                      onDrop={handleDropFile}
                      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        isDragOverFile 
                          ? 'border-orange-500 bg-orange-500/10' 
                          : 'border-[#333] hover:border-orange-500/50 hover:bg-[#1a1a1a]'
                      }`}
                    >
                      <Upload size={32} className={`mb-2 ${isDragOverFile ? 'text-orange-500 animate-bounce' : 'text-zinc-500'}`} />
                      <p className="text-sm text-zinc-200 font-semibold">Click to upload files</p>
                      <p className="text-xs text-zinc-500 mt-1">Supports ZIP, models (.glb, .obj, .fbx), and code files (.js, .ts, .json)</p>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".zip,.rar,.tar,.gz,.obj,.gltf,.fbx,.glb,.json,.js,.tsx,.ts,.html,.css,.txt,.py"
                      />
                    </div>
                  ) : (
                    <div className="bg-[#151515] border border-[#333] rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {getFileIcon(attachedFile.name)}
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-white truncate">{attachedFile.name}</p>
                          <p className="text-xs text-zinc-400">{formatBytes(attachedFile.size)}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setAttachedFile(null)} 
                        className="p-1.5 bg-[#222] hover:bg-[#333] hover:text-red-400 rounded-lg transition-colors border border-[#333]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Optional Custom Cover/Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Preview Thumbnail (Optional)</label>
                  {!attachedImage ? (
                    <div 
                      onClick={() => imageInputRef.current?.click()}
                      onDragOver={handleDragOverImage}
                      onDragLeave={handleDragLeaveImage}
                      onDrop={handleDropImage}
                      className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        isDragOverImage 
                          ? 'border-orange-500 bg-orange-500/10' 
                          : 'border-[#333] hover:border-orange-500/50 hover:bg-[#1a1a1a]'
                      }`}
                    >
                      <ImageIcon size={24} className="text-zinc-500 mb-1" />
                      <p className="text-xs text-zinc-300 font-medium">Upload thumbnail (PNG/JPG)</p>
                      <input 
                        type="file" 
                        ref={imageInputRef} 
                        onChange={handleImageChange} 
                        className="hidden" 
                        accept="image/*"
                      />
                    </div>
                  ) : (
                    <div className="bg-[#151515] border border-[#333] rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img src={attachedImage} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-[#333]" />
                        <div>
                          <p className="text-xs font-semibold text-white">Custom thumbnail ready</p>
                          <p className="text-[10px] text-zinc-400">Will be featured on the card</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setAttachedImage(null)} 
                        className="p-1.5 bg-[#222] hover:bg-[#333] hover:text-red-400 rounded-lg transition-colors border border-[#333]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#222] shrink-0">
                  <button 
                    type="button"
                    onClick={() => { setIsUploadModalOpen(false); resetForm(); }} 
                    className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-[#222] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 transition-all shadow-[0_4px_12px_rgba(249,115,22,0.2)]"
                  >
                    <Check size={16} /> Submit & Publish
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

const ItemCard: React.FC<{ item: MarketplaceItem, onClick: () => void }> = ({ item, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-[#111] border border-[#333] rounded-2xl overflow-hidden hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all cursor-pointer group flex flex-col"
    >
      <div className="h-40 overflow-hidden relative">
        <img 
          src={item.image} 
          alt={item.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
           <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
            {item.category}
          </span>
          {item.isFeatured && (
            <span className="bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1">
              <Star size={10} className="fill-current" /> Featured
            </span>
          )}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-white mb-1 line-clamp-1">{item.title}</h3>
        <p className="text-zinc-400 text-xs mb-3">by {item.author}</p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#222]">
          <div className="flex items-center text-yellow-500">
            <Star size={12} className="fill-current" />
            <span className="ml-1 text-xs font-medium text-white">{item.rating.toFixed(1)}</span>
            <span className="ml-1 text-xs text-zinc-500">({item.reviews})</span>
          </div>
          <div className="flex items-center text-zinc-400 text-xs gap-1">
            <Download size={12} /> {item.downloads}
          </div>
        </div>
      </div>
    </div>
  );
}
