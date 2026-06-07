import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Plus, Volume2, SquareSquare, Download, Paperclip, X } from 'lucide-react';
import { motion } from 'motion/react';

const AnimatedAvatar = ({ role }: { role: 'user' | 'model' }) => {
  const [scale, setScale] = useState(1);
  const isModel = role === 'model';
  const bgColor = isModel ? '#f15401' : '#ffffff';
  const textColor = isModel ? 'text-white' : 'text-black';

  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: bgColor }}>
      <motion.div
        animate={{ scale }}
        transition={{ duration: 0.2 }}
        onClick={() => {
          setScale(0.85);
          setTimeout(() => setScale(1), 200);
        }}
        className="cursor-pointer flex items-center justify-center w-full h-full"
        style={{ backgroundColor: bgColor, borderRadius: '9999px' }}
      >
        {role === 'user' ? (
          <User size={20} className={textColor} style={{ backgroundColor: bgColor }} />
        ) : (
          <Bot size={20} className={textColor} style={{ backgroundColor: bgColor }} />
        )}
      </motion.div>
    </div>
  );
};

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  file?: {
    type: string;
    url: string;
    base64?: string;
  };
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Hello! I am your sohdAI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFileBase64, setSelectedFileBase64] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Cleanup speech synth on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setSelectedFileUrl(url);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedFileBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const initChat = () => {
    // Backend handles chat state now
  };

  useEffect(() => {
    initChat();
  }, []);

  const handleNewChat = () => {
    setMessages([{ id: Date.now().toString(), role: 'model', text: 'Hello! I am your sohdAI.com assistant. How can I help you today?' }]);
  };

  const handleSpeak = (text: string, msgId: string) => {
    if (isSpeaking === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);
    
    setIsSpeaking(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || isLoading) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(null);

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: input,
      file: selectedFile && selectedFileUrl ? {
        type: selectedFile.type,
        url: selectedFileUrl,
        base64: selectedFileBase64 || undefined
      } : undefined
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedFile(null);
    setSelectedFileUrl(null);
    setSelectedFileBase64(null);
    setIsLoading(true);

    try {
      let messageContent: any = input;
      
      if (userMsg.file?.base64) {
        messageContent = [
          { text: input || 'Describe this file.' },
          { inlineData: { data: userMsg.file.base64, mimeType: userMsg.file.type } }
        ];
      }

      // get recent history ignoring files for simplicity (backend does this in full scale)
      const history = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          history
        })
      });

      if (!res.ok) throw new Error('API Error');
      const response = await res.json();
      
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: response.text || '' }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: 'Sorry, I encountered an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <header className="pr-4 md:pr-8 pl-16 lg:px-8 py-4 md:py-6 border-b border-[#222] flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight truncate max-w-[150px] md:max-w-none">Chat Assistant</h2>
          <p className="text-zinc-400 text-xs md:text-sm mt-1 hidden sm:block">Chat with sohdAI.com for general help and brainstorming</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="px-4 py-2 bg-[#111] border border-[#333] rounded-lg text-sm font-medium hover:bg-[#222] transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <AnimatedAvatar role={msg.role} />
            <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed max-w-full overflow-hidden ${
                msg.role === 'user' 
                  ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm' 
                  : 'bg-[#111] border border-[#222] text-zinc-300 rounded-tl-sm'
              }`}>
                {msg.file && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-[#333]/50 max-w-sm bg-black">
                    {msg.file.type.startsWith('image/') ? (
                      <img src={msg.file.url} alt="Uploaded" className="w-full h-auto object-cover max-h-60" />
                    ) : msg.file.type.startsWith('video/') ? (
                      <video src={msg.file.url} controls className="w-full h-auto max-h-60" />
                    ) : (
                      <div className="p-3 bg-[#1a1a1a] flex items-center justify-center">
                        <Paperclip size={20} className="text-zinc-500" />
                        <span className="ml-2 text-zinc-300 text-xs truncate max-w-[200px]">Attached Document</span>
                      </div>
                    )}
                  </div>
                )}
                {msg.text}
              </div>
              {msg.role === 'model' && msg.text && (
                <button
                  onClick={() => handleSpeak(msg.text, msg.id)}
                  className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                    isSpeaking === msg.id ? 'text-orange-500 bg-orange-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a]'
                  }`}
                >
                  <Volume2 size={14} className={isSpeaking === msg.id ? 'animate-pulse' : ''} />
                  {isSpeaking === msg.id ? 'Stop Speaking' : 'Speak'}
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-3xl">
            <AnimatedAvatar role="model" />
            <div className="px-5 py-3.5 rounded-2xl bg-[#111] border border-[#222] text-zinc-300 rounded-tl-sm flex items-center">
              <Loader2 size={18} className="animate-spin text-orange-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-[#0a0a0a] border-t border-[#222]">
        <div className="max-w-3xl mx-auto relative flex flex-col gap-3">
          {selectedFileUrl && (
            <div className="relative self-start group">
              <div className="h-20 max-w-[200px] rounded-lg overflow-hidden border border-[#333] bg-[#111] object-cover flex items-center justify-center">
                {selectedFile?.type.startsWith('image/') ? (
                  <img src={selectedFileUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : selectedFile?.type.startsWith('video/') ? (
                   <video src={selectedFileUrl} className="h-full w-full object-cover" />
                ) : (
                  <Paperclip size={24} className="text-zinc-500" />
                )}
              </div>
              <button 
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedFileUrl(null);
                  setSelectedFileBase64(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md hover:bg-zinc-700"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="relative flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,text/*,application/pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-2 w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-[#222] rounded-full transition-colors z-10"
              title="Attach File"
            >
              <Paperclip size={18} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask sohdAI.com anything..."
              className="w-full bg-[#111] border border-[#333] rounded-full pl-14 pr-14 py-4 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedFile) || isLoading}
              className="absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-full disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors z-10"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
