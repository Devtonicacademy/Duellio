/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, 
  Users, 
  UserCheck,
  Bot, 
  Trophy, 
  Coins, 
  Sparkles, 
  Gamepad2, 
  TrendingUp,
  ChevronRight,
  ShieldAlert,
  Brain,
  MessageSquare,
  Link,
  Copy,
  Minus,
  Plus,
  Check,
  X,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { UserProfile, WalletTransaction } from '../types';
import { db } from '../firebase';
import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { sanitizeFirestoreData } from '../utils/firestoreSanitizer';

interface PlayArenaTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onLaunchMatch: (matchData: {
    gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe';
    opponentType: 'bot' | 'player';
    botDifficulty?: 'easy' | 'medium' | 'hard';
    entryFee: number;
    opponentName: string;
    multiplier: number;
    sessionId?: string;
    ludoMode?: '2-player' | '4-player';
  }) => void;
  allProfiles: UserProfile[];
  preselectedGame?: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | null;
  setPreselectedGame?: React.Dispatch<React.SetStateAction<'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | null>>;
}

const AVAILABLE_GAMES = [
  {
    id: 'Chess' as const,
    name: 'Cyber Chess Arena',
    metric: 'FIDE Rated Elo',
    desc: 'Deep algorithmic turn strategy. Includes real-time 3D rotation cameras, interactive chess rule validation, algebraic notation logs, and check status detection.',
    icon: '/assets/chess_icon.png',
    difficultyRecommendation: 'High Strategy Level',
    color: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20',
    image: '/assets/chess_bg.png',
    gradientBg: 'from-cyan-500/30 via-blue-500/10 to-transparent'
  },
  {
    id: 'Ludo' as const,
    name: 'Cyber Ludo Quadrant',
    metric: '4-Player Path Matrix',
    desc: 'Holographic coordinate piece tracker. Throw virtual high-precision physics dice cubes, spawn base tokens, slide along pathways, and capture enemy pieces.',
    icon: '/assets/ludo_icon.png',
    difficultyRecommendation: 'Casual & Tactical Strategy',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
    image: '/assets/ludo_bg.png',
    gradientBg: 'from-emerald-500/30 via-teal-500/10 to-transparent'
  },
  {
    id: 'Whot' as const,
    name: 'Cyber Whot Card Table',
    metric: 'Nigerian Whot Standard',
    desc: 'Hyper-responsive hand management. Features "Market" card draws, specialized action card sequences (Hold On, Pick Two, Pick Three, Whot wildcards), and recursive deck recycling.',
    icon: '/assets/whot_icon.png',
    difficultyRecommendation: 'High Reflex & Card Skill',
    color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
    image: '/assets/whot_bg.png',
    gradientBg: 'from-purple-500/30 via-pink-500/10 to-transparent'
  },
  {
    id: 'Draft' as const,
    name: 'Cyber Drafts Matrix',
    metric: '8x8 Checkers Grid',
    desc: 'Neon diagonal tactical warfare. Command your light tokens across the dark matrix grid, perform diagonal jumps, capture enemy nodes, and secure King elevations.',
    icon: '/assets/draft_icon.png',
    difficultyRecommendation: 'Mid Strategy Level',
    color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
    image: '/assets/draft_bg.png',
    gradientBg: 'from-amber-500/30 via-orange-500/10 to-transparent'
  },
  {
    id: 'TicTacToe' as const,
    name: 'Cyber Tic-Tac-Toe Grid',
    metric: '3x3 Holographic Matrix',
    desc: 'Rapid tactical alignment duel. Command neon X and O nodes across an illuminated cybernetic grid. Features Minimax unbeatable bot AI, live move history feeds, and instant match stakes.',
    icon: '/assets/tictactoe_icon.png',
    difficultyRecommendation: 'Fast-Paced Strategy',
    color: 'from-sky-500/10 to-indigo-500/10 border-sky-500/20',
    image: '/assets/tictactoe_bg.png',
    gradientBg: 'from-sky-500/30 via-indigo-500/10 to-transparent'
  }
];

