/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { Swords } from 'lucide-react';

// Custom Hooks
import { useTheme } from './hooks/useTheme';
import { useProfiles } from './hooks/useProfiles';
import { useWallet } from './hooks/useWallet';
import { useFriendInvite } from './hooks/useFriendInvite';

// UI Components
import { Header } from './components/Header';
import { FriendInviteModal } from './components/FriendInviteModal';
import { ErrorBoundary } from './components/ErrorBoundary';

// Types
import { WalletTransaction, NotificationItem } from './types';

// Lazy-loaded Tabs for code-splitting and improved bundle/load performance
const DiscoverTab = lazy(() => import('./components/DiscoverTab').then(m => ({ default: m.DiscoverTab })));
const PlayArenaTab = lazy(() => import('./components/PlayArenaTab').then(m => ({ default: m.PlayArenaTab })));
const TournamentsTab = lazy(() => import('./components/TournamentsTab').then(m => ({ default: m.TournamentsTab })));
const PhaseSandboxTab = lazy(() => import('./components/PhaseSandboxTab').then(m => ({ default: m.PhaseSandboxTab })));
const ProfileTab = lazy(() => import('./components/ProfileTab').then(m => ({ default: m.ProfileTab })));
const AuthEntrancePortal = lazy(() => import('./components/AuthEntrancePortal').then(m => ({ default: m.AuthEntrancePortal })));
const SpectateTab = lazy(() => import('./components/SpectateTab').then(m => ({ default: m.SpectateTab })));
const ChatTab = lazy(() => import('./components/ChatTab').then(m => ({ default: m.ChatTab })));
const AdminTab = lazy(() => import('./components/AdminTab').then(m => ({ default: m.AdminTab })));

