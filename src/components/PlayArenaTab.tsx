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
  }) => void;
  allProfiles: UserProfile[];
}

const AVAILABLE_GAMES = [
  {
    id: 'Chess' as const,
    name: 'Cyber Chess Arena',
    metric: 'FIDE Rated Elo',
    desc: 'Deep algorithmic turn strategy. Includes real-time 3D rotation cameras, interactive chess rule validation, algebraic notation logs, and check status detection.',
    icon: '♟️',
    difficultyRecommendation: 'High Strategy Level',
    color: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20'
  },
  {
    id: 'Ludo' as const,
    name: 'Cyber Ludo Quadrant',
    metric: '4-Player Path Matrix',
    desc: 'Holographic coordinate piece tracker. Throw virtual high-precision physics dice cubes, spawn base tokens, slide along pathways, and capture enemy pieces.',
    icon: '🎲',
    difficultyRecommendation: 'Casual & Tactical Strategy',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20'
  },
  {
    id: 'Whot' as const,
    name: 'Cyber Whot Card Table',
    metric: 'Nigerian Whot Standard',
    desc: 'Hyper-responsive hand management. Features "Market" card draws, specialized action card sequences (Hold On, Pick Two, Pick Three, Whot wildcards), and recursive deck recycling.',
    icon: '🃏',
    difficultyRecommendation: 'High Reflex & Card Skill',
    color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20'
  },
  {
    id: 'Draft' as const,
    name: 'Cyber Drafts Matrix',
    metric: '8x8 Checkers Grid',
    desc: 'Neon diagonal tactical warfare. Command your light tokens across the dark matrix grid, perform diagonal jumps, capture enemy nodes, and secure King elevations.',
    icon: '🔴',
    difficultyRecommendation: 'Mid Strategy Level',
    color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20'
  }
];

