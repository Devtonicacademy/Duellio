import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Swords, Zap, ChevronRight, Play, Users } from 'lucide-react';

export const TournamentsTab: React.FC = () => {
  const [activeBracketGroup, setActiveBracketGroup] = useState<'semis' | 'quarters' | 'finals'>('semis');
  const [queueJoined, setQueueJoined] = useState(false);

  return (
    <div className="space-y-10" id="tournaments-dashboard">
      
      {/* Header section with live states */}
      <div className="flex flex-col lg:flex-row md:items-end justify-between gap-6 border-b border-neutral-900 pb-6">
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/35 font-display text-[10px] font-bold rounded-md uppercase tracking-wider">
            CHAMPIONSHIP SERIES
          </span>
          <h1 className="font-display text-4xl font-extrabold text-white uppercase tracking-tight">
            DECENTRALIZED PRO LEAGUE <span className="text-purple-300">S4</span>
          </h1>
          <p className="text-neutral-400 font-sans text-sm max-w-xl leading-relaxed">
            The ultimate zero-trust tactical battleground. Track active brackets, participate in dynamic qualifying ladders, and challenge FIDE rating thresholds.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-left md:text-right">
            <span className="font-mono text-[10px] text-neutral-500 block font-bold uppercase tracking-wider">TOTAL PRIZE POOL</span>
            <span className="font-display text-3xl font-extrabold text-purple-300 text-glow-purple">50,000 Coins</span>
          </div>

          <button 
            onClick={() => setQueueJoined(!queueJoined)}
            className={`font-display font-extrabold px-8 h-12 rounded-xl transition-all cursor-pointer font-bold select-none text-xs flex items-center justify-center gap-2 ${
              queueJoined 
                ? 'bg-emerald-400 text-neutral-950 neon-glow-cyan' 
                : 'bg-purple-350 text-neutral-950 neon-glow-primary hover:scale-[1.03]'
            }`}
          >
            <Swords className="w-4 h-4" />
            {queueJoined ? 'QUEUE ACTIVE (CANCEL)' : 'JOIN PRO QUEUE'}
          </button>
        </div>
      </div>

      {/* Grid corresponding to Bento Stream panel + Sidebar lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Stream Banner (Bento Large) */}
        <div className="lg:col-span-8 glass-card rounded-2xl overflow-hidden relative group border border-neutral-850">
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="bg-rose-500 text-white px-2.5 py-1 rounded-md text-[10px] uppercase font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE STREAM
            </span>
            <span className="bg-neutral-950/80 backdrop-blur-md text-xs text-neutral-300 px-3 py-1 rounded-lg border border-neutral-800 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              12.4K VIEWERS
            </span>
          </div>

          <div className="aspect-video w-full relative">
            <img 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103 opacity-75" 
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80"
              alt="Futuristic cyber stage stream view"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-955 via-neutral-955/20 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/10 opacity-100 group-hover:bg-neutral-950/20 transition-all">
              <button className="w-16 h-16 rounded-full bg-purple-350/90 text-neutral-950 flex items-center justify-center shadow-2xl hover:scale-110 transition-all cursor-pointer">
                <Play className="w-6 h-6 animate-pulse fill-neutral-950 text-neutral-950" />
              </button>
            </div>
          </div>

          <div className="p-5 flex justify-between items-center bg-neutral-950 border-t border-neutral-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500 overflow-hidden bg-neutral-900">
                <img 
                  alt="Player Avatar" 
                  className="w-full h-full object-cover" 
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                />
              </div>
              <div>
                <h3 className="font-display font-semibold text-white text-sm">Grand Finals: Team VORTEX vs ECLIPSE</h3>
                <p className="font-mono text-[10px] text-neutral-450">Neon Pro League Main Broadcast Server</p>
              </div>
            </div>

            <div className="flex -space-x-2">
              <span className="w-7 h-7 rounded-full border border-neutral-900 bg-neutral-800 text-[9px] text-neutral-400 font-bold flex items-center justify-center select-none">+</span >
              <span className="w-7 h-7 rounded-full border border-neutral-900 bg-neutral-800 text-[9px] text-neutral-400 font-bold flex items-center justify-center select-none">12</span >
            </div>
          </div>
        </div>

        {/* Sidebar events + XP Progress */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between self-stretch">
          
          <div className="glass-card rounded-xl p-5 space-y-4 border border-neutral-850">
            <h4 className="font-mono text-[10px] text-purple-300 font-bold tracking-widest uppercase">UPCOMING EVENTS</h4>
            
            <div className="space-y-4">
              
              {/* Event 1 */}
              <div className="flex items-center gap-3.5 group cursor-pointer border-b border-neutral-900 pb-3">
                <div className="w-12 h-12 rounded-lg bg-neutral-900 overflow-hidden shrink-0">
                  <img 
                    className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-all" 
                    src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80" 
                    alt="Cyber Event"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-display text-xs font-semibold group-hover:text-purple-300 transition-colors text-white">Midnight Blitz Ladder</p>
                  <p className="text-[10px] text-neutral-450 font-mono mt-0.5">Starts in 4 hours • 128 Slots</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-purple-300 text-xs font-bold">2,500 Coins</p>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500 inline-block" />
                </div>
              </div>

              {/* Event 2 */}
              <div className="flex items-center gap-3.5 group cursor-pointer pb-1">
                <div className="w-12 h-12 rounded-lg bg-neutral-900 overflow-hidden shrink-0">
                  <img 
                    className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-all" 
                    src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80" 
                    alt="Team Event"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-display text-xs font-semibold group-hover:text-purple-300 transition-colors text-white">Titan League qualifiers</p>
                  <p className="text-[10px] text-neutral-450 font-mono mt-0.5">Tomorrow 18:00 • Free Entry</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-purple-300 text-xs font-bold">10,000 Coins</p>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500 inline-block" />
                </div>
              </div>

            </div>
          </div>

          {/* XP Booster progressing card */}
          <div className="glass-card rounded-xl p-5 border border-purple-500/25 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 relative overflow-hidden group">
            <Zap className="w-12 h-12 text-purple-300/10 absolute -right-3 -bottom-3 rotate-12 group-hover:scale-110 transition-transform" />
            <h4 className="font-display text-xs font-bold text-white mb-1.5 uppercase">XP BOOST ACTIVATED</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed mb-4">
              Decentralized tournament participation grants <strong>2x ELO and coin multipliers</strong> directly into escrow vaults.
            </p>
            <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-linear-to-r from-purple-400 to-cyan-400 shadow-md"></div>
            </div>
            <p className="text-[9px] font-mono text-neutral-500 mt-2 text-right">5h 22m remaining</p>
          </div>

        </div>

      </div>

      {/* Playoff Bracket Tree matches bottom section */}
      <section className="glass-card rounded-2xl p-6 border border-neutral-850 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-extrabold text-white text-lg">Duellio Playoff Bracket</h3>
            <p className="font-mono text-[10px] text-neutral-500">Live outcomes and tree synchronization indicators</p>
          </div>
          <div className="flex gap-2">
            {(['quarters', 'semis', 'finals'] as const).map(group => (
              <button
                key={group}
                onClick={() => setActiveBracketGroup(group)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold cursor-pointer transition-all border ${
                  activeBracketGroup === group
                    ? 'bg-purple-350 text-neutral-950 border-purple-300 font-bold'
                    : 'bg-neutral-900/60 text-neutral-400 border-neutral-800'
                }`}
              >
                {group.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center justify-around py-4">
          {/* Semi-Finals matches lists */}
          <div className="space-y-6 w-full lg:w-72">
            
            {/* Match 1 */}
            <div className="relative">
              <div className="glass-card rounded-xl overflow-hidden border-l-4 border-l-purple-400 bg-neutral-950/60 p-4 space-y-3">
                <span className="text-[9px] font-mono text-neutral-500 font-bold block uppercase tracking-wider">MATCH 21 - COMPLETED</span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white">Team VORTEX</span>
                    <strong className="text-purple-300 font-mono">2</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs opacity-50">
                    <span className="text-neutral-300">Eclipse Prime</span>
                    <strong className="font-mono">1</strong>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block absolute right-[-2.2rem] top-1/2 w-8 h-px bg-neutral-850"></div>
            </div>

            {/* Match 2 */}
            <div className="relative">
              <div className="glass-card rounded-xl overflow-hidden border-l-4 border-l-purple-500/30 bg-neutral-950/60 p-4 space-y-3">
                <span className="text-[9px] font-mono text-neutral-500 font-bold block uppercase tracking-wider">MATCH 22 - COMPLETED</span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs opacity-50">
                    <span className="text-neutral-300">Neon Knights</span>
                    <strong className="font-mono">0</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white">Cyber Sharks</span>
                    <strong className="text-purple-300 font-mono">3</strong>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block absolute right-[-2.2rem] top-1/2 w-8 h-px bg-neutral-850"></div>
            </div>

          </div>

          <div className="hidden lg:flex flex-col justify-center h-full">
            <div className="w-0.5 h-36 bg-linear-to-b from-purple-500/20 to-cyan-500/20 rounded-full"></div>
          </div>

          {/* Finals match big card */}
          <div className="w-full lg:w-80">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-purple-400 to-cyan-400 rounded-2xl blur-md opacity-25 group-hover:opacity-40 transition-all"></div>
              
              <div className="relative glass-card rounded-2xl overflow-hidden bg-neutral-955 border border-purple-500/20">
                <div className="p-4 bg-linear-to-r from-purple-500/10 to-transparent text-center border-b border-neutral-900">
                  <p className="font-display font-medium text-pink-300 text-xs tracking-wide">GRAND FINALS</p>
                  <p className="text-[9px] text-neutral-500 font-mono mt-0.5">Sun, Oct 24 • 21:00 UTC</p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-400/40 text-[10px] text-purple-300 font-bold flex items-center justify-center">V</span>
                      <span className="text-white">Team VORTEX</span>
                    </div>
                    <span className="font-mono text-purple-300">TBD</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="h-px bg-neutral-900 flex-1"></div>
                    <span className="text-[9px] font-mono text-neutral-500">VS</span>
                    <div className="h-px bg-neutral-900 flex-1"></div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-700/15 border border-cyan-400/40 text-[10px] text-cyan-300 font-bold flex items-center justify-center">C</span>
                      <span className="text-white">Cyber Sharks</span>
                    </div>
                    <span className="font-mono text-cyan-300">TBD</span>
                  </div>
                </div>

                <div className="p-4 bg-neutral-930 text-center text-[10px] font-mono text-neutral-400 border-t border-neutral-900">
                  ESCROW VALUE LOCKED: 1,500 COINS
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
