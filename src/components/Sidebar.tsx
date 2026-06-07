import React, { useState } from 'react';
import { MessageSquare, Image as ImageIcon, Gamepad2, Film, Sparkles, LogIn, LogOut, Layout, Edit3 } from 'lucide-react';
import { Tool } from '../App';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logout } from '../firebase';
import { ProfileModal } from './ProfileModal';

interface SidebarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  user: User | null;
}

export function Sidebar({ activeTool, setActiveTool, user }: SidebarProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [, setForceRender] = useState(0);

  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Chat Assistant', icon: <MessageSquare size={20} /> },
    { id: 'image', label: 'Image Studio', icon: <ImageIcon size={20} /> },
    { id: 'game', label: 'Game Studio', icon: <Gamepad2 size={20} /> },
    { id: 'animation', label: 'Animation', icon: <Film size={20} /> },
    { id: 'webapp', label: 'Web App Studio', icon: <Layout size={20} /> },
    { id: 'marketplace', label: 'Marketplace', icon: <Sparkles size={20} /> },
  ];

  return (
    <aside className="w-64 bg-[#111111] border-r border-[#222] flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#ff7600] flex items-center justify-center">
          <Sparkles size={18} className="text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">sohdAI</h1>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto min-h-0">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-[#1a1a1a] border border-[#333] rounded-xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tool.icon}</span>
              <span className="relative z-10 font-medium text-sm">{tool.label}</span>
            </button>
          );
        })}
      </nav>


      <div className="p-4 border-t border-[#222] flex flex-col gap-4 shrink-0">
        {user ? (
          <div className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl border border-[#333] group relative">
            <div className="flex items-center gap-3 overflow-hidden">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{user.displayName || 'User'}</span>
                <span className="text-xs text-zinc-500 truncate">{user.email}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="text-zinc-500 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity" 
                title="Edit Profile"
              >
                <Edit3 size={16} />
              </button>
              <button onClick={logout} className="text-zinc-400 hover:text-white p-1" title="Log out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <LogIn size={16} />
            Log In with Google
          </button>
        )}
        <div className="flex flex-col gap-2 w-full mt-2">
          <a
            href="https://buy.stripe.com/test_8x2eVd1hT5hh28M2JPcMM00"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-500 rounded-xl py-2 text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
          >
            <Sparkles size={14} /> GameAI Hub Plus
          </a>
          <div className="text-xs text-zinc-500 text-center">
            sohdAI.com Studio v4.1
          </div>
        </div>
      </div>

      {isProfileModalOpen && user && (
        <ProfileModal 
          user={user} 
          onClose={() => setIsProfileModalOpen(false)} 
          onUpdate={() => setForceRender(prev => prev + 1)}
        />
      )}
    </aside>
  );
}
