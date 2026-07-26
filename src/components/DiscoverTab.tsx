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
  onSelectGame: (gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman', suggestedStake: number) => void;
  userCoins: number;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({ onSelectGame, userCoins }) => {
  const [activeCategory, setActiveTab] = useState<'all' | 'strategy' | 'classic' | 'fast' | 'high'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [quickStake, setQuickStake] = useState<number>(250);
  const [selectedQuickGame, setSelectedQuickGame] = useState<'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman'>('Stickman');

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
      tags: ['#1 MOST PLAYED', 'CHESS'],
      image: '/assets/chess_bg.png',
      isFeatured: true
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
      tags: ['TRENDING CARDS', 'WHOT'],
      image: '/assets/whot_bg.png',
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
      tags: ['POPULAR ARENA', 'LUDO'],
      image: '/assets/ludo_bg.png',
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
      isFeatured: false
    }
  ];

  const comingSoonGames = [
    {
      name: 'Cyber Backgammon (3D)',
      desc: 'High-speed tactical 3D backgammon with automated dice seed generation and custom checkers.',
      status: 'Q3 2026 RELEASE',
      tags: ['IN DEVELOPMENT', 'STRATEGY'],
      image: '/assets/cyber_backgammon.jpg'
    },
    {
      name: 'Dominoes Overdrive',
      desc: 'High-stakes 4-player chain domino duels with dynamic multiplier tiles and speed rounds.',
      status: 'Q4 2026 RELEASE',
      tags: ['CLOSED BETA', 'MULTIPLAYER'],
      image: '/assets/dominoes_overdrive.jpg'
    },
    {
      name: 'Solitaire Clash',
      desc: 'Head-to-head competitive 1v1 speed solitaire battle royale with real-time card clearing.',
      status: 'Q4 2026 RELEASE',
      tags: ['CONCEPT', 'CARDS'],
      image: '/assets/solitaire_clash.jpg'
    },
    {
      name: 'Snakes & Ladders Cyber-Ascent',
      desc: '3D multi-level vertical board race featuring holographic energy serpents and boost tiles.',
      status: 'Q1 2027 RELEASE',
      tags: ['IN DEVELOPMENT', 'CASUAL'],
      image: '/assets/snakes_ladders.jpg'
    }
  ];

  const filteredBoards = featuredGames.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchInput.toLowerCase());
    if (activeCategory === 'all') return matchesSearch;
    return g.category === activeCategory && matchesSearch;
  });

  return (
    <div className="space-y-10" id="discover-dashboard">
      
      {/* Premium Hero Banner */}
      <section className="relative w-full h-[22rem] md:h-[25rem] rounded-3xl overflow-hidden glass-card group flex items-center p-6 md:p-12 border border-white/10">
        <div className="absolute inset-0 -z-10">
          <img 
            className="w-full h-full object-cover opacity-35 transition-transform duration-700 group-hover:scale-103" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMWIrsVoSN1aRgOYQ8rmIpYeqm1gw3wVa2wJ-r8EDXSbXCrmgK231P7K_eGKPxnZsw60g9Ug5dW0LGWqWlo1vSjZNXRHvXOnwXWcgM1Mg00A1D4JLob6TX3X76HXYDZOpj8E9cB0kvGMTLi-D2HElYyHfzVtsuIfFulqRYlfdhpbNK5XPZI8T7LinabYA-I7K75rKeh5R-G_NH2T8ZgafxGP_qJ3qPQLC6XsPhihgQl_1gLGA5lNTuLRkW7JMqRstTxPs2CGum1A"
            alt="Grandmaster Arena"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-[#070709]/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/35 rounded-md font-display font-bold text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-purple-400" /> PREMIUM ARENA
            </span>
            <span className="text-neutral-400 font-mono text-xs">ELO MATCHMAKER</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight uppercase tracking-tight">
            GRANDMASTER <span className="text-purple-300 text-glow-purple">DUELS</span>
          </h1>

          <p className="text-neutral-300 font-sans text-xs md:text-base leading-relaxed max-w-xl">
            High-stakes strategic board games. Engage in real-time verified matches for pool payouts across Chess, Ludo, Whot, Draft, and Tic-Tac-Toe.
          </p>

          <div className="flex items-center gap-3 pt-3">
            <button 
              onClick={() => onSelectGame('Chess', 500)}
              className="px-6 py-3 bg-purple-350 hover:bg-purple-300 text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer font-display uppercase tracking-wider neon-glow-primary hover:scale-[1.03] flex items-center gap-2"
            >
              <Swords className="w-4 h-4" />
              <span>Join Chess Lobby</span>
            </button>
            <button 
              onClick={() => onSelectGame('Ludo', 100)}
              className="px-6 py-3 bg-transparent border border-neutral-700 hover:border-neutral-500 text-neutral-300 text-xs font-semibold rounded-xl hover:bg-white/5 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-2"
            >
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              <span>Explore Ludo</span>
            </button>
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

      {/* Board Cards Grid Layout */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredBoards.length > 0 ? (
          filteredBoards.map((game, index) => {
            return (
              <motion.div 
                key={game.id}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="glass-bento glass-bento-hover rounded-3xl overflow-hidden group flex flex-col justify-between border border-white/10 col-span-1"
              >
                {/* Product Cover image */}
                <div className="relative overflow-hidden w-full aspect-[4/3]">
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
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center glass-bento rounded-3xl border border-dashed border-white/10">
            <h4 className="text-neutral-400 font-mono text-sm">No board tables found matching search.</h4>
          </div>
        )}
      </section>

      {/* COMING SOON Section */}
      <section className="space-y-6 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/35 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider">
                ROADMAP EXPANSION
              </span>
            </div>
            <h2 className="font-display text-xl font-extrabold text-white uppercase tracking-tight">COMING SOON</h2>
            <p className="text-xs text-neutral-400 font-mono">Upcoming zero-trust board games and arena expansions currently in development</p>
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
          {comingSoonGames.map((game) => (
            <div key={game.name} className="glass-bento glass-bento-hover rounded-3xl overflow-hidden group pb-4 border border-white/10 flex flex-col justify-between">
              <div className="h-44 relative overflow-hidden">
                <img 
                  src={game.image} 
                  alt={game.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F13] via-transparent to-transparent"></div>
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[8px] font-bold text-purple-300 font-display tracking-wider border border-purple-500/30 uppercase">
                  {game.tags[0]}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h5 className="font-display font-bold text-white text-sm truncate">{game.name}</h5>
                </div>
                <p className="text-neutral-400 text-xs line-clamp-2 leading-relaxed h-8 font-sans">{game.desc}</p>
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-mono text-neutral-400">
                  <span className="text-purple-300 font-bold">{game.status}</span>
                  <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[8px] font-mono text-neutral-300 uppercase">COMING SOON</span>
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
