import React, { useState, useEffect } from 'react';
import { Box, Play, Pause, Loader2, Save, Download, Rotate3D, Cuboid as Cube, Database as Cylinder, Circle as Sphere, Camera, Sun } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Canvas } from '@react-three/fiber';
import { Physics, useBox, useSphere, useCylinder, usePlane } from '@react-three/cannon';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Component3D {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  z: number;
  color: string;
}

function PhysicalCube({ position, color }: { position: [number, number, number], color: string }) {
  const [ref] = useBox(() => ({ mass: 1, position, args: [1, 1, 1] }));
  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

function PhysicalSphere({ position, color }: { position: [number, number, number], color: string }) {
  const [ref] = useSphere(() => ({ mass: 1, position, args: [0.6] }));
  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

function PhysicalCylinder({ position, color }: { position: [number, number, number], color: string }) {
  const [ref] = useCylinder(() => ({ mass: 1, position, args: [0.5, 0.5, 1, 32] }));
  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

function Ground() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, -3, 0] }));
  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#222" roughness={1} />
    </mesh>
  );
}

function SceneObjects({ components, isPlaying }: { components: Component3D[], isPlaying: boolean }) {
  // If we change isPlaying from false to true, we might want to remount the physics? 
  // Let's just always render them. To "reset", the user needs to re-generate.
  // But we can reset by keying the physics wrapper.
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} />
      <Ground />
      {components.map((c) => {
        const pos: [number, number, number] = [c.x, c.y + 5, c.z]; // +5 so they fall
        if (c.type === 'sphere') {
          return <PhysicalSphere key={c.id} position={pos} color={c.color} />;
        } else if (c.type === 'cylinder') {
          return <PhysicalCylinder key={c.id} position={pos} color={c.color} />;
        } else {
          return <PhysicalCube key={c.id} position={pos} color={c.color} />;
        }
      })}
    </>
  );
}

