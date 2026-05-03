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
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export type Tool = 'chat' | 'image' | 'game' | 'animation' | 'webapp';

export default function App() {
  const [activeTool, setActiveTool] = useState<Tool>('chat');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} user={user} />
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {activeTool === 'chat' && <Chatbot />}
        {activeTool === 'image' && <ImageStudio />}
        {activeTool === 'game' && <GameStudio />}
        {activeTool === 'animation' && <AnimationStudio />}
        {activeTool === 'webapp' && <WebAppStudio />}
      </main>
    </div>
  );
}
