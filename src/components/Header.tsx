import { useState, useEffect, useRef } from 'react';
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
  Menu,
  X,
  MessageSquare,
  ShieldAlert,
  Bell,
  Flag,
  Check,
  Trash2,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { DuellioLogo } from './DuellioLogo';
import { UserProfile, NotificationItem } from '../types';

interface HeaderProps {
  activeTab: 'discover' | 'tournaments' | 'lobbies' | 'profile' | 'play-arena' | 'spectate' | 'chat' | 'admin';
  setActiveTab: (tab: 'discover' | 'tournaments' | 'lobbies' | 'profile' | 'play-arena' | 'spectate' | 'chat' | 'admin') => void;
  setPreselectedGame: (game: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman' | null) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  userProfile: UserProfile | null;
  onHeaderFaucet: () => void;
  totalUnread?: number;
  notifications?: NotificationItem[];
  onAcceptChallenge?: (notification: NotificationItem) => void;
  onDeclineChallenge?: (notificationId: string) => void;
  onAcceptForfeit?: (notification: NotificationItem) => void;
  onDeclineForfeit?: (notificationId: string) => void;
  onClearNotifications?: () => void;
  onMarkNotificationsRead?: () => void;
  onSimulateNotification?: (type: 'challenge' | 'forfeit') => void;
}

export function Header({
  activeTab,
  setActiveTab,
  setPreselectedGame,
  theme,
  toggleTheme,
  userProfile,
  onHeaderFaucet,
  totalUnread = 0,
  notifications = [],
  onAcceptChallenge,
  onDeclineChallenge,
  onAcceptForfeit,
  onDeclineForfeit,
  onClearNotifications,
  onMarkNotificationsRead,
  onSimulateNotification
}: HeaderProps) {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

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

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  return (
    <>
      <div className="sticky top-2 sm:top-4 z-50 px-2 sm:px-4 lg:px-6 xl:px-8 max-w-7xl mx-auto transition-all">
        <header className="glass-floating-header rounded-2xl xl:rounded-full px-3 sm:px-5 xl:px-6 py-2 sm:py-2.5 flex justify-between items-center gap-2 xl:gap-4 ring-1 ring-white/10 hover:ring-purple-500/30 transition-all duration-300">
          {/* Logo and network metadata indicator */}
          <div className="flex items-center gap-2 sm:gap-3 select-none shrink-0">
            <div 
              onClick={() => setActiveTab('discover')}
              className="cursor-pointer hover:scale-105 transition-transform duration-250 shrink-0"
            >
              <DuellioLogo size={36} showText={false} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span 
                  onClick={() => setActiveTab('discover')}
                  className="cursor-pointer text-base sm:text-lg xl:text-xl font-extrabold text-white tracking-[0.12em] sm:tracking-[0.2em] font-display text-glow-purple"
                >
                  DUELLIO
                </span>
                <span className="hidden min-[520px]:inline-block bg-emerald-500/20 border border-emerald-500/35 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono text-emerald-400 font-bold uppercase animate-pulse">
                  PRO NETWORK LIVE
                </span>
              </div>
              <p className="hidden 2xl:block text-[9px] font-mono text-neutral-500 truncate max-w-[200px]">
                Zero-Trust Matchmaker • FIDE & Whot Certified
              </p>
            </div>
          </div>

          {/* Dynamic Centered Navigation Tabs - Desktop Only (Icon-only by default, smooth label reveal on hover) */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#0F0F13] p-1.5 rounded-2xl border border-white/[0.04] text-xs font-display shrink-0">
            <button
              onClick={() => { setActiveTab('discover'); setPreselectedGame(null); }}
              title="Discover"
              className={`group relative flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-300 ease-out font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
                activeTab === 'discover'
                  ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/20'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.06]'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden inline-block leading-none">
                Discover
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('play-arena'); setPreselectedGame(null); }}
              title="Play Arena"
              className={`group relative flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-300 ease-out font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
                activeTab === 'play-arena'
                  ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/20'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.06]'
              }`}
            >
              <Gamepad2 className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden inline-block leading-none">
                Play Arena
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('tournaments'); setPreselectedGame(null); }}
              title="Tournaments"
              className={`group relative flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-300 ease-out font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
                activeTab === 'tournaments'
                  ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/20'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.06]'
              }`}
            >
              <Trophy className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden inline-block leading-none">
                Tournaments
              </span>
            </button>

            <button
              onClick={() => setActiveTab('lobbies')}
              title="Lobbies"
              className={`group relative flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-300 ease-out font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
                activeTab === 'lobbies'
                  ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/20'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.06]'
              }`}
            >
              <Swords className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden inline-block leading-none">
                Lobbies
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('spectate'); setPreselectedGame(null); }}
              title="Spectate"
              className={`group relative flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-300 ease-out font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
                activeTab === 'spectate'
                  ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/20'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.06]'
              }`}
            >
              <Tv className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden inline-block leading-none">
                Spectate
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('chat'); setPreselectedGame(null); }}
              title="Chat"
              className={`group relative flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-300 ease-out font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
                activeTab === 'chat'
                  ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/20'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.06]'
              }`}
            >
              <div className="relative shrink-0">
                <MessageSquare className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                {totalUnread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white animate-pulse">
                    {totalUnread}
                  </span>
                )}
              </div>
              <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden inline-block leading-none">
                Chat
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('profile'); setPreselectedGame(null); }}
              title="My Profile"
              className={`group relative flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-300 ease-out font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
                activeTab === 'profile'
                  ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/20'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.06]'
              }`}
            >
              <User className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden inline-block leading-none">
                My Profile
              </span>
            </button>

            {userProfile?.email === 'devtonicllc@gmail.com' && (
              <button
                onClick={() => { setActiveTab('admin'); setPreselectedGame(null); }}
                title="Admin Control"
                className={`group relative flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-300 ease-out font-bold cursor-pointer uppercase text-[10px] tracking-wider select-none ${
                  activeTab === 'admin'
                    ? 'bg-purple-350 text-[#070709] font-black shadow-lg shadow-purple-500/20'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.06]'
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden inline-block leading-none">
                  Admin
                </span>
              </button>
            )}
          </nav>

          {/* Wallet action, faucet, notifications and profile image link on right - Desktop Only */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <button 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="flex items-center justify-center p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition-all cursor-pointer font-sans shrink-0"
              id="theme-mode-toggle"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Notification Bell Button & Dropdown Container */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                title="Match & Arena Notifications"
                className={`relative flex items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer font-sans shrink-0 border ${
                  unreadCount > 0
                    ? 'bg-purple-500/25 text-purple-300 border-purple-500/60 shadow-lg shadow-purple-500/20'
                    : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Center Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 max-w-[92vw] bg-[#0B0B0E]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 p-4 font-sans text-xs text-white">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-purple-400" />
                      <span className="font-extrabold font-display tracking-wider uppercase text-[11px]">Match Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {notifications.length > 0 && (
                        <button
                          onClick={onMarkNotificationsRead}
                          title="Mark all read"
                          className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={onClearNotifications}
                          title="Clear all"
                          className="p-1 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Interactive Simulation Controls */}
                  <div className="flex items-center gap-2 mb-3 bg-purple-500/10 p-2 rounded-xl border border-purple-500/20 text-[10px]">
                    <span className="text-purple-300 font-bold shrink-0">Simulate:</span>
                    <button
                      onClick={() => onSimulateNotification?.('challenge')}
                      className="flex-1 py-1 px-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-lg font-bold transition-all text-center cursor-pointer"
                    >
                      + Challenge
                    </button>
                    <button
                      onClick={() => onSimulateNotification?.('forfeit')}
                      className="flex-1 py-1 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg font-bold transition-all text-center cursor-pointer"
                    >
                      + Forfeit
                    </button>
                  </div>

                  {/* List of Notification Cards */}
                  <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-neutral-500 space-y-1">
                        <Bell className="w-6 h-6 mx-auto opacity-30" />
                        <p className="text-xs font-mono">No notifications right now</p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all ${
                            item.read ? 'bg-neutral-900/40 border-white/5' : 'bg-purple-950/20 border-purple-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              {item.type === 'challenge' && (
                                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
                                  <Swords className="w-3.5 h-3.5" />
                                </div>
                              )}
                              {item.type === 'forfeit' && (
                                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                                  <Flag className="w-3.5 h-3.5" />
                                </div>
                              )}
                              {item.type === 'system' && (
                                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold font-display text-white text-[11px] leading-tight">{item.title}</h4>
                                <span className="text-[9px] font-mono text-neutral-400">{item.timestamp}</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-[11px] text-neutral-300 leading-snug mb-2">{item.message}</p>

                          {/* Action buttons for Challenges */}
                          {item.type === 'challenge' && item.status === 'pending' && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => onAcceptChallenge?.(item)}
                                className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Accept Challenge</span>
                              </button>
                              <button
                                onClick={() => onDeclineChallenge?.(item.id)}
                                className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-neutral-300 font-bold rounded-lg text-[10px] uppercase transition-all cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          )}

                          {/* Action buttons for Forfeits */}
                          {item.type === 'forfeit' && item.status === 'pending' && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => onAcceptForfeit?.(item)}
                                className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Claim Victory</span>
                              </button>
                              <button
                                onClick={() => onDeclineForfeit?.(item.id)}
                                className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-neutral-300 font-bold rounded-lg text-[10px] uppercase transition-all cursor-pointer"
                              >
                                Dismiss
                              </button>
                            </div>
                          )}

                          {item.status === 'accepted' && (
                            <div className="text-[9px] font-mono text-emerald-400 font-bold uppercase pt-1">✓ Accepted</div>
                          )}
                          {item.status === 'declined' && (
                            <div className="text-[9px] font-mono text-neutral-500 uppercase pt-1">Declined</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={onHeaderFaucet}
              title="Instant Faucet Claim"
              className="flex items-center gap-1.5 2xl:gap-2 px-2.5 2xl:px-3.5 py-1.5 2xl:py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all cursor-pointer font-mono text-[11px] 2xl:text-xs font-bold shrink-0"
            >
              <Coins className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 animate-bounce" />
              <span className="hidden 2xl:inline">Claim +1,000</span>
              <span className="2xl:hidden">+1K</span>
            </button>

            <div 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 2xl:gap-2.5 cursor-pointer bg-neutral-900 hover:bg-neutral-850 py-1 2xl:py-1.5 pl-2 2xl:pl-2.5 pr-3 2xl:pr-4 rounded-full border border-neutral-800 transition-all select-none group shrink-0"
            >
              <div className="p-0.5 rounded-full border border-purple-500/60 ring-2 ring-purple-500/20 overflow-hidden w-7 h-7 2xl:w-8 2xl:h-8 shrink-0">
                <img 
                  src={userProfile?.avatar || ''} 
                  alt="Me" 
                  className="w-full h-full rounded-full object-cover" 
                />
              </div>
              <div className="text-left">
                <span className="block text-[10px] 2xl:text-[11px] text-white font-bold font-display group-hover:text-purple-300 transition-colors leading-none tracking-tight truncate max-w-[65px] 2xl:max-w-[90px]">
                  {userProfile?.username || ''}
                </span>
                <strong className="text-[9px] 2xl:text-[10px] text-purple-300 font-mono leading-none font-bold block mt-0.5">
                  {(userProfile?.coins || 0).toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Quick Actions + Hamburger Menu Toggle */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Faucet / Coin indicator on mobile/tablet */}
            <button 
              onClick={onHeaderFaucet} 
              title="Claim Faucet"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-mono text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all active:scale-95"
            >
              <Coins className="w-3.5 h-3.5 animate-bounce" />
              <span className="hidden min-[380px]:inline">{(userProfile?.coins || 0).toLocaleString()}</span>
            </button>

            {/* Quick Notification Bell on mobile/tablet */}
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              title="Notifications"
              className={`relative flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer font-sans shrink-0 border ${
                unreadCount > 0
                  ? 'bg-purple-500/25 text-purple-300 border-purple-500/60 shadow-lg shadow-purple-500/20'
                  : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Quick profile avatar link on mobile/tablet */}
            <div 
              onClick={() => setActiveTab('profile')}
              title="View Profile"
              className="cursor-pointer p-0.5 rounded-full border border-purple-500/60 ring-2 ring-purple-500/20 overflow-hidden w-7 h-7 sm:w-8 sm:h-8 shrink-0 transition-transform active:scale-95"
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
              <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
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
              {/* Drawer Header (Sticky Top) */}
              <div className="sticky top-0 z-10 bg-[#0B0B0E]/95 backdrop-blur-xl pt-1 pb-4 mb-4 border-b border-white/[0.06] flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <DuellioLogo size={34} showText={false} />
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

              {/* Theme configuration */}
              <button 
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition-all cursor-pointer font-sans text-xs font-semibold"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