function LoadingFallback() {
  return (
    <div className="py-20 text-center space-y-4">
      <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest animate-pulse">Loading view...</p>
    </div>
  );
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  
  const {
    allProfiles,
    userProfile,
    setUserProfile,
    authLoading,
    handleLogout,
    handleChangePassword,
    handleSwitchProfile,
    handleDeleteProfile,
    handleAddProfile,
    handleToggleDeactivate,
    handleUpdateProfile
  } = useProfiles();

  const {
    transactions,
    setTransactions,
    handleHeaderFaucet,
    addTransaction
  } = useWallet(userProfile);

  const {
    friendInvite,
    setFriendInvite
  } = useFriendInvite();

  const [activeTab, setActiveTab] = useState<'discover' | 'tournaments' | 'lobbies' | 'profile' | 'play-arena' | 'spectate' | 'chat' | 'admin'>('discover');

  // High fidelity quick state connectors
  const [preselectedGame, setPreselectedGame] = useState<'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman' | null>(null);
  const [suggestedStake, setSuggestedStake] = useState<number>(300);

  const [friendChallenge, setFriendChallenge] = useState<{
    senderName: string;
    gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman';
    entryFee: number;
    opponentType?: 'bot' | 'player';
    botDifficulty?: 'easy' | 'medium' | 'hard';
    rewardMultiplier?: number;
    sessionId?: string;
    isHost?: boolean;
  } | null>(null);

  const [isGameActive, setIsGameActive] = useState<boolean>(false);

  // Framer Motion Smooth Scroll Progress Spring Indicator
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001
  });

  // Smooth scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Match & Forfeit Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'challenge',
      title: 'Match Challenge Received!',
      message: 'Grandmaster_Alex has challenged you to a Chess match for 500 Coins!',
      senderName: 'Grandmaster_Alex',
      gameType: 'Chess',
      entryFee: 500,
      timestamp: 'Just now',
      read: false,
      status: 'pending'
    },
    {
      id: 'notif-2',
      type: 'forfeit',
      title: 'Forfeit Request Submitted',
      message: 'Shadow_Knight has requested a forfeit in your Whot match. Accept to claim +300 Coins victory payout!',
      senderName: 'Shadow_Knight',
      gameType: 'Whot',
      entryFee: 300,
      timestamp: '5m ago',
      read: false,
      status: 'pending'
    }
  ]);

  // Wrapper for profile registration to automatically log the onboarding transaction
  const handleAddProfileWrapper = (username: string, email: string, pass: string, avatar: string) => {
    return handleAddProfile(username, email, pass, avatar, addTransaction);
  };

  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!userProfile?.uid) {
      setTotalUnread(0);
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('users', 'array-contains', userProfile.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const unread = data.unreadCount?.[userProfile.uid] || 0;
        count += unread;
      });
      setTotalUnread(count);
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const [incomingToastChallenge, setIncomingToastChallenge] = useState<NotificationItem | null>(null);

  // Firestore Real-time Live Duel Challenge Notification Listener
  useEffect(() => {
    if (!userProfile?.uid && !userProfile?.username) return;

    const notifRef = collection(db, 'notifications');
    const q = query(notifRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveNotifs: NotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const isTarget = data.receiverId === userProfile.uid || 
                         data.receiverName === userProfile.username || 
                         data.receiverId === 'all';
        const isNotSelf = data.senderId !== userProfile.uid && data.senderName !== userProfile.username;

        if (isTarget && isNotSelf) {
          liveNotifs.push({
            id: docSnap.id,
            type: data.type || 'challenge',
            title: data.title || 'Match Challenge Received!',
            message: data.message || `${data.senderName} challenged you to a live duel!`,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            gameType: data.gameType,
            entryFee: data.entryFee,
            sessionId: data.sessionId,
            timestamp: data.timeString || 'Just now',
            read: data.read || false,
            status: data.status || 'pending'
          });
        }
      });

      if (liveNotifs.length > 0) {
        setNotifications(prev => {
          const notifMap = new Map<string, NotificationItem>();
          prev.forEach(n => notifMap.set(n.id, n));

          liveNotifs.forEach(n => {
            if (!notifMap.has(n.id)) {
              notifMap.set(n.id, n);
              if (n.status === 'pending') {
                setIncomingToastChallenge(n);
              }
            } else {
              const existing = notifMap.get(n.id)!;
              notifMap.set(n.id, { ...existing, ...n });
            }
          });

          return Array.from(notifMap.values());
        });
      }
    }, (error) => {
      console.warn("Notifications Firestore listener warning:", error);
    });

    return () => unsubscribe();
  }, [userProfile?.uid, userProfile?.username]);

  // Notification Handlers
  const handleAcceptChallenge = (notification: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true, status: 'accepted' } : n));
    setFriendChallenge({
      senderName: notification.senderName,
      gameType: notification.gameType as any || 'Chess',
      entryFee: notification.entryFee || 300,
      opponentType: 'player',
      sessionId: notification.sessionId,
      isHost: false
    });
    setActiveTab('lobbies');

    if (notification.id) {
      updateDoc(doc(db, 'notifications', notification.id), {
        status: 'accepted',
        read: true
      }).catch(console.warn);
    }
  };

  const handleDeclineChallenge = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true, status: 'declined' } : n));
    if (notificationId) {
      updateDoc(doc(db, 'notifications', notificationId), {
        status: 'declined',
        read: true
      }).catch(console.warn);
    }
  };

  const handleAcceptForfeit = (notification: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true, status: 'accepted' } : n));
    const reward = notification.entryFee ? notification.entryFee * 2 : 500;
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        coins: userProfile.coins + reward,
        wins: (userProfile.wins || 0) + 1
      });
    }
    addTransaction({
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: userProfile!.uid,
      type: 'credit',
      amount: reward,
      description: `Forfeit Victory payout vs ${notification.senderName} (${notification.gameType})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'completed'
    });
  };

  const handleDeclineForfeit = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true, status: 'declined' } : n));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleMarkNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSimulateNotification = (type: 'challenge' | 'forfeit') => {
    const opponents = ['CyberNinja', 'NeonQueen', 'Valkyrie', 'ProGamer99'];
    const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
    const games: Array<'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe'> = ['Chess', 'Whot', 'Ludo', 'Draft', 'TicTacToe'];
    const randomGame = games[Math.floor(Math.random() * games.length)];
    const randomStake = (Math.floor(Math.random() * 5) + 1) * 200;
    const newId = `notif-${Date.now()}`;

    if (type === 'challenge') {
      setNotifications(prev => [
        {
          id: newId,
          type: 'challenge',
          title: 'New Player Challenge!',
          message: `${randomOpponent} challenged you to a ${randomGame} match for ${randomStake} Coins!`,
          senderName: randomOpponent,
          gameType: randomGame,
          entryFee: randomStake,
          timestamp: 'Just now',
          read: false,
          status: 'pending'
        },
        ...prev
      ]);
    } else {
      setNotifications(prev => [
        {
          id: newId,
          type: 'forfeit',
          title: 'Forfeit Request Submitted',
          message: `${randomOpponent} requested to forfeit their active ${randomGame} match. Claim your +${randomStake} Coins victory!`,
          senderName: randomOpponent,
          gameType: randomGame,
          entryFee: randomStake,
          timestamp: 'Just now',
          read: false,
          status: 'pending'
        },
        ...prev
      ]);
    }
  };

  // Direct card-to-matchmaker connector
  const handleSelectGameFromDiscover = (gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman', stake: number) => {
    setPreselectedGame(gameType);
    setSuggestedStake(stake);
    setActiveTab('lobbies');
  };

  // Direct card-to-matchmaker connector from play arena tab
  const handleLaunchArenaMatch = (matchData: {
    gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman';
    opponentType: 'bot' | 'player';
    botDifficulty?: 'easy' | 'medium' | 'hard';
    entryFee: number;
    opponentName: string;
    multiplier: number;
    sessionId?: string;
  }) => {
    setFriendChallenge({
      senderName: matchData.opponentName,
      gameType: matchData.gameType,
      entryFee: matchData.entryFee,
      opponentType: matchData.opponentType,
      botDifficulty: matchData.botDifficulty,
      rewardMultiplier: matchData.multiplier,
      sessionId: matchData.sessionId,
      isHost: true
    });
    setActiveTab('lobbies');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] font-mono text-purple-400 uppercase tracking-widest animate-pulse">Initializing security session...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AuthEntrancePortal
          onLoginSuccess={(user) => {
            setUserProfile(user);
          }}
          onRegisterSuccess={(user) => {
            setUserProfile(user);
          }}
          allProfiles={allProfiles}
          onAddProfile={handleAddProfileWrapper}
        />
      </Suspense>
    );
  }

  return (
    <div className={`relative min-h-screen bg-[#070709] text-neutral-100 font-sans antialiased pb-24 lg:pb-12 selection:bg-purple-500/30 selection:text-white ${theme}`} id="applet-viewport">
      
      {/* Framer Motion Smooth Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 z-[100] origin-left shadow-[0_0_12px_rgba(168,85,247,0.9)] pointer-events-none"
        style={{ scaleX }}
      />

      {/* Dynamic Ambient Glassmorphism Gradient Mesh Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
        <div className="absolute -top-32 -left-32 w-72 h-72 sm:w-96 sm:h-96 bg-purple-600/15 rounded-full blur-[100px] sm:blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/3 -right-32 w-72 h-72 sm:w-[30rem] sm:h-[30rem] bg-cyan-600/10 rounded-full blur-[100px] sm:blur-[140px]"></div>
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 sm:w-[35rem] sm:h-[35rem] bg-indigo-600/10 rounded-full blur-[120px] sm:blur-[160px]"></div>
      </div>

      {/* Extract Premium Glowing Navigation Header Bar */}
      {!isGameActive && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setPreselectedGame={setPreselectedGame}
          theme={theme}
          toggleTheme={toggleTheme}
          userProfile={userProfile}
          onHeaderFaucet={() => handleHeaderFaucet(userProfile, setUserProfile)}
          totalUnread={totalUnread}
          notifications={notifications}
          onAcceptChallenge={handleAcceptChallenge}
          onDeclineChallenge={handleDeclineChallenge}
          onAcceptForfeit={handleAcceptForfeit}
          onDeclineForfeit={handleDeclineForfeit}
          onClearNotifications={handleClearNotifications}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onSimulateNotification={handleSimulateNotification}
        />
      )}

      {/* Real-time In-App Challenge Toast Alert Overlay */}
      <AnimatePresence>
        {incomingToastChallenge && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-lg bg-neutral-950/95 border-2 border-purple-500/50 rounded-2xl p-4 shadow-[0_0_35px_rgba(168,85,247,0.5)] backdrop-blur-2xl text-white font-sans flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30 shrink-0 animate-bounce">
                <Swords className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-purple-300 font-black uppercase tracking-wider bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                    ⚡ LIVE DUEL INVITATION
                  </span>
                </div>
                <span className="block text-xs font-bold text-white mt-1">
                  {incomingToastChallenge.senderName} is challenging you to {incomingToastChallenge.gameType}!
                </span>
                <p className="text-[11px] text-neutral-400 font-mono">
                  Stakes Lock: <strong className="text-emerald-400 font-bold">{incomingToastChallenge.entryFee} Coins</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleDeclineChallenge(incomingToastChallenge.id);
                  setIncomingToastChallenge(null);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAcceptChallenge(incomingToastChallenge);
                  setIncomingToastChallenge(null);
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/30 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                ⚔️ Accept & Play
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main viewport with Suspense boundary for lazy components */}
      <main className={`max-w-7xl mx-auto px-4 md:px-8 ${isGameActive ? 'mt-4 md:mt-6' : 'mt-10'}`}>
        <ErrorBoundary onReset={() => setActiveTab('lobbies')}>
          <Suspense fallback={<LoadingFallback />}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18 }}
            >
              {/* Discover View */}
              {activeTab === 'discover' && (
                <DiscoverTab 
                  onSelectGame={handleSelectGameFromDiscover} 
                  userCoins={userProfile.coins} 
                />
              )}

              {/* Play Arena View */}
              {activeTab === 'play-arena' && (
                <PlayArenaTab 
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  onLaunchMatch={handleLaunchArenaMatch}
                  allProfiles={allProfiles}
                />
              )}

              {/* Tournaments View */}
              {activeTab === 'tournaments' && (
                <TournamentsTab />
              )}

              {/* Matchmaking Lobbies and actual Games simulation View */}
              {activeTab === 'lobbies' && (
                <PhaseSandboxTab 
                  userProfile={userProfile} 
                  setUserProfile={setUserProfile}
                  transactions={transactions}
                  setTransactions={setTransactions}
                  preselectedGame={preselectedGame}
                  setPreselectedGame={setPreselectedGame}
                  suggestedStake={suggestedStake}
                  friendChallenge={friendChallenge}
                  setFriendChallenge={setFriendChallenge}
                  allProfiles={allProfiles}
                  theme={theme}
                  handleToggleDeactivate={handleToggleDeactivate}
                  handleDeleteProfile={handleDeleteProfile}
                  onGameActiveChange={setIsGameActive}
                />
              )}

              {/* Player Achievements / Profiles View */}
              {activeTab === 'profile' && (
                <ProfileTab 
                  userProfile={userProfile} 
                  transactions={transactions} 
                  onLogout={handleLogout}
                  onChangePassword={handleChangePassword}
                  onDeleteProfile={handleDeleteProfile}
                  onAddProfile={handleAddProfileWrapper}
                  onSwitchProfile={handleSwitchProfile}
                  onUpdateProfile={handleUpdateProfile}
                  allProfiles={allProfiles}
                />
              )}

              {/* Spectate & Live Betting View */}
              {activeTab === 'spectate' && (
                <SpectateTab 
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  onAddTransaction={addTransaction}
                />
              )}

              {/* Chat View */}
              {activeTab === 'chat' && (
                <ChatTab 
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  allProfiles={allProfiles}
                  setActiveTab={setActiveTab}
                  setFriendChallenge={setFriendChallenge}
                  addTransaction={addTransaction}
                />
              )}

              {/* Admin Dashboard Tab */}
              {activeTab === 'admin' && userProfile?.email === 'devtonicllc@gmail.com' && (
                <AdminTab />
              )}
            </motion.div>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Extract Friend Invitation Challenge Modal */}
      <FriendInviteModal
        friendInvite={friendInvite}
        onAccept={() => {
          if (!friendInvite) return;
          
          // Claim faucet coins immediately so user has plenty of funds to join
          const bonusCoins = 1000;
          setUserProfile(prev => prev ? ({
            ...prev,
            coins: prev.coins + bonusCoins
          }) : null);
          
          addTransaction({
            id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
            userId: userProfile.uid,
            type: 'credit',
            amount: bonusCoins,
            description: `Claimed Welcome Stake Credit: From ${friendInvite.sender}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'completed'
          });

          // Activate the lobby and friend challenge match trigger
          setFriendChallenge({
            senderName: friendInvite.sender,
            gameType: friendInvite.game,
            entryFee: friendInvite.stake,
            opponentType: 'player',
            sessionId: friendInvite.sessionId,
            isHost: false
          });
          setActiveTab('lobbies');
          
          // Clean memory and URL parameters without refreshing
          setFriendInvite(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
        onIgnore={() => {
          setFriendInvite(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      />
    </div>
  );
}
