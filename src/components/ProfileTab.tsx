import React from 'react';
import { motion } from 'motion/react';
import { Trophy, HelpCircle, ShieldAlert, Award, Inbox, Clock, Zap, Star, ShieldCheck, Heart, EyeOff, MessageSquare } from 'lucide-react';
import { UserProfile, WalletTransaction } from '../types';

interface ProfileTabProps {
  userProfile: UserProfile;
  transactions: WalletTransaction[];
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ userProfile, transactions }) => {
  
  // Custom mock friends with status indicators
  const friends = [
    {
      name: 'Ghost_Protocol',
      status: 'In Lobby',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlEoWyt4k69f_jcjOpBHjc0bFK9-KFouqDUvsLGypdqRqi8hhs3Flj9prGmaz6vNvdby9s_NvlRTNHsWMYM9alL91dzjDEWuPJEx1bPjHFCCclDswNgSAqN4RUs6_zQade3gxrKsCrvcVREmEnfkEuS4rn-t2XgXrtZp_98fU9FDONcSdXzeMmaxwbxlZi1ud0O1QQ8B8Nl_v1PTWcT-Vx7d5ZzkrRU-CYJi9leZN_wiIkAnrG_ME5ED8T7gCMqQBL1zwJaFqswQ',
      badgeColor: 'border-cyan-400 bg-cyan-400'
    },
    {
      name: 'Glitch_Witch',
      status: 'In Game',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDL9opxIaiZyVCds7zEVPMhkv_nt1wNEUPNQRdB6VKTNJkQ8uxx69_gnAgrc_Zyi9h4o2-trHVDhVTnV3ebeqa32_zTQ8r-rUoYFOlPpoAST2RiE7FaHm8vZ60eTSDtJNMrBkf-Lt4FewJfL89NW_5uzVWif_R5OzlzjKujB7OopZIaKWB1buCF-fC0hnfz0IhrZDzJV5ms-qL5y1qF2ts_I9pImG5EzswhZoUSAhNuxaMOcfFrwFZq5_FigvJ4FL1eOIluuVqvA',
      badgeColor: 'border-purple-400 bg-purple-400'
    },
    {
      name: 'Silent_Echo',
      status: 'Offline',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxy-eVDzCFQ9cAmljD2rC-oErAguIfdRzwvZJCOCdawSVeGBjkbhpCTtRQ085JmRGAFKfpyGqcmRuRPk6BD1EpO5f3H-PK-HMc1VRMUND---kpssWH3rQOLuSb2UtuZkF94PTPtajsBwAdaE763TuWOuZRo2poRykZmKsibvQ7ugo4h5r1hcaqu-tMkfT4SE_9P-gZA61tvhj0ez4Sanss_vjGrUPhbHlTSKNNo3uP-dAgXZQw0V025n4YvfHL--iQQqPWGwJI-g',
      badgeColor: 'border-neutral-700 bg-neutral-700'
    }
  ];

  return (
    <div className="space-y-6" id="player-profile-view">
      
      {/* Hero Header Section matches Screenshot 1 and 5 */}
      <section className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[90px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
        
        {/* Left Side: Circular ELO / Badge indicators */}
        <div className="relative shrink-0">
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-purple-500/30 neon-glow-purple p-1 bg-neutral-900 shadow-xl">
            <div className="w-full h-full rounded-xl overflow-hidden relative">
              <img 
                alt="Player Avatar" 
                className="w-full h-full object-cover" 
                src={userProfile.avatar} 
              />
              <div className="absolute bottom-0 inset-x-0 bg-purple-400/95 text-neutral-950 text-center font-display font-bold text-[9px] py-1 uppercase tracking-wide">
                ELITE OPS
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-3 -right-3 bg-purple-300 text-neutral-950 w-12 h-12 rounded-full flex flex-col items-center justify-center border-4 border-neutral-950 font-display shadow-lg">
            <span className="text-sm font-extrabold leading-none">42</span>
            <span className="text-[7px] font-bold uppercase tracking-tighter">Level</span>
          </div>
        </div>

        {/* Right Side: Primary indicators */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold text-white tracking-tight uppercase">
              {userProfile.username}
            </h1>
            <span className="bg-purple-500/15 border border-purple-500/35 text-purple-300 px-3 py-0.5 rounded-full font-display text-[9px] font-bold tracking-wider uppercase animate-pulse">
              PRO MEMBER
            </span>
          </div>

          <p className="text-xs md:text-sm text-neutral-400 font-sans max-w-xl leading-relaxed">
            Technical duelist specializing in high-performance board games and ELO matrix manipulation. Currently ranking in the top 0.5% of the global Duellio escrow cycle.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 hover:border-purple-500/15 transition-all">
              <span className="text-neutral-500 font-mono text-[9px] font-bold block uppercase tracking-wider">TOTAL MATCH WINS</span>
              <span className="text-purple-300 font-display text-xl font-black">{1420 + userProfile.wins}</span>
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 hover:border-purple-500/15 transition-all">
              <span className="text-neutral-500 font-mono text-[9px] font-bold block uppercase tracking-wider">WIN ESCROW DEGREE</span>
              <span className="text-cyan-300 font-display text-xl font-black">68%</span>
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 hover:border-purple-500/15 transition-all">
              <span className="text-neutral-500 font-mono text-[9px] font-bold block uppercase tracking-wider">ACHIEVEMENTS</span>
              <span className="text-pink-300 font-display text-xl font-black">84/100</span>
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 hover:border-purple-500/15 transition-all">
              <span className="text-neutral-500 font-mono text-[9px] font-bold block uppercase tracking-wider">XP TO NEXT LEVEL</span>
              <div className="mt-2.5">
                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-purple-400 to-cyan-400 w-[75%] shadow-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Bento Grid layout containing radar stats and history ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Performance Radar Metric Block (4-cols) */}
        <div className="lg:col-span-4 glass-card p-5 rounded-2xl flex flex-col justify-between border border-neutral-850">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white text-sm">Player Performance</h3>
            <Zap className="w-4 h-4 text-purple-300 fill-purple-400 animate-pulse" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <svg className="w-full max-w-[14rem] stroke-neutral-800" viewBox="0 0 200 200">
              {/* Radar Grid circles / lines */}
              <polygon className="stroke-white/10 fill-none" strokeWidth="1" points="100,20 180,140 20,140"></polygon>
              <polygon className="stroke-white/10 fill-none" strokeWidth="1" points="100,50 160,125 40,125"></polygon>
              <polygon className="stroke-white/10 fill-none" strokeWidth="1" points="100,80 140,110 60,110"></polygon>
              <line className="stroke-white/10" strokeWidth="1" x1="100" y1="100" x2="100" y2="20"></line>
              <line className="stroke-white/10" strokeWidth="1" x1="100" y1="100" x2="180" y2="140"></line>
              <line className="stroke-white/10" strokeWidth="1" x1="100" y1="100" x2="20" y2="140"></line>
              
              {/* Filled values representing player traits */}
              <polygon className="fill-purple-500/20 stroke-purple-400" strokeWidth="2.5" points="100,35 158,128 48,110"></polygon>
              
              {/* Markers for highlights */}
              <circle cx="100" cy="35" r="3.5" className="fill-purple-300"></circle>
              <circle cx="158" cy="128" r="3.5" className="fill-purple-300"></circle>
              <circle cx="48" cy="110" r="3.5" className="fill-purple-300"></circle>
            </svg>

            <div className="flex justify-between w-full mt-6 text-[10px] font-mono tracking-wider font-bold">
              <div className="text-center font-bold">
                <span className="text-purple-300 block">SKILL</span>
                <span className="text-neutral-300 text-xs">92%</span>
              </div>
              <div className="text-center font-bold">
                <span className="text-cyan-300 block">AGILITY</span>
                <span className="text-neutral-300 text-xs">88%</span>
              </div>
              <div className="text-center font-bold">
                <span className="text-pink-300 block">TEAMWORK</span>
                <span className="text-neutral-300 text-xs">74%</span>
              </div>
            </div>

            <div className="w-full border-t border-neutral-900 mt-5 pt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-[8px] font-mono text-neutral-500 font-bold block uppercase tracking-wider">TOTAL EARNED</p>
                <strong className="text-purple-300 font-mono text-xs">{(userProfile.coins + 12840).toLocaleString()} Coins</strong>
              </div>
              <div>
                <p className="text-[8px] font-mono text-neutral-500 font-bold block uppercase tracking-wider">SECURE ESCROW</p>
                <strong className="text-cyan-300 font-mono text-xs">8,200 Coins</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Games historical logger list (5-cols) */}
        <div className="lg:col-span-5 glass-card p-5 rounded-2xl border border-neutral-850 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <h3 className="font-display font-semibold text-white text-sm">Recent Duels Log</h3>
            <span className="text-[10px] text-neutral-450 font-mono">FIDE DECENTRALIZED FEED</span>
          </div>

          <div className="space-y-3.5">
            
            {/* Log Item 1 */}
            <div className="flex items-center gap-3.5 p-2 bg-neutral-950/60 rounded-xl border border-neutral-900 hover:bg-neutral-900/40 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-md bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800">
                <img 
                  alt="Game Thumb" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuh4k4YaaHDo-emcWDI9rXFXWmnvK5JCEyzVWbBn8MU7aR-rPktMC-qvELjfVlujdinWpDMBFuH7YSR4mHKkq_Dk-mt5CSozenTCcUefYaYtO6qO9elvoHUaktjE61nUNUGrawQojY8u1Ox_405lggrPqq9LtWnNwwF_sAwhHb7nCkma9RyqHDA1f1GsHXoaSjOWQarwetSzycIFzHBQrODhp0fMgx6G42e7cdD8UnIQLnSBMoW5U0U9LFJqS-qqoyX9ev-c0efQ"
                />
              </div>
              <div className="flex-1">
                <h5 className="font-display font-semibold text-xs text-white">VOID RUNNER 2077 (WHOT)</h5>
                <p className="text-[9px] font-mono text-neutral-500 mt-0.5">25m ago • Deathmatch</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-purple-300 font-bold text-xs">+150 XP</p>
                <p className="text-[8px] font-mono text-purple-400 font-semibold uppercase tracking-wider">Victory</p>
              </div>
            </div>

            {/* Log Item 2 */}
            <div className="flex items-center gap-3.5 p-2 bg-neutral-950/60 rounded-xl border border-neutral-900 hover:bg-neutral-900/40 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-md bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800">
                <img 
                  alt="Game Thumb" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDr_L_wuUhbPV36na3DOU3RaGFgYb_1e19qS1LuchnlZPWHbTv5P_OPdHtI7Gr7qj6A_GOmz7lFVCSzvd2wXlQ2BCLZbOjzDG7KHcFV4l0y-l1ZCZy2YhuDw5gPMXoyYAcuj264Elw7SA_LdHTLg1DmjAE0hgJ4PErF7eTu7fJA_EcGV6znvpxPtSvQUcbplWXL8IgtevLBVWw98Ge1KYsAOlMo3DRsXXZzwijexzarDwzFJrCuYhCWf5DgXWhJ0GFiicHxA3KOcw"
                />
              </div>
              <div className="flex-1">
                <h5 className="font-display font-semibold text-xs text-white">SYNTH_STRIKE (LUDO)</h5>
                <p className="text-[9px] font-mono text-neutral-500 mt-0.5">2h ago • Ranked Team</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-pink-300 font-bold text-xs">-45 XP</p>
                <p className="text-[8px] font-mono text-neutral-500 font-semibold uppercase tracking-wider">Defeat</p>
              </div>
            </div>

            {/* Log Item 3 */}
            <div className="flex items-center gap-3.5 p-2 bg-neutral-950/60 rounded-xl border border-neutral-900 hover:bg-neutral-900/40 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-md bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800">
                <img 
                  alt="Game Thumb" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXSen2w7OQY6mkqKeOIDwKoeazb-jJYfFEhyMDGcvhxBQ3e2bCqXnbGWK0UydaqQebcqoAmmuckLDLGsufFo_cBdxPfpfzEt9EHzRMkDwf9ZD2mUFJknqwUsep9eep3yxKyejUwsbsFIz4foNAAg02IE7kr3BeiGYTghzfJjvBrfJ6OwCEcMIM6Q7EXJt5ywabtNaKLb8FTCUjSDXsXteXNDEM9iT3dvopRycKET56g5YRBtF6kPkUoJ79K1Kq82d91zZSJ2rcnw"
                />
              </div>
              <div className="flex-1">
                <h5 className="font-display font-semibold text-xs text-white">NEURAL MESH (CHESS)</h5>
                <p className="text-[9px] font-mono text-neutral-500 mt-0.5">Yesterday • Solo Quest</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-purple-300 font-bold text-xs">+2,000 XP</p>
                <p className="text-[8px] font-mono text-purple-400 font-semibold uppercase tracking-wider">Victory</p>
              </div>
            </div>

          </div>
        </div>

        {/* Friend List (3 Columns) matches Screenshot 1 and 5 */}
        <div className="lg:col-span-3 glass-card p-5 rounded-2xl flex flex-col justify-between border border-neutral-850">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <h3 className="font-display font-semibold text-white text-xs">Friend List</h3>
              <Star className="w-3.5 h-3.5 text-neutral-500" />
            </div>

            <div className="space-y-4">
              {friends.map((friend) => (
                <div key={friend.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full border border-purple-500/35 overflow-hidden p-0.5 bg-neutral-900">
                        <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-full object-cover" />
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full absolute bottom-0 right-0 border-2 border-neutral-950 ${friend.badgeColor}`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-[11px]">{friend.name}</p>
                      <p className="text-[9px] font-mono text-neutral-400">{friend.status}</p>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-neutral-850 rounded-lg text-neutral-500 hover:text-purple-300 cursor-pointer">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full mt-5 py-2 text-xs font-mono bg-neutral-900/80 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-lg transition-all border border-neutral-850 cursor-pointer">
            View All (142 Friends)
          </button>
        </div>

      </div>

      {/* Interactive Achievement Milestones card (12 Columns Full Width) */}
      <div className="glass-card p-5 rounded-2xl border border-neutral-850">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5 border-b border-neutral-900 pb-4">
          <div>
            <h3 className="font-display font-bold text-white text-sm">Achievement Milestones</h3>
            <p className="text-[10px] font-mono text-neutral-500">Tier qualification bounds toward seasonal chest pools</p>
          </div>
          <span className="px-3 py-1 bg-pink-500/15 text-pink-300 rounded-lg font-mono text-[9px] font-bold border border-pink-500/30">
            ★ SEASONAL ELITE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Milestone 1 */}
          <div className="bg-neutral-950/45 p-4 rounded-xl border border-neutral-900 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-400/35 overflow-hidden flex items-center justify-center text-purple-300 font-bold text-xs select-none">
                DT
              </div>
              <div>
                <p className="text-white font-display text-xs font-bold leading-none">Data Thief</p>
                <p className="text-[9px] text-neutral-500 font-mono mt-1">Steal 50,000 Credits</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 w-full shadow-sm"></div>
              </div>
              <p className="text-[8px] font-mono text-purple-300 text-right font-black">COMPLETED</p>
            </div>
          </div>

          {/* Milestone 2 */}
          <div className="bg-neutral-950/45 p-4 rounded-xl border border-neutral-900 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-400/35 overflow-hidden flex items-center justify-center text-cyan-300 font-bold text-xs select-none">
                TB
              </div>
              <div>
                <p className="text-white font-display text-xs font-bold leading-none">Time Bender</p>
                <p className="text-[9px] text-neutral-500 font-mono mt-1">Accumulate 1,000 live hours</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 w-[82%] shadow-sm"></div>
              </div>
              <p className="text-[8px] font-mono text-neutral-400 text-right font-bold">820 / 1,000 HRS</p>
            </div>
          </div>

          {/* Milestone 3 */}
          <div className="bg-neutral-950/45 p-4 rounded-xl border border-neutral-900 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-400/25 overflow-hidden flex items-center justify-center text-pink-300 font-bold text-xs select-none">
                SW
              </div>
              <div>
                <p className="text-white font-display text-xs font-bold leading-none">Shadow Warrior</p>
                <p className="text-[9px] text-neutral-500 font-mono mt-1">100 stake wins without damage</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-pink-400/60 w-[15%]"></div>
              </div>
              <p className="text-[8px] font-mono text-neutral-400 text-right font-bold">15 / 100</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
