import { useState } from 'react';
import { 
  Trophy, 
  Compass,
  Swords,
  Coins,
  User,
  Sun,
  Moon,
  Gamepad2,
  Tv,
  Volume2,
  VolumeX,
  Menu,
  X,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { DuellioLogo } from './DuellioLogo';
import { UserProfile } from '../types';

interface HeaderProps {
  activeTab: 'discover' | 'tournaments' | 'lobbies' | 'profile' | 'play-arena' | 'spectate' | 'chat' | 'admin';
  setActiveTab: (tab: 'discover' | 'tournaments' | 'lobbies' | 'profile' | 'play-arena' | 'spectate' | 'chat' | 'admin') => void;
  setPreselectedGame: (game: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | null) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  userProfile: UserProfile | null;
  onHeaderFaucet: () => void;
  voiceEnabled: boolean;
  toggleVoice: () => void;
  totalUnread?: number;
}

export function Header({
  activeTab,
  setActiveTab,
  setPreselectedGame,
  theme,
  toggleTheme,
  userProfile,
  onHeaderFaucet,
  voiceEnabled,
  toggleVoice,
  totalUnread = 0
}: HeaderProps) {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0B0B0E]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.4)] px-4 md:px-8 py-4 flex justify-between items-center gap-4">
        {/* Logo and network metadata indicator */}
        <div className="flex items-center gap-3 select-none">
          <div 
            onClick={() => setActiveTab('discover')}
            className="cursor-pointer hover:scale-105 transition-transform duration-250 shrink-0"
          >
            <DuellioLogo size={46} showText={false} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span 
                onClick={() => setActiveTab('discover')}
                className="cursor-pointer text-xl font-extrabold text-white tracking-[0.2em] font-display text-glow-purple"
              >
                DUELLIO
              </span>
              <span className="hidden sm:inline bg-emerald-500/20 border border-emerald-500/35 px-2 py-0.5 rounded-full text-[9px] font-mono text-emerald-400 font-bold uppercase animate-pulse">
                PRO NETWORK LIVE
              </span>
            </div>
            <p className="text-[9px] font-mono text-neutral-500">Zero-Trust Matchmaker • FIDE & Whot Certified</p>
          </div>
        </div>

        {/* Dynamic Centered Navigation Tabs - Desktop Only */}
        <nav className="hidden lg:flex items-center bg-[#0F0F13] p-1.5 rounded-2xl border border-white/[0.04] text-xs font-display">
          <button
            onClick={() => { setActiveTab('discover'); setPreselectedGame(null); }}
            className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'discover'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Compass className="w-4 h-4" />
            Discover
          </button>

          <button
            onClick={() => { setActiveTab('play-arena'); setPreselectedGame(null); }}
            className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'play-arena'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Play Arena
          </button>

          <button
            onClick={() => { setActiveTab('tournaments'); setPreselectedGame(null); }}
            className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'tournaments'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Tournaments
          </button>

          <button
            onClick={() => setActiveTab('lobbies')}
            className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'lobbies'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Swords className="w-4 h-4" />
            Lobbies
          </button>

          <button
            onClick={() => { setActiveTab('spectate'); setPreselectedGame(null); }}
            className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'spectate'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Tv className="w-4 h-4" />
            Spectate
          </button>

          <button
            onClick={() => { setActiveTab('chat'); setPreselectedGame(null); }}
            className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none relative ${
              activeTab === 'chat'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-4 h-4" />
              {totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white animate-pulse">
                  {totalUnread}
                </span>
              )}
            </div>
            Chat
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setPreselectedGame(null); }}
            className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'profile'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <User className="w-4 h-4" />
            My Profile
          </button>

          {userProfile?.email === 'devtonicllc@gmail.com' && (
            <button
              onClick={() => { setActiveTab('admin'); setPreselectedGame(null); }}
              className={`px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
                activeTab === 'admin'
                  ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Admin
            </button>
          )}
        </nav>

        {/* Wallet action, faucet and profile image link on right - Desktop Only */}
        <div className="hidden lg:flex items-center gap-3.5">
          <button 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="flex items-center justify-center p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition-all cursor-pointer font-sans"
            id="theme-mode-toggle"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          <button 
            onClick={toggleVoice}
            title={voiceEnabled ? "Mute Voice Announcements" : "Enable Voice Announcements"}
            className="flex items-center justify-center p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition-all cursor-pointer font-sans"
            id="voice-toggle"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>

          <button 
            onClick={onHeaderFaucet}
            title="Instant Faucet Claim"
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all cursor-pointer font-mono text-xs font-bold"
          >
            <Coins className="w-4 h-4 animate-bounce" />
            <span>Claim +1,000</span>
          </button>

          <div 
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2.5 cursor-pointer bg-neutral-900 hover:bg-neutral-850 py-1.5 pl-2.5 pr-4 rounded-full border border-neutral-800 transition-all select-none group"
          >
            <div className="p-0.5 rounded-full border border-purple-500/60 ring-2 ring-purple-500/20 overflow-hidden w-8 h-8">
              <img 
                src={userProfile?.avatar || ''} 
                alt="Me" 
                className="w-full h-full rounded-full object-cover" 
              />
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-[11px] text-white font-bold font-display group-hover:text-purple-300 transition-colors leading-none tracking-tight truncate max-w-[80px]">
                {userProfile?.username || ''}
              </span>
              <strong className="text-[10px] text-purple-300 font-mono leading-none font-bold block mt-0.5">
                {(userProfile?.coins || 0).toLocaleString()} Coins
              </strong>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Hamburger Menu Toggle Button */}
        <button
          onClick={() => setIsSideNavOpen(true)}
          title="Open Navigation Menu"
          className="lg:hidden flex items-center justify-center p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition-all cursor-pointer font-sans"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Sidenav Overlay & Panel */}
      {isSideNavOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSideNavOpen(false)}
          />

          {/* Sidenav Panel */}
          <div className="relative w-80 max-w-[85vw] h-full bg-[#0B0B0E]/95 backdrop-blur-2xl border-l border-white/[0.08] p-6 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)] text-neutral-100 z-10 transition-transform duration-300 ease-out">
            <div>
              {/* Drawer Header */}
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <DuellioLogo size={36} showText={false} />
                  <div>
                    <span className="block text-xs font-extrabold tracking-[0.2em] text-white">DUELLIO</span>
                    <span className="block text-[8px] font-mono text-purple-400 font-bold uppercase tracking-wider">NAV PORTAL</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSideNavOpen(false)}
                  title="Close Menu"
                  className="p-2 text-neutral-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all cursor-pointer border border-white/[0.06]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Vertical Navigation Links */}
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => { setActiveTab('discover'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'discover'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Discover
                </button>

                <button
                  onClick={() => { setActiveTab('play-arena'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'play-arena'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4" />
                  Play Arena
                </button>

                <button
                  onClick={() => { setActiveTab('tournaments'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'tournaments'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  Tournaments
                </button>

                <button
                  onClick={() => { setActiveTab('lobbies'); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'lobbies'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  Lobbies
                </button>

                <button
                  onClick={() => { setActiveTab('spectate'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'spectate'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  Spectate
                </button>

                <button
                  onClick={() => { setActiveTab('chat'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all flex items-center justify-between font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'chat'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </div>
                  {totalUnread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white animate-pulse">
                      {totalUnread}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveTab('profile'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'profile'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>

                {userProfile?.email === 'devtonicllc@gmail.com' && (
                  <button
                    onClick={() => { setActiveTab('admin'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                    className={`w-full px-4 py-3.5 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                      activeTab === 'admin'
                        ? 'bg-purple-350 text-[#070709] font-black'
                        : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Admin Control
                  </button>
                )}
              </nav>
            </div>

            {/* Sidenav Footer: Profile Banner, Faucet, Settings */}
            <div className="flex flex-col gap-4 border-t border-white/[0.06] pt-6 mt-auto">
              {/* Profile Block */}
              <div 
                onClick={() => { setActiveTab('profile'); setIsSideNavOpen(false); }}
                className="flex items-center gap-3.5 cursor-pointer bg-neutral-900/50 hover:bg-neutral-800/80 p-3 rounded-xl border border-neutral-800 transition-all group"
              >
                <div className="p-0.5 rounded-full border border-purple-500/60 ring-2 ring-purple-500/20 overflow-hidden w-10 h-10">
                  <img 
                    src={userProfile?.avatar || ''} 
                    alt="Me" 
                    className="w-full h-full rounded-full object-cover" 
                  />
                </div>
                <div>
                  <span className="block text-xs text-white font-bold font-display group-hover:text-purple-300 transition-colors">
                    {userProfile?.username || ''}
                  </span>
                  <strong className="text-[10px] text-purple-300 font-mono block mt-0.5">
                    {(userProfile?.coins || 0).toLocaleString()} Coins
                  </strong>
                </div>
              </div>

              {/* Faucet button */}
              <button 
                onClick={() => { onHeaderFaucet(); }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all cursor-pointer font-mono text-xs font-bold"
              >
                <Coins className="w-4 h-4 animate-bounce" />
                <span>Claim +1,000 Coins</span>
              </button>

              {/* Theme & Voice configuration row */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={toggleTheme}
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                  className="flex items-center justify-center gap-2 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition-all cursor-pointer font-sans text-xs font-semibold"
                >
                  {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-400" />}
                  <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>

                <button 
                  onClick={toggleVoice}
                  title={voiceEnabled ? "Mute Voice Announcements" : "Enable Voice Announcements"}
                  className="flex items-center justify-center gap-2 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition-all cursor-pointer font-sans text-xs font-semibold"
                >
                  {voiceEnabled ? <Volume2 className="w-4.5 h-4.5 text-purple-400" /> : <VolumeX className="w-4.5 h-4.5 text-neutral-500" />}
                  <span>{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