export const PlayArenaTab: React.FC<PlayArenaTabProps> = ({
  userProfile,
  setUserProfile,
  onLaunchMatch,
  allProfiles
}) => {
  const [selectedGame, setSelectedGame] = useState<'Chess' | 'Ludo' | 'Whot' | 'Draft'>('Chess');
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
      : (selectedOpponent?.username || 'Chidi_LudoKing');

    if (opponentStyle === 'player') {
      const inviteLink = `${origin}${pathname}?friendInvite=true&game=${selectedGame}&stake=${actualStake}&sender=${encodeURIComponent(userProfile.username)}`;
      navigator.clipboard.writeText(inviteLink);
      alert(`🎉 Multiplayer Match Ready!\n\nWe copied the invitation link to your clipboard:\n\n${inviteLink}\n\nShare this link with your challenger to start instantly!`);
    }

    onLaunchMatch({
      gameType: selectedGame,
      opponentType: opponentStyle,
      botDifficulty: opponentStyle === 'bot' ? difficulty : undefined,
      entryFee: actualStake,
      opponentName,
      multiplier
    });
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

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Game Selection list */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2 mb-2 font-display">
            <span>1.</span> Select Game Board
          </h2>
          
          <div className="space-y-4">
            {AVAILABLE_GAMES.map((game) => {
              const isActive = selectedGame === game.id;
              return (
                <div
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  id={`arena-game-card-${game.id}`}
                  className={`group relative overflow-hidden p-5 rounded-2xl border transition-all cursor-pointer select-none flex gap-5 ${
                    isActive 
                      ? 'bg-purple-500/[0.05] border-purple-500/60 shadow-[0_4px_25px_rgba(147,51,234,0.15)] ring-1 ring-purple-500/20' 
                      : 'bg-[#0B0B0E]/60 border-white/[0.05] hover:border-white/[0.12] hover:bg-[#0B0B0E]/80'
                  }`}
                >
                  {/* Left Visual Element */}
                  <div className="text-4xl w-14 h-14 bg-neutral-900/40 rounded-xl flex items-center justify-center border border-white/[0.03] group-hover:scale-105 transition-transform duration-250 shrink-0">
                    {game.icon}
                  </div>
                  
                  {/* Text Descriptors */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2.5">
                      <h3 className={`text-base font-black font-display tracking-tight transition-colors ${isActive ? 'text-purple-300' : 'text-white'}`}>
                        {game.name}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-cyan-400/80 uppercase tracking-wider bg-cyan-950/20 border border-cyan-500/10 px-2 py-0.5 rounded-full shrink-0">
                        {game.metric}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed font-sans">{game.desc}</p>
                    <div className="flex items-center gap-2.5 text-[10px] font-mono text-neutral-500 pt-1">
                      <span className="bg-neutral-950/40 border border-white/[0.03] px-2 py-0.5 rounded-sm text-neutral-400">
                        {game.difficultyRecommendation}
                      </span>
                      <span>•</span>
                      <span className="text-purple-300 font-bold">Standard Match Stake Ready</span>
                    </div>
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
              <p className="text-xs text-neutral-400">
                You currently have <strong className="text-white font-black">{userProfile.wins}</strong> victory nodes secured across tournaments and sandbox modules.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Matchmaker Configuration parameters */}
        <div className="lg:col-span-5">
          <div className="bg-[#0B0B0F]/90 border border-white/[0.06] rounded-3xl p-6 shadow-xl space-y-6 sticky top-24" id="matchmaker-parameter-card">
            
            <div className="border-b border-white/[0.06] pb-4">
              <h2 className="text-base font-black text-white tracking-tight font-display flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Match Settings
              </h2>
              <p className="text-xs text-neutral-400 mt-1">Configure your opponent details and active staking stake.</p>
            </div>

            {/* Selector: VS Bot or VS Player */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                2. Opponent Mode
              </label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-[#070709] rounded-xl border border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setOpponentStyle('bot')}
                  className={`py-2.5 rounded-lg font-bold text-xs font-display flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    opponentStyle === 'bot'
                      ? 'bg-purple-350 text-[#070709]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  Play with Bots
                </button>
                <button
                  type="button"
                  onClick={() => setOpponentStyle('player')}
                  className={`py-2.5 rounded-lg font-bold text-xs font-display flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    opponentStyle === 'player'
                      ? 'bg-purple-350 text-[#070709]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Live Duel (P2P)
                </button>
              </div>
            </div>

            {/* Dynamic Segment: Bot Play Mode selector (Practice vs Staked) */}
            {opponentStyle === 'bot' && (
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                  Bot Game Style
                </label>
                <div className="grid grid-cols-2 gap-3 p-1 bg-[#070709] rounded-xl border border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => setBotPlayMode('practice')}
                    className={`py-2 rounded-lg font-bold text-xs font-display transition-all cursor-pointer ${
                      botPlayMode === 'practice'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Free Practice
                  </button>
                  <button
                    type="button"
                    onClick={() => setBotPlayMode('staked')}
                    className={`py-2 rounded-lg font-bold text-xs font-display transition-all cursor-pointer ${
                      botPlayMode === 'staked'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Staked Challenge
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Segment: Bot Difficulty selection with Multipliers */}
            {opponentStyle === 'bot' ? (
              <div className="space-y-3 animate-fade-in bg-purple-500/[0.02] border border-purple-500/10 p-4.5 rounded-2xl">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5" />
                    Bot Difficulty Preset
                  </label>
                  <span className="bg-purple-500/20 text-purple-350 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">
                    Risk Multipliers
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2.5 font-sans">
                  {/* Easy */}
                  <button
                    type="button"
                    onClick={() => setDifficulty('easy')}
                    className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      difficulty === 'easy'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-neutral-900/60 border-transparent text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                    }`}
                  >
                    <span className="text-xs font-bold font-display">Easy</span>
                    <span className="text-[9px] font-mono font-bold opacity-80">1.0x Bonus</span>
                  </button>

                  {/* Medium */}
                  <button
                    type="button"
                    onClick={() => setDifficulty('medium')}
                    className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      difficulty === 'medium'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-neutral-900/60 border-transparent text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                    }`}
                  >
                    <span className="text-xs font-bold font-display">Medium</span>
                    <span className="text-[9px] font-mono font-bold opacity-80">1.5x Bonus</span>
                  </button>

                  {/* Hard */}
                  <button
                    type="button"
                    onClick={() => setDifficulty('hard')}
                    className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      difficulty === 'hard'
                        ? 'bg-rose-500/15 border-rose-500/45 text-rose-300'
                        : 'bg-neutral-900/60 border-transparent text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                    }`}
                  >
                    <span className="text-xs font-bold font-display">Hard</span>
                    <span className="text-[9px] font-mono font-bold opacity-80">2.5x Bonus</span>
                  </button>
                </div>

                <p className="text-[10px] text-neutral-400 leading-normal pt-1 flex items-start gap-1">
                  <span>💡</span>
                  <span>Play against adaptive AI. Medium and Hard modes activate high-stakes multipliers in the server-side validator nodes.</span>
                </p>
              </div>
            ) : (
              /* Live Player Selection segment */
              <div className="space-y-4 animate-fade-in bg-cyan-500/[0.02] border border-cyan-500/10 p-4.5 rounded-2xl">
                <div>
                  <label className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider block mb-2">
                    Select Opponent User
                  </label>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {onlinePlayers.map((player) => (
                      <div
                        key={player.uid}
                        onClick={() => setSelectedPlayerUid(player.uid)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer border select-none ${
                          selectedPlayerUid === player.uid
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                            : 'bg-neutral-900/50 border-transparent hover:bg-neutral-850 text-neutral-300'
                        }`}
                      >
                        <img src={player.avatar} alt={player.username} className="w-7 h-7 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs block truncate leading-none">{player.username}</span>
                          <span className="font-mono text-[8px] text-neutral-400">Wins: {player.wins} | Coin Stack: {player.coins.toLocaleString()} Coins</span>
                        </div>
                        {selectedPlayerUid === player.uid && (
                          <span className="text-[10px] bg-cyan-400 text-neutral-950 font-bold px-1.5 py-0.5 rounded-md font-mono uppercase shrink-0">Challenged</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instant Share Link Helper */}
                <div className="border-t border-cyan-500/15 pt-3.5 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider block">
                    🔗 Direct Duel Challenge Invite link:
                  </span>
                  
                  <div className="flex gap-2">
                    <input
                      readOnly
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      value={`${window.location.origin}${window.location.pathname}?friendInvite=true&game=${selectedGame}&stake=${stake}&sender=${encodeURIComponent(userProfile.username)}`}
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-neutral-350 font-mono focus:outline-none selection:bg-cyan-500 selection:text-neutral-950 select-all truncate"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const link = `${window.location.origin}${window.location.pathname}?friendInvite=true&game=${selectedGame}&stake=${stake}&sender=${encodeURIComponent(userProfile.username)}`;
                        navigator.clipboard.writeText(link);
                        alert("📋 Invite challenge URL has been copied to your clipboard!");
                      }}
                      className="px-3 bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-neutral-950 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <span className="text-[9px] text-neutral-450 leading-relaxed block font-sans">
                    Send this link to any player so they can instantly enter the match stakes and duel with you.
                  </span>
                </div>
              </div>
            )}

            {/* Select Stakes with fast Buttons (Only shown for P2P or Staked Bot matches) */}
            {!(opponentStyle === 'bot' && botPlayMode === 'practice') && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                    3. Entry Fee / Stakes
                  </label>
                  <span className="text-xs font-mono font-bold text-purple-300">{stake} Coins</span>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
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
                      {val.toLocaleString()} Coins
                    </button>
                  ))}
                </div>

                {/* Slider for custom stake */}
                <div className="pt-2">
                  <input 
                    type="range" 
                    min="50" 
                    max="2000" 
                    step="50"
                    value={stake} 
                    onChange={(e) => setStake(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-neutral-500 mt-1">
                    <span>Min: 50 Coins</span>
                    <span>Max: 2,000 Coins</span>
                  </div>
                </div>
              </div>
            )}

            {/* Estimated payout calculation detail */}
            <div className="bg-[#070709] rounded-2xl p-4 border border-white/[0.04] space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Your Base Escrow Entry Fee:</span>
                <span className="text-white font-mono font-bold">
                  -{opponentStyle === 'bot' && botPlayMode === 'practice' ? 0 : stake} Coins
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Match Stake Pool (P2P matching):</span>
                <span className="text-white font-mono font-bold">
                  {opponentStyle === 'bot' && botPlayMode === 'practice' ? 0 : stake * 2} Coins
                </span>
              </div>

              {opponentStyle === 'bot' && botPlayMode === 'staked' && (
                <div className="flex justify-between items-center text-xs border-b border-dashed border-white/[0.06] pb-2.5">
                  <span className="text-purple-350 font-medium">AI Difficulty Multiplier Boost:</span>
                  <span className="text-purple-300 font-mono font-bold">x{getMultiplier().toFixed(1)} Bonus Payout</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm pt-1">
                <strong className="text-white font-black font-display uppercase tracking-tight text-xs">On Victory Return Payout:</strong>
                <strong className="text-emerald-400 font-mono font-bold text-base">
                  +{opponentStyle === 'bot' && botPlayMode === 'practice' ? 0 : Math.floor(stake * (1 + getMultiplier()))} Coins!
                </strong>
              </div>
            </div>

            {/* Launch CTA */}
            <button
              onClick={handleLaunch}
              className="w-full py-4.5 bg-gradient-to-r from-purple-500 via-purple-700 to-pink-500 hover:from-purple-450 hover:to-pink-450 text-white font-extrabold text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-purple-500/10 cursor-pointer hover:shadow-purple-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" />
              Start Cyber Duel Match
            </button>
            
          </div>
        </div>

      </div>

    </div>
  );
};
