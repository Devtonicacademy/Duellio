/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, lazy, Suspense } from 'react';
import { motion } from 'motion/react';

// Custom Hooks
import { useTheme } from './hooks/useTheme';
import { useProfiles } from './hooks/useProfiles';
import { useWallet } from './hooks/useWallet';
import { useFriendInvite } from './hooks/useFriendInvite';

// UI Components
import { Header } from './components/Header';
import { FriendInviteModal } from './components/FriendInviteModal';

// Types
import { WalletTransaction } from './types';

// Lazy-loaded Tabs for code-splitting and improved bundle/load performance
const DiscoverTab = lazy(() => import('./components/DiscoverTab').then(m => ({ default: m.DiscoverTab })));
const PlayArenaTab = lazy(() => import('./components/PlayArenaTab').then(m => ({ default: m.PlayArenaTab })));
const TournamentsTab = lazy(() => import('./components/TournamentsTab').then(m => ({ default: m.TournamentsTab })));
const PhaseSandboxTab = lazy(() => import('./components/PhaseSandboxTab').then(m => ({ default: m.PhaseSandboxTab })));
const ProfileTab = lazy(() => import('./components/ProfileTab').then(m => ({ default: m.ProfileTab })));
const AuthEntrancePortal = lazy(() => import('./components/AuthEntrancePortal').then(m => ({ default: m.AuthEntrancePortal })));
const SpectateTab = lazy(() => import('./components/SpectateTab').then(m => ({ default: m.SpectateTab })));

// Premium loading placeholder for Suspense boundaries
const LoadingFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-xs font-mono text-purple-400 uppercase tracking-widest animate-pulse">Loading Arena View...</p>
  </div>
);

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
    handleAddProfile
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

  const [activeTab, setActiveTab] = useState<'discover' | 'tournaments' | 'lobbies' | 'profile' | 'play-arena' | 'spectate'>('discover');

  // High fidelity quick state connectors
  const [preselectedGame, setPreselectedGame] = useState<'Chess' | 'Ludo' | 'Whot' | 'Draft' | null>(null);
  const [suggestedStake, setSuggestedStake] = useState<number>(300);

  const [friendChallenge, setFriendChallenge] = useState<{
    senderName: string;
    gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft';
    entryFee: number;
    opponentType?: 'bot' | 'player';
    botDifficulty?: 'easy' | 'medium' | 'hard';
    rewardMultiplier?: number;
  } | null>(null);

  // Wrapper for profile registration to automatically log the onboarding transaction
  const handleAddProfileWrapper = (username: string, email: string, pass: string, avatar: string) => {
    return handleAddProfile(username, email, pass, avatar, addTransaction);
  };

  // Direct card-to-matchmaker connector
  const handleSelectGameFromDiscover = (gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft', stake: number) => {
    setPreselectedGame(gameType);
    setSuggestedStake(stake);
    setActiveTab('lobbies');
  };

  // Direct card-to-matchmaker connector from play arena tab
  const handleLaunchArenaMatch = (matchData: {
    gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft';
    opponentType: 'bot' | 'player';
    botDifficulty?: 'easy' | 'medium' | 'hard';
    entryFee: number;
    opponentName: string;
    multiplier: number;
  }) => {
    setFriendChallenge({
      senderName: matchData.opponentName,
      gameType: matchData.gameType,
      entryFee: matchData.entryFee,
      opponentType: matchData.opponentType,
      botDifficulty: matchData.botDifficulty,
      rewardMultiplier: matchData.multiplier
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
    <div className={`min-h-screen bg-[#070709] text-neutral-100 font-sans antialiased pb-12 selection:bg-purple-500/30 selection:text-white ${theme}`} id="applet-viewport">
      
      {/* Extract Premium Glowing Navigation Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setPreselectedGame={setPreselectedGame}
        theme={theme}
        toggleTheme={toggleTheme}
        userProfile={userProfile}
        onHeaderFaucet={() => handleHeaderFaucet(userProfile, setUserProfile)}
      />

      {/* Main viewport with Suspense boundary for lazy components */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
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
          </motion.div>
        </Suspense>
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
            entryFee: friendInvite.stake
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
