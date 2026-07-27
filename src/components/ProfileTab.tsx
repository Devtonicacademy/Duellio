import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  HelpCircle, 
  ShieldAlert, 
  Award, 
  Inbox, 
  Clock, 
  Zap, 
  Star, 
  ShieldCheck, 
  Heart, 
  EyeOff, 
  MessageSquare, 
  Trash2, 
  LogOut, 
  UserPlus, 
  KeyRound, 
  Eye, 
  Coins,
  Pencil,
  Camera,
  Upload
} from 'lucide-react';
import { UserProfile, WalletTransaction } from '../types';
import { db } from '../firebase';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';

interface ProfileTabProps {
  userProfile: UserProfile;
  transactions: WalletTransaction[];
  onLogout: () => void;
  onChangePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  onDeleteProfile: (uid: string) => void;
  onAddProfile: (username: string, email: string, pass: string, avatar: string) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  onSwitchProfile: (uid: string) => void;
  onUpdateProfile?: (username: string, avatar: string) => Promise<{ success: boolean; message: string }>;
  allProfiles: UserProfile[];
}

// Canvas-based image compression helper for device uploads
function compressImageFile(file: File, maxWidth = 300, maxHeight = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ 
  userProfile, 
  transactions,
  onLogout,
  onChangePassword,
  onDeleteProfile,
  onAddProfile,
  onSwitchProfile,
  onUpdateProfile,
  allProfiles
}) => {
  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  
  // Developer revenue states
  const [devRevenue, setDevRevenue] = useState<number>(0);
  const [devTxHistory, setDevTxHistory] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    if (userProfile.email !== 'devtonicllc@gmail.com') return;

    const revUnsub = onSnapshot(doc(db, 'developer_stats', 'revenue'), (docSnap) => {
      if (docSnap.exists()) {
        setDevRevenue(docSnap.data()?.totalRake || 0);
      }
    });

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', 'developer')
    );
    const txUnsub = onSnapshot(q, (snapshot) => {
      const txList: WalletTransaction[] = [];
      snapshot.forEach((docSnap) => {
        txList.push(docSnap.data() as WalletTransaction);
      });
      setDevTxHistory(txList.sort((a, b) => b.id.localeCompare(a.id)));
    });

    return () => {
      revUnsub();
      txUnsub();
    };
  }, [userProfile?.email]);
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [showPassState, setShowPassState] = useState<{ current: boolean; new: boolean; confirm: boolean }>({
    current: false,
    new: false,
    confirm: false
  });
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New profile creation state
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regSelectedAvatar, setRegSelectedAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
  const [regMsg, setRegMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit profile state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const availableAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  ];

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (!currentPass || !newPass || !confirmNewPass) {
      setPwdMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }

    if (newPass !== confirmNewPass) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPass.length < 6) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    const res = await onChangePassword(currentPass, newPass);
    if (res.success) {
      setPwdMsg({ type: 'success', text: res.message });
      setCurrentPass('');
      setNewPass('');
      setConfirmNewPass('');
    } else {
      setPwdMsg({ type: 'error', text: res.message });
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMsg(null);

    if (!regUsername || !regEmail || !regPass) {
      setRegMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }

    if (regPass.length < 6) {
      setRegMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    const res = await onAddProfile(regUsername, regEmail, regPass, regSelectedAvatar);
    if (res.success) {
      setRegMsg({ type: 'success', text: 'Profile created with 1,000 Coins starting gift! Swapping sessions...' });
      setTimeout(() => {
        setRegUsername('');
        setRegEmail('');
        setRegPass('');
        setShowAddProfileModal(false);
        setRegMsg(null);
      }, 1500);
    } else {
      setRegMsg({ type: 'error', text: res.message });
    }
  };

  const handleSaveEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;
    setEditMsg(null);
    setIsSavingEdit(true);

    const finalAvatar = customAvatarUrl.trim() ? customAvatarUrl.trim() : editAvatar;
    const res = await onUpdateProfile(editUsername, finalAvatar);
    setIsSavingEdit(false);

    if (res.success) {
      setEditMsg({ type: 'success', text: res.message });
      setTimeout(() => {
        setShowEditProfileModal(false);
        setEditMsg(null);
      }, 1200);
    } else {
      setEditMsg({ type: 'error', text: res.message });
    }
  };
  
  // Actual user profiles on the app as friends
  const friends = allProfiles
    .filter(p => p.uid !== userProfile.uid)
    .map(p => ({
      name: p.username,
      status: p.status === 'online' ? 'Online' : p.status === 'in-game' ? 'In Game' : 'Offline',
      avatar: p.avatar,
      badgeColor: p.status === 'online' 
        ? 'border-emerald-400 bg-emerald-400' 
        : p.status === 'in-game' 
          ? 'border-purple-400 bg-purple-400' 
          : 'border-neutral-700 bg-neutral-700'
    }));

  const deviceProfiles = allProfiles.filter(p => !p.uid.startsWith('bot_'));

  return (
    <div className="space-y-6" id="player-profile-view">
      
      {/* Hero Header Section matches Screenshot 1 and 5 */}
      <section className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[90px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
        
        {/* Left Side: Circular ELO / Badge indicators */}
        <div className="relative shrink-0">
          <div 
            onClick={() => {
              setEditUsername(userProfile.username);
              setEditAvatar(userProfile.avatar);
              setCustomAvatarUrl('');
              setEditMsg(null);
              setShowEditProfileModal(true);
            }}
            className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-purple-500/30 neon-glow-purple p-1 bg-neutral-900 shadow-xl cursor-pointer group relative"
            title="Click to edit profile avatar"
          >
            <div className="w-full h-full rounded-xl overflow-hidden relative">
              <img 
                alt="Player Avatar" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                src={userProfile.avatar} 
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white font-sans text-xs font-bold">
                <Camera className="w-5 h-5 text-purple-300" />
                <span>Change</span>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-purple-400/95 text-neutral-950 text-center font-display font-bold text-[9px] py-1 uppercase tracking-wide">
                ELITE OPS
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-3 -right-3 bg-purple-300 text-neutral-950 w-12 h-12 rounded-full flex flex-col items-center justify-center border-4 border-neutral-950 font-display shadow-lg">
            <span className="text-sm font-extrabold leading-none">42</span>
            <span className="text-[7px] font-bold uppercase tracking-tighter">Level</span>
          </div>
        </div>

        {/* Right Side: Primary indicators */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold text-white tracking-tight uppercase">
              {userProfile.username}
            </h1>
            <span className="bg-purple-500/15 border border-purple-500/35 text-purple-300 px-3 py-0.5 rounded-full font-display text-[9px] font-bold tracking-wider uppercase animate-pulse">
              PRO MEMBER
            </span>

            <button
              type="button"
              onClick={() => {
                setEditUsername(userProfile.username);
                setEditAvatar(userProfile.avatar);
                setCustomAvatarUrl('');
                setEditMsg(null);
                setShowEditProfileModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full transition-all cursor-pointer font-sans text-xs font-bold shrink-0 select-none shadow-sm hover:border-purple-500/50"
              title="Edit Profile Username & Avatar"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          <p className="text-xs md:text-sm text-neutral-400 font-sans max-w-xl leading-relaxed">
            Technical duelist specializing in high-performance board games and ELO matrix manipulation. Currently ranking in the top 0.5% of the global Duellio escrow cycle.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1 font-mono">
            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all">
              <span className="text-neutral-400 text-[9px] font-bold block uppercase tracking-wider">TOTAL MATCH WINS</span>
              <span className="text-xl font-extrabold text-emerald-400 font-display block mt-1">{userProfile.wins}</span>
            </div>
            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all">
              <span className="text-neutral-400 text-[9px] font-bold block uppercase tracking-wider">LOSSES / DRAWS</span>
              <span className="text-xl font-extrabold text-rose-400 font-display block mt-1">{userProfile.losses} / {userProfile.draws}</span>
            </div>
            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all">
              <span className="text-neutral-400 text-[9px] font-bold block uppercase tracking-wider">VICTORY RATE</span>
              <span className="text-xl font-extrabold text-purple-300 font-display block mt-1">
                {userProfile.wins + userProfile.losses > 0 
                  ? Math.round((userProfile.wins / (userProfile.wins + userProfile.losses)) * 100) 
                  : 100}%
              </span>
            </div>
            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all">
              <span className="text-neutral-400 text-[9px] font-bold block uppercase tracking-wider">WALLET COINS</span>
              <span className="text-xl font-extrabold text-amber-300 font-display block mt-1">{userProfile.coins.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </section>

      {/* 🛠️ DEVELOPER TELEMETRY & REVENUE PORTAL */}
      {userProfile.email === 'devtonicllc@gmail.com' && (
        <section className="glass-panel p-6 rounded-2xl border border-cyan-500/20 relative overflow-hidden" id="developer-telemetry-portal">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[90px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-5 mb-6">
            <div>
              <h3 className="font-display font-extrabold text-white text-base tracking-wide uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                Developer Telemetry & Platform Revenue
              </h3>
              <p className="text-[11px] font-mono text-neutral-400 mt-1">
                Real-time tracking of platform rake collections (10% commission on wagers) and house winnings from Bot matches.
              </p>
            </div>
            <div className="bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 px-3.5 py-1 rounded-xl font-mono text-xs font-bold tracking-wider uppercase">
              DEV MODE ACTIVE
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 font-sans">
            {/* Stat 1: Total Revenue */}
            <div className="bg-neutral-950/60 p-4.5 rounded-2xl border border-neutral-850 flex items-center gap-4 hover:border-cyan-500/20 transition-all">
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-500 font-bold block uppercase tracking-wider">TOTAL PLATFORM REVENUE</span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">
                  {devRevenue.toLocaleString()} <span className="text-xs text-cyan-400 font-sans font-normal">Coins</span>
                </span>
              </div>
            </div>

            {/* Stat 2: Total Commission Transactions */}
            <div className="bg-neutral-950/60 p-4.5 rounded-2xl border border-neutral-850 flex items-center gap-4 hover:border-cyan-500/20 transition-all">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-500 font-bold block uppercase tracking-wider">COMMISSION TRANSACTIONS</span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">
                  {devTxHistory.length} <span className="text-xs text-purple-400 font-sans font-normal">recorded</span>
                </span>
              </div>
            </div>

            {/* Stat 3: Avg Transaction Earning */}
            <div className="bg-neutral-950/60 p-4.5 rounded-2xl border border-neutral-850 flex items-center gap-4 hover:border-cyan-500/20 transition-all">
              <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-500 font-bold block uppercase tracking-wider">EST. REVENUE SHIELD</span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">
                  {devTxHistory.length > 0 
                    ? Math.round(devRevenue / devTxHistory.length).toLocaleString() 
                    : 0} <span className="text-xs text-pink-400 font-sans font-normal">Coins/Tx</span>
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Ledger History */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-neutral-350 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-neutral-900">
              <Clock className="w-4 h-4 text-cyan-300" />
              Developer Coin-Ledger Feed
            </h4>

            {devTxHistory.length === 0 ? (
              <div className="bg-black/20 border border-neutral-900 rounded-xl p-8 text-center text-neutral-500 text-xs">
                No telemetry transaction recordings detected in the Firestore ledger yet. Start staked bot duels to accumulate rake fees!
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {devTxHistory.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-neutral-950/40 rounded-xl border border-neutral-900 hover:bg-neutral-900/20 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-white text-xs font-semibold font-sans">{tx.description}</p>
                        <span className="text-[9px] font-mono text-neutral-500 mt-1 block">
                          TXID: {tx.id} • Timestamp: {tx.timestamp}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold font-mono">
                        +{tx.amount.toLocaleString()} Coins
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bento Grid layout containing radar stats and history ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Performance Radar Metric Block (4-cols) */}
        <div className="lg:col-span-4 glass-card p-5 rounded-2xl flex flex-col justify-between border border-neutral-850">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white text-sm">Player Performance</h3>
            <Zap className="w-4 h-4 text-purple-300 fill-purple-400 animate-pulse" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <svg className="w-full max-w-[14rem] stroke-neutral-800" viewBox="0 0 200 200">
              {/* Radar Grid circles / lines */}
              <polygon className="stroke-white/10 fill-none" strokeWidth="1" points="100,20 180,140 20,140"></polygon>
              <polygon className="stroke-white/10 fill-none" strokeWidth="1" points="100,50 160,125 40,125"></polygon>
              <polygon className="stroke-white/10 fill-none" strokeWidth="1" points="100,80 140,110 60,110"></polygon>
              <line className="stroke-white/10" strokeWidth="1" x1="100" y1="100" x2="100" y2="20"></line>
              <line className="stroke-white/10" strokeWidth="1" x1="100" y1="100" x2="180" y2="140"></line>
              <line className="stroke-white/10" strokeWidth="1" x1="100" y1="100" x2="20" y2="140"></line>
              
              {/* Filled values representing player traits */}
              <polygon className="fill-purple-500/20 stroke-purple-400" strokeWidth="2.5" points="100,35 158,128 48,110"></polygon>
              
              {/* Markers for highlights */}
              <circle cx="100" cy="35" r="3.5" className="fill-purple-300"></circle>
              <circle cx="158" cy="128" r="3.5" className="fill-purple-300"></circle>
              <circle cx="48" cy="110" r="3.5" className="fill-purple-300"></circle>
            </svg>

            <div className="flex justify-between w-full mt-6 text-[10px] font-mono tracking-wider font-bold">
              <div className="text-center font-bold">
                <span className="text-purple-300 block">SKILL</span>
                <span className="text-neutral-300 text-xs">92%</span>
              </div>
              <div className="text-center font-bold">
                <span className="text-cyan-300 block">AGILITY</span>
                <span className="text-neutral-300 text-xs">88%</span>
              </div>
              <div className="text-center font-bold">
                <span className="text-pink-300 block">TEAMWORK</span>
                <span className="text-neutral-300 text-xs">74%</span>
              </div>
            </div>

            <div className="w-full border-t border-neutral-900 mt-5 pt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-[8px] font-mono text-neutral-500 font-bold block uppercase tracking-wider">TOTAL EARNED</p>
                <strong className="text-purple-300 font-mono text-xs">{(userProfile.coins + 12840).toLocaleString()} Coins</strong>
              </div>
              <div>
                <p className="text-[8px] font-mono text-neutral-500 font-bold block uppercase tracking-wider">SECURE ESCROW</p>
                <strong className="text-cyan-300 font-mono text-xs">8,200 Coins</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Games historical logger list (5-cols) */}
        <div className="lg:col-span-5 glass-card p-5 rounded-2xl border border-neutral-850 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <h3 className="font-display font-semibold text-white text-sm">Recent Duels Log</h3>
            <span className="text-[10px] text-neutral-450 font-mono">FIDE DECENTRALIZED FEED</span>
          </div>

          <div className="space-y-3.5">
            
            {/* Log Item 1 */}
            <div className="flex items-center gap-3.5 p-2 bg-neutral-950/60 rounded-xl border border-neutral-900 hover:bg-neutral-900/40 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-md bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800">
                <img 
                  alt="Game Thumb" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuh4k4YaaHDo-emcWDI9rXFXWmnvK5JCEyzVWbBn8MU7aR-rPktMC-qvELjfVlujdinWpDMBFuH7YSR4mHKkq_Dk-mt5CSozenTCcUefYaYtO6qO9elvoHUaktjE61nUNUGrawQojY8u1Ox_405lggrPqq9LtWnNwwF_sAwhHb7nCkma9RyqHDA1f1GsHXoaSjOWQarwetSzycIFzHBQrODhp0fMgx6G42e7cdD8UnIQLnSBMoW5U0U9LFJqS-qqoyX9ev-c0efQ"
                />
              </div>
              <div className="flex-1">
                <h5 className="font-display font-semibold text-xs text-white">VOID RUNNER 2077 (WHOT)</h5>
                <p className="text-[9px] font-mono text-neutral-500 mt-0.5">25m ago • Deathmatch</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-purple-300 font-bold text-xs">+150 XP</p>
                <p className="text-[8px] font-mono text-purple-400 font-semibold uppercase tracking-wider">Victory</p>
              </div>
            </div>

            {/* Log Item 2 */}
            <div className="flex items-center gap-3.5 p-2 bg-neutral-950/60 rounded-xl border border-neutral-900 hover:bg-neutral-900/40 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-md bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800">
                <img 
                  alt="Game Thumb" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDr_L_wuUhbPV36na3DOU3RaGFgYb_1e19qS1LuchnlZPWHbTv5P_OPdHtI7Gr7qj6A_GOmz7lFVCSzvd2wXlQ2BCLZbOjzDG7KHcFV4l0y-l1ZCZy2YhuDw5gPMXoyYAcuj264Elw7SA_LdHTLg1DmjAE0hgJ4PErF7eTu7fJA_EcGV6znvpxPtSvQUcbplWXL8IgtevLBVWw98Ge1KYsAOlMo3DRsXXZzwijexzarDwzFJrCuYhCWf5DgXWhJ0GFiicHxA3KOcw"
                />
              </div>
              <div className="flex-1">
                <h5 className="font-display font-semibold text-xs text-white">SYNTH_STRIKE (LUDO)</h5>
                <p className="text-[9px] font-mono text-neutral-500 mt-0.5">2h ago • Ranked Team</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-pink-300 font-bold text-xs">-45 XP</p>
                <p className="text-[8px] font-mono text-neutral-500 font-semibold uppercase tracking-wider">Defeat</p>
              </div>
            </div>

            {/* Log Item 3 */}
            <div className="flex items-center gap-3.5 p-2 bg-neutral-950/60 rounded-xl border border-neutral-900 hover:bg-neutral-900/40 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-md bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800">
                <img 
                  alt="Game Thumb" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXSen2w7OQY6mkqKeOIDwKoeazb-jJYfFEhyMDGcvhxBQ3e2bCqXnbGWK0UydaqQebcqoAmmuckLDLGsufFo_cBdxPfpfzEt9EHzRMkDwf9ZD2mUFJknqwUsep9eep3yxKyejUwsbsFIz4foNAAg02IE7kr3BeiGYTghzfJjvBrfJ6OwCEcMIM6Q7EXJt5ywabtNaKLb8FTCUjSDXsXteXNDEM9iT3dvopRycKET56g5YRBtF6kPkUoJ79K1Kq82d91zZSJ2rcnw"
                />
              </div>
              <div className="flex-1">
                <h5 className="font-display font-semibold text-xs text-white">NEURAL MESH (CHESS)</h5>
                <p className="text-[9px] font-mono text-neutral-500 mt-0.5">Yesterday • Solo Quest</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-purple-300 font-bold text-xs">+2,000 XP</p>
                <p className="text-[8px] font-mono text-purple-400 font-semibold uppercase tracking-wider">Victory</p>
              </div>
            </div>

          </div>
        </div>

        {/* Friend List (3 Columns) matches Screenshot 1 and 5 */}
        <div className="lg:col-span-3 glass-card p-5 rounded-2xl flex flex-col justify-between border border-neutral-850">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <h3 className="font-display font-semibold text-white text-xs">Friend List</h3>
              <Star className="w-3.5 h-3.5 text-neutral-500" />
            </div>

            <div className="space-y-4">
              {friends.map((friend) => (
                <div key={friend.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full border border-purple-500/35 overflow-hidden p-0.5 bg-neutral-900">
                        <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-full object-cover" />
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full absolute bottom-0 right-0 border-2 border-neutral-950 ${friend.badgeColor}`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-[11px]">{friend.name}</p>
                      <p className="text-[9px] font-mono text-neutral-400">{friend.status}</p>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-neutral-850 rounded-lg text-neutral-500 hover:text-purple-300 cursor-pointer">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full mt-5 py-2 text-xs font-mono bg-neutral-900/80 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-lg transition-all border border-neutral-850 cursor-pointer">
            View All ({friends.length} Friends)
          </button>
        </div>

      </div>

      {/* Interactive Achievement Milestones card (12 Columns Full Width) */}
      <div className="glass-card p-5 rounded-2xl border border-neutral-850">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5 border-b border-neutral-900 pb-4">
          <div>
            <h3 className="font-display font-bold text-white text-sm">Achievement Milestones</h3>
            <p className="text-[10px] font-mono text-neutral-500">Tier qualification bounds toward seasonal chest pools</p>
          </div>
          <span className="px-3 py-1 bg-pink-500/15 text-pink-300 rounded-lg font-mono text-[9px] font-bold border border-pink-500/30">
            ★ SEASONAL ELITE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Milestone 1 */}
          <div className="bg-neutral-950/45 p-4 rounded-xl border border-neutral-900 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-400/35 overflow-hidden flex items-center justify-center text-purple-300 font-bold text-xs select-none">
                DT
              </div>
              <div>
                <p className="text-white font-display text-xs font-bold leading-none">Data Thief</p>
                <p className="text-[9px] text-neutral-500 font-mono mt-1">Steal 50,000 Credits</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 w-full shadow-sm"></div>
              </div>
              <p className="text-[8px] font-mono text-purple-300 text-right font-black">COMPLETED</p>
            </div>
          </div>

          {/* Milestone 2 */}
          <div className="bg-neutral-950/45 p-4 rounded-xl border border-neutral-900 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-400/35 overflow-hidden flex items-center justify-center text-cyan-300 font-bold text-xs select-none">
                TB
              </div>
              <div>
                <p className="text-white font-display text-xs font-bold leading-none">Time Bender</p>
                <p className="text-[9px] text-neutral-500 font-mono mt-1">Accumulate 1,000 live hours</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 w-[82%] shadow-sm"></div>
              </div>
              <p className="text-[8px] font-mono text-neutral-400 text-right font-bold">820 / 1,000 HRS</p>
            </div>
          </div>

          {/* Milestone 3 */}
          <div className="bg-neutral-950/45 p-4 rounded-xl border border-neutral-900 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-400/25 overflow-hidden flex items-center justify-center text-pink-300 font-bold text-xs select-none">
                SW
              </div>
              <div>
                <p className="text-white font-display text-xs font-bold leading-none">Shadow Warrior</p>
                <p className="text-[9px] text-neutral-500 font-mono mt-1">100 stake wins without damage</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-pink-400/60 w-[15%]"></div>
              </div>
              <p className="text-[8px] font-mono text-neutral-400 text-right font-bold">15 / 100</p>
            </div>
          </div>

        </div>
      </div>

      {/* 🛡️ IDENTITY MANAGEMENT & PROFILE VAULT */}
      <section className="glass-panel p-6 rounded-2xl border border-neutral-850 relative overflow-hidden" id="identity-management-vault">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[90px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[90px] rounded-full -ml-32 -mb-32 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-5 mb-6">
          <div>
            <h3 className="font-display font-extrabold text-white text-base tracking-wide uppercase flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              Identity & Session Vault
            </h3>
            <p className="text-[11px] font-mono text-neutral-450 mt-1">
              Configure active credentials, manage local client profiles, and administer zero-trust wallet handshakes.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 bg-gradient-to-r from-rose-650 to-rose-750 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md border border-rose-500/10 select-none uppercase tracking-wider self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column A: Change Password */}
          <div className="lg:col-span-6 space-y-4">
            <h4 className="text-xs font-mono font-bold text-neutral-350 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-neutral-900">
              <KeyRound className="w-4 h-4 text-purple-300" />
              Edit Security Password
            </h4>

            <form onSubmit={handlePasswordChange} className="space-y-3.5 font-sans">
              <div>
                <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassState.current ? 'text' : 'password'}
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassState(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPassState.current ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassState.new ? 'text' : 'password'}
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="At least 6 chars"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassState(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-300"
                    >
                      {showPassState.new ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassState.confirm ? 'text' : 'password'}
                      value={confirmNewPass}
                      onChange={(e) => setConfirmNewPass(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassState(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-300"
                    >
                      {showPassState.confirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {pwdMsg && (
                <div className={`p-3 rounded-xl border text-xs font-medium ${
                  pwdMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {pwdMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-800 hover:from-purple-450 hover:to-purple-750 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-95 cursor-pointer uppercase tracking-wider shadow-md select-none"
              >
                🔐 Confirm Password Edit
              </button>
            </form>
          </div>

          {/* Column B: Local Profile Switcher */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
              <h4 className="text-xs font-mono font-bold text-neutral-350 uppercase tracking-widest flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-cyan-300" />
                Active Device Profiles ({deviceProfiles.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddProfileModal(true)}
                className="px-2.5 py-1 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 select-none"
              >
                <UserPlus className="w-3 h-3" />
                <span>Add Profile</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {deviceProfiles.map((profile) => {
                const isActive = profile.uid === userProfile.uid;
                return (
                  <div
                    key={profile.uid}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isActive 
                        ? 'bg-purple-500/10 border-purple-500/40 text-neutral-100 shadow-[0_0_15px_rgba(147,51,234,0.1)]' 
                        : 'bg-neutral-950/60 border-neutral-850 text-neutral-300 hover:bg-neutral-900/40'
                    }`}
                  >
                    <div 
                      onClick={() => !isActive && onSwitchProfile(profile.uid)}
                      className={`flex items-center gap-3 flex-1 min-w-0 ${!isActive ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <img 
                        src={profile.avatar} 
                        alt={profile.username} 
                        className={`w-9 h-9 rounded-full object-cover border ${isActive ? 'border-purple-400' : 'border-neutral-700'}`}
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs block truncate leading-none">{profile.username}</span>
                          {isActive && (
                            <span className="bg-purple-300 text-neutral-950 text-[8px] font-bold font-mono px-1 rounded uppercase tracking-wider">Active</span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-neutral-400 mt-1 block truncate">
                          {profile.email} • <strong className="text-amber-400">{profile.coins.toLocaleString()} Coins</strong>
                        </span>
                      </div>
                    </div>

                    {/* Delete capability */}
                    <button
                      type="button"
                      onClick={() => onDeleteProfile(profile.uid)}
                      title={`Remove profile ${profile.username}`}
                      className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer select-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-[9px] text-neutral-450 font-mono leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/[0.03]">
              💡 <strong>Dual Mode Vault Rule:</strong> Adding new profiles creates completely isolated secure game sessions. New profiles receive <strong>1,000 Coins starting credit</strong>. Deleting the active session profile triggers automatic sign-out.
            </p>
          </div>

        </div>
      </section>

      {/* Complete Modal Overlay for Edit Profile */}
      <AnimatePresence>
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black/92 backdrop-blur-md flex items-center justify-center z-[120] p-4 font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -15 }}
              className="bg-[#0B0B0F] border-2 border-purple-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(168,85,247,0.15)] space-y-6"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => { setShowEditProfileModal(false); setEditMsg(null); }}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white font-black text-sm p-1.5 hover:bg-white/5 rounded-full cursor-pointer transition-colors select-none"
              >
                ✕
              </button>

              <div className="text-center space-y-2">
                <div className="mx-auto h-14 w-14 bg-purple-500/15 rounded-2xl flex items-center justify-center border border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <Pencil className="w-7 h-7 text-purple-300" />
                </div>
                <h3 className="text-lg md:text-xl font-black text-white tracking-tight font-display uppercase">
                  Edit Player Profile
                </h3>
                <p className="text-xs text-neutral-400">
                  Update your display name and avatar identity.
                </p>
              </div>

              {/* Real-time Preview Badge */}
              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-white/10 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-purple-400/40 shrink-0 bg-neutral-900">
                  <img 
                    src={customAvatarUrl.trim() ? customAvatarUrl.trim() : editAvatar} 
                    alt="Preview Avatar" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono font-bold text-neutral-500 block uppercase tracking-wider">LIVE PREVIEW</span>
                  <p className="text-sm font-extrabold text-white truncate font-display uppercase">
                    {editUsername.trim() || userProfile.username}
                  </p>
                  <span className="text-[10px] text-purple-300 font-mono block">PRO MEMBER • Level 42</span>
                </div>
              </div>

              <form onSubmit={handleSaveEditProfile} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Display Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Enter new username"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 font-sans font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Choose Avatar Source
                  </label>

                  {/* Device File Upload Button */}
                  <div className="mb-3">
                    <label className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl transition-all cursor-pointer text-xs font-bold font-sans hover:border-purple-400 select-none">
                      <Upload className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Choose Image File from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressedBase64 = await compressImageFile(file);
                              setCustomAvatarUrl(compressedBase64);
                              setEditAvatar(compressedBase64);
                            } catch (err) {
                              console.error("Error reading device image:", err);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex gap-2 justify-between flex-wrap bg-neutral-950 p-2 rounded-2xl border border-white/5">
                    {availableAvatars.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => {
                          setEditAvatar(av);
                          setCustomAvatarUrl('');
                        }}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          !customAvatarUrl && editAvatar === av ? 'border-purple-400 scale-105 shadow-md shadow-purple-500/30' : 'border-transparent hover:border-neutral-700'
                        }`}
                      >
                        <img src={av} alt="Avatar Preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Or Custom Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 font-mono text-[11px]"
                  />
                </div>

                {editMsg && (
                  <div className={`p-3 rounded-xl border text-xs font-semibold ${
                    editMsg.type === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                  }`}>
                    {editMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm rounded-xl cursor-pointer transition-all shadow-md active:scale-95 uppercase tracking-wider mt-3 select-none disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complete Modal Overlay for Add Profile */}
      <AnimatePresence>
        {showAddProfileModal && (
          <div className="fixed inset-0 bg-black/92 backdrop-blur-md flex items-center justify-center z-[120] p-4 font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -15 }}
              className="bg-[#0B0B0F] border-2 border-cyan-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(34,211,238,0.12)] space-y-6"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => { setShowAddProfileModal(false); setRegMsg(null); }}
                className="absolute top-4 right-4 text-neutral-500 hover:text-white font-black text-sm p-1.5 hover:bg-white/5 rounded-full cursor-pointer transition-colors select-none"
              >
                ✕
              </button>

              <div className="text-center space-y-2">
                <div className="mx-auto h-14 w-14 bg-cyan-500/15 rounded-2xl flex items-center justify-center border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                  <UserPlus className="w-7 h-7 text-cyan-300" />
                </div>
                <h3 className="text-lg md:text-xl font-black text-white tracking-tight font-display uppercase">
                  Register New Client Profile
                </h3>
                <p className="text-xs text-neutral-400">
                  Join the Duellio arena with isolated coins, records, and statistics.
                </p>
              </div>

              {/* Reward Alert */}
              <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-2xl flex items-center gap-3.5">
                <div className="p-2 bg-emerald-500/15 rounded-xl text-emerald-400 animate-bounce">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono leading-none font-extrabold text-emerald-300 uppercase tracking-widest">ONBOARDING BENEFIT</span>
                  <p className="text-xs text-neutral-300 font-bold mt-1">Starting reward of 1,000 Coins loaded automatically.</p>
                </div>
              </div>

              <form onSubmit={handleCreateProfile} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Choose Profile Avatar
                  </label>

                  {/* Device File Upload Button */}
                  <div className="mb-2.5">
                    <label className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl transition-all cursor-pointer text-xs font-bold font-sans hover:border-cyan-400 select-none">
                      <Upload className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Upload Device Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressedBase64 = await compressImageFile(file);
                              setRegSelectedAvatar(compressedBase64);
                            } catch (err) {
                              console.error("Error reading device image:", err);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex gap-2 justify-between flex-wrap bg-neutral-950 p-2 rounded-2xl border border-white/5">
                    {availableAvatars.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setRegSelectedAvatar(av)}
                        className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          regSelectedAvatar === av ? 'border-cyan-400 scale-105' : 'border-transparent hover:border-neutral-700'
                        }`}
                      >
                        <img src={av} alt="Avatar Selection" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Enter visual username"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/50 text-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@server-nodes.io"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/50 text-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Security Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                  />
                </div>

                {regMsg && (
                  <div className={`p-3 rounded-xl border text-xs font-semibold ${
                    regMsg.type === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                  }`}>
                    {regMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-neutral-950 font-black text-sm rounded-xl cursor-pointer transition-all shadow-md active:scale-95 uppercase tracking-wider mt-3 select-none"
                >
                  Create & Launch Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

