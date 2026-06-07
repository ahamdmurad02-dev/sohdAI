import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Loader2, Camera } from 'lucide-react';
import { User, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

export function ProfileModal({ user, onClose, onUpdate }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const resizeAndSetImage = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    const MAX_SIZE = 256;
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      }
    } else {
      if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, width, height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPhotoURL(dataUrl);
    setIsUploading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => resizeAndSetImage(img);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Could not access camera. Please allow camera permissions.');
      setShowCamera(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      setIsUploading(true);
      const img = new Image();
      img.onload = () => resizeAndSetImage(img);
      img.src = dataUrl;
      stopCamera();
    }
  };

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    
    setIsSaving(true);
    try {
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        photoURL
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (showCamera) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl relative">
          <div className="flex justify-between items-center p-4 border-b border-[#222]">
            <h2 className="text-lg font-semibold text-white">Take Photo</h2>
            <button onClick={stopCamera} className="text-zinc-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="relative bg-black flex items-center justify-center w-full aspect-square">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>
          <div className="p-4 bg-[#151515] flex justify-center">
            <button 
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-zinc-400 hover:bg-zinc-200 transition-colors flex items-center justify-center"
              aria-label="Take photo"
            >
              <div className="w-12 h-12 rounded-full border-2 border-black/10" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-[#222]">
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-[#333] bg-[#222]">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-light text-zinc-500">
                  {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 size={24} className="text-white animate-spin" />
                ) : (
                  <>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                      title="Upload from device"
                    >
                      <Upload size={18} />
                    </button>
                    <button 
                      onClick={startCamera}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                      title="Take a photo"
                    >
                      <Camera size={18} />
                    </button>
                  </>
                )}
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <Upload size={14} /> Upload
              </button>
              <span className="text-zinc-600">•</span>
              <button 
                onClick={startCamera}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <Camera size={14} /> Camera
              </button>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Your name"
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-[#222] bg-[#151515] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || !displayName.trim()}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
