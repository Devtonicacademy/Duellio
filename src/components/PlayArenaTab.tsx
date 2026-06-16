/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Swords, 
  Users, 
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
  Copy
} from 'lucide-react';
import { UserProfile, WalletTransaction } from '../types';

interface PlayArenaTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onLaunchMatch: (matchData: {
    gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft';
    opponentType: 'bot' | 'player';
    botDifficulty?: 'easy' | 'medium' | 'hard';
    entryFee: number;
    opponentName: string;
    multiplier: number;
    sessionId?: string;
  }) => void;
  allProfiles: UserProfile[];
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
  }
];

export const PlayArenaTab: React.FC<PlayArenaTabProps> = ({
  userProfile,
  setUserProfile,
  onLaunchMatch,
  allProfiles
}) => {
  const [selectedGame, setSelectedGame] = useState<'Chess' | 'Ludo' | 'Whot' | 'Draft' | null>(null);
  const [opponentStyle, setOpponentStyle] = useState<'bot' | 'player'>('bot');
  const [botPlayMode, setBotPlayMode] = useState<'practice' | 'staked'>('staked');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [stake, setStake] = useState<number>(250);
  
  // Available other live players from allProfiles (excluding current user)
  const onlinePlayers = allProfiles.filter(p => p.uid !== userProfile.uid);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string>(onlinePlayers[0]?.uid || '');

  // Calculate bot multiplier modifier
  // Easy: Stake * 2.0 payout (basic 1x return)
  // Medium: Stake * 2.5 payout
  // Hard: Stake * 3.5 payout (high difficulty high reward!)
  const getMultiplier = () => {
    if (opponentStyle === 'player') return 1.0;
    if (difficulty === 'easy') return 1.0;
    if (difficulty === 'medium') return 1.5;
    return 2.5;
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
      ? `Nebula_AI (${difficulty.toUpperCase()})${isPractice ? ' [PRACTICE]' : ''}` 
      : (selectedOpponent?.username || 'Challenger');

    let sessionId: string | undefined = undefined;
    if (opponentStyle === 'player') {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const inviteLink = `${origin}${pathname}?friendInvite=true&game=${selectedGame}&stake=${actualStake}&sender=${encodeURIComponent(userProfile.username)}&sessionId=${sessionId}`;
      navigator.clipboard.writeText(inviteLink);
      alert(`🎉 Multiplayer Match Ready!\n\nWe copied the invitation link to your clipboard:\n\n${inviteLink}\n\nShare this link with your challenger to start instantly!`);
    }

    onLaunchMatch({
      gameType: selectedGame,
      opponentType: opponentStyle,
      botDifficulty: opponentStyle === 'bot' ? difficulty : undefined,
      entryFee: actualStake,
      opponentName,
      multiplier,
      sessionId
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
        <div className="bg-[#0F0F13] border border-white/[0.05] p-3 px-5 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/25">
            <Coins className="w-5 h-5 text-purple-300 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-none">Your Escrow Holdings</span>
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
                  className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer select-none flex flex-col md:flex-row items-center gap-6 p-6 ${
                    isActive 
                      ? 'bg-purple-500/[0.04] border-purple-500/70 shadow-[0_0_25px_rgba(147,51,234,0.15)] ring-1 ring-purple-500/20' 
                      : 'bg-[#0B0B0E]/60 border-white/[0.05] hover:border-white/[0.12] hover:bg-[#0B0B0E]/80 hover:-translate-y-0.5'
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
      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop with animate fade-in */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedGame(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container — slides up from bottom on mobile, centered on desktop */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative bg-[#0B0B0F] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4 sm:space-y-5 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto z-10"
            id="matchmaker-parameter-card"
          >
            {/* ── Modal Header with game banner ── */}
            {(() => {
              const activeGame = AVAILABLE_GAMES.find(g => g.id === selectedGame);
              return (
                <div className="relative -mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 mb-2 overflow-hidden rounded-t-3xl">
                  {/* Game background image banner */}
                  <div className="h-24 sm:h-28 relative">
                    <img
                      src={activeGame?.image}
                      alt={activeGame?.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/60 to-transparent" />
                    <div className={`absolute inset-0 bg-gradient-to-r ${activeGame?.gradientBg} opacity-40`} />
                  </div>

                  {/* Close button overlaid on banner */}
                  <button 
                    type="button"
                    onClick={() => setSelectedGame(null)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer border border-white/10"
                  >
                    ✕
                  </button>

                  {/* Title overlaid at bottom of banner */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 md:px-8 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-neutral-900/80 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center shrink-0">
                        <img src={activeGame?.icon} alt="" className="w-5 h-5 object-contain" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-black text-white tracking-tight font-display truncate">
                          {activeGame?.name}
                        </h2>
                        <p className="text-[10px] text-neutral-400 truncate">Configure match rules & opponent</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Opponent Mode Selector ── */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                Opponent Mode
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#070709] rounded-xl border border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setOpponentStyle('bot')}
                  className={`py-2.5 rounded-lg font-bold text-[11px] sm:text-xs font-display flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    opponentStyle === 'bot'
                      ? 'bg-purple-350 text-[#070709]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  VS Bot
                </button>
                <button
                  type="button"
                  onClick={() => setOpponentStyle('player')}
                  className={`py-2.5 rounded-lg font-bold text-[11px] sm:text-xs font-display flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    opponentStyle === 'player'
                      ? 'bg-purple-350 text-[#070709]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Live Duel
                </button>
              </div>
            </div>

            {/* ── Bot Play Mode (Practice vs Staked) ── */}
            {opponentStyle === 'bot' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                  Bot Game Style
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#070709] rounded-xl border border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => setBotPlayMode('practice')}
                    className={`py-2 rounded-lg font-bold text-[11px] sm:text-xs font-display transition-all cursor-pointer ${
                      botPlayMode === 'practice'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Practice
                  </button>
                  <button
                    type="button"
                    onClick={() => setBotPlayMode('staked')}
                    className={`py-2 rounded-lg font-bold text-[11px] sm:text-xs font-display transition-all cursor-pointer ${
                      botPlayMode === 'staked'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Staked
                  </button>
                </div>
              </div>
            )}

            {/* ── Bot Difficulty / Player Selection ── */}
            {opponentStyle === 'bot' ? (
              <div className="space-y-2.5 animate-fade-in bg-purple-500/[0.03] border border-purple-500/10 p-3 sm:p-4 rounded-2xl">
                <div className="flex justify-between items-center gap-2">
                  <label className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <Brain className="w-3.5 h-3.5" />
                    Difficulty
                  </label>
                  <span className="bg-purple-500/20 text-purple-350 font-mono text-[9px] px-2 py-0.5 rounded-md font-bold uppercase whitespace-nowrap">
                    Multipliers
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 font-sans">
                  <button
                    type="button"
                    onClick={() => setDifficulty('easy')}
                    className={`py-2.5 px-1 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      difficulty === 'easy'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-neutral-900/60 border-transparent text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs font-bold font-display">Easy</span>
                    <span className="text-[8px] sm:text-[9px] font-mono font-bold opacity-80">1.0x</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('medium')}
                    className={`py-2.5 px-1 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      difficulty === 'medium'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-neutral-900/60 border-transparent text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs font-bold font-display">Medium</span>
                    <span className="text-[8px] sm:text-[9px] font-mono font-bold opacity-80">1.5x</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('hard')}
                    className={`py-2.5 px-1 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      difficulty === 'hard'
                        ? 'bg-rose-500/15 border-rose-500/45 text-rose-305'
                        : 'bg-neutral-900/60 border-transparent text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs font-bold font-display">Hard</span>
                    <span className="text-[8px] sm:text-[9px] font-mono font-bold opacity-80">2.5x</span>
                  </button>
                </div>

                <p className="text-[10px] text-neutral-400 leading-normal flex items-start gap-1">
                  <span>💡</span>
                  <span>Higher difficulty = higher stake multiplier on win.</span>
                </p>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in bg-cyan-500/[0.03] border border-cyan-500/10 p-3 sm:p-4 rounded-2xl">
                <label className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider block">
                  Select Opponent
                </label>
                
                <div className="space-y-1.5 max-h-36 overflow-y-auto -mx-1 px-1">
                  {onlinePlayers.map((player) => (
                    <div
                      key={player.uid}
                      onClick={() => setSelectedPlayerUid(player.uid)}
                      className={`flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer border select-none ${
                        selectedPlayerUid === player.uid
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                          : 'bg-neutral-900/50 border-transparent hover:bg-neutral-850 text-neutral-300'
                      }`}
                    >
                      <img src={player.avatar} alt={player.username} className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-[11px] block truncate leading-none">{player.username}</span>
                        <span className="font-mono text-[8px] text-neutral-405 truncate block">W:{player.wins} · {player.coins.toLocaleString()}c</span>
                      </div>
                      {selectedPlayerUid === player.uid && (
                        <span className="text-[9px] bg-cyan-400 text-neutral-950 font-bold px-1.5 py-0.5 rounded-md font-mono uppercase shrink-0">✓</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Invite Link */}
                <div className="border-t border-cyan-500/15 pt-3 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider block">
                    🔗 Invite Link
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
                        navigator.clipboard.writeText(link);
                        alert("📋 Invite link copied!");
                      }}
                      className="px-2.5 bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-neutral-950 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Entry Fee / Stakes ── */}
            {!(opponentStyle === 'bot' && botPlayMode === 'practice') && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
                    Entry Stakes
                  </label>
                  <span className="text-xs font-mono font-bold text-purple-300">{stake}c</span>
                </div>
                
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {[100, 250, 500, 1000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setStake(val)}
                      className={`py-2 text-[10px] font-mono font-bold rounded-xl transition-all border cursor-pointer ${
                        stake === val
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-neutral-900 hover:bg-neutral-850 border-white/[0.04] text-neutral-400'
                      }`}
                    >
                      {val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <input 
                    type="range" 
                    min="50" 
                    max="2000" 
                    step="50"
                    value={stake} 
                    onChange={(e) => setStake(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[8px] sm:text-[9px] font-mono text-neutral-500 mt-0.5">
                    <span>50</span>
                    <span>2,000</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Payout Summary ── */}
            <div className="bg-[#070709] rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/[0.04] space-y-2">
              <div className="flex justify-between items-center text-[11px] sm:text-xs">
                <span className="text-neutral-450">Entry Fee</span>
                <span className="text-white font-mono font-bold">
                  -{opponentStyle === 'bot' && botPlayMode === 'practice' ? 0 : stake}c
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] sm:text-xs">
                <span className="text-neutral-450">Stake Pool</span>
                <span className="text-white font-mono font-bold">
                  {opponentStyle === 'bot' && botPlayMode === 'practice' ? 0 : stake * 2}c
                </span>
              </div>

              {opponentStyle === 'bot' && botPlayMode === 'staked' && (
                <div className="flex justify-between items-center text-[11px] sm:text-xs border-b border-dashed border-white/[0.06] pb-2">
                  <span className="text-purple-355">Multiplier</span>
                  <span className="text-purple-300 font-mono font-bold">×{getMultiplier().toFixed(1)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1 border-t border-white/[0.04]">
                <strong className="text-white font-black font-display uppercase text-[10px] sm:text-xs tracking-tight">Win Payout</strong>
                <strong className="text-emerald-400 font-mono font-bold text-sm sm:text-base">
                  +{opponentStyle === 'bot' && botPlayMode === 'practice' ? 0 : Math.floor(stake * (1 + getMultiplier()))}c
                </strong>
              </div>
            </div>

            {/* ── Launch CTA ── */}
            <button
              onClick={handleLaunch}
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-purple-500 via-purple-700 to-pink-500 hover:from-purple-450 hover:to-pink-450 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider sm:tracking-widest rounded-xl shadow-lg shadow-purple-500/10 cursor-pointer hover:shadow-purple-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
              Start Duel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
