/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Terminal, 
  Map, 
  FileCode, 
  Layout, 
  Workflow, 
  ShieldCheck, 
  HelpCircle,
  Database,
  Compass,
  CheckCircle2,
  Users,
  Swords,
  Coins,
  Tv,
  User,
  ExternalLink,
  HelpCircle as QuestionIcon,
  Sun,
  Moon,
  Gamepad2
} from 'lucide-react';

import { DiscoverTab } from './components/DiscoverTab';
import { TournamentsTab } from './components/TournamentsTab';
import { ProfileTab } from './components/ProfileTab';
import { PhaseSandboxTab } from './components/PhaseSandboxTab';
import { DuellioLogo } from './components/DuellioLogo';
import { PlayArenaTab } from './components/PlayArenaTab';
import { AuthEntrancePortal } from './components/AuthEntrancePortal';

import { INITIAL_USER, INITIAL_TX } from './data/simulation';
import { UserProfile, WalletTransaction } from './types';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('duellio-theme');
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  });

  React.useEffect(() => {
    localStorage.setItem('duellio-theme', theme);
  }, [theme]);

  const [activeTab, setActiveTab] = useState<'discover' | 'tournaments' | 'lobbies' | 'profile' | 'play-arena'>('discover');
  
  // Stored Profiles and Active User loading
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>(() => {
    const raw = localStorage.getItem('duellio-users');
    if (!raw) {
      const defaultUsers = [
        { ...INITIAL_USER, password: 'password123' },
        {
          uid: 'user_gamer',
          username: 'Apex_Pro',
          email: 'apex@gamerplatform.io',
          avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
          wins: 4,
          losses: 1,
          draws: 0,
          coins: 1000,
          status: 'online',
          password: 'password123'
        }
      ];
      localStorage.setItem('duellio-users', JSON.stringify(defaultUsers));
      return defaultUsers.map(({ password, ...u }) => u as UserProfile);
    }
    try {
      const parsed = JSON.parse(raw) as (UserProfile & { password?: string })[];
      return parsed.map(({ password, ...u }) => u as UserProfile);
    } catch (e) {
      return [INITIAL_USER];
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const rawUsers = localStorage.getItem('duellio-users');
    let usersList: (UserProfile & { password?: string })[] = [];
    if (rawUsers) {
      try {
        usersList = JSON.parse(rawUsers);
      } catch (e) {
        usersList = [{ ...INITIAL_USER, password: 'password123' }];
      }
    } else {
      usersList = [{ ...INITIAL_USER, password: 'password123' }];
      localStorage.setItem('duellio-users', JSON.stringify(usersList));
    }

    const currentId = localStorage.getItem('duellio-current-user-uid');
    if (currentId === 'none') {
      return null;
    }
    const found = usersList.find(u => u.uid === currentId);
    if (found) {
      return found;
    }
    // Default to the first user
    localStorage.setItem('duellio-current-user-uid', usersList[0].uid);
    return usersList[0];
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TX);
  
  // Sync modified userProfile changes back to the localStorage array and allProfiles state
  React.useEffect(() => {
    if (!userProfile) {
      localStorage.setItem('duellio-current-user-uid', 'none');
      return;
    }
    localStorage.setItem('duellio-current-user-uid', userProfile.uid);
    const raw = localStorage.getItem('duellio-users');
    if (raw) {
      try {
        const usersList = JSON.parse(raw) as (UserProfile & { password?: string })[];
        const index = usersList.findIndex(u => u.uid === userProfile.uid);
        if (index !== -1) {
          usersList[index] = { ...usersList[index], ...userProfile };
          localStorage.setItem('duellio-users', JSON.stringify(usersList));
          setAllProfiles(usersList.map(({ password, ...u }) => u));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [userProfile]);

  // Logout Session
  const handleLogout = () => {
    setUserProfile(null);
    localStorage.setItem('duellio-current-user-uid', 'none');
  };

  // Change Password
  const handleChangePassword = (current: string, newP: string) => {
    if (!userProfile) return { success: false, message: 'No active session.' };
    const raw = localStorage.getItem('duellio-users');
    if (raw) {
      try {
        const list = JSON.parse(raw) as (UserProfile & { password?: string })[];
        const idx = list.findIndex(u => u.uid === userProfile.uid);
        if (idx !== -1) {
          const storedPass = list[idx].password || 'password123';
          if (storedPass !== current) {
            return { success: false, message: 'Inclement validation check - old password incorrect.' };
          }
          list[idx].password = newP;
          localStorage.setItem('duellio-users', JSON.stringify(list));
          return { success: true, message: 'Password database updated successfully!' };
        }
      } catch (e) {
        return { success: false, message: 'Fidelity encryption mismatch.' };
      }
    }
    return { success: false, message: 'User profile not found in credentials db.' };
  };

  // Switch / Swap Profile instantly
  const handleSwitchProfile = (uid: string) => {
    const raw = localStorage.getItem('duellio-users');
    if (raw) {
      try {
        const list = JSON.parse(raw) as (UserProfile & { password?: string })[];
        const found = list.find(u => u.uid === uid);
        if (found) {
          setUserProfile(found);
          localStorage.setItem('duellio-current-user-uid', uid);
        }
      } catch (e) {}
    }
  };

  // Delete Guest / Device Profile
  const handleDeleteProfile = (uid: string) => {
    const raw = localStorage.getItem('duellio-users');
    if (!raw) return;
    try {
      const list = JSON.parse(raw) as (UserProfile & { password?: string })[];
      if (list.length <= 1) {
        alert("🔒 Identity Vault Core Requirement: At least one user profile must persist on client device.");
        return;
      }
      const updated = list.filter(u => u.uid !== uid);
      localStorage.setItem('duellio-users', JSON.stringify(updated));
      setAllProfiles(updated.map(({ password, ...u }) => u));
      
      if (userProfile?.uid === uid) {
        const nextUser = updated[0];
        setUserProfile(nextUser);
        localStorage.setItem('duellio-current-user-uid', nextUser.uid);
      }
    } catch (e) {}
  };

  // Register New device profile with automatic 1000 Starting Coins
  const handleAddProfile = (username: string, email: string, pass: string, avatar: string) => {
    const raw = localStorage.getItem('duellio-users');
    let list: (UserProfile & { password?: string })[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (e) {}
    }

    const duplicateUser = list.some(u => u.username.toLowerCase() === username.toLowerCase());
    const duplicateEmail = list.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (duplicateUser) {
      return { success: false, message: `Username "${username}" is already registered on this device.` };
    }
    if (duplicateEmail) {
      return { success: false, message: `Email "${email}" is already registered on this device.` };
    }

    const newUser: UserProfile & { password?: string } = {
      uid: `user_${Math.floor(100000 + Math.random() * 900000)}`,
      username,
      email,
      avatar,
      wins: 0,
      losses: 0,
      draws: 0,
      coins: 1000, // mandatory 1,000 Starting Coins rule!
      status: 'online',
      password: pass
    };

    list.push(newUser);
    localStorage.setItem('duellio-users', JSON.stringify(list));
    
    // Welcome Credit transaction
    const bonusTx: WalletTransaction = {
      id: `TX-RECOM-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'credit',
      amount: 1000,
      description: 'Onboarding welcome bonus preloaded',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTransactions(prev => [bonusTx, ...prev]);

    setUserProfile(newUser);
    localStorage.setItem('duellio-current-user-uid', newUser.uid);
    setAllProfiles(list.map(({ password, ...u }) => u));

    return { success: true, message: 'Onboarding successful with 1,000 Coins credited!', user: newUser };
  };

  // High fidelity quick state connectors
  const [preselectedGame, setPreselectedGame] = useState<'Chess' | 'Ludo' | 'Whot' | null>(null);
  const [suggestedStake, setSuggestedStake] = useState<number>(300);

  // Friend Link challenge states
  const [friendInvite, setFriendInvite] = useState<{
    game: 'Chess' | 'Ludo' | 'Whot';
    stake: number;
    sender: string;
  } | null>(null);

  const [friendChallenge, setFriendChallenge] = useState<{
    senderName: string;
    gameType: 'Chess' | 'Ludo' | 'Whot';
    entryFee: number;
    opponentType?: 'bot' | 'player';
    botDifficulty?: 'easy' | 'medium' | 'hard';
    rewardMultiplier?: number;
  } | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasInvite = params.get('friendInvite') === 'true' || params.get('invite') === 'true';
    const inviteGame = params.get('game');
    const inviteStake = params.get('stake');
    const inviteSender = params.get('sender');

    if (hasInvite && inviteGame && inviteStake && inviteSender) {
      const validGames = ['Chess', 'Ludo', 'Whot'];
      const gameType = validGames.includes(inviteGame) ? (inviteGame as 'Chess' | 'Ludo' | 'Whot') : 'Chess';
      const stakeVal = Math.max(100, Math.min(1000, parseInt(inviteStake) || 300));
      
      setFriendInvite({
        game: gameType,
        stake: stakeVal,
        sender: inviteSender
      });
    }
  }, []);

  // Direct card-to-matchmaker connector
  const handleSelectGameFromDiscover = (gameType: 'Chess' | 'Ludo' | 'Whot', stake: number) => {
    setPreselectedGame(gameType);
    setSuggestedStake(stake);
    setActiveTab('lobbies');
  };

  // Faucet claim quick trigger
  const handleHeaderFaucet = () => {
    if (!userProfile) return;
    const claimAmount = 1000;
    const newTx: WalletTransaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'credit',
      amount: claimAmount,
      description: 'Lobby Header Faucet Credit Claim',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setUserProfile(prev => prev ? ({ ...prev, coins: prev.coins + claimAmount }) : null);
    setTransactions(prev => [newTx, ...prev]);
  };

  const handleLaunchArenaMatch = (matchData: {
    gameType: 'Chess' | 'Ludo' | 'Whot';
    opponentType: 'bot' | 'player';
    botDifficulty?: 'easy' | 'medium' | 'hard';
    entryFee: number;
    opponentName: string;
    multiplier: number;
  }) => {
    setFriendChallenge({
      senderName: matchData.opponentName,
      gameType: matchData.gameType,
      entryFee: matchData.entryFee,
      opponentType: matchData.opponentType,
      botDifficulty: matchData.botDifficulty,
      rewardMultiplier: matchData.multiplier
    });
    setActiveTab('lobbies');
  };

  if (!userProfile) {
    return (
      <AuthEntrancePortal
        onLoginSuccess={(user) => {
          setUserProfile(user);
        }}
        onRegisterSuccess={(user) => {
          setUserProfile(user);
        }}
        allProfiles={allProfiles}
        onAddProfile={handleAddProfile}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[#070709] text-neutral-100 font-sans antialiased pb-12 selection:bg-purple-500/30 selection:text-white ${theme}`} id="applet-viewport">
      
      {/* Sticky Premium Glowing Navigation Header Bar matches Screenshot layouts exactly */}
      <header className="sticky top-0 z-40 bg-[#0B0B0E]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.4)] px-4 md:px-8 py-4 flex flex-col lg:flex-row justify-between items-center gap-4">
        
        {/* Logo and network metadata indicator */}
        <div className="flex items-center gap-3 select-none">
          <div 
            onClick={() => setActiveTab('discover')}
            className="cursor-pointer hover:scale-105 transition-transform duration-250 shrink-0"
          >
            <DuellioLogo size={46} showText={false} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span 
                onClick={() => setActiveTab('discover')}
                className="cursor-pointer text-xl font-extrabold text-white tracking-[0.2em] font-display text-glow-purple"
              >
                DUELLIO
              </span>
              <span className="bg-emerald-500/20 border border-emerald-500/35 px-2 py-0.5 rounded-full text-[9px] font-mono text-emerald-400 font-bold uppercase animate-pulse">
                PRO NETWORK LIVE
              </span>
            </div>
            <p className="text-[9px] font-mono text-neutral-500">Zero-Trust Matchmaker • FIDE & Whot Certified</p>
          </div>
        </div>

        {/* Dynamic Centered Navigation Tabs */}
        <nav className="flex items-center bg-[#0F0F13] p-1.5 rounded-2xl border border-white/[0.04] text-xs font-display">
          <button
            onClick={() => { setActiveTab('discover'); setPreselectedGame(null); }}
            className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'discover'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Compass className="w-4 h-4" />
            Discover
          </button>

          <button
            onClick={() => { setActiveTab('play-arena'); setPreselectedGame(null); }}
            className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'play-arena'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Play Arena
          </button>

          <button
            onClick={() => { setActiveTab('tournaments'); setPreselectedGame(null); }}
            className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'tournaments'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Tournaments
          </button>

          <button
            onClick={() => setActiveTab('lobbies')}
            className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'lobbies'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Swords className="w-4 h-4" />
            Lobbies
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setPreselectedGame(null); }}
            className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'profile'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <User className="w-4 h-4" />
            My Profile
          </button>
        </nav>

        {/* Wallet action, faucet and profile image link on right */}
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="flex items-center justify-center p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition-all cursor-pointer font-sans"
            id="theme-mode-toggle"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          <button 
            onClick={handleHeaderFaucet}
            title="Instant Faucet Claim"
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all cursor-pointer font-mono text-xs font-bold"
          >
            <Coins className="w-4 h-4 animate-bounce" />
            <span>Claim +1,000</span>
          </button>

          <div 
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2.5 cursor-pointer bg-neutral-900 hover:bg-neutral-850 py-1.5 pl-2.5 pr-4 rounded-full border border-neutral-800 transition-all select-none group"
          >
            <div className="p-0.5 rounded-full border border-purple-500/60 ring-2 ring-purple-500/20 overflow-hidden w-8 h-8">
              <img 
                src={userProfile?.avatar || ''} 
                alt="Me" 
                className="w-full h-full rounded-full object-cover" 
              />
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-[11px] text-white font-bold font-display group-hover:text-purple-300 transition-colors leading-none tracking-tight truncate max-w-[80px]">
                {userProfile?.username || ''}
              </span>
              <strong className="text-[10px] text-purple-300 font-mono leading-none font-bold block mt-0.5">
                {(userProfile?.coins || 0).toLocaleString()} Coins
              </strong>
            </div>
          </div>
        </div>

      </header>

      {/* Main viewport */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18 }}
          >
            {/* Discover View */}
            {activeTab === 'discover' && (
              <DiscoverTab 
                onSelectGame={handleSelectGameFromDiscover} 
                userCoins={userProfile.coins} 
              />
            )}

            {/* Play Arena View */}
            {activeTab === 'play-arena' && (
              <PlayArenaTab 
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                onLaunchMatch={handleLaunchArenaMatch}
              />
            )}

            {/* Tournaments View */}
            {activeTab === 'tournaments' && (
              <TournamentsTab />
            )}

            {/* Matchmaking Lobbies and actual Games simulation View */}
            {activeTab === 'lobbies' && (
              <PhaseSandboxTab 
                userProfile={userProfile} 
                setUserProfile={setUserProfile}
                transactions={transactions}
                setTransactions={setTransactions}
                // We will hook these up to auto trigger challenges
                preselectedGame={preselectedGame}
                setPreselectedGame={setPreselectedGame}
                suggestedStake={suggestedStake}
                friendChallenge={friendChallenge}
                setFriendChallenge={setFriendChallenge}
              />
            )}

            {/* Player Achievements / Profiles View */}
            {activeTab === 'profile' && userProfile && (
              <ProfileTab 
                userProfile={userProfile} 
                transactions={transactions} 
                onLogout={handleLogout}
                onChangePassword={handleChangePassword}
                onDeleteProfile={handleDeleteProfile}
                onAddProfile={handleAddProfile}
                onSwitchProfile={handleSwitchProfile}
                allProfiles={allProfiles}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Absolute Overlay for Friend Invitations via Shared Links */}
      <AnimatePresence>
        {friendInvite && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -15, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-[#0B0B0F] border border-purple-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full text-center relative shadow-[0_0_50px_rgba(147,51,234,0.15)] space-y-6"
            >
              {/* Glowing purple badge indicator */}
              <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 shadow-[0_0_20px_rgba(147,51,234,0.2)]">
                <Swords className="w-8 h-8 text-purple-400" />
              </div>

              <div className="space-y-2">
                <span className="bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-[10px] font-mono text-purple-300 font-bold uppercase tracking-widest leading-none">
                  Incoming Game Invitation
                </span>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight font-display mt-2">
                  Challenge from <span className="text-purple-400 font-extrabold">{friendInvite.sender}</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Accept the stakes and enter the Duellio Smart P2P Matchmaker Arena instantly.
                </p>
              </div>

              {/* Match setup status indicators */}
              <div className="bg-[#121217] rounded-2xl p-4.5 border border-white/[0.04] text-left space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-medium font-sans">Selected Arena:</span>
                  <span className="text-white font-bold font-display uppercase tracking-wider">{friendInvite.game} Board</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-medium font-sans">Match Stakes:</span>
                  <span className="text-purple-300 font-bold font-mono text-sm">{friendInvite.stake} Coins</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-medium font-sans">Onboarding Bonus:</span>
                  <span className="text-emerald-400 font-mono font-bold uppercase text-[10px]">Claimed +1,000 Coins Setup Benefit</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2 font-sans">
                <button
                  onClick={() => {
                    // Claim faucet coins immediately so user has plenty of funds to join
                    const bonusCoins = 1000;
                    setUserProfile(prev => ({
                      ...prev,
                      coins: prev.coins + bonusCoins
                    }));
                    setTransactions(prev => [
                      {
                        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
                        type: 'credit' as const,
                        amount: bonusCoins,
                        description: `Claimed Welcome Stake Credit: From ${friendInvite.sender}`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      },
                      ...prev
                    ]);

                    // Activate the lobby and friend challenge match trigger
                    setFriendChallenge({
                      senderName: friendInvite.sender,
                      gameType: friendInvite.game,
                      entryFee: friendInvite.stake
                    });
                    setActiveTab('lobbies');
                    
                    // Clean memory and URL parameters without refreshing
                    setFriendInvite(null);
                    window.history.replaceState({}, document.title, window.location.pathname);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-purple-800 hover:from-purple-450 hover:to-purple-750 text-white font-black text-sm rounded-xl cursor-pointer transition-all shadow-lg hover:scale-[1.02] select-none uppercase tracking-wider"
                >
                  Accept Stakes & Duel Now
                </button>
                <button
                  onClick={() => {
                    setFriendInvite(null);
                    window.history.replaceState({}, document.title, window.location.pathname);
                  }}
                  className="w-full py-2.5 bg-neutral-900/60 hover:bg-neutral-850 border border-white/[0.05] hover:border-white/[0.1] text-neutral-400 hover:text-white font-medium text-xs rounded-xl cursor-pointer transition-all select-none uppercase tracking-wider"
                >
                  Ignore Challenge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