export const PlayArenaTab: React.FC<PlayArenaTabProps> = ({
  userProfile,
  setUserProfile,
  onLaunchMatch,
  allProfiles,
  preselectedGame,
  setPreselectedGame
}) => {
  const [selectedGame, setSelectedGame] = useState<'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | null>(null);
  const [opponentStyle, setOpponentStyle] = useState<'bot' | 'player'>('bot');
  const [botPlayMode, setBotPlayMode] = useState<'practice' | 'staked'>('staked');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [stake, setStake] = useState<number>(250);
  const [ludoMode, setLudoMode] = useState<'2-player' | '4-player'>('2-player');

  // Sync preselected game if coming from discover tab or header
  useEffect(() => {
    if (preselectedGame) {
      setSelectedGame(preselectedGame);
      if (setPreselectedGame) {
        setPreselectedGame(null);
      }
    }
  }, [preselectedGame, setPreselectedGame]);
  
  // Available other live players from allProfiles (excluding current user)
  const onlinePlayers = allProfiles.filter(p => p.uid !== userProfile.uid);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string>(onlinePlayers[0]?.uid || '');

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedGame(null);
      }
    };
    if (selectedGame) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedGame]);

  // Calculate bot multiplier modifier
  const getMultiplier = () => {
    if (opponentStyle === 'player') return 1.0;
    if (botPlayMode === 'practice') {
      if (difficulty === 'easy') return 1.0;
      if (difficulty === 'medium') return 1.5;
      return 2.5;
    }
    return 1.0;
  };

  const selectedOpponent = onlinePlayers.find(p => p.uid === selectedPlayerUid) || onlinePlayers[0];

  const handleLaunch = () => {
    if (!selectedGame) return;

    const isPractice = opponentStyle === 'bot' && botPlayMode === 'practice';
    const actualStake = isPractice ? 0 : stake;

    if (userProfile.coins < actualStake) {
      alert(`Stake Lock Error: You have ${userProfile.coins} coins but the entry stake is ${actualStake}. Please use the "+" Claim Faucet button at the top header to get immediate coins.`);
      return;
    }

    const { origin, pathname } = window.location;
    const multiplier = isPractice ? 0 : getMultiplier();
    const opponentName = opponentStyle === 'bot' 
      ? (isPractice ? `Nebula_AI (${difficulty.toUpperCase()}) [PRACTICE]` : 'Nebula_AI') 
      : (selectedOpponent?.username || 'Challenger');

    let sessionId: string | undefined = undefined;
    if (opponentStyle === 'player') {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const inviteLink = `${origin}${pathname}?friendInvite=true&game=${selectedGame}&stake=${actualStake}&sender=${encodeURIComponent(userProfile.username)}&sessionId=${sessionId}`;
      try {
        navigator.clipboard.writeText(inviteLink);
      } catch (err) {
        console.warn("Clipboard access error:", err);
      }

      // If a specific opponent was selected, dispatch direct challenge message
      if (selectedOpponent?.uid) {
        const chatId = userProfile.uid < selectedOpponent.uid
          ? `${userProfile.uid}_${selectedOpponent.uid}`
          : `${selectedOpponent.uid}_${userProfile.uid}`;

        const chatRef = doc(db, 'chats', chatId);
        setDoc(chatRef, sanitizeFirestoreData({
          id: chatId,
          users: [userProfile.uid, selectedOpponent.uid],
          lastMessage: `Staked Duel Challenge: ${selectedGame}`,
          timestamp: serverTimestamp()
        }), { merge: true }).catch(console.error);

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        addDoc(messagesRef, sanitizeFirestoreData({
          senderId: userProfile.uid,
          senderName: userProfile.username,
          senderAvatar: userProfile.avatar || '',
          text: `Staked Duel Challenge: ${selectedGame}`,
          timestamp: serverTimestamp(),
          isChallenge: true,
          challengeId: `CHALL-CHAT-${Date.now()}`,
          sessionId: sessionId,
          gameType: selectedGame,
          entryFee: actualStake,
          challengeStatus: 'pending'
        })).catch(console.error);
      }

      // Dispatch Real-time Notification Document to target player in Firestore
      const notifRef = collection(db, 'notifications');
      addDoc(notifRef, sanitizeFirestoreData({
        receiverId: selectedOpponent?.uid || 'all',
        receiverName: opponentName || 'Opponent',
        senderId: userProfile.uid || 'host',
        senderName: userProfile.username || 'Challenger',
        senderAvatar: userProfile.avatar || '',
        type: 'challenge',
        title: '⚔️ Live Duel Challenge Received!',
        message: `${userProfile.username} has challenged you to a ${selectedGame} match for ${actualStake} Coins!`,
        gameType: selectedGame,
        entryFee: actualStake,
        sessionId: sessionId,
        timestamp: Date.now(),
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        status: 'pending'
      })).catch(console.warn);

      alert(`🎉 Multiplayer Match Ready!\n\nInvitation sent to ${opponentName}!\n\nInvite link also copied to clipboard:\n${inviteLink}`);
    }

    const effectiveBotDifficulty = opponentStyle === 'bot'
      ? (!isPractice ? 'hard' : difficulty)
      : undefined;

    onLaunchMatch({
      gameType: selectedGame,
      opponentType: opponentStyle,
      botDifficulty: effectiveBotDifficulty,
      entryFee: actualStake,
      opponentName,
      multiplier,
      sessionId,
      ludoMode: selectedGame === 'Ludo' ? ludoMode : undefined
    });

    setSelectedGame(null);
  };

  return (
    <div className="space-y-8" id="play-arena-dashboard">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <span className="bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
            Atomic Multi-Game Matchmaker
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight font-display mt-2 flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-purple-400" />
            Play Duel Arena
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Choose Chess, Ludo, or Whot. Play against zero-trust AI Bots with incremental difficulty score boosts, or lock atomic stakes with live peer users.
          </p>
        </div>
        <div className="glass-bento p-3 px-5 rounded-2xl flex items-center gap-3.5 shadow-lg border border-white/10">
          <div className="bg-purple-500/20 p-2.5 rounded-xl border border-purple-500/30">
            <Coins className="w-5 h-5 text-purple-300 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest leading-none">Your Escrow Holdings</span>
            <strong className="text-xl font-bold font-mono text-white tracking-tight mt-0.5 block">
              {userProfile.coins.toLocaleString()} Coins
            </strong>
          </div>
        </div>
      </div>

      {/* Main Column View */}
      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* Game Selection list */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2 mb-2 font-display">
            <span>1.</span> Select Game Board
          </h2>
          
          <div className="flex flex-col gap-4">
            {AVAILABLE_GAMES.map((game) => {
              const isActive = selectedGame === game.id;
              return (
                <div
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  id={`arena-game-card-${game.id}`}
                  className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer select-none flex flex-col md:flex-row items-center gap-6 p-6 ${
                    isActive 
                      ? 'glass-bento border-purple-500/80 shadow-[0_0_30px_rgba(168,85,247,0.25)] ring-2 ring-purple-500/40' 
                      : 'glass-bento glass-bento-hover border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Background element */}
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={game.image} 
                      alt={game.name}
                      className="w-full h-full object-cover transition-all duration-500 brightness-90"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-neutral-950/70 group-hover:bg-neutral-950/60 transition-colors duration-300" />
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-r ${game.gradientBg}`}
                      animate={{
                        opacity: isActive ? [0.4, 0.6, 0.4] : 0.2,
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 4,
                        ease: "easeInOut"
                      }}
                    />
                  </div>

                  {/* Icon Container with Floating / Pulsing animation */}
                  <motion.div 
                    className="relative z-10 w-16 h-16 md:w-20 md:h-20 bg-neutral-900/80 rounded-2xl flex items-center justify-center border border-white/[0.08] backdrop-blur-md overflow-hidden shrink-0"
                    animate={isActive ? {
                      y: [0, -6, 0],
                      scale: [1, 1.05, 1],
                      borderColor: ["rgba(255,255,255,0.08)", "rgba(168,85,247,0.5)", "rgba(255,255,255,0.08)"]
                    } : {
                      y: 0,
                      scale: 1,
                      borderColor: "rgba(255,255,255,0.08)"
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut"
                    }}
                  >
                    <img 
                      src={game.icon} 
                      alt={`${game.name} Icon`} 
                      className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]" 
                    />
                  </motion.div>

                  {/* Center info */}
                  <div className="relative z-10 flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className={`text-base font-black font-display tracking-tight transition-colors ${isActive ? 'text-purple-300' : 'text-white'}`}>
                        {game.name}
                      </h3>
                      <span className="text-[9px] font-mono font-bold text-cyan-300 uppercase tracking-wider bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                        {game.metric}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-purple-300 uppercase tracking-wider bg-purple-950/60 border border-purple-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                        Standard Stakes Active
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans line-clamp-2">
                      {game.desc}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-neutral-400">
                      <span className="bg-neutral-950/60 border border-white/[0.05] px-2 py-0.5 rounded-sm">
                        {game.difficultyRecommendation}
                      </span>
                    </div>
                  </div>

                  {/* Right Action */}
                  <div className="relative z-10 flex flex-col items-end shrink-0 gap-2">
                    <button
                      type="button"
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 cursor-pointer select-none ${
                        isActive 
                          ? 'bg-purple-350 text-[#070709] shadow-[0_0_15px_rgba(235,211,255,0.2)] font-black'
                          : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {isActive ? 'Configure Arena' : 'Select Game'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Stats banner */}
          <div className="bg-[#0F0F13] rounded-2xl p-4.5 border border-white/[0.03] flex items-center gap-4">
            <div className="bg-emerald-500/15 p-2 rounded-xl text-emerald-400">
              <Trophy className="w-5 h-5 animate-bounce" />
            </div>
            <div className="font-sans">
              <p className="text-xs text-neutral-405">
                You currently have <strong className="text-white font-black">{userProfile.wins}</strong> victory nodes secured across tournaments and sandbox modules.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Match Settings Modal overlay */}
      <AnimatePresence>
        {selectedGame && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-match-title"
          >
            {/* Backdrop with animated fade-in */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedGame(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Container — slides up from bottom on mobile, centered on desktop */}
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              className="relative bg-[#0B0B0F] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 md:p-7 max-w-lg w-full shadow-[0_25px_60px_rgba(0,0,0,0.85)] space-y-5 max-h-[92vh] sm:max-h-[88vh] overflow-y-auto z-10 custom-scrollbar text-white"
              id="matchmaker-parameter-card"
            >
              {/* ── Modal Header with game banner & artwork ── */}
              {(() => {
                const activeGame = AVAILABLE_GAMES.find(g => g.id === selectedGame);
                const isPractice = opponentStyle === 'bot' && botPlayMode === 'practice';
                const actualStake = isPractice ? 0 : stake;
                const isInsufficient = userProfile.coins < actualStake;
                const shortfall = actualStake - userProfile.coins;

                return (
                  <>
                    <div className="relative -mx-5 sm:-mx-6 md:-mx-7 -mt-5 sm:-mt-6 md:-mt-7 mb-1 overflow-hidden rounded-t-3xl border-b border-white/[0.08]">
                      {/* Game background image banner */}
                      <div className="h-28 sm:h-32 relative">
                        <img
                          src={activeGame?.image}
                          alt={activeGame?.name}
                          className="w-full h-full object-cover brightness-90"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/70 to-transparent" />
                        <div className={`absolute inset-0 bg-gradient-to-r ${activeGame?.gradientBg} opacity-50`} />
                      </div>

                      {/* Close button overlaid on banner */}
                      <button 
                        type="button"
                        onClick={() => setSelectedGame(null)}
                        aria-label="Close setup modal"
                        className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/85 flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer border border-white/15 hover:scale-105 active:scale-95 shadow-md z-20"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Title overlaid at bottom of banner */}
                      <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-6 md:px-7 pb-3.5 flex items-end justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-white/15 flex items-center justify-center shrink-0 shadow-lg p-1.5">
                            <img src={activeGame?.icon} alt="" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                                Match Setup
                              </span>
                              <span className="text-[9px] font-mono text-neutral-400 hidden sm:inline-block">
                                {activeGame?.metric}
                              </span>
                            </div>
                            <h2 id="modal-match-title" className="text-base sm:text-lg font-black text-white tracking-tight font-display truncate mt-0.5">
                              {activeGame?.name}
                            </h2>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Opponent Mode Selector Cards ── */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                          1. Choose Opponent Type
                        </label>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {opponentStyle === 'bot' ? '🤖 vs AI Bot' : '👤 vs Live Player'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Bot Selection Card */}
                        <button
                          type="button"
                          onClick={() => setOpponentStyle('bot')}
                          className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                            opponentStyle === 'bot'
                              ? 'bg-gradient-to-b from-purple-500/15 via-purple-500/5 to-transparent border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.18)] ring-1 ring-purple-500/40'
                              : 'bg-neutral-900/60 border-white/[0.06] hover:border-white/20 hover:bg-neutral-850/80 text-neutral-400'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className={`p-2 rounded-xl border transition-colors ${
                              opponentStyle === 'bot'
                                ? 'bg-purple-500/25 border-purple-400/40 text-purple-300'
                                : 'bg-neutral-950 border-white/5 text-neutral-400 group-hover:text-white'
                            }`}>
                              <Bot className="w-5 h-5" />
                            </div>
                            {opponentStyle === 'bot' && (
                              <span className="bg-purple-400 text-neutral-950 p-0.5 rounded-full font-bold text-[9px] shadow-sm">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <div>
                            <span className={`text-xs font-bold font-display block ${opponentStyle === 'bot' ? 'text-white' : 'text-neutral-300'}`}>
                              VS AI Bot
                            </span>
                            <span className="text-[10px] text-neutral-400 font-sans block mt-0.5 leading-snug">
                              Instant zero-trust battle
                            </span>
                          </div>
                        </button>

                        {/* Human Selection Card */}
                        <button
                          type="button"
                          onClick={() => setOpponentStyle('player')}
                          className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                            opponentStyle === 'player'
                              ? 'bg-gradient-to-b from-cyan-500/15 via-cyan-500/5 to-transparent border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/40'
                              : 'bg-neutral-900/60 border-white/[0.06] hover:border-white/20 hover:bg-neutral-850/80 text-neutral-400'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className={`p-2 rounded-xl border transition-colors ${
                              opponentStyle === 'player'
                                ? 'bg-cyan-500/25 border-cyan-400/40 text-cyan-300'
                                : 'bg-neutral-950 border-white/5 text-neutral-400 group-hover:text-white'
                            }`}>
                              <Users className="w-5 h-5" />
                            </div>
                            {opponentStyle === 'player' && (
                              <span className="bg-cyan-400 text-neutral-950 p-0.5 rounded-full font-bold text-[9px] shadow-sm">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <div>
                            <span className={`text-xs font-bold font-display block ${opponentStyle === 'player' ? 'text-white' : 'text-neutral-300'}`}>
                              Live Duel
                            </span>
                            <span className="text-[10px] text-neutral-400 font-sans block mt-0.5 leading-snug">
                              Challenge players & friends
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* ── Ludo Quadrant Mode Selector ── */}
                    {selectedGame === 'Ludo' && (
                      <div className="space-y-2 animate-fade-in bg-emerald-500/[0.04] border border-emerald-500/20 p-3.5 rounded-2xl">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider block">
                            Ludo Match Type
                          </label>
                          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                            {ludoMode === '2-player' ? '2-Player Mode' : '4-Player Mode'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-1 bg-[#070709] rounded-xl border border-white/[0.04]">
                          <button
                            type="button"
                            onClick={() => setLudoMode('2-player')}
                            className={`py-2 rounded-lg font-bold text-[11px] font-display flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              ludoMode === '2-player'
                                ? 'bg-amber-400 text-neutral-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            2 Players (2 Quadrants)
                          </button>
                          <button
                            type="button"
                            onClick={() => setLudoMode('4-player')}
                            className={`py-2 rounded-lg font-bold text-[11px] font-display flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              ludoMode === '4-player'
                                ? 'bg-cyan-400 text-neutral-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            4 Players (1 Quadrant)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Bot Configuration Sub-panel ── */}
                    {opponentStyle === 'bot' && (
                      <div className="space-y-3 bg-purple-500/[0.03] border border-purple-500/15 p-3.5 rounded-2xl">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider block">
                            Bot Mode & Difficulty
                          </label>
                          <span className="text-[9px] font-mono text-purple-400">
                            {botPlayMode === 'practice' ? `Practice (${difficulty.toUpperCase()})` : 'Staked Match'}
                          </span>
                        </div>

                        {/* Practice vs Staked pills */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-[#070709] rounded-xl border border-white/[0.04]">
                          <button
                            type="button"
                            onClick={() => setBotPlayMode('practice')}
                            className={`py-2 rounded-lg font-bold text-[11px] font-display transition-all cursor-pointer ${
                              botPlayMode === 'practice'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            Practice (0 Stake)
                          </button>
                          <button
                            type="button"
                            onClick={() => setBotPlayMode('staked')}
                            className={`py-2 rounded-lg font-bold text-[11px] font-display transition-all cursor-pointer ${
                              botPlayMode === 'staked'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            Staked Duel
                          </button>
                        </div>

                        {/* Difficulty cards when in practice mode */}
                        {botPlayMode === 'practice' && (
                          <div className="grid grid-cols-3 gap-2 font-sans pt-1">
                            <button
                              type="button"
                              onClick={() => setDifficulty('easy')}
                              className={`py-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                difficulty === 'easy'
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                  : 'bg-neutral-900/60 border-transparent text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                              }`}
                            >
                              <span className="text-[11px] font-bold font-display">Easy</span>
                              <span className="text-[8px] font-mono text-emerald-400/80">1.0x Score</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDifficulty('medium')}
                              className={`py-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                difficulty === 'medium'
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                  : 'bg-neutral-900/60 border-transparent text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                              }`}
                            >
                              <span className="text-[11px] font-bold font-display">Medium</span>
                              <span className="text-[8px] font-mono text-amber-400/80">1.5x Score</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDifficulty('hard')}
                              className={`py-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                difficulty === 'hard'
                                  ? 'bg-rose-500/15 border-rose-500/45 text-rose-300'
                                  : 'bg-neutral-900/60 border-transparent text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                              }`}
                            >
                              <span className="text-[11px] font-bold font-display">Hard</span>
                              <span className="text-[8px] font-mono text-rose-400/80">2.5x Score</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Human Matchmaking Sub-panel ── */}
                    {opponentStyle === 'player' && (
                      <div className="space-y-3 animate-fade-in bg-cyan-500/[0.03] border border-cyan-500/15 p-3.5 rounded-2xl">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider block">
                            Select Online Player
                          </label>
                          <span className="text-[9px] font-mono text-cyan-400/80">
                            {onlinePlayers.length} Available
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 max-h-36 overflow-y-auto -mx-1 px-1 custom-scrollbar">
                          {onlinePlayers.map((player) => (
                            <div
                              key={player.uid}
                              onClick={() => setSelectedPlayerUid(player.uid)}
                              className={`flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer border select-none ${
                                selectedPlayerUid === player.uid
                                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-sm'
                                  : 'bg-neutral-900/50 border-transparent hover:bg-neutral-850 text-neutral-300'
                              }`}
                            >
                              <img src={player.avatar} alt={player.username} className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" referrerPolicy="no-referrer" />
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-[11px] block truncate leading-none">{player.username}</span>
                                <span className="font-mono text-[8px] text-neutral-400 truncate block mt-0.5">Wins: {player.wins} · {player.coins.toLocaleString()}c</span>
                              </div>
                              {selectedPlayerUid === player.uid && (
                                <span className="text-[9px] bg-cyan-400 text-neutral-950 font-bold px-1.5 py-0.5 rounded-md font-mono uppercase shrink-0 flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  Selected
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Direct Invite Link */}
                        <div className="border-t border-cyan-500/15 pt-3 space-y-1.5">
                          <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider block flex items-center gap-1">
                            <Link className="w-3 h-3" /> Direct Invite Link
                          </span>
                          <div className="flex gap-1.5">
                            <input
                              readOnly
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              value={`${window.location.origin}${window.location.pathname}?friendInvite=true&game=${selectedGame}&stake=${stake}&sender=${encodeURIComponent(userProfile.username)}`}
                              className="flex-1 min-w-0 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-[9px] text-neutral-350 font-mono focus:outline-none selection:bg-cyan-500 selection:text-neutral-950 truncate"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const link = `${window.location.origin}${window.location.pathname}?friendInvite=true&game=${selectedGame}&stake=${stake}&sender=${encodeURIComponent(userProfile.username)}`;
                                try {
                                  navigator.clipboard.writeText(link);
                                } catch (e) {
                                  console.warn("Clipboard copy failed:", e);
                                }
                                alert("📋 Invite link copied!");
                              }}
                              className="px-3 bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-neutral-950 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-sm"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Entry Stake Section ── */}
                    {!(opponentStyle === 'bot' && botPlayMode === 'practice') && (
                      <div className="space-y-3 bg-[#070709] border border-white/[0.06] p-4 rounded-2xl">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-purple-300" />
                            2. Entry Stake
                          </label>
                          <span className="text-[10px] font-mono text-neutral-400">
                            Balance: <strong className="text-white font-bold">{userProfile.coins.toLocaleString()} 🪙</strong>
                          </span>
                        </div>

                        {/* Large stake display with Stepper controls */}
                        <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-xl p-2 px-3">
                          <button
                            type="button"
                            onClick={() => setStake(prev => Math.max(50, prev - 50))}
                            disabled={stake <= 50}
                            className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                            aria-label="Decrease stake"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <div className="text-center font-mono">
                            <div className="text-xl sm:text-2xl font-black text-purple-300 tracking-tight flex items-center justify-center gap-1.5">
                              <span>🪙</span>
                              <span>{stake.toLocaleString()}</span>
                            </div>
                            <span className="text-[9px] text-neutral-500 uppercase tracking-wider block -mt-0.5">Coins per player</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setStake(prev => Math.min(2000, prev + 50))}
                            disabled={stake >= 2000}
                            className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                            aria-label="Increase stake"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Quick Presets */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[100, 250, 500, 1000].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setStake(val)}
                              className={`py-1.5 text-[10px] font-mono font-bold rounded-xl transition-all border cursor-pointer ${
                                stake === val
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                                  : 'bg-neutral-900 hover:bg-neutral-850 border-white/[0.04] text-neutral-400 hover:text-white'
                              }`}
                            >
                              {val >= 1000 ? `${val / 1000}k` : val} 🪙
                            </button>
                          ))}
                        </div>

                        {/* Fine Tuning Slider */}
                        <div className="pt-1">
                          <input 
                            type="range" 
                            min="50" 
                            max="2000" 
                            step="50"
                            value={stake} 
                            onChange={(e) => setStake(Number(e.target.value))}
                            className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-400"
                          />
                          <div className="flex justify-between text-[8px] font-mono text-neutral-500 mt-0.5">
                            <span>Min: 50🪙</span>
                            <span>Max: 2,000🪙</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Insufficient Balance Warning ── */}
                    {isInsufficient && (
                      <div className="bg-rose-500/10 border border-rose-500/30 p-3 sm:p-3.5 rounded-2xl flex items-center gap-3 text-rose-300 text-xs font-sans animate-shake">
                        <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <strong className="block font-bold leading-none text-rose-200">Insufficient Coin Balance</strong>
                          <span className="text-[10px] text-rose-300/90 block mt-0.5">
                            You have <strong>{userProfile.coins}</strong> coins but need <strong>{actualStake}</strong> coins (short by {shortfall}). Use the "+" button at header to claim faucet coins.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ── Match Stake & Payout Summary Card ── */}
                    <div className="bg-[#070709] rounded-2xl p-3.5 sm:p-4 border border-white/[0.06] space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-400">Entry Fee (Per Player):</span>
                        <span className="text-white font-mono font-bold">
                          -{actualStake.toLocaleString()} 🪙
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-400">Match Pool:</span>
                        <span className="text-white font-mono font-bold">
                          {(actualStake * 2).toLocaleString()} 🪙
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-white font-black font-display uppercase text-xs tracking-tight">Winner Take Payout</strong>
                          {opponentStyle === 'bot' && botPlayMode === 'practice' && (
                            <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                              {getMultiplier()}x Score Boost
                            </span>
                          )}
                        </div>
                        <strong className="text-emerald-400 font-mono font-bold text-base sm:text-lg">
                          +{(actualStake * 2).toLocaleString()} 🪙
                        </strong>
                      </div>
                    </div>

                    {/* ── Primary Action Button (CTA) ── */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={handleLaunch}
                        disabled={isInsufficient}
                        className={`w-full py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider sm:tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 relative overflow-hidden group ${
                          isInsufficient
                            ? 'bg-neutral-900/40 backdrop-blur-md text-neutral-500 border border-neutral-700/40 cursor-not-allowed opacity-50 shadow-none'
                            : 'bg-gradient-to-r from-purple-600/35 via-purple-500/25 to-pink-600/35 backdrop-blur-xl border border-purple-400/50 text-white shadow-[0_8px_32px_rgba(168,85,247,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:from-purple-500/50 hover:via-purple-500/40 hover:to-pink-500/50 hover:border-purple-300/80 hover:shadow-[0_12px_40px_rgba(168,85,247,0.45),inset_0_1px_2px_rgba(255,255,255,0.5)] cursor-pointer active:scale-[0.985]'
                        }`}
                      >
                        {/* Glass shine overlay transition */}
                        {!isInsufficient && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
                        )}
                        <Swords className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110 ${!isInsufficient ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(235,211,255,0.6)]' : ''}`} />
                        <span className={!isInsufficient ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]' : ''}>
                          {isInsufficient ? 'Insufficient Balance to Start' : 'Start Duel'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedGame(null)}
                        className="w-full py-1.5 text-center text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel Setup
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
