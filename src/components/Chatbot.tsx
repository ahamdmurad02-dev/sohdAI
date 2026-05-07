import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Plus, Volume2, SquareSquare, Mic, MicOff } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'model', 
      text: 'مرحباً! أنا مساعد sohdAI الخاص بك (Chat Assistant).\nHello! I am your sohdAI Chat Assistant.\n\nيسعدني أن أقدم لك ميزاتنا الجديدة / I am happy to introduce our new features:\n• النماذج المتقدمة / Advanced Models\n• إنشاء متقدم للصور باستخدام Thinking / Advanced Image Generation using Thinking\n• وكيل كتابة الأكواد البرمجية Codex / Codex Coding Agent\n• المشروعات ونماذج GPT المخصصة / Projects and Custom GPTs\n\nكيف يمكنني مساعدتك اليوم؟ / How can I help you today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Cleanup speech synth on unmount
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ar-SA';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          alert('تعذر الوصول إلى الميكروفون. يرجى التأكد من منح الإذن للمتصفح. إذا كنت تستخدم التطبيق داخل نافذة مضمنة (iFrame)، يرجى فتح التطبيق في علامة تبويب جديدة.');
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in your browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const initChat = () => {
    chatRef.current = ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: "You are sohdAI, an advanced AI assistant (Chat Assistant) capable of helping with text, images, video, games, and animation. You have Advanced Models with high capacity, advanced image generation using Thinking, extended memory across different chats, Codex coding agent capabilities, expanded deep search, Projects, and Custom GPTs. You are helpful, creative, and concise. You can speak and respond in both Arabic and English based on the user's language or request.",
      }
    });
  };

  useEffect(() => {
    initChat();
  }, []);

  const handleNewChat = () => {
    setMessages([{ 
      id: Date.now().toString(), 
      role: 'model', 
      text: 'مرحباً! أنا مساعد sohdAI الخاص بك (Chat Assistant).\nHello! I am your sohdAI Chat Assistant.\n\nيسعدني أن أقدم لك ميزاتنا الجديدة / I am happy to introduce our new features:\n• النماذج المتقدمة / Advanced Models\n• إنشاء متقدم للصور باستخدام Thinking / Advanced Image Generation using Thinking\n• وكيل كتابة الأكواد البرمجية Codex / Codex Coding Agent\n• المشروعات ونماذج GPT المخصصة / Projects and Custom GPTs\n\nكيف يمكنني مساعدتك اليوم؟ / How can I help you today?' 
    }]);
    initChat();
  };

  const handleSpeak = (text: string, msgId: string) => {
    if (isSpeaking === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }
    
    window.speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);
    
    setIsSpeaking(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(null);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatRef.current) return;
      
      const response = await chatRef.current.sendMessageStream({ message: userMsg.text });
      
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '' }]);

      let fullText = '';
      for await (const chunk of response) {
        fullText += chunk.text;
        setMessages(prev => prev.map(msg => 
          msg.id === modelMsgId ? { ...msg, text: fullText } : msg
        ));
      }
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
      <header className="px-8 py-6 border-b border-[#222] flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Chat Assistant</h2>
          <p className="text-zinc-400 text-sm mt-1">Chat with sohdAI for general help and brainstorming</p>
        </div>
        <button
          onClick={handleNewChat}
          className="px-4 py-2 bg-[#111] border border-[#333] rounded-lg text-sm font-medium hover:bg-[#222] transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> New Chat
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-zinc-800' : 'bg-orange-500/20 text-orange-500'
            }`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm' 
                  : 'bg-[#111] border border-[#222] text-zinc-300 rounded-tl-sm'
              }`}>
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
            <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
              <Bot size={20} />
            </div>
            <div className="px-5 py-3.5 rounded-2xl bg-[#111] border border-[#222] text-zinc-300 rounded-tl-sm flex items-center">
              <Loader2 size={18} className="animate-spin text-orange-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-[#0a0a0a] border-t border-[#222]">
        <div className="max-w-3xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask sohdAI anything..."
            className="w-full bg-[#111] border border-[#333] rounded-full pl-6 pr-24 py-4 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
          />
          <div className="absolute right-2 top-2 bottom-2 flex gap-1">
            <button
              onClick={toggleListening}
              className={`w-10 flex items-center justify-center rounded-full transition-colors ${
                isListening ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#222]'
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-10 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-full disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
