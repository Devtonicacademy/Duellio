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
  MessageSquare
} from 'lucide-react';
import { UserProfile, WalletTransaction } from '../types';

interface SpectateTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onAddTransaction: (tx: WalletTransaction) => void;
}

interface LiveMatch {
  id: string;
  gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft';
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
      { rank: 2, name: 'Chidi_LudoKing', wins: 118, coins: 32000, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' },
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

  return (
    <div className="space-y-8" id="spectate-dashboard">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <span className="bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full text-[10px] font-mono text-pink-400 font-bold uppercase tracking-wider">
            Live Esports Arena & Staking Hub
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight font-display mt-2 flex items-center gap-2">
            <Tv className="w-8 h-8 text-pink-400" />
            Spectator & Live Betting
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Watch live duels happening in real-time, analyze performance odds, and stake virtual coins on top players.
          </p>
        </div>

        {/* Winner Stays On (King of the Hill) Live Indicator */}
        <div className="bg-[#120B14] border border-pink-500/20 p-3 px-5 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="bg-pink-500/20 p-2.5 rounded-xl border border-pink-500/35">
            <Flame className="w-5 h-5 text-pink-300 animate-pulse" />
          </div>
          <div>
            <span className="block text-[9px] font-mono text-pink-400 uppercase tracking-widest leading-none">KING OF THE HILL</span>
            <strong className="text-sm font-bold text-white tracking-tight mt-0.5 block">
              Sipho_Grandmaster (9 Wins)
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Columns: Live matches or Live Spectator screen */}
        <div className="lg:col-span-8 space-y-6">
          
          <AnimatePresence mode="wait">
            {selectedMatch ? (
              /* ACTIVE STREAM SIMULATION */
              <motion.div
                key="active-stream"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-[#0B0B0F]/90 border border-white/[0.06] rounded-3xl p-6 space-y-6 shadow-xl"
              >
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-4">
                  <button 
                    onClick={() => setSelectedMatch(null)}
                    className="text-xs text-neutral-450 hover:text-white font-mono flex items-center gap-1 cursor-pointer"
                  >
                    ← Back to Matches
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-mono font-bold text-rose-400 uppercase">LIVE STREAMING</span>
                  </div>
                </div>

                {/* Match Up Header */}
                <div className="grid grid-cols-3 items-center text-center py-4 bg-neutral-950/40 rounded-2xl border border-white/5">
                  <div className="space-y-2">
                    <img src={selectedMatch.playerA.avatar} alt="P1" className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-purple-500" />
                    <h3 className="text-sm font-black text-white">{selectedMatch.playerA.username}</h3>
                    <span className="text-[10px] text-purple-300 font-mono">Odds: {selectedMatch.playerA.odds}x</span>
                  </div>
                  <div>
                    <span className="text-xs font-mono text-neutral-500 uppercase block">vs</span>
                    <span className="text-lg font-bold text-pink-400 font-display block">{selectedMatch.gameType}</span>
                    <span className="text-[10px] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-400 mt-2 inline-block">
                      Pool: {selectedMatch.pool} 🪙
                    </span>
                  </div>
                  <div className="space-y-2">
                    <img src={selectedMatch.playerB.avatar} alt="P2" className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-pink-500" />
                    <h3 className="text-sm font-black text-white">{selectedMatch.playerB.username}</h3>
                    <span className="text-[10px] text-pink-300 font-mono">Odds: {selectedMatch.playerB.odds}x</span>
                  </div>
                </div>

                {/* Simulated Game Action Logs */}
                <div className="space-y-3 bg-[#070709] border border-white/[0.04] p-4.5 rounded-2xl font-mono">
                  <div className="flex justify-between items-center text-[10px] text-neutral-450 uppercase font-bold tracking-wider">
                    <span>Live Match Logs</span>
                    <span>{selectedMatch.spectators} watching</span>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto pt-2 text-xs">
                    {selectedMatch.logs.map((log, index) => (
                      <div key={index} className="text-neutral-350 py-1 border-b border-white/[0.02] flex justify-between items-center">
                        <span>{log}</span>
                        <span className="text-[8px] text-neutral-600">Verified Node</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-emerald-400 leading-normal pt-2 flex items-center gap-1.5 border-t border-white/[0.05]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span>State Check: {selectedMatch.status}</span>
                  </p>
                </div>

                {/* Placing Bets UI */}
                <div className="border-t border-white/[0.06] pt-6 space-y-4">
                  <h4 className="text-sm font-bold text-neutral-200 font-display">Place Stake Bet on Winner</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedWinner('A')}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedWinner === 'A' 
                          ? 'bg-purple-500/10 border-purple-500 text-purple-300 font-bold' 
                          : 'bg-[#0B0B0E] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span className="block text-xs uppercase tracking-wide opacity-80">Back Player A</span>
                      <strong className="text-base font-display">{selectedMatch.playerA.username}</strong>
                    </button>

                    <button
                      onClick={() => setSelectedWinner('B')}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedWinner === 'B' 
                          ? 'bg-pink-500/10 border-pink-500 text-pink-300 font-bold' 
                          : 'bg-[#0B0B0E] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span className="block text-xs uppercase tracking-wide opacity-80">Back Player B</span>
                      <strong className="text-base font-display">{selectedMatch.playerB.username}</strong>
                    </button>
                  </div>

                  {selectedWinner && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-2"
                    >
                      {/* Stake Picker */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-400">Bet Amount:</span>
                        <div className="flex gap-2">
                          {[100, 200, 500, 1000].map(amt => (
                            <button
                              key={amt}
                              onClick={() => setBetAmount(amt)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                                betAmount === amt 
                                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' 
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
                        className="w-full py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-pink-700 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {betPlaced ? 'Locking bet...' : `Confirm Bet: Stake ${betAmount} Coins`}
                      </button>
                    </motion.div>
                  )}
                </div>

              </motion.div>
            ) : (
              /* LIVE MATCHES LIST */
              <motion.div
                key="matches-list"
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider font-display">
                    Active Cyber Duels
                  </h2>
                  <span className="text-[10px] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded font-mono text-neutral-500">
                    Real-time match feed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveMatches.map((match) => (
                    <div 
                      key={match.id}
                      className="bg-[#0B0B0E]/60 border border-white/[0.05] hover:border-purple-500/30 p-5 rounded-2xl transition-all flex flex-col justify-between space-y-4 shadow-md group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/40 border border-purple-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {match.gameType}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          👁️ {match.spectators} Spectators
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs py-2 border-y border-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <img src={match.playerA.avatar} alt="A" className="w-8 h-8 rounded-full object-cover" />
                          <span className="text-white font-bold max-w-[100px] truncate">{match.playerA.username}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">vs</span>
                        <div className="flex items-center gap-2 text-right">
                          <span className="text-white font-bold max-w-[100px] truncate">{match.playerB.username}</span>
                          <img src={match.playerB.avatar} alt="B" className="w-8 h-8 rounded-full object-cover" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <div className="text-[10px] font-mono text-neutral-500">
                          <span className="block">Total Pool</span>
                          <span className="text-white font-bold">{match.pool.toLocaleString()} Coins</span>
                        </div>
                        <button
                          onClick={() => setSelectedMatch(match)}
                          className="px-4 py-2 bg-purple-350 hover:bg-purple-300 text-neutral-950 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        >
                          Spectate & Bet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Winner Stays On (King of the Hill) active table info card */}
          <div className="glass-card rounded-3xl p-6 border border-white/[0.06] space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-neutral-200 font-display flex items-center gap-2">
              <Flame className="w-4 h-4 text-pink-400" />
              King of the Hill Tables
            </h3>
            
            <div className="bg-neutral-950/40 rounded-2xl border border-white/5 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80" alt="King" className="w-16 h-16 rounded-full object-cover border-2 border-pink-500" />
                  <span className="absolute -top-2 -right-2 bg-pink-500 text-white rounded-full p-1 text-[8px] font-bold shadow-md">👑 King</span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Sipho_Grandmaster</h4>
                  <div className="flex gap-2 text-[10px] text-neutral-450 mt-1 font-mono">
                    <span className="bg-pink-950/40 text-pink-300 border border-pink-500/20 px-2 py-0.5 rounded">Current Streak: 9 Wins</span>
                    <span className="bg-neutral-900 px-2 py-0.5 rounded">Total Coins Won: 18,000</span>
                  </div>
                </div>
              </div>

              <div className="text-center md:text-right shrink-0">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase">Current Table Pool</span>
                <strong className="text-xl font-bold font-mono text-pink-400">2,000 Coins</strong>
                <button
                  onClick={() => alert("Challenging the King is locked until the current match concludes!")}
                  className="mt-2 block w-full md:w-auto px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Queue Challenge
                </button>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column: Hyper-Local Leaderboards */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-[#0B0B0F]/90 border border-white/[0.06] rounded-3xl p-6 shadow-xl space-y-6">
            <div className="border-b border-white/[0.06] pb-4">
              <h2 className="text-base font-black text-white tracking-tight font-display flex items-center gap-2">
                <MapPin className="w-5 h-5 text-pink-400" />
                Neighborhood Wars
              </h2>
              <p className="text-xs text-neutral-400 mt-1">Regional rankings & top dueling zones across emerging markets.</p>
            </div>

            {/* Region Selector tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {LOCAL_LEADERBOARDS.map((regionData, idx) => (
                <button
                  key={regionData.region}
                  onClick={() => setActiveLeaderboardIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-sans transition-all whitespace-nowrap cursor-pointer ${
                    activeLeaderboardIdx === idx 
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/35' 
                      : 'bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {regionData.region.split(',')[0]}
                </button>
              ))}
            </div>

            {/* Selected Region Leaderboard details */}
            <div className="space-y-4 pt-2">
              <span className="text-[9px] font-mono text-neutral-500 uppercase block">
                Top players in {LOCAL_LEADERBOARDS[activeLeaderboardIdx].region}:
              </span>
              
              <div className="space-y-3">
                {LOCAL_LEADERBOARDS[activeLeaderboardIdx].players.map((player) => (
                  <div 
                    key={player.name}
                    className="flex items-center justify-between p-3 bg-neutral-950/40 rounded-xl border border-white/5 hover:border-pink-500/25 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 font-mono text-xs font-black ${
                        player.rank === 1 ? 'text-amber-400' : player.rank === 2 ? 'text-neutral-300' : 'text-amber-700'
                      }`}>
                        #{player.rank}
                      </span>
                      <img src={player.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                      <div>
                        <span className="font-bold text-xs text-white block truncate leading-none">{player.name}</span>
                        <span className="text-[9px] text-neutral-500 font-mono mt-1 block">Wins: {player.wins}</span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <strong className="text-xs font-bold text-pink-400">{player.coins.toLocaleString()} 🪙</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#070709] rounded-2xl p-4 border border-white/[0.04] text-[10px] text-neutral-450 leading-relaxed font-sans flex items-start gap-2">
              <span className="shrink-0 text-pink-400">📍</span>
              <p>Your current location is detected. Join tournaments to earn points for your neighborhood board and unlock local reward multipliers!</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
