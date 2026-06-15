import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, Wallet, Star, ChevronLeft, ChevronRight, Search, ShieldCheck } from 'lucide-react';

interface DiscoverTabProps {
  onSelectGame: (gameType: 'Chess' | 'Ludo' | 'Whot', suggestedStake: number) => void;
  userCoins: number;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({ onSelectGame, userCoins }) => {
  const [activeCategory, setActiveTab] = useState<'all' | 'strategy' | 'classic' | 'fast' | 'high'>('all');
  const [searchInput, setSearchInput] = useState('');

  const featuredGames = [
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
      tags: ['POPULAR NOW'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZArkzDtYwdyIVKtVbyaIo8laEJ30K0ExG9HSbrKeCvmvwqaIn-ggEAOIkAusehsX0jV0YNcxy7Zk4MdQ2pt_y0BAk8Nccn6FpLjgyQ3WhZmRJx0dPFxq0s0ltgeyOiSWKzeCOW6gUXRouF3VJSeRuxuKbaO1jiGqSi-4oJmLF0C71LbRNEJ0w7YIVAgu-WLgCc1lp2dljSG22VmVOgdE6Mfi-QXdKc-Gq3sGltpbc_NeyNFxM8E4tg7K8JaXBxM-MYc5pyC9wng',
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
      tags: ['CARDS'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuD7YykKcuut20Barnbr0ZP5Zv52vpUpn8RaUZH9F4cN4oeuaqzLM5Fj213eJ43DrOYBN3PikRczk8D4XT4Q37QQdV7cIgCYql-kwK-_80cyaGRzkLTTVcLQ0OYWlDZWVrjN8HsNCRE17C-5u5LSMgA7QI2qBnhnVhjpyJBPyljSlQ69Dt-B3cnCQEknUgcRpVcc4hkS1LkUO0qSFAsOhgpfCfBp4QugXG-ySYjBpKH_QpIAlpY_ib6-B6dVTmjnmUbIaDgmarcA',
      isFeatured: false
    },
    {
      id: 'quantum-checkers',
      title: 'Quantum Checkers',
      gameType: 'Chess' as const, // Treat Checkers as Chess module since we have gorgeous FIDE Chess simulator!
      category: 'strategy',
      stakeMin: 2,
      stakeMax: 250,
      totalStaked: 1800,
      playersLive: '950 Live',
      rating: 4.7,
      tags: ['STRATEGY'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBpyQcq_wHjORP_7S3OwfyhNY8tymcwnDRX_7V9DGGQLY3sGhuAQKFEPEeYmlc6P2pEVGb3xEfag6e7cGMUdwKFBL5z1BAnX8O8LBMg-AxI_fAAjCnhMSSB4LkqmHTnszHXqVxzHgzZnmYkDLGfDa73NImMy6KRTYbW_VVl2KnZLoIKlP3bXXlzvltvBenHxHz2g0T6ZP0Z0p6lW4iBrKOM0y4gZtbE74NuhbwLv1Bh31w6dJZf3xZELf5LK0BFm3W3QzGsy8JWw',
      isFeatured: false
    },
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
      tags: ['ELITE', 'STAKE MATCH'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqe2-xHq7O7g4Iu6186He8X5SH3qQ5bFkOXLHrHdtELG-XT5FKjuUF31DoPB_DeYc0GPzBoJPtYj4o8paBh1xCCq1VNihPpby2OS5YmSUHXSFExf_kKhW1HJ0hGwAOcp6uNg9yZJW5SmZ82IPMHRH-7_ArOuHIsSrLQq2Bs_T4CWDnoS0rJ-L8GIEYFg8qlI0CTJ1EqKC1oBN-5uhuTw41dCGh65qNi4pbP37o7j8UFWjjJVYQpvIM-rNubCzMEsTdhg67GMtTww',
      isFeatured: false
    },
    {
      id: 'whot-speed',
      title: 'Whot! Speed Blitz',
      gameType: 'Whot' as const,
      category: 'fast',
      stakeMin: 0.5,
      stakeMax: 20,
      totalStaked: 800,
      playersLive: '860 Live',
      rating: 4.5,
      tags: ['FAST ACTION'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOnWfsmxo7bovkDRx3Otnl614cBaLIuMJTtXm1vCH0evMCd1YnEOVFrHEvXvT1SUSloPQK7NL1VnfSjbCDofEYIBhZ5h6VVzwUkcaP9Jf26BTm1KUgSHv1pvoAaAQe99juyEFWJTEXsGPSJvvgQGfZVP_rvCw7jBIb5AUbhZAJSRzcPrtYri6zqBrg09Byh6VEP_-2bF0zLiNZHd_vjbd2bfBM_gvnYK0ZMNxcEfKOiZLxgopCCcQw3x9R0TwBUPb3E7OSCTGLcg',
      isFeatured: false
    },
    {
      id: 'ludo-blitz-2p',
      title: 'Ludo Blitz: 2 Player',
      gameType: 'Ludo' as const,
      category: 'fast',
      stakeMin: 5,
      stakeMax: 50,
      totalStaked: 4500,
      playersLive: '1.9k Live',
      rating: 4.8,
      tags: ['FAST-PACED'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkcw8U-DOLoucHMsaq1N6fEZ9ymO2eqTMMVx4T9lcGNcAZGH8gfH4EAEv_uov5RCB_HjasO3AXKOu3b9XVZxVCfY_d0mmSDogDClsdsixa8g_yH2yNMKZGVx12AZVdl0utssfkS6jMpmIsuflIQmkgGsNnjhhwuqGXVmSFX-U1h5PUGZRaS5eiLGs78N8hgz8wZY7jcqUFKZiutOqF0HoLzAdmhb8jjKY1boM1aoyrvEzEncYAHghuXThdXDho3aI4o_JTe91hcw',
      isFeatured: false
    }
  ];

  // Additional cinematic grid cards representing trend indicators
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
      
      {/* Premium Hero Banner exactly matching the design */}
      <section className="relative w-full h-[25rem] rounded-3xl overflow-hidden glass-card group flex items-center p-6 md:p-12">
        <div className="absolute inset-0 -z-10">
          <img 
            className="w-full h-full object-cover opacity-35 transition-transform duration-700 group-hover:scale-103" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMWIrsVoSN1aRgOYQ8rmIpYeqm1gw3wVa2wJ-r8EDXSbXCrmgK231P7K_eGKPxnZsw60g9Ug5dW0LGWqWlo1vSjZNXRHvXOnwXWcgM1Mg00A1D4JLob6TX3X76HXYDZOpj8E9cB0kvGMTLi-D2HElYyHfzVtsuIfFulqRYlfdhpbNK5XPZI8T7LinabYA-I7K75rKeh5R-G_NH2T8ZgafxGP_qJ3qPQLC6XsPhihgQl_1gLGA5lNTuLRkW7JMqRstTxPs2CGum1A"
            alt="Cinematic neon terminal metropolis"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/35 rounded-md font-display font-bold text-[10px] uppercase tracking-wider animate-pulse">
              PREMIUM TABLE
            </span>
            <span className="text-neutral-400 font-mono text-xs">ELO MATCHMAKER</span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white leading-none uppercase tracking-tighter">
            GRANDMASTER SERIES: <span className="text-purple-300 text-glow-purple">CHESS</span>
          </h1>

          <p className="text-neutral-300 font-sans text-sm md:text-base leading-relaxed max-w-xl">
            Secure high-stakes strategic chess duals. Engage against FIDE masters and zero-trust chatbot players for deep pool payouts. Real-time encryption active.
          </p>

          <div className="flex items-center gap-3.5 pt-3">
            <button 
              onClick={() => onSelectGame('Chess', 500)}
              className="px-6 py-3 bg-purple-300 hover:bg-purple-200 text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer font-display uppercase tracking-wider neon-glow-primary hover:scale-[1.03]"
            >
              Join Chess Lobby
            </button>
            <button 
              onClick={() => onSelectGame('Ludo', 100)}
              className="px-6 py-3 bg-transparent border border-neutral-700 hover:border-neutral-500 text-neutral-300 text-xs font-semibold rounded-xl hover:bg-white/5 transition-all cursor-pointer uppercase tracking-normal"
            >
              Explore Ludo
            </button>
          </div>
        </div>
      </section>

      {/* Discovery Category Filters & Dynamic Search Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-neutral-900 pb-5">
        <div className="flex flex-wrap gap-2">
          {(['all', 'strategy', 'classic', 'fast', 'high'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4.5 py-2.5 text-xs font-medium rounded-full cursor-pointer transition-all ${
                activeCategory === tab
                  ? 'bg-purple-350 text-neutral-950 font-bold'
                  : 'bg-neutral-900/60 text-neutral-405 border border-neutral-800/80 hover:border-neutral-700 hover:text-neutral-100'
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
          {/* Built-in dynamic search */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-neutral-500" />
            <input 
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search boards..."
              className="bg-neutral-900 border border-neutral-800 focus:border-purple-500/50 rounded-full py-2.5 pl-10 pr-4 text-xs text-neutral-100 placeholder:text-neutral-500 font-sans outline-hidden transition-all w-52 sm:w-64"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-900/80 border border-neutral-800 px-3.5 py-2.5 rounded-xl font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>FIDE APPROVED</span>
          </div>
        </div>
      </section>

      {/* Game Cards Bento Grid Layout matches exactly screenshot 2 */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBoards.length > 0 ? (
          filteredBoards.map((game, index) => {
            // Check if card should take wide span
            const isWide = game.isFeatured || index === 0;
            return (
              <div 
                key={game.id}
                className={`glass-card rounded-2xl overflow-hidden group border border-neutral-800 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between ${
                  isWide ? 'md:col-span-2' : 'col-span-1'
                }`}
              >
                {/* Product Cover image */}
                <div className={`relative overflow-hidden w-full ${isWide ? 'aspect-video' : 'aspect-[4/5]'}`}>
                  <img 
                    src={game.image} 
                    alt={game.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent"></div>
                  
                  {/* Floating Tags */}
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                    {game.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-neutral-900/85 backdrop-blur-md text-purple-300 font-display font-medium text-[8px] tracking-wide rounded-md border border-purple-500/20">
                        {t}
                      </span>
                    ))}
                    <div className="bg-neutral-950/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-neutral-800 text-[10px] font-mono text-center">
                      <span className="text-neutral-500 block text-[8px] font-bold">STAKE RANGE</span>
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
                        <div className="flex items-center gap-1.5 text-xs text-neutral-450 mt-1 font-mono">
                          <Wallet className="w-3.5 h-3.5 text-purple-400" />
                          <span>Total Staked: <strong className="text-purple-300">{game.totalStaked.toLocaleString()} Coins</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded-md text-xs font-mono font-bold text-neutral-300 border border-neutral-800">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{game.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-center">
                    <button 
                      onClick={() => onSelectGame(game.gameType, game.stakeMin * 10)}
                      className="flex-1 py-2.5 bg-purple-350 hover:bg-purple-300 text-neutral-950 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all neon-glow-primary cursor-pointer"
                    >
                      Place Stake & Play
                    </button>
                    <div className="p-2.5 bg-neutral-950 rounded-xl text-neutral-400 font-mono text-[10px] border border-neutral-850">
                      {game.playersLive}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center glass-card rounded-2xl border border-dashed border-neutral-800">
            <h4 className="text-neutral-405 font-mono text-sm">No board tables found matching search.</h4>
          </div>
        )}
      </section>

      {/* TRENDING IN THE REALM Section matching Screenshot 3 bottom */}
      <section className="space-y-6 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-white uppercase tracking-tight">TRENDING IN THE REALM</h2>
            <p className="text-xs text-neutral-500 font-mono">Live virtual worlds and platform simulation metrics</p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full border border-neutral-850 flex items-center justify-center hover:bg-neutral-900 transition-all text-neutral-400 hover:text-white cursor-pointer select-none">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 rounded-full border border-neutral-850 flex items-center justify-center hover:bg-neutral-900 transition-all text-neutral-400 hover:text-white cursor-pointer select-none">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingRealms.map((realm) => (
            <div key={realm.name} className="glass-card rounded-xl overflow-hidden group pb-4 border border-neutral-855 hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div className="h-44 relative overflow-hidden">
                <img src={realm.image} alt={realm.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent"></div>
                <div className="absolute top-3 right-3 bg-neutral-950/80 px-2 py-0.5 rounded text-[8px] font-bold text-purple-300 font-display tracking-wider border border-purple-500/25">
                  ACTIVE
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h5 className="font-display font-semibold text-white text-sm truncate">{realm.name}</h5>
                  <span className="text-neutral-500 text-[9px] font-mono whitespace-nowrap">{realm.players} Playing</span>
                </div>
                <p className="text-neutral-400 text-xs line-clamp-2 leading-relaxed h-8 font-sans">{realm.desc}</p>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-[10px] font-mono text-neutral-500">
                  <span>Category: {realm.tags[0]}</span>
                  <div className="flex items-center gap-0.5 text-amber-400">
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
      <section className="group relative rounded-2xl overflow-hidden glass-card transition-all duration-300 hover:border-purple-500/30 flex flex-col md:flex-row border border-neutral-850">
        <div className="md:w-2/5 relative overflow-hidden min-h-[160px]">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGBaHQnAnHJ4qvQVBK8Q0R9TWU0-oaeINoVKpwMjx8YJnhqUon3lgwo6icPFMaxhGuVv1kZ_jXiLUrkrfwaud6wiTRwWqrhaRxNfyfiODBjnxguOOSKMoErBjdmt1pyT-H8TvnZbNu-fLOLdf2VsFyQcmFp19rrdFykOKta4qwdihOUHzM98_tGLGMy_K-01KsPgPPr5OZa8LnUht9oNDO7JBBn9vNebheRwG0yGyLe2gkjoloxnrk1rf_hrc7auInJQHpmeCAxQ" className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-102" alt="Chess Master" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-neutral-950 hidden md:block"></div>
        </div>
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-display font-medium text-[8px] tracking-wide rounded-md border border-rose-500/30">
              TRENDING EVENT
            </span>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-tighter">CHESS MASTERS LIVE</span>
          </div>
          <h3 className="font-display font-extrabold text-xl text-white">Duellio Pro Championship: Arena S1</h3>
          <p className="text-neutral-400 text-xs md:text-sm leading-relaxed max-w-xl">
            Register and stake early in FIDE-certified tournament events. Pool escalators start at <strong>5,000,000 Coins</strong>. Dynamic anti-cheat scans enabled on host.
          </p>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => onSelectGame('Chess', 50)}
              className="px-5 py-2 bg-purple-350 hover:bg-purple-300 text-neutral-950 font-bold uppercase text-[10px] tracking-wider rounded-lg transition-all cursor-pointer font-display"
            >
              Enter Arena Lobby
            </button>
            <span className="text-neutral-500 text-xs font-mono">Entry limit: 128/128 Slots filled</span>
          </div>
        </div>
      </section>

    </div>
  );
};