export function Animation3DStudio() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [components, setComponents] = useState<Component3D[]>([]);
  const [selectedRenderer, setSelectedRenderer] = useState('webgl');
  const [sceneKey, setSceneKey] = useState(0);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a 3D scene arrangement generator. Based on the user's prompt, generate an array of 5 to 10 abstract 3D components (cubes, spheres, or cylinders) to represent the scene.
        Respond ONLY with a valid JSON array where each object has these fields:
        - "id": string (unique)
        - "type": "cube" | "sphere" | "cylinder"
        - "name": string (descriptive name)
        - "x": number (from -4 to 4)
        - "y": number (from -2 to 4)
        - "z": number (from -4 to 4)
        - "color": string (a vivid hex color that fits the prompt)
        
        User prompt: "${prompt}"`,
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const text = response.text;
      if (text) {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const generatedComponents = JSON.parse(cleanedText);
        setComponents(generatedComponents);
        setIsPlaying(true);
        setSceneKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('3D scene generation error:', error);
      alert('Failed to generate 3D scene.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSimulation = () => {
    setSceneKey(prev => prev + 1);
    setIsPlaying(true);
  };

  const handleDragStart = (e: React.DragEvent, item: string) => {
    e.dataTransfer.setData('text/plain', `[Add 3D node: ${item}]`);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <header className="px-4 md:px-8 py-4 md:py-6 border-b border-[#222] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Box className="text-orange-500" />
            3D Animation Studio
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm mt-1">Design and animate 3D scenes with generative AI and physics</p>
        </div>
        <div className="flex gap-2 self-end md:self-auto">
          <button 
            onClick={() => alert('3D Scene saved!')}
            className="px-4 py-2 bg-[#111] hover:bg-[#222] border border-[#333] text-zinc-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Save size={16} /> Save Scene
          </button>
          <button 
            onClick={() => alert('Exporting as GLTF...')}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4">
        {/* Left Panel - Controls & Prompts */}
        <div className="border-r border-[#222] bg-[#111]/50 p-4 flex flex-col gap-6 overflow-y-auto hidden lg:flex">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">Scene Description</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., A pile of colorful toys dropping, a bunch of shiny metal balls falling..."
              className="w-full h-32 bg-[#111] border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 resize-none text-white"
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 border border-orange-400/30"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Box size={16} />}
              Generate 3D Physics Scene
            </button>
          </div>

          <div>
           <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">Library Assets</label>
           <div className="grid grid-cols-2 gap-2">
             {[
               { id: 'cube', name: 'Cube', icon: Cube },
               { id: 'sphere', name: 'Sphere', icon: Sphere },
               { id: 'cylinder', name: 'Cylinder', icon: Cylinder },
               { id: 'camera', name: 'Camera', icon: Camera },
               { id: 'light', name: 'Point Light', icon: Sun },
             ].map(asset => {
               const Icon = asset.icon;
               return (
                 <div 
                   key={asset.id}
                   draggable
                   onDragStart={(e) => handleDragStart(e, asset.name)}
                   className="bg-[#1a1a1a] border border-[#333] hover:border-orange-500/50 p-3 rounded-lg cursor-grab active:cursor-grabbing text-center transition-colors group flex flex-col items-center"
                 >
                   <Icon size={20} className="text-zinc-400 group-hover:text-orange-500 mb-2 transition-colors" />
                   <span className="text-xs text-zinc-300">{asset.name}</span>
                 </div>
               );
             })}
           </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">Renderer</label>
            <select 
              value={selectedRenderer}
              onChange={(e) => setSelectedRenderer(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50"
            >
              <option value="webgl">WebGL (Fast)</option>
              <option value="raytrace">Raytraced (High Quality)</option>
              <option value="wireframe">Wireframe</option>
            </select>
          </div>
        </div>

        {/* Center - 3D Viewport & Timeline */}
        <div className="lg:col-span-3 flex flex-col bg-[#0a0a0a]">
          {/* Viewport */}
          <div className="flex-1 relative m-4 border border-[#333] rounded-xl bg-[#151515] overflow-hidden flex flex-col">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <span className="bg-black/50 backdrop-blur-sm text-zinc-400 px-2 py-1 rounded text-[10px] font-mono border border-[#333]">
                Perspective
              </span>
              <span className="bg-black/50 backdrop-blur-sm text-zinc-400 px-2 py-1 rounded text-[10px] font-mono border border-[#333]">
                Shaded / Physics
              </span>
            </div>
            
            <div className="flex-1 w-full h-full relative cursor-move">
              {isLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm text-orange-500">
                  <Rotate3D size={48} className="animate-spin mb-4" style={{ animationDuration: '3s' }} />
                  <span className="text-sm font-medium animate-pulse">Building Scene & Physics...</span>
                </div>
              )}
              
              {components.length > 0 ? (
                <Canvas shadows camera={{ position: [0, 8, 12], fov: 50 }}>
                  <Physics key={sceneKey} gravity={[0, -9.81, 0]}>
                    <SceneObjects components={components} isPlaying={isPlaying} />
                  </Physics>
                </Canvas>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-zinc-600 flex flex-col items-center">
                    <Box size={64} className="mb-4 opacity-20" />
                    <p>Generate a scene to see physics in action</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-14 border-t border-[#333] bg-[#0a0a0a] flex items-center justify-center gap-4 z-10">
              <button 
                onClick={resetSimulation}
                className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                disabled={components.length === 0}
                title="Restart simulation"
              >
                <Rotate3D size={18} className="fill-white" />
              </button>
            </div>
          </div>

          {/* 3D Timeline (Simplified) */}
          <div className="h-48 border-t border-[#222] bg-[#111] m-4 mt-0 rounded-xl overflow-hidden flex flex-col">
            <div className="h-8 border-b border-[#222] bg-[#1a1a1a] flex items-center px-4 text-xs text-zinc-500 font-medium">
              Physics Elements
            </div>
            <div className="flex-1 overflow-y-auto">
               <div className="grid grid-cols-[150px_1fr] divide-x divide-[#222]">
                 <div className="flex flex-col py-2">
                   {components.length > 0 ? components.map((comp) => (
                     <div key={comp.id} className="h-10 px-3 flex items-center text-xs text-zinc-400 capitalize whitespace-nowrap overflow-hidden text-ellipsis">
                       {comp.name || comp.type}
                     </div>
                   )) : (
                     <div className="h-10 px-3 flex items-center text-xs text-zinc-600">
                       No objects
                     </div>
                   )}
                 </div>
                 <div className="relative bg-[#0a0a0a] bg-[linear-gradient(to_right,#222_1px,transparent_1px)] bg-[size:40px_100%] overflow-hidden flex items-center px-4">
                    {components.length > 0 && <span className="text-zinc-600 text-xs italic">Physics simulated automatically</span>}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
