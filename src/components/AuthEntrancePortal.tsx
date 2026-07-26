import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  UserPlus, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Coins, 
  User, 
  Swords, 
  ArrowRight,
  Mail
} from 'lucide-react';
import { UserProfile } from '../types';
import { DuellioLogo } from './DuellioLogo';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from '../firebase';


interface AuthEntrancePortalProps {
  onLoginSuccess: (user: UserProfile) => void;
  onRegisterSuccess: (user: UserProfile) => void;
  allProfiles: UserProfile[];
  onAddProfile: (username: string, email: string, pass: string, avatar: string) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
}

export const AuthEntrancePortal: React.FC<AuthEntrancePortalProps> = ({
  onLoginSuccess,
  onRegisterSuccess,
  allProfiles,
  onAddProfile
}) => {
  const [activeMode, setActiveMode] = useState<'signin' | 'signup'>('signin');
  
  // Login States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up / Registration States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const availableAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  ];

  const handleGoogleSignIn = async () => {
    try {
      setLoginError(null);
      setRegError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const raw = localStorage.getItem('duellio-users');
      let usersList: (UserProfile & { password?: string })[] = [];
      if (raw) {
        try { usersList = JSON.parse(raw); } catch (e) {}
      }

      let matchedInFirestore = allProfiles.find(p => p.uid === firebaseUser.uid || p.email.trim().toLowerCase() === firebaseUser.email?.trim().toLowerCase());
      if (matchedInFirestore && matchedInFirestore.deactivated) {
        setLoginError("🔒 Account Deactivated: This profile has been deactivated by the system administrator.");
        await auth.signOut();
        return;
      }

      let matched = usersList.find(u => u.uid === firebaseUser.uid || u.email.trim().toLowerCase() === firebaseUser.email?.trim().toLowerCase());
      if (!matched) {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          username: firebaseUser.displayName || `Gamer_${firebaseUser.uid.substring(0, 5)}`,
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          wins: 0,
          losses: 0,
          draws: 0,
          coins: 1000,
          status: 'online',
          favorites: []
        };
        usersList.push(newProfile);
        localStorage.setItem('duellio-users', JSON.stringify(usersList));
        onRegisterSuccess(newProfile);
      } else {
        if (matched.uid !== firebaseUser.uid) {
          matched.uid = firebaseUser.uid;
          localStorage.setItem('duellio-users', JSON.stringify(usersList));
        }
        onLoginSuccess(matched);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to sign in with Google.');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier || !loginPassword) {
      setLoginError('Please enter both your identifier (email/username) and password.');
      return;
    }

    let emailToAuth = loginIdentifier.trim();
    if (!emailToAuth.includes('@')) {
      const matchedLocal = allProfiles.find(
        p => p.username.toLowerCase() === emailToAuth.toLowerCase()
      );
      if (matchedLocal) {
        emailToAuth = matchedLocal.email;
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToAuth, loginPassword);
      const firebaseUser = userCredential.user;

      const raw = localStorage.getItem('duellio-users');
      let usersList: (UserProfile & { password?: string })[] = [];
      if (raw) {
        try { usersList = JSON.parse(raw); } catch (e) {}
      }

      let matchedInFirestore = allProfiles.find(p => p.uid === firebaseUser.uid || p.email.trim().toLowerCase() === firebaseUser.email?.trim().toLowerCase());
      if (matchedInFirestore && matchedInFirestore.deactivated) {
        setLoginError("🔒 Account Deactivated: This profile has been deactivated by the system administrator.");
        await auth.signOut();
        return;
      }

      let matched = usersList.find(u => u.uid === firebaseUser.uid || u.email.trim().toLowerCase() === firebaseUser.email?.trim().toLowerCase());
      if (!matched) {
        matched = {
          uid: firebaseUser.uid,
          username: firebaseUser.displayName || `Gamer_${firebaseUser.uid.substring(0, 5)}`,
          email: firebaseUser.email || emailToAuth,
          avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          wins: 0,
          losses: 0,
          draws: 0,
          coins: 1000,
          status: 'online',
          favorites: []
        };
        usersList.push(matched);
        localStorage.setItem('duellio-users', JSON.stringify(usersList));
      }
      onLoginSuccess(matched);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify your credentials.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!username || !email || !password) {
      setRegError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: username.trim(),
        photoURL: selectedAvatar
      });

      const res = onAddProfile(username.trim(), email.trim(), password, selectedAvatar);
      
      const raw = localStorage.getItem('duellio-users');
      if (raw) {
        try {
          const list = JSON.parse(raw) as (UserProfile & { password?: string })[];
          const idx = list.findIndex(u => u.email.toLowerCase() === email.trim().toLowerCase());
          if (idx !== -1) {
            list[idx].uid = firebaseUser.uid;
            localStorage.setItem('duellio-users', JSON.stringify(list));
            const updatedProfile = { ...list[idx] };
            delete updatedProfile.password;
            
            setRegSuccess('🎉 Success! Your profile is registered and initialized with 1,000 Coins starting gift!');
            setTimeout(() => {
              onRegisterSuccess(updatedProfile);
            }, 1200);
            return;
          }
        } catch (e) {}
      }

      setRegError('Failed to initialize local profile mapping.');
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    }
  };

  const handleQuickLogin = (profile: UserProfile) => {
    onLoginSuccess(profile);
  };


  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 font-sans antialiased flex flex-col items-center justify-center p-4 selection:bg-purple-500/30 selection:text-white relative overflow-hidden" id="auth-entrance-portal">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 relative">
        
        {/* Left Column (Brand Presentation) */}
        <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
          <div className="flex justify-center lg:justify-start items-center gap-4">
            <DuellioLogo size={55} showText={false} />
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-[0.2em] font-display text-glow-purple leading-tight">
                DUELLIO
              </h1>
              <span className="bg-purple-500/20 border border-purple-500/35 px-2.5 py-0.5 rounded-full text-[9px] font-mono text-purple-300 font-bold uppercase tracking-wider">
                🔐 ZERO TRUST ESCROW MATCHMAKER
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-display font-bold text-white leading-snug">
              Secure Esports Board Games Arena
            </h2>
            <p className="text-xs md:text-sm text-neutral-450 leading-relaxed max-w-md mx-auto lg:mx-0">
              Duel in Chess, Ludo, or Whot! featuring real time transaction ledgers, atomic reward escrow smart lock validation, and offline playground bots.
            </p>
          </div>

          {/* Quick info list */}
          <div className="hidden md:grid grid-cols-3 gap-3.5 pt-2 text-center">
            <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
              <span className="text-[9px] font-mono font-bold text-neutral-500 block uppercase tracking-wider">Starting coins</span>
              <span className="text-amber-400 font-display font-black text-xs leading-none mt-1.5 block">1000 COINS</span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
              <span className="text-[9px] font-mono font-bold text-neutral-500 block uppercase tracking-wider">P2P Escrow</span>
              <span className="text-purple-300 font-display font-black text-xs leading-none mt-1.5 block">ATOMIC SYNC</span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
              <span className="text-[9px] font-mono font-bold text-neutral-500 block uppercase tracking-wider">Multi-User</span>
              <span className="text-cyan-300 font-display font-black text-xs leading-none mt-1.5 block">DUAL SESSIONS</span>
            </div>
          </div>
        </div>

        {/* Right Column (Forms) */}
        <div className="lg:col-span-7 bg-[#0B0B0E]/80 backdrop-blur-xl border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-6 md:p-8 rounded-3xl space-y-6">
          
          {/* Main Auth Form Tab Switchers */}
          <div className="flex bg-[#0F0F13] p-1 rounded-2xl border border-white/[0.04]">
            <button
              type="button"
              onClick={() => setActiveMode('signin')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer ${
                activeMode === 'signin'
                  ? 'bg-purple-350 text-neutral-950 font-black shadow-lg shadow-purple-500/10'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In Session
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('signup')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer ${
                activeMode === 'signup'
                  ? 'bg-purple-350 text-neutral-950 font-black shadow-lg shadow-purple-500/10'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign Up (Get 1000 Coins)
            </button>
          </div>

          {/* Google Sign In Option */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2.5 shadow-md uppercase tracking-wider font-display select-none"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center">
              <div className="flex-1 border-t border-white/[0.06]"></div>
              <span className="px-3 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">or use email credentials</span>
              <div className="flex-1 border-t border-white/[0.06]"></div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeMode === 'signin' ? (
              <motion.div
                key="signin-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">Provide Your Access Credentials</h3>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Use default user `Lead_Developer` & password `password123` to enter instantly.</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Username or Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Lead_Developer or architect@gamerplatform.io"
                        className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50"
                      />
                      <User className="w-4 h-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Client password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPass ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter account security keys"
                        className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPass(!showLoginPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-300"
                      >
                        {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl leading-relaxed">
                      ⚠️ <strong>Login Warning:</strong> {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-800 hover:from-purple-450 hover:to-purple-750 text-white font-black text-sm rounded-xl cursor-pointer transition-all hover:scale-[1.01] active:scale-95 shadow-md uppercase tracking-wider select-none flex items-center justify-center gap-2"
                  >
                    <span>Log In & Sync Session</span>
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </button>
                </form>

                {/* Quick Swapper if device has saved sessions */}
                {(() => {
                  const deviceProfiles = allProfiles.filter(p => !p.uid.startsWith('bot_'));
                  return deviceProfiles.length > 0 && (
                    <div className="border-t border-white/[0.04] pt-5 space-y-3.5">
                      <span className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                        Saved Active Device Profiles
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-1">
                        {deviceProfiles.map((p) => (
                          <div
                            key={p.uid}
                            onClick={() => handleQuickLogin(p)}
                            className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#0F0F13] border border-white/[0.03] hover:border-purple-500/25 transition-all cursor-pointer group"
                          >
                            <img src={p.avatar} alt={p.username} className="w-8 h-8 rounded-full object-cover border border-white/5" />
                            <div className="min-w-0 flex-1 text-left">
                              <span className="font-bold text-xs text-neutral-200 group-hover:text-purple-300 block truncate leading-none">{p.username}</span>
                              <strong className="text-[9px] text-amber-400 font-mono block mt-1 leading-none">{p.coins.toLocaleString()} Coins</strong>
                            </div>
                            <span className="text-[9px] text-neutral-500 group-hover:text-neutral-300">Unlock →</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4 text-left"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">Create Brand-New Esports Profile</h3>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Registering immediately credits you with isolated play funds.</p>
                </div>

                {/* Coins starting benefit panel */}
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-3.5 rounded-2xl flex items-center gap-4">
                  <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 animate-bounce shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono leading-none font-black text-emerald-300 uppercase tracking-widest">ONBOARDING LOOT</span>
                    <p className="text-xs text-neutral-300 font-bold mt-1">Starting reward of 1,000 Coins loaded automatically on join!</p>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Select Personal Avatar
                    </label>
                    <div className="flex gap-2 justify-between flex-wrap bg-neutral-950 p-2.5 rounded-2xl border border-white/5">
                      {availableAvatars.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setSelectedAvatar(av)}
                          className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                            selectedAvatar === av ? 'border-cyan-400 scale-105' : 'border-transparent hover:border-neutral-700'
                          }`}
                        >
                          <img src={av} alt="Avatar Selector" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Unique Username
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Pick your alias"
                        className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alias@gamers.io"
                          className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50"
                        />
                        <Mail className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Client security password
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPass ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 secure characters"
                        className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPass(!showRegPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-300"
                      >
                        {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {regError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl">
                      ⚠️ <strong>Registration Error:</strong> {regError}
                    </div>
                  )}

                  {regSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl">
                      ✅ {regSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-neutral-950 font-black text-sm rounded-xl cursor-pointer transition-all hover:scale-[1.01] active:scale-95 shadow-md uppercase tracking-wider select-none flex items-center justify-center gap-2"
                  >
                    <span>Sign Up & Claim welcome reward</span>
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[9px] text-neutral-500 font-mono mt-4 text-center">
            🔐 By entering the Duellio Gateway, you accept that game outcomes automatically invoke P2P escrow payout locks.
          </p>
        </div>

      </div>
    </div>
  );
};
