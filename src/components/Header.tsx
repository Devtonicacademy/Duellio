import { useState, useEffect } from 'react';
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
  setPreselectedGame: (game: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | null) => void;
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

  // Lock background scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    if (isSideNavOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsSideNavOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isSideNavOpen]);

  return (
    <>
      <div className="sticky top-3 sm:top-4 z-50 px-3 sm:px-6 xl:px-8 max-w-7xl mx-auto transition-all">
        <header className="glass-floating-header rounded-2xl md:rounded-full px-4 sm:px-6 py-2.5 flex justify-between items-center gap-2 sm:gap-4 ring-1 ring-white/10 hover:ring-purple-500/30 transition-all duration-300">
        {/* Logo and network metadata indicator */}
        <div className="flex items-center gap-2.5 sm:gap-3 select-none shrink-0">
          <div 
            onClick={() => setActiveTab('discover')}
            className="cursor-pointer hover:scale-105 transition-transform duration-250 shrink-0"
          >
            <DuellioLogo size={40} showText={false} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span 
                onClick={() => setActiveTab('discover')}
                className="cursor-pointer text-lg sm:text-xl font-extrabold text-white tracking-[0.15em] sm:tracking-[0.2em] font-display text-glow-purple"
              >
                DUELLIO
              </span>
              <span className="hidden min-[480px]:inline-block bg-emerald-500/20 border border-emerald-500/35 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono text-emerald-400 font-bold uppercase animate-pulse">
                PRO NETWORK LIVE
              </span>
            </div>
            <p className="hidden md:block text-[9px] font-mono text-neutral-500 truncate max-w-[200px] lg:max-w-[260px] xl:max-w-none">
              Zero-Trust Matchmaker • FIDE & Whot Certified
            </p>
          </div>
        </div>

        {/* Dynamic Centered Navigation Tabs - Desktop Only (Responsive at lg & xl) */}
        <nav className="hidden lg:flex items-center bg-[#0F0F13] p-1 xl:p-1.5 rounded-2xl border border-white/[0.04] text-xs font-display shrink-0">
          <button
            onClick={() => { setActiveTab('discover'); setPreselectedGame(null); }}
            className={`px-2.5 xl:px-4 py-2 xl:py-2.5 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'discover'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
            <span>Discover</span>
          </button>

          <button
            onClick={() => { setActiveTab('play-arena'); setPreselectedGame(null); }}
            className={`px-2.5 xl:px-4 py-2 xl:py-2.5 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'play-arena'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
            <span><span className="hidden 2xl:inline">Play </span>Arena</span>
          </button>

          <button
            onClick={() => { setActiveTab('tournaments'); setPreselectedGame(null); }}
            className={`px-2.5 xl:px-4 py-2 xl:py-2.5 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'tournaments'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
            <span>
              <span className="hidden xl:inline">Tournaments</span>
              <span className="xl:hidden">Tourneys</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('lobbies')}
            className={`px-2.5 xl:px-4 py-2 xl:py-2.5 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'lobbies'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Swords className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
            <span>Lobbies</span>
          </button>

          <button
            onClick={() => { setActiveTab('spectate'); setPreselectedGame(null); }}
            className={`px-2.5 xl:px-4 py-2 xl:py-2.5 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'spectate'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <Tv className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
            <span>Spectate</span>
          </button>

          <button
            onClick={() => { setActiveTab('chat'); setPreselectedGame(null); }}
            className={`px-2.5 xl:px-4 py-2 xl:py-2.5 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none relative ${
              activeTab === 'chat'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
              {totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white animate-pulse">
                  {totalUnread}
                </span>
              )}
            </div>
            <span>Chat</span>
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setPreselectedGame(null); }}
            className={`px-2.5 xl:px-4 py-2 xl:py-2.5 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
              activeTab === 'profile'
                ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
            }`}
          >
            <User className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
            <span><span className="hidden 2xl:inline">My </span>Profile</span>
          </button>

          {userProfile?.email === 'devtonicllc@gmail.com' && (
            <button
              onClick={() => { setActiveTab('admin'); setPreselectedGame(null); }}
              className={`px-2.5 xl:px-4 py-2 xl:py-2.5 rounded-xl transition-all flex items-center gap-1.5 xl:gap-2 font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
                activeTab === 'admin'
                  ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/10'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* Wallet action, faucet and profile image link on right - Desktop Only */}
        <div className="hidden lg:flex items-center gap-1.5 xl:gap-3 shrink-0">
          <button 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="flex items-center justify-center p-2 xl:p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition-all cursor-pointer font-sans shrink-0"
            id="theme-mode-toggle"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          <button 
            onClick={toggleVoice}
            title={voiceEnabled ? "Mute Voice Announcements" : "Enable Voice Announcements"}
            className="flex items-center justify-center p-2 xl:p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition-all cursor-pointer font-sans shrink-0"
            id="voice-toggle"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>

          <button 
            onClick={onHeaderFaucet}
            title="Instant Faucet Claim"
            className="flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 py-1.5 xl:py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all cursor-pointer font-mono text-[11px] xl:text-xs font-bold shrink-0"
          >
            <Coins className="w-3.5 h-3.5 xl:w-4 xl:h-4 animate-bounce" />
            <span className="hidden xl:inline">Claim +1,000</span>
            <span className="xl:hidden">+1K</span>
          </button>

          <div 
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 xl:gap-2.5 cursor-pointer bg-neutral-900 hover:bg-neutral-850 py-1 xl:py-1.5 pl-2 xl:pl-2.5 pr-3 xl:pr-4 rounded-full border border-neutral-800 transition-all select-none group shrink-0"
          >
            <div className="p-0.5 rounded-full border border-purple-500/60 ring-2 ring-purple-500/20 overflow-hidden w-7 h-7 xl:w-8 xl:h-8 shrink-0">
              <img 
                src={userProfile?.avatar || ''} 
                alt="Me" 
                className="w-full h-full rounded-full object-cover" 
              />
            </div>
            <div className="text-left">
              <span className="block text-[10px] xl:text-[11px] text-white font-bold font-display group-hover:text-purple-300 transition-colors leading-none tracking-tight truncate max-w-[60px] xl:max-w-[85px]">
                {userProfile?.username || ''}
              </span>
              <strong className="text-[9px] xl:text-[10px] text-purple-300 font-mono leading-none font-bold block mt-0.5">
                {(userProfile?.coins || 0).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Quick Actions + Hamburger Menu Toggle */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          {/* Quick Faucet / Coin indicator on mobile/tablet */}
          <button 
            onClick={onHeaderFaucet} 
            title="Claim Faucet"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-mono text-[11px] font-bold cursor-pointer transition-all active:scale-95"
          >
            <Coins className="w-3.5 h-3.5 animate-bounce" />
            <span className="text-[10px]">{(userProfile?.coins || 0).toLocaleString()}</span>
          </button>

          {/* Quick profile avatar link on mobile/tablet */}
          <div 
            onClick={() => setActiveTab('profile')}
            title="View Profile"
            className="cursor-pointer p-0.5 rounded-full border border-purple-500/60 ring-2 ring-purple-500/20 overflow-hidden w-8 h-8 shrink-0 transition-transform active:scale-95"
          >
            <img 
              src={userProfile?.avatar || ''} 
              alt="Me" 
              className="w-full h-full rounded-full object-cover" 
            />
          </div>

          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setIsSideNavOpen(true)}
            title="Open Navigation Menu"
            className="flex items-center justify-center p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition-all cursor-pointer font-sans active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
    </div>

      {/* Sidenav Overlay & Panel */}
      {isSideNavOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSideNavOpen(false)}
          />

          {/* Sidenav Panel */}
          <div className="relative w-80 max-w-[85vw] h-full max-h-screen overflow-y-auto custom-scrollbar bg-[#0B0B0E]/95 backdrop-blur-2xl border-l border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)] text-neutral-100 z-10 transition-transform duration-300 ease-out">
            <div>
              {/* Drawer Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/[0.06]">
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
              <nav className="flex flex-col gap-1.5">
                <button
                  onClick={() => { setActiveTab('discover'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'discover'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>Discover</span>
                </button>

                <button
                  onClick={() => { setActiveTab('play-arena'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'play-arena'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4 shrink-0" />
                  <span>Play Arena</span>
                </button>

                <button
                  onClick={() => { setActiveTab('tournaments'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'tournaments'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" />
                  <span>Tournaments</span>
                </button>

                <button
                  onClick={() => { setActiveTab('lobbies'); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'lobbies'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Swords className="w-4 h-4 shrink-0" />
                  <span>Lobbies</span>
                </button>

                <button
                  onClick={() => { setActiveTab('spectate'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'spectate'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Tv className="w-4 h-4 shrink-0" />
                  <span>Spectate</span>
                </button>

                <button
                  onClick={() => { setActiveTab('chat'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'chat'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>Chat</span>
                  </div>
                  {totalUnread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white animate-pulse">
                      {totalUnread}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveTab('profile'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                  className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                    activeTab === 'profile'
                      ? 'bg-purple-350 text-[#070709] font-black'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>My Profile</span>
                </button>

                {userProfile?.email === 'devtonicllc@gmail.com' && (
                  <button
                    onClick={() => { setActiveTab('admin'); setPreselectedGame(null); setIsSideNavOpen(false); }}
                    className={`w-full px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-bold cursor-pointer uppercase text-[11px] tracking-wider select-none ${
                      activeTab === 'admin'
                        ? 'bg-purple-350 text-[#070709] font-black'
                        : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Admin Control</span>
                  </button>
                )}
              </nav>
            </div>

            {/* Sidenav Footer: Profile Banner, Faucet, Settings */}
            <div className="flex flex-col gap-3.5 border-t border-white/[0.06] pt-5 mt-6 shrink-0">
              {/* Profile Block */}
              <div 
                onClick={() => { setActiveTab('profile'); setIsSideNavOpen(false); }}
                className="flex items-center gap-3.5 cursor-pointer bg-neutral-900/50 hover:bg-neutral-800/80 p-3 rounded-xl border border-neutral-800 transition-all group"
              >
                <div className="p-0.5 rounded-full border border-purple-500/60 ring-2 ring-purple-500/20 overflow-hidden w-10 h-10 shrink-0">
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
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                  <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>

                <button 
                  onClick={toggleVoice}
                  title={voiceEnabled ? "Mute Voice Announcements" : "Enable Voice Announcements"}
                  className="flex items-center justify-center gap-2 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition-all cursor-pointer font-sans text-xs font-semibold"
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
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
