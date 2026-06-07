/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chatbot } from './components/Chatbot';
import { ImageStudio } from './components/ImageStudio';
import { GameStudio } from './components/GameStudio';
import { AnimationStudio } from './components/AnimationStudio';
import { WebAppStudio } from './components/WebAppStudio';
import { Auth } from './components/Auth';
import { Marketplace } from './components/Marketplace';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Menu, Loader2, Sparkles, Monitor, Smartphone } from 'lucide-react';

import { Toaster } from 'react-hot-toast';

export type Tool = 'chat' | 'image' | 'game' | 'animation' | 'webapp' | 'marketplace';

export default function App() {
  const [activeTool, setActiveTool] = useState<Tool>('chat');
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  const [shareData, setShareData] = useState<{
    code: string;
    type: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('share');
    if (codeParam) {
      try {
        const decoded = decodeURIComponent(Array.prototype.map.call(atob(codeParam), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        setShareData({
          code: decoded,
          type: params.get('type') || 'app',
          title: params.get('title') || 'Shared Creation'
        });
      } catch (err) {
        console.error('Failed to decode share data', err);
      }
    }
  }, []);

  if (shareData) {
    return (
      <div className="flex flex-col h-[100dvh] w-full bg-[#0a0a0a] text-white overflow-hidden font-sans">
        <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
        <header className="h-16 px-4 md:px-8 border-b border-[#222] bg-[#111] flex items-center justify-between shrink-0 relative z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ff7600] flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-none flex items-center gap-2">
                {shareData.title}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live {shareData.type === 'game' ? 'Game' : 'Web App'}
                </span>
              </span>
              <span className="text-[10px] text-zinc-500 mt-1">Host powered by sohdAI</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-[#333] hidden sm:flex">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'desktop' ? 'bg-[#333] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Desktop View"
              >
                <Monitor size={14} />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'mobile' ? 'bg-[#333] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Mobile View"
              >
                <Smartphone size={14} />
              </button>
            </div>

            <button 
              onClick={() => {
                window.location.href = window.location.origin + window.location.pathname;
              }}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer"
            >
              <Sparkles size={14} /> Create Your Own
            </button>
          </div>
        </header>

        <div className="flex-1 bg-[#050505] relative flex items-center justify-center p-4 min-h-0 min-w-0">
          <div 
            className={`bg-white rounded-lg overflow-hidden transition-all duration-300 border border-[#222] shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${
              viewMode === 'mobile' ? 'w-[375px] max-w-full h-full max-h-[720px] aspect-[9/19]' : 'w-full h-full'
            }`}
          >
            <iframe 
              srcDoc={shareData.code}
              className="w-full h-full border-none bg-white"
              title="Target App Launchpad"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        </div>
      </div>
    );
  }

  if (loadingAuth) {
    return (
      <div className="flex h-[100dvh] w-full bg-[#0a0a0a] items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Check email verification
  const isVerified = user.emailVerified || user.providerData.some(p => p.providerId === 'google.com');

  return (
    <div className="flex h-[100dvh] w-full bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`fixed lg:static top-0 bottom-0 left-0 z-50 transition-transform duration-300 w-64 flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar activeTool={activeTool} setActiveTool={(t) => { setActiveTool(t); setIsSidebarOpen(false); }} user={user} />
      </div>

      <main className="flex-1 relative overflow-hidden flex flex-col min-w-0 min-h-0">
        {!isVerified && (
          <div className="bg-orange-500/20 border-b border-orange-500/30 text-orange-400 p-3 flex justify-center items-center text-sm z-40 relative shrink-0">
            <span>Please check your inbox and verify your email address to access all features.</span>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
          {/* Mobile Header Menu Button */}
          <div className="lg:hidden absolute top-4 left-4 z-30">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2.5 bg-[#1a1a1a]/80 backdrop-blur-md rounded-xl border border-[#333] hover:bg-[#222] transition-colors"
            >
              <Menu size={20} className="text-white" />
            </button>
          </div>

          {activeTool === 'chat' && <Chatbot />}
          {activeTool === 'image' && <ImageStudio />}
          {activeTool === 'game' && <GameStudio />}
          {activeTool === 'animation' && <AnimationStudio />}
          {activeTool === 'webapp' && <WebAppStudio />}
          {activeTool === 'marketplace' && <Marketplace />}
        </div>
      </main>
    </div>
  );
}
