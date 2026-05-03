import React from 'react';
import { MessageSquare, Image as ImageIcon, Gamepad2, Film, Sparkles, LogIn, LogOut, Layout } from 'lucide-react';
import { Tool } from '../App';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logout } from '../firebase';

interface SidebarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  user: User | null;
}

export function Sidebar({ activeTool, setActiveTool, user }: SidebarProps) {
  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Chat Assistant', icon: <MessageSquare size={20} /> },
    { id: 'image', label: 'Image Studio', icon: <ImageIcon size={20} /> },
    { id: 'game', label: 'Game Studio', icon: <Gamepad2 size={20} /> },
    { id: 'animation', label: 'Animation', icon: <Film size={20} /> },
    { id: 'webapp', label: 'Web App Studio', icon: <Layout size={20} /> },
  ];

  return (
    <aside className="w-64 bg-[#111111] border-r border-[#222] flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <Sparkles size={18} className="text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">sohdAI</h1>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-2">
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

      <div className="px-4 pb-4">
        <div className="bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-500/20 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group cursor-pointer hover:border-orange-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-600/20 blur-xl rounded-full group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-orange-500" />
              <span className="text-sm font-semibold text-white">sohdAI Plus</span>
            </div>
            <span className="text-xs font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">$10/mo</span>
          </div>
          <p className="text-xs text-zinc-400">Upgrade for faster generation and 4K exports.</p>
        </div>
      </div>

      <div className="p-4 border-t border-[#222] flex flex-col gap-4">
        {user ? (
          <div className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl border border-[#333]">
            <div className="flex items-center gap-3 overflow-hidden">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Avatar" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{user.displayName || 'User'}</span>
                <span className="text-xs text-zinc-500 truncate">{user.email}</span>
              </div>
            </div>
            <button onClick={logout} className="text-zinc-400 hover:text-white p-1" title="Log out">
              <LogOut size={16} />
            </button>
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
        <div className="text-xs text-zinc-500 text-center">
          sohdAI Studio v1.0
        </div>
      </div>
    </aside>
  );
}
