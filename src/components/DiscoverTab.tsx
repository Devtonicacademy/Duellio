import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Wallet, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  ShieldCheck, 
  Flame, 
  Zap, 
  Swords, 
  Gift, 
  Gamepad2, 
  Radio,
  ArrowRight
} from 'lucide-react';

interface DiscoverTabProps {
  onSelectGame: (gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe', suggestedStake: number) => void;
  userCoins: number;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({ onSelectGame, userCoins }) => {
  const [activeCategory, setActiveTab] = useState<'all' | 'strategy' | 'classic' | 'fast' | 'high'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [quickStake, setQuickStake] = useState<number>(250);
  const [selectedQuickGame, setSelectedQuickGame] = useState<'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe'>('Chess');

  const featuredGames = [
    {
      id: 'grandmaster-chess',
      title: 'Grandmaster Chess',
      gameType: 'Chess' as const,
      category: 'high',
      stakeMin: 10,
      stakeMax: 1000,
      totalStaked: 45000,
      playersLive: '5.4k Live',
      rating: 5.0,
      tags: ['ELITE', 'CHESS'],
      image: '/assets/chess_bg.png',
      isFeatured: false
    },
    {
      id: 'ludo-cyber',
      title: 'Ludo Cyber-Clash',
      gameType: 'Ludo' as const,
      category: 'classic',
      stakeMin: 5,
      stakeMax: 500,
      totalStaked: 12450,
      playersLive: '4.8k Live',
      rating: 4.8,
      tags: ['POPULAR NOW', 'LUDO'],
      image: '/assets/ludo_bg.png',
      isFeatured: false
    },
    {
      id: 'whot-royale',
      title: 'Neon Whot! Royale',
      gameType: 'Whot' as const,
      category: 'fast',
      stakeMin: 1,
      stakeMax: 100,
      totalStaked: 3200,
      playersLive: '1.2k Live',
      rating: 4.9,
      tags: ['CARDS', 'WHOT'],
      image: '/assets/whot_bg.png',
      isFeatured: false
    },
    {
      id: 'quantum-checkers',
      title: 'Quantum Drafts',
      gameType: 'Draft' as const,
      category: 'strategy',
      stakeMin: 2,
      stakeMax: 250,
      totalStaked: 1800,
      playersLive: '950 Live',
      rating: 4.7,
      tags: ['STRATEGY', 'DRAFT'],
      image: '/assets/draft_bg.png',
      isFeatured: false
    },
    {
      id: 'cyber-tictactoe',
      title: 'Cyber Tic-Tac-Toe',
      gameType: 'TicTacToe' as const,
      category: 'fast',
      stakeMin: 5,
      stakeMax: 300,
      totalStaked: 5400,
      playersLive: '2.1k Live',
      rating: 4.9,
      tags: ['RAPID DUEL', 'TIC-TAC-TOE'],
      image: '/assets/tictactoe_bg.png',
      isFeatured: true
    }
  ];

  const trendingRealms = [
    {
      name: 'Neon Drifters',
      desc: 'High-speed hovercraft racing through the vertical sprawl of Neo-Tokyo.',
      rating: 4.8,
      players: '12k',
      tags: ['NEW CONTENT', 'RACING'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBon70yZ_tB-mb165-0BCRbM32AAa-9Lnrt9JWloViALC_6m9GrXcu42YRES_RqOF5p0BXWQn95MwKvIq2TsyTdMw7Mh4-uPILvxGOMkHdtg11eagTZZ3-heK-2kd0ojsWOfa9ElKGQ1_SagECr5UttnEnDonz5Xmw4kepWTmXNAqG_De_yVDV2oHfB0LEiOGbarcZ2mMOsSg1vHu29mrg3fo-A8xcJhr_KBakNttymcmVD1tn6qWeeqE5_3sZ4UiDXHpiB9-45Tg'
    },
    {
      name: 'Void Strider',
      desc: 'Explore the fractured dimensions of the digital afterlife in this souls-like epic.',
      rating: 4.9,
      players: '8k',
      tags: ['ADVENTURE'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfH1WeqOfR1BW4Lfq-IW-Smuo5n-BOhHG1Uk8ZCToHUsd0WVaX2BnOnUqvoCt3-XNp4xBz5G1iWgMb7r2PzaxpZwoGxgMsVLgrvsDB8qwcrUOWVrIEpO7oVkO3tgP8WaxSk1UG8s-JiC5rLtaiD9BbVNiEk2J2Qkxxxq9OtzFLCTArIYRbRjrHMZsTR1_ssXD4rBJ9Oo86lSyM_Mi-WyoUwIiQn6thJwVqVvQHcUkl7FNf56wolV3tP675huMof4_I-DP1t7Su7Q'
    },
    {
      name: 'Synth Strike',
      desc: 'Tactical team-based shooter with deep weapon customization and hacking mechanics.',
      rating: 4.7,
      players: '42k',
      tags: ['FPS'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoHYcbyHD67L6QbcDJytcn-3RZbEM-3JwTfo-TvZ7MkXKAHrTw0HHIwKyc_L-N66zf0n3HW05o5UMjSkGlb8OjuU4e3UtypO8H-R2HnHc-8DOdWqjVGhNOIBKA5KHwkXwg4YqEDBrN6uQddpw8p6rXC-i3uEJKB75xHvMCNRkerwlfzI1QzJC9GyWy9wpoDegmz6h8SnDD1k56ulnxjmuFMXbfnIyCtBAMmpDN1jrgNywy_ms_V3gfUqQdVM4U9nQ5BhHIu8OYSA'
    },
    {
      name: 'Core Manager',
      desc: 'Manage resources and build your empire across colonized asteroid belts.',
      rating: 4.5,
      players: '5k',
      tags: ['STRATEGY'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHFPha7AYvAggKvPyNxTHKCRn9obaynZjJcJp90r3j2fXp4rk_J2khMrBsRWl3bjTlnkwW5OyA_pjLLcg6uV3DZZQndScbD9Bvy6TU56g_oGxI6_yNpbwCUF91_ii39P_onrLwZT-ObF45AlWh5tatmVGTWKUxFA3IP4YuHmm-qSqPDJ1zKvsOg1BtMLJgWdMCbGed3z6GCcb7JdSeEEg713b105znY-H4rCrJJgrnkMdLiqAEGTAZs6xngKkhiaGxz4qksm7wCQ'
    }
  ];

  const filteredBoards = featuredGames.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchInput.toLowerCase());
    if (activeCategory === 'all') return matchesSearch;
    return g.category === activeCategory && matchesSearch;
  });

  return (
    <div className="space-y-10" id="discover-dashboard">
      
      {/* Dynamic Asymmetric Bento Grid Header Hero Module */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Bento Tile 1: Hero Featured Spotlight (Spans 2 cols, 2 rows on large screens) */}
        <div className="md:col-span-2 lg:col-span-2 md:row-span-2 relative min-h-[26rem] rounded-3xl overflow-hidden glass-bento glass-bento-hover group flex flex-col justify-end p-6 md:p-8">
          <div className="absolute inset-0 -z-10">
            <img 
              className="w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMWIrsVoSN1aRgOYQ8rmIpYeqm1gw3wVa2wJ-r8EDXSbXCrmgK231P7K_eGKPxnZsw60g9Ug5dW0LGWqWlo1vSjZNXRHvXOnwXWcgM1Mg00A1D4JLob6TX3X76HXYDZOpj8E9cB0kvGMTLi-D2HElYyHfzVtsuIfFulqRYlfdhpbNK5XPZI8T7LinabYA-I7K75rKeh5R-G_NH2T8ZgafxGP_qJ3qPQLC6XsPhihgQl_1gLGA5lNTuLRkW7JMqRstTxPs2CGum1A"
              alt="Grandmaster Arena"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/70 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#070709]/90 via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 space-y-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-purple-500/25 text-purple-300 border border-purple-500/40 rounded-full font-display font-bold text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-purple-400" /> FEATURED ARENA
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase">
                12.4k ACTIVE DUELS
              </span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight uppercase tracking-tight">
              GRANDMASTER <span className="text-purple-300 text-glow-purple">CHESS & LUDO</span>
            </h1>

            <p className="text-neutral-300 font-sans text-xs md:text-sm leading-relaxed max-w-xl">
              High-stakes zero-trust duels with real-time rule verification, automated payouts, and algorithmic match rating.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => onSelectGame('Chess', 500)}
                className="px-5 py-2.5 bg-purple-350 hover:bg-purple-300 text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer font-display uppercase tracking-wider neon-glow-primary hover:scale-[1.03] flex items-center gap-2"
              >
                <Swords className="w-4 h-4" />
                <span>Launch Chess Lobby</span>
              </button>
              <button 
                onClick={() => onSelectGame('Ludo', 100)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2"
              >
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>Ludo Match</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bento Tile 2: Instant Stake Matchmaker (Col-span 1) */}
        <div className="glass-bento glass-bento-hover rounded-3xl p-5 flex flex-col justify-between space-y-4 border border-white/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/30">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-white font-display text-xs font-bold uppercase">1-Tap Stake</h4>
                <p className="text-[10px] font-mono text-neutral-400">Instant Matchmaker</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">
              INSTANT
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-1 p-1 bg-white/5 rounded-xl border border-white/5 text-[10px] font-mono font-bold">
              {(['Chess', 'Ludo', 'Whot', 'Draft', 'TicTacToe'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedQuickGame(g)}
                  className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                    selectedQuickGame === g 
                      ? 'bg-purple-350 text-neutral-950 font-black shadow-md' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-neutral-300">
                <span>Selected Stake:</span>
                <span className="text-purple-300 font-bold">{quickStake} Coins</span>
              </div>
              <div className="flex gap-1.5">
                {[100, 250, 500, 1000].map(s => (
                  <button
                    key={s}
                    onClick={() => setQuickStake(s)}
                    className={`flex-1 py-1 rounded-lg font-mono text-[10px] font-bold border transition-all cursor-pointer ${
                      quickStake === s 
                        ? 'bg-purple-500/30 border-purple-400 text-purple-200' 
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:border-white/20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectGame(selectedQuickGame, quickStake)}
            className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
          >
            <span>Play {selectedQuickGame} ({quickStake} C)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bento Tile 3: Daily Quest & Streak Rewards (Col-span 1) */}
        <div className="glass-bento glass-bento-hover rounded-3xl p-5 flex flex-col justify-between space-y-4 border border-white/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-white font-display text-xs font-bold uppercase">Daily Quest</h4>
                <p className="text-[10px] font-mono text-neutral-400">Claim 500 Free Coins</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25">
              3 DAY STREAK
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>Progress: 2/3 Matches</span>
              <span className="text-amber-400 font-bold">66%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full w-2/3 animate-pulse"></div>
            </div>
            <p className="text-[10px] text-neutral-300 leading-tight">
              Complete 1 more match today to unlock the daily mystery vault.
            </p>
          </div>

          <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] font-mono text-amber-300">
            <Trophy className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="truncate">Reward: +500 Coins + XP Boost</span>
          </div>
        </div>

        {/* Bento Tile 4: Live Broadcast & Spectate Ticker (Col-span 1 or 2 depending on breakpoint) */}
        <div className="md:col-span-1 lg:col-span-2 glass-bento glass-bento-hover rounded-3xl p-5 flex flex-col justify-between space-y-3 border border-white/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              <h4 className="text-white font-display text-xs font-bold uppercase tracking-wider">Live Broadcasts</h4>
            </div>
            <span className="text-[9px] font-mono text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
              ● LIVE NOW
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono text-purple-300 font-bold">
                <span>Cyber Chess Arena</span>
                <span className="text-neutral-400">1,240 Spectators</span>
              </div>
              <p className="text-white text-xs font-display font-semibold truncate">Grandmaster Alpha vs Master Nova</p>
              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                <span>Pot: 5,000 Coins</span>
                <span className="text-emerald-400 font-bold">Turn 24</span>
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono text-cyan-300 font-bold">
                <span>Whot! Royale Blitz</span>
                <span className="text-neutral-400">890 Spectators</span>
              </div>
              <p className="text-white text-xs font-display font-semibold truncate">Vortex King vs Shadow Blade</p>
              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                <span>Pot: 2,500 Coins</span>
                <span className="text-amber-400 font-bold">Final Card!</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Discovery Category Filters & Dynamic Search Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-white/10 pb-5">
        <div className="flex flex-wrap gap-2">
          {(['all', 'strategy', 'classic', 'fast', 'high'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4.5 py-2 text-xs font-medium rounded-full cursor-pointer transition-all ${
                activeCategory === tab
                  ? 'bg-purple-350 text-neutral-950 font-extrabold shadow-md shadow-purple-500/20'
                  : 'glass-pill text-neutral-300 hover:border-purple-500/40 hover:text-white'
              }`}
            >
              {tab === 'all' && 'All Tables'}
              {tab === 'strategy' && 'Strategy'}
              {tab === 'classic' && 'Classic'}
              {tab === 'fast' && 'Fast-Paced'}
              {tab === 'high' && 'High Stakes'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-neutral-400" />
            <input 
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tables..."
              className="bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-full py-2 pl-10 pr-4 text-xs text-neutral-100 placeholder:text-neutral-400 font-sans outline-hidden transition-all w-52 sm:w-64 backdrop-blur-md"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-300 bg-white/5 border border-white/10 px-3.5 py-2 rounded-full font-mono backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold">FIDE CERTIFIED</span>
          </div>
        </div>
      </section>

      {/* Game Cards Bento Grid Layout */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBoards.length > 0 ? (
          filteredBoards.map((game) => {
            const isWide = game.isFeatured;
            return (
              <div 
                key={game.id}
                className={`glass-bento glass-bento-hover rounded-3xl overflow-hidden group flex flex-col justify-between border border-white/10 ${
                  isWide ? 'md:col-span-2' : 'col-span-1'
                }`}
              >
                {/* Product Cover image */}
                <div className={`relative overflow-hidden w-full ${isWide ? 'aspect-video' : 'aspect-[4/3]'}`}>
                  <img 
                    src={game.image} 
                    alt={game.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F13] via-[#0F0F13]/20 to-transparent"></div>
                  
                  {/* Floating Tags */}
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                    {game.tags.map(t => (
                      <span key={t} className="px-2.5 py-1 bg-black/70 backdrop-blur-md text-purple-300 font-display font-bold text-[9px] tracking-wider rounded-lg border border-purple-500/30 uppercase">
                        {t}
                      </span>
                    ))}
                    <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-center">
                      <span className="text-neutral-400 block text-[8px] font-bold uppercase">STAKE RANGE</span>
                      <span className="text-purple-300 font-bold">{game.stakeMin} - {game.stakeMax} Coins</span>
                    </div>
                  </div>
                </div>

                {/* Info and Actions */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-display text-base font-bold tracking-tight">
                          {game.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1 font-mono">
                          <Wallet className="w-3.5 h-3.5 text-purple-400" />
                          <span>Total Staked: {game.totalStaked.toLocaleString()} C</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-neutral-200 border border-white/10">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{game.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-center pt-2">
                    <button 
                      onClick={() => onSelectGame(game.gameType, game.stakeMin * 10)}
                      className="flex-1 py-2.5 bg-purple-350 hover:bg-purple-300 text-neutral-950 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all neon-glow-primary cursor-pointer font-display"
                    >
                      Place Stake & Play
                    </button>
                    <div className="px-3 py-2.5 bg-white/5 rounded-xl text-neutral-300 font-mono text-[10px] border border-white/10 font-bold">
                      {game.playersLive}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center glass-bento rounded-3xl border border-dashed border-white/10">
            <h4 className="text-neutral-400 font-mono text-sm">No board tables found matching search.</h4>
          </div>
        )}
      </section>

      {/* TRENDING IN THE REALM Section */}
      <section className="space-y-6 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-white uppercase tracking-tight">TRENDING IN THE REALM</h2>
            <p className="text-xs text-neutral-400 font-mono">Live virtual worlds and platform simulation metrics</p>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-xl border border-white/10 glass-pill flex items-center justify-center hover:bg-white/10 transition-all text-neutral-300 hover:text-white cursor-pointer select-none">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-xl border border-white/10 glass-pill flex items-center justify-center hover:bg-white/10 transition-all text-neutral-300 hover:text-white cursor-pointer select-none">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingRealms.map((realm) => (
            <div key={realm.name} className="glass-bento glass-bento-hover rounded-3xl overflow-hidden group pb-4 border border-white/10 flex flex-col justify-between">
              <div className="h-44 relative overflow-hidden">
                <img src={realm.image} alt={realm.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F13] via-transparent to-transparent"></div>
                <div className="absolute top-3 right-3 bg-black/80 px-2.5 py-1 rounded-md text-[8px] font-bold text-purple-300 font-display tracking-wider border border-purple-500/30">
                  ACTIVE
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h5 className="font-display font-semibold text-white text-sm truncate">{realm.name}</h5>
                  <span className="text-neutral-400 text-[9px] font-mono font-bold whitespace-nowrap">{realm.players} Playing</span>
                </div>
                <p className="text-neutral-400 text-xs line-clamp-2 leading-relaxed h-8 font-sans">{realm.desc}</p>
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-mono text-neutral-400">
                  <span>Category: {realm.tags[0]}</span>
                  <div className="flex items-center gap-0.5 text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{realm.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Embedded horizontal tournament campaign */}
      <section className="group relative rounded-3xl overflow-hidden glass-bento glass-bento-hover flex flex-col md:flex-row border border-white/10">
        <div className="md:w-2/5 relative overflow-hidden min-h-[180px]">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGBaHQnAnHJ4qvQVBK8Q0R9TWU0-oaeINoVKpwMjx8YJnhqUon3lgwo6icPFMaxhGuVv1kZ_jXiLUrkrfwaud6wiTRwWqrhaRxNfyfiODBjnxguOOSKMoErBjdmt1pyT-H8TvnZbNu-fLOLdf2VsFyQcmFp19rrdFykOKta4qwdihOUHzM98_tGLGMy_K-01KsPgPPr5OZa8LnUht9oNDO7JBBn9vNebheRwG0yGyLe2gkjoloxnrk1rf_hrc7auInJQHpmeCAxQ" className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-102" alt="Chess Master" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0F0F13] hidden md:block"></div>
        </div>
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 font-display font-bold text-[8px] tracking-wide rounded-full border border-rose-500/30">
              TRENDING EVENT
            </span>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-tighter">CHESS MASTERS LIVE</span>
          </div>
          <h3 className="font-display font-extrabold text-xl text-white">Duellio Pro Championship: Arena S1</h3>
          <p className="text-neutral-300 text-xs md:text-sm leading-relaxed max-w-xl">
            Register and stake early in FIDE-certified tournament events. Pool escalators start at <strong>5,000,000 Coins</strong>. Dynamic anti-cheat scans enabled on host.
          </p>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => onSelectGame('Chess', 50)}
              className="px-5 py-2.5 bg-purple-350 hover:bg-purple-300 text-neutral-950 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer font-display neon-glow-primary"
            >
              Enter Arena Lobby
            </button>
            <span className="text-neutral-400 text-xs font-mono">Entry limit: 128/128 Slots filled</span>
          </div>
        </div>
      </section>

    </div>
  );
};
