'use client';

import { Camera, TrainFront, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { authClient } from '@/utils/auth-client';
import { useRouter } from 'next/navigation';

export default function MrtSignupCard() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic validation
    if (!username || !email || !password) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setIsLoading(false);
      return;
    }

    try {
      // Sign up with Better Auth — username will be stored in ba_user.name
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: username,
      });

      if (error) {
        setError(error.message || 'Sign up failed. Username or email may already exist.');
        setIsLoading(false);
        return;
      }

      router.push('/passport');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sign up failed. Username or email may already exist.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      
      {/* THE CARD CONTAINER */}
      <div className="relative w-full max-w-[320px] aspect-[1/1.6] bg-[#00AEEF] rounded-[2rem] shadow-2xl overflow-hidden border-4 border-white flex flex-col font-sans">
        
        {/* TOP LOGOS SECTION */}
        <div className="flex justify-between items-start p-6 pb-2">
          <div className="bg-white px-2 py-1 rounded-md">
            <span className="text-[10px] font-black text-[#003366]">My Pass</span>
          </div>
          <div className="flex items-center gap-1 text-white">
             <TrainFront className="w-5 h-5" />
             <span className="font-bold italic text-sm">MRTQuest</span>
          </div>
        </div>

        {/* AVATAR / PHOTO BOX */}
        <div className="flex justify-center mt-4">
          <div className="w-32 h-40 bg-white border-2 border-white/50 shadow-inner flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer">
            <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-[10px] text-slate-400 font-bold uppercase">Upload Photo</span>
            </div>
          </div>
        </div>

        {/* INPUT SECTION */}
        <form onSubmit={handleSignup} className="flex-1 flex flex-col px-6 mt-6 gap-3">
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white uppercase tracking-wider">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ADVENTURER_01"
              disabled={isLoading}
              className="w-full bg-white/20 border-b-2 border-white text-white placeholder:text-white/50 focus:outline-none py-1 font-bold text-sm disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="explorer@mrt.quest"
              disabled={isLoading}
              className="w-full bg-white/20 border-b-2 border-white text-white placeholder:text-white/50 focus:outline-none py-1 font-bold text-sm disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white uppercase tracking-wider">Passphrase</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full bg-white/20 border-b-2 border-white text-white placeholder:text-white/50 focus:outline-none py-1 text-sm disabled:opacity-50"
            />
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="text-xs text-red-100 bg-red-600/30 p-2 rounded-lg">
              {error}
            </div>
          )}

          {/* BOTTOM BRANDING / ACTION BUTTON */}
          <div className="bg-white mt-auto p-4 flex flex-col items-center rounded-t-[2.5rem]">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E879F9] hover:bg-[#d946ef] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  PRINTING...
                </>
              ) : (
                <>
                  PRINT MY PASS
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <div className="mt-3 flex flex-col items-center">
              <h2 className="text-xl font-black text-[#003366] italic tracking-tighter">myrapid</h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">S I G N U P</p>
            </div>
          </div>
        </form>
      </div>

      <p className="mt-8 text-xs text-slate-600">
        Already have a pass? <a href="/login" className="text-primary font-bold cursor-pointer hover:underline">Sign In</a>
      </p>
    </div>
  );
}
