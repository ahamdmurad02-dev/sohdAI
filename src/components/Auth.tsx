import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth, loginWithGoogle } from '../firebase';
import { Mail, Lock, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

type AuthMode = 'login' | 'register' | 'forgot_password';

export function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      if (mode === 'login') {
        if (!password) throw new Error('Password is required');
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'register') {
        if (!password) throw new Error('Password is required');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setMessage('Registration successful! Please check your email to verify your account.');
      } else if (mode === 'forgot_password') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      // Clean up Firebase error messages
      const msg = err.message || 'Authentication error';
      setError(msg.replace('Firebase: ', '').replace(/\(auth.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111] border border-[#222] rounded-3xl p-8 relative z-10 shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <div className="bg-orange-500 text-white p-3 rounded-2xl shadow-lg shadow-orange-500/20">
            <RefreshCw size={32} className="animate-spin-slow" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2 tracking-tight">
          {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create an account' : 'Reset password'}
        </h2>
        <p className="text-zinc-400 text-center text-sm mb-8">
          {mode === 'login' ? 'Log in to your sohdAI.com account' : 
           mode === 'register' ? 'Sign up to start building' : 
           'Enter your email to reset your password'}
        </p>

        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {message && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 pl-1 uppercase tracking-wider">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-zinc-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          
          {mode !== 'forgot_password' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => setMode('forgot_password')}
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-colors"
                  placeholder="••••••••"
                  required={mode !== 'forgot_password'}
                  minLength={6}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-3 rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center space-x-4">
          <div className="h-px bg-[#333] flex-1"></div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Or continue with</span>
          <div className="h-px bg-[#333] flex-1"></div>
        </div>

        <button
          onClick={async () => {
            if (googleLoading) return;
            setError('');
            setGoogleLoading(true);
            try {
              await loginWithGoogle();
            } catch (err: any) {
               setError(err.message || 'Google sign-in failed');
            } finally {
              setGoogleLoading(false);
            }
          }}
          disabled={googleLoading}
          type="button"
          className="mt-6 w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-400 font-medium py-3 rounded-xl flex justify-center items-center gap-2 transition-colors"
        >
          {googleLoading ? (
            <Loader2 size={20} className="animate-spin text-black" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {googleLoading ? 'Signing in...' : 'Google'}
        </button>

        <div className="mt-8 text-center text-sm text-zinc-400">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => { setMode('register'); setError(''); setMessage(''); }} className="text-white hover:text-orange-400 font-medium transition-colors">Sign up</button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-white hover:text-orange-400 font-medium transition-colors">Log in</button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
