import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, 
  Coins, 
  Trophy, 
  MapPin, 
  Flame, 
  TrendingUp, 
  Users, 
  Check, 
  ShieldCheck, 
  ExternalLink,
  MessageSquare,
  Radio,
  Activity,
  ArrowRight
} from 'lucide-react';
import { UserProfile, WalletTransaction } from '../types';

interface SpectateTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onAddTransaction: (tx: WalletTransaction) => void;
}

interface LiveMatch {
  id: string;
  gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe';
  playerA: { username: string; avatar: string; wins: number; odds: number };
  playerB: { username: string; avatar: string; wins: number; odds: number };
  pool: number;
  spectators: number;
  status: string;
  logs: string[];
}

const LOCAL_LEADERBOARDS = [
  {
    region: 'Lagos, Nigeria',
    players: [
      { rank: 1, name: 'Adebayo_WhotLord', wins: 142, coins: 45000, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
      { rank: 2, name: 'Chidi_LudoMaster', wins: 118, coins: 32000, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' },
      { rank: 3, name: 'Funmi_Cards', wins: 95, coins: 21000, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80' },
    ]
  },
  {
    region: 'Nairobi, Kenya',
    players: [
      { rank: 1, name: 'Karanja_ChessPro', wins: 165, coins: 62000, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80' },
      { rank: 2, name: 'Mwangi_Draft', wins: 104, coins: 28000, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80' },
      { rank: 3, name: 'Wanjiku_Ludo', wins: 88, coins: 19500, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' },
    ]
  },
  {
    region: 'Johannesburg, South Africa',
    players: [
      { rank: 1, name: 'Sipho_Grandmaster', wins: 189, coins: 78000, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80' },
      { rank: 2, name: 'Zanele_Whot', wins: 122, coins: 39000, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80' },
      { rank: 3, name: 'Lerato_Checkers', wins: 76, coins: 15000, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80' },
    ]
  }
];

export const SpectateTab: React.FC<SpectateTabProps> = ({
  userProfile,
  setUserProfile,
  onAddTransaction
}) => {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([
    {
      id: 'match_1',
      gameType: 'Chess',
      playerA: { username: 'Adebayo_Grandmaster', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', wins: 142, odds: 1.85 },
      playerB: { username: 'Nebula_AI (Hard)', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80', wins: 340, odds: 2.10 },
      pool: 10000,
      spectators: 342,
      status: 'Move 24: White playing. Adebayo castled kingside.',
      logs: [
        'Move 22: Nebula_AI played Nf3 -> Nd4.',
        'Move 23: Adebayo played Be7 -> Bf6.',
        'Move 24: Nebula_AI played O-O.',
      ]
    },
    {
      id: 'match_2',
      gameType: 'Whot',
      playerA: { username: 'Funmi_Cards', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', wins: 95, odds: 1.60 },
      playerB: { username: 'Tolu_Stars', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', wins: 82, odds: 2.45 },
      pool: 5000,
      spectators: 189,
      status: 'Player A has 3 cards left. Player B has 5 cards left.',
      logs: [
        'Tolu played Crosses 5.',
        'Funmi played Crosses 10.',
        'Tolu drew 1 card from Market.',
      ]
    },
    {
      id: 'match_3',
      gameType: 'Draft',
      playerA: { username: 'Mwangi_Draft', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80', wins: 104, odds: 1.90 },
      playerB: { username: 'Zanele_Checkers', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80', wins: 122, odds: 1.90 },
      pool: 2500,
      spectators: 87,
      status: 'Zanele captured 2 pieces. Active turn: Mwangi.',
      logs: [
        'Mwangi moved row 4 col 3 -> row 5 col 4.',
        'Zanele captured row 3 col 2 -> row 5 col 4.',
        'Zanele captured row 5 col 4 -> row 7 col 6 (KINGED).',
      ]
    },
    {
      id: 'match_4',
      gameType: 'TicTacToe',
      playerA: { username: 'Cyber_Strike', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', wins: 88, odds: 1.75 },
      playerB: { username: 'Matrix_Node', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', wins: 91, odds: 2.15 },
      pool: 3500,
      spectators: 145,
      status: 'Cell 5 (Center) claimed by Cyber_Strike. Active turn: Matrix_Node.',
      logs: [
        'Cyber_Strike claimed cell 5 (Center X).',
        'Matrix_Node claimed cell 1 (Corner O).',
        'Cyber_Strike claimed cell 9 (Corner X).',
      ]
    }
  ]);

  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<'A' | 'B' | null>(null);
  const [betAmount, setBetAmount] = useState<number>(200);
  const [activeLeaderboardIdx, setActiveLeaderboardIdx] = useState<number>(0);
  const [betPlaced, setBetPlaced] = useState<boolean>(false);

  // Live match log simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMatches(prevMatches => 
        prevMatches.map(match => {
          const rand = Math.random();
          let newLogs = [...match.logs];
          let newStatus = match.status;

          if (match.gameType === 'Chess') {
            if (rand > 0.6) {
              const moveNo = 25 + Math.floor(Math.random() * 5);
              const piece = ['Q', 'R', 'N', 'B', 'P'][Math.floor(Math.random() * 5)];
              const target = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][Math.floor(Math.random() * 8)] + (1 + Math.floor(Math.random() * 8));
              const logMsg = `Move ${moveNo}: Player moved ${piece} to ${target}.`;
              newLogs.push(logMsg);
              newStatus = logMsg;
            }
          } else if (match.gameType === 'Whot') {
            if (rand > 0.6) {
              const shapes = ['Circles', 'Triangles', 'Crosses', 'Stars', 'Squares'];
              const player = Math.random() > 0.5 ? 'Funmi' : 'Tolu';
              const cardVal = [1, 2, 5, 8, 10, 14, 20][Math.floor(Math.random() * 7)];
              const cardShape = shapes[Math.floor(Math.random() * 5)];
              const logMsg = `${player} played ${cardShape} ${cardVal}.`;
              newLogs.push(logMsg);
              newStatus = logMsg;
            }
          }

          if (newLogs.length > 5) {
            newLogs.shift();
          }

          const updatedMatch = {
            ...match,
            logs: newLogs,
            status: newStatus,
            spectators: match.spectators + (Math.random() > 0.5 ? 1 : -1)
          };

          // Update active spectated match too
          if (selectedMatch && selectedMatch.id === match.id) {
            setSelectedMatch(updatedMatch);
          }

          return updatedMatch;
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedMatch]);

  const handlePlaceBet = () => {
    if (!selectedMatch || !selectedWinner) return;
    if (userProfile.coins < betAmount) {
      alert('Insufficient coins to place bet.');
      return;
    }

    const targetPlayerName = selectedWinner === 'A' ? selectedMatch.playerA.username : selectedMatch.playerB.username;
    
    // Deduct coins
    setUserProfile(prev => ({
      ...prev,
      coins: prev.coins - betAmount
    }));

    // Log transaction
    onAddTransaction({
      id: `TX-BET-${Date.now()}`,
      userId: userProfile.uid,
      type: 'debit',
      amount: betAmount,
      description: `Bet placed on ${targetPlayerName} in ${selectedMatch.gameType} match`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'completed'
    });

    setBetPlaced(true);
    setTimeout(() => {
      setBetPlaced(false);
      setSelectedWinner(null);
      alert(`🎉 Bet locked! You placed ${betAmount} coins on ${targetPlayerName}.`);
    }, 1500);
  };

  const getGameIcon = (type: string) => {
    switch (type) {
      case 'Chess': return '♟️';
      case 'Ludo': return '🎲';
      case 'Whot': return '🃏';
      case 'Draft': return '🎯';
      default: return '❌';
    }
  };

  return (
    <div className="space-y-6" id="spectate-dashboard">
      
      {/* Dynamic Network Spectator Header */}
      <div className="glass-command-card p-6 border border-white/[0.06] rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-pink-500/10 border border-pink-500/25 px-3 py-1 rounded-full text-[10px] font-mono text-pink-300 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Radio className="w-3 h-3 text-pink-400 animate-pulse" />
                LIVE ESPORTS ARENA & STAKING HUB
              </span>
              <span className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {liveMatches.length} MATCHES STREAMING
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-3">
              <div className="p-2.5 bg-pink-500/15 border border-pink-500/30 rounded-2xl text-pink-400 shadow-md">
                <Tv className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              Spectator & Live Betting
            </h1>
            <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
              Watch real-time P2P competitive gaming duels, analyze live odds multiplier curves, and stake virtual coins on top platform gladiators.
            </p>
          </div>

          {/* King of the Hill Spotlight Header Pill */}
          <div className="w-full lg:w-auto bg-[#120B14] border border-pink-500/30 p-3.5 px-5 rounded-2xl flex items-center justify-between lg:justify-start gap-4 shadow-lg shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="bg-pink-500/20 p-2.5 rounded-xl border border-pink-500/40 text-pink-300">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="block text-[9px] font-mono text-pink-400 uppercase tracking-widest font-black leading-none">KING OF THE HILL</span>
                <strong className="text-xs sm:text-sm font-bold text-white tracking-tight mt-1 block">
                  Sipho_Grandmaster
                </strong>
                <span className="text-[10px] font-mono text-pink-300 font-bold">🔥 9 Win Streak</span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-lg text-[9px] font-mono font-bold uppercase shrink-0">
              REIGNING
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Columns: Live matches stream or matches feed */}
        <div className="lg:col-span-8 space-y-6">
          
          <AnimatePresence mode="wait">
            {selectedMatch ? (
              /* ACTIVE STREAM BROADCAST VIEW */
              <motion.div
                key="active-stream"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-command-card border border-white/[0.06] rounded-3xl p-6 space-y-6 shadow-2xl relative"
              >
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-4">
                  <button 
                    onClick={() => setSelectedMatch(null)}
                    className="text-xs text-neutral-400 hover:text-white font-mono flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 transition-all hover:bg-neutral-850"
                  >
                    ← Back to Matches
                  </button>
                  <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-widest">LIVE BROADCAST</span>
                  </div>
                </div>

                {/* Match Up Gladiator Header */}
                <div className="grid grid-cols-3 items-center text-center py-5 px-4 bg-neutral-950/60 rounded-2xl border border-white/5 shadow-inner">
                  <div className="space-y-2">
                    <div className="relative inline-block">
                      <img src={selectedMatch.playerA.avatar} alt="P1" className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-purple-500 shadow-lg shadow-purple-500/20" />
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-neutral-950" />
                    </div>
                    <h3 className="text-sm font-black text-white font-display truncate max-w-[120px] mx-auto">{selectedMatch.playerA.username}</h3>
                    <span className="text-[10px] text-purple-300 font-mono font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full inline-block">
                      {selectedMatch.playerA.odds}x Payout
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xl">{getGameIcon(selectedMatch.gameType)}</span>
                    <span className="text-lg font-black text-pink-400 font-display block tracking-wider uppercase">{selectedMatch.gameType}</span>
                    <span className="text-[10px] bg-neutral-900 border border-white/10 px-2.5 py-1 rounded-full text-neutral-300 font-mono font-bold inline-block">
                      Pool: {selectedMatch.pool.toLocaleString()} 🪙
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="relative inline-block">
                      <img src={selectedMatch.playerB.avatar} alt="P2" className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-pink-500 shadow-lg shadow-pink-500/20" />
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-neutral-950" />
                    </div>
                    <h3 className="text-sm font-black text-white font-display truncate max-w-[120px] mx-auto">{selectedMatch.playerB.username}</h3>
                    <span className="text-[10px] text-pink-300 font-mono font-bold bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full inline-block">
                      {selectedMatch.playerB.odds}x Payout
                    </span>
                  </div>
                </div>

                {/* Simulated Game Action Logs */}
                <div className="space-y-3 bg-[#070709] border border-white/[0.04] p-4.5 rounded-2xl font-mono">
                  <div className="flex justify-between items-center text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                    <span className="flex items-center gap-1.5 text-purple-400 font-mono">
                      <Activity className="w-3.5 h-3.5" />
                      Verified Game Node Stream
                    </span>
                    <span className="text-neutral-450 font-mono">👁️ {selectedMatch.spectators} watching</span>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto pt-2 text-xs">
                    {selectedMatch.logs.map((log, index) => (
                      <div key={index} className="text-neutral-300 py-1.5 border-b border-white/[0.02] flex justify-between items-center font-mono text-[11px]">
                        <span>{log}</span>
                        <span className="text-[8px] text-neutral-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">Node Sync</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-emerald-400 leading-normal pt-2 flex items-center gap-2 border-t border-white/[0.05] font-mono">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span>State Check: {selectedMatch.status}</span>
                  </p>
                </div>

                {/* Placing Bets UI */}
                <div className="border-t border-white/[0.06] pt-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300 font-display flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    Stake Virtual Coins on Duel Winner
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedWinner('A')}
                      className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        selectedWinner === 'A' 
                          ? 'bg-purple-500/15 border-purple-500 text-purple-300 font-bold shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/50' 
                          : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      <span className="block text-[10px] uppercase font-mono tracking-wider text-purple-400">Back Player A ({selectedMatch.playerA.odds}x)</span>
                      <strong className="text-sm font-display block mt-1">{selectedMatch.playerA.username}</strong>
                    </button>

                    <button
                      onClick={() => setSelectedWinner('B')}
                      className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        selectedWinner === 'B' 
                          ? 'bg-pink-500/15 border-pink-500 text-pink-300 font-bold shadow-lg shadow-pink-500/10 ring-1 ring-pink-500/50' 
                          : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      <span className="block text-[10px] uppercase font-mono tracking-wider text-pink-400">Back Player B ({selectedMatch.playerB.odds}x)</span>
                      <strong className="text-sm font-display block mt-1">{selectedMatch.playerB.username}</strong>
                    </button>
                  </div>

                  {selectedWinner && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-2"
                    >
                      {/* Stake Picker */}
                      <div className="flex justify-between items-center text-xs bg-neutral-950/60 p-3 rounded-2xl border border-white/5">
                        <span className="text-neutral-400 font-mono font-bold">Select Wager Stake:</span>
                        <div className="flex gap-2">
                          {[100, 200, 500, 1000].map(amt => (
                            <button
                              key={amt}
                              onClick={() => setBetAmount(amt)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                                betAmount === amt 
                                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm' 
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                              }`}
                            >
                              {amt} 🪙
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handlePlaceBet}
                        disabled={betPlaced}
                        className="w-full py-3.5 bg-[#ebd3ff] hover:bg-[#dfbeff] text-neutral-950 font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-[0.99]"
                      >
                        {betPlaced ? 'Locking Wager Stake...' : `Confirm Bet: Stake ${betAmount.toLocaleString()} Coins`}
                      </button>
                    </motion.div>
                  )}
                </div>

              </motion.div>
            ) : (
              /* LIVE MATCHES FEED LIST */
              <motion.div
                key="matches-list"
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest font-display flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Active Cyber Duels Feed
                  </h2>
                  <span className="text-[10px] bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full font-mono text-neutral-400 font-bold">
                    ● Real-time Match Stream
                  </span>
                </div>

                {liveMatches.length === 0 ? (
                  /* Elegant Empty State when no active matches */
                  <div className="glass-command-card p-12 text-center rounded-3xl border border-white/[0.06] space-y-4">
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-purple-400">
                      <Tv className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-white font-display">NO LIVE DUELS</h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      The esports arena is quiet right now. Check back soon or challenge someone in the lobby to start a live broadcast.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveMatches.map((match) => (
                      <div 
                        key={match.id}
                        className="glass-command-card hover:border-purple-500/40 p-5 rounded-3xl transition-all flex flex-col justify-between space-y-4 shadow-lg group relative overflow-hidden"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <span>{getGameIcon(match.gameType)}</span>
                            <span>{match.gameType}</span>
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono font-bold flex items-center gap-1">
                            👁️ {match.spectators} Spectators
                          </span>
                        </div>

                        {/* Versus Matchup Bar */}
                        <div className="flex items-center justify-between text-xs py-3 px-3 bg-neutral-950/60 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <img src={match.playerA.avatar} alt="A" className="w-9 h-9 rounded-full object-cover border border-purple-500/50" />
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-neutral-950" />
                            </div>
                            <div>
                              <span className="text-white font-bold text-xs block max-w-[90px] truncate">{match.playerA.username}</span>
                              <span className="text-[9px] text-purple-300 font-mono">{match.playerA.odds}x</span>
                            </div>
                          </div>

                          <span className="text-[10px] text-neutral-500 font-mono font-black uppercase px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded">
                            VS
                          </span>

                          <div className="flex items-center gap-2.5 text-right">
                            <div>
                              <span className="text-white font-bold text-xs block max-w-[90px] truncate">{match.playerB.username}</span>
                              <span className="text-[9px] text-pink-300 font-mono">{match.playerB.odds}x</span>
                            </div>
                            <div className="relative">
                              <img src={match.playerB.avatar} alt="B" className="w-9 h-9 rounded-full object-cover border border-pink-500/50" />
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-neutral-950" />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <div className="text-[10px] font-mono">
                            <span className="block text-neutral-400 font-bold uppercase text-[9px]">Total Pool</span>
                            <span className="text-emerald-400 font-bold text-xs">{match.pool.toLocaleString()} 🪙</span>
                          </div>
                          <button
                            onClick={() => setSelectedMatch(match)}
                            className="px-4 py-2.5 bg-[#ebd3ff] hover:bg-[#dfbeff] text-neutral-950 text-[10px] font-extrabold uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-500/10 active:scale-95"
                          >
                            Spectate & Bet
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* King of the Hill Arena Section Card */}
          <div className="glass-command-card rounded-3xl p-6 border border-pink-500/20 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-widest font-display flex items-center gap-2">
                <Flame className="w-4 h-4 text-pink-400 animate-pulse" />
                King of the Hill Tables
              </h3>
              <span className="text-[10px] bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full text-pink-300 font-mono font-bold uppercase">
                WINNER STAYS ON
              </span>
            </div>
            
            <div className="bg-neutral-950/60 rounded-2xl border border-white/5 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80" alt="King" className="w-14 h-14 rounded-full object-cover border-2 border-pink-500 shadow-md shadow-pink-500/30" />
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider shadow-md">👑 King</span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white font-display">Sipho_Grandmaster</h4>
                  <div className="flex flex-wrap gap-2 text-[10px] text-neutral-400 mt-1 font-mono">
                    <span className="bg-pink-500/10 text-pink-300 border border-pink-500/20 px-2 py-0.5 rounded-full font-bold">🔥 9 Wins Streak</span>
                    <span className="bg-neutral-900 border border-white/5 px-2 py-0.5 rounded-full">Total Won: 18,000 🪙</span>
                  </div>
                </div>
              </div>

              <div className="text-center md:text-right shrink-0">
                <span className="block text-[9px] font-mono text-neutral-400 uppercase font-bold">Current Table Pool</span>
                <strong className="text-lg font-black font-mono text-pink-400">2,000 Coins</strong>
                <button
                  onClick={() => alert("Challenging the King is locked until the current match concludes!")}
                  className="mt-2 block w-full md:w-auto px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-pink-600/20"
                >
                  Queue Challenge
                </button>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column: Neighborhood Wars Regional Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="glass-command-card rounded-3xl p-6 shadow-xl space-y-5 border border-white/[0.06]">
            <div className="border-b border-white/[0.06] pb-4">
              <h2 className="text-sm font-black text-white tracking-tight font-display flex items-center gap-2">
                <MapPin className="w-4 h-4 text-pink-400" />
                Neighborhood Wars
              </h2>
              <p className="text-xs text-neutral-400 mt-1">Regional rankings & top dueling zones across emerging markets.</p>
            </div>

            {/* Region Selector tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {LOCAL_LEADERBOARDS.map((regionData, idx) => (
                <button
                  key={regionData.region}
                  onClick={() => setActiveLeaderboardIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold font-sans transition-all whitespace-nowrap cursor-pointer border ${
                    activeLeaderboardIdx === idx 
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm' 
                      : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  {regionData.region.split(',')[0]}
                </button>
              ))}
            </div>

            {/* Selected Region Leaderboard details */}
            <div className="space-y-3 pt-1">
              <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase block">
                Top gladiators in {LOCAL_LEADERBOARDS[activeLeaderboardIdx].region}:
              </span>
              
              <div className="space-y-2.5">
                {LOCAL_LEADERBOARDS[activeLeaderboardIdx].players.map((player) => (
                  <div 
                    key={player.name}
                    className="flex items-center justify-between p-3 bg-neutral-950/60 rounded-2xl border border-white/5 hover:border-pink-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 font-mono text-xs font-black ${
                        player.rank === 1 ? 'text-amber-400' : player.rank === 2 ? 'text-neutral-300' : 'text-amber-700'
                      }`}>
                        #{player.rank}
                      </span>
                      <img src={player.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                      <div>
                        <span className="font-bold text-xs text-white block truncate max-w-[110px] leading-tight">{player.name}</span>
                        <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">{player.wins} Wins</span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <strong className="text-xs font-bold text-pink-400">{player.coins.toLocaleString()} 🪙</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#070709] rounded-2xl p-3.5 border border-white/[0.04] text-[10px] text-neutral-400 leading-relaxed font-sans flex items-start gap-2">
              <span className="shrink-0 text-pink-400 mt-0.5">📍</span>
              <p>Your current location is detected. Join tournaments to earn points for your neighborhood board and unlock local reward multipliers!</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
