/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
  Send, 
  Wallet, 
  Swords, 
  Users, 
  ShieldCheck, 
  Trophy, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  Layers, 
  RefreshCw, 
  Check, 
  Hash, 
  User, 
  HelpCircle,
  HelpCircle as QuestionIcon,
  Share2,
  Copy,
  Link
} from 'lucide-react';
import { UserProfile, ChatMessage, MatchChallenge, WalletTransaction, WhotCard, WhotGameState } from '../types';
import { INITIAL_CHAT, getRandomBotResponse } from '../data/simulation';
import { InteractiveLudoBoard } from './InteractiveLudoBoard';
import { InteractiveChessBoard } from './InteractiveChessBoard';
import { InteractiveDraftBoard } from './InteractiveDraftBoard';
import { InteractiveTicTacToeBoard } from './InteractiveTicTacToeBoard';
import { InteractiveStickmanBoard } from './InteractiveStickmanBoard';
import { TicTacToeLogicService } from '../services/ticTacToeLogic';
import { DraftLogicService } from '../services/draftLogic';
import { db } from '../firebase';
import { doc, setDoc, increment, updateDoc, onSnapshot, collection, query, where, getDoc, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { sanitizeFirestoreData } from '../utils/firestoreSanitizer';

interface PhaseSandboxTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  transactions: WalletTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<WalletTransaction[]>>;
  preselectedGame?: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman' | null;
  setPreselectedGame?: React.Dispatch<React.SetStateAction<'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman' | null>>;
  suggestedStake?: number;
  friendChallenge?: {
    senderName: string;
    gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman';
    entryFee: number;
    opponentType?: 'bot' | 'player';
    botDifficulty?: 'easy' | 'medium' | 'hard';
    rewardMultiplier?: number;
    sessionId?: string;
    isHost?: boolean;
  } | null;
  setFriendChallenge?: React.Dispatch<React.SetStateAction<{
    senderName: string;
    gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman';
    entryFee: number;
    opponentType?: 'bot' | 'player';
    botDifficulty?: 'easy' | 'medium' | 'hard';
    rewardMultiplier?: number;
    sessionId?: string;
    isHost?: boolean;
  } | null>>;
  allProfiles: UserProfile[];
  theme?: string;
  handleToggleDeactivate?: (uid: string, deactivated: boolean) => Promise<{ success: boolean; message?: string }>;
  handleDeleteProfile?: (uid: string) => Promise<void>;
  onGameActiveChange?: (isActive: boolean) => void;
}

// Helper: Standard Whot cards generator
function generateWhotDeck(include20: boolean = true): WhotCard[] {
  const deck: WhotCard[] = [];
  let idCounter = 1;

  // Circles: 1-5, 7, 8, 10-14
  const circleVals = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14];
  circleVals.forEach(v => {
    deck.push({ id: `c_${idCounter++}`, suit: 'Circles', value: v });
  });

  // Triangles: 1-5, 7, 8, 10-14
  const triangleVals = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14];
  triangleVals.forEach(v => {
    deck.push({ id: `t_${idCounter++}`, suit: 'Triangles', value: v });
  });

  // Crosses: 1-3, 5, 7, 10, 11, 13, 14
  const crossVals = [1, 2, 3, 5, 7, 10, 11, 13, 14];
  crossVals.forEach(v => {
    deck.push({ id: `cr_${idCounter++}`, suit: 'Crosses', value: v });
  });

  // Stars: 1-5, 7, 8, 10-14
  const starVals = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14];
  starVals.forEach(v => {
    deck.push({ id: `s_${idCounter++}`, suit: 'Stars', value: v });
  });

  // Squares: 1-3, 5, 7, 10, 11, 13, 14
  const squareVals = [1, 2, 3, 5, 7, 10, 11, 13, 14];
  squareVals.forEach(v => {
    deck.push({ id: `sq_${idCounter++}`, suit: 'Squares', value: v });
  });

  // Whots: 20s (4 wildcard cards)
  if (include20) {
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `w_${idCounter++}`, suit: 'Whot', value: 20 });
    }
  }

  return deck;
}

// Fisher-Yates shuffle
function shuffleDeck(deck: WhotCard[]): WhotCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function hasAnyPlayableCard(hand: WhotCard[], activeSuit: string, topCard: WhotCard | undefined, penaltyCount: number) {
  if (!topCard) return false;
  const penaltyActive = penaltyCount > 0;
  return hand.some(card => {
    if (penaltyActive) {
      if (topCard.value === 14) return false; // General market (14) cannot be countered!
      return card.value === topCard.value;
    }
    return card.suit === 'Whot' || card.suit === activeSuit || card.value === topCard.value;
  });
}

export const PhaseSandboxTab: React.FC<PhaseSandboxTabProps> = ({
  userProfile,
  setUserProfile,
  transactions,
  setTransactions,
  preselectedGame,
  setPreselectedGame,
  suggestedStake,
  friendChallenge,
  setFriendChallenge,
  allProfiles,
  handleToggleDeactivate,
  handleDeleteProfile,
  onGameActiveChange
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'wallet' | 'presence' | 'settings' | 'active-sessions'>('chat');
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pauseRequest, setPauseRequest] = useState<{ requesterId: string; status: 'pending' | 'accepted' | 'declined' | null } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  // 3D Perspective mode
  const [is3DMode, setIs3DMode] = useState<boolean>(true);

  // Card Fan / Spin mode for mobile
  const [isFanMode, setIsFanMode] = useState<boolean>(false);
  const [fanCenterIndex, setFanCenterIndex] = useState<number>(0);
  const fanTouchStartX = useRef<number>(0);
  const fanTouchStartY = useRef<number>(0);
  const scrollRowRef = useRef<HTMLDivElement>(null);
  const opponentScrollRowRef = useRef<HTMLDivElement>(null);

  // Escrow details expand/collapse on mobile
  const [showEscrowDetails, setShowEscrowDetails] = useState<boolean>(false);

  // Admin Whot Game Settings State
  const [whotSettings, setWhotSettings] = useState(() => {
    const saved = localStorage.getItem('duellio-whot-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse whot settings:", e);
      }
    }
    return {
      forcePickOn14: true,
      defendOn2: true,
      playAgainOn1or8: true,
      optional20: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('duellio-whot-settings', JSON.stringify(whotSettings));
  }, [whotSettings]);
  
  const otherUsers = allProfiles.filter(p => p.uid !== userProfile.uid);
  const [onlineBots, setOnlineBots] = useState<UserProfile[]>(() => otherUsers);
  
  // Custom Friend Challenge state parameters
  const [friendGame, setFriendGame] = useState<'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman'>('Stickman');
  const [friendStake, setFriendStake] = useState<number>(300);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Staking challenge state
  const [activeChallenge, setActiveChallenge] = useState<MatchChallenge | null>(null);
  const [liveGameState, setLiveGameState] = useState<any>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedBot, setSelectedBot] = useState<UserProfile | null>(() => otherUsers[0] || null);
  const [gameType, setGameType] = useState<'Whot' | 'Ludo' | 'Chess' | 'Draft' | 'TicTacToe' | 'Stickman'>('Stickman');
  const [entryFee, setEntryFee] = useState<number>(300);

  // Notification alert state for semi last card, last card, checkup
  const [whotNotification, setWhotNotification] = useState<{ text: string; type: 'semi' | 'last' | 'checkup' } | null>(null);
  const prevHandsRef = useRef<{ [uid: string]: number }>({});
  const lastTimeoutPlayerRef = useRef<string | null>(null);

  // Sync onlineBots and selectedBot when allProfiles or userProfile changes
  useEffect(() => {
    const updatedUsers = allProfiles.filter(p => p.uid !== userProfile.uid);
    setOnlineBots(updatedUsers);
    if (updatedUsers.length > 0 && (!selectedBot || !updatedUsers.some(u => u.uid === selectedBot.uid))) {
      setSelectedBot(updatedUsers[0]);
    }
  }, [allProfiles, userProfile.uid]);

  // Pre-fill parameters when redirected from Discover cards
  useEffect(() => {
    if (preselectedGame) {
      setGameType(preselectedGame);
      setEntryFee(suggestedStake || 300);
      
      const bot = onlineBots.find(b => b.status === 'online') || onlineBots[0] || (allProfiles.filter(p => p.uid !== userProfile.uid)[0]);
      setSelectedBot(bot || null);
      
      if (setPreselectedGame) {
        setPreselectedGame(null);
      }
    }
  }, [preselectedGame, suggestedStake, onlineBots, setPreselectedGame, allProfiles, userProfile.uid]);

  // Trigger Friend Invite Matches
  useEffect(() => {
    if (friendChallenge) {
      if (friendChallenge.opponentType === 'player') {
        const sessionId = friendChallenge.sessionId || `session_${Date.now()}`;
        
        // Deduct entry fee
        if (friendChallenge.entryFee > 0) {
          setUserProfile(prev => ({
            ...prev,
            coins: Math.max(0, prev.coins - friendChallenge.entryFee),
            status: 'in-game'
          }));

          const stakeTx: WalletTransaction = {
            id: `escrow_${Date.now()}`,
            type: 'stake_lock',
            amount: friendChallenge.entryFee,
            description: `Escrow Multiplayer Challenge Lock: ${friendChallenge.gameType}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setTransactions(prev => [stakeTx, ...prev]);
        } else {
          setUserProfile(prev => ({
            ...prev,
            status: 'in-game'
          }));
        }

        if (friendChallenge.isHost) {
          // Setup Host Game State
          const fullDeck = shuffleDeck(generateWhotDeck(whotSettings.optional20));
          const hostHand = fullDeck.splice(0, 6);
          const guestHand = fullDeck.splice(0, 6);
          
          let starterIndex = 0;
          for (let i = 0; i < fullDeck.length; i++) {
            if (fullDeck[i].value !== 1 && fullDeck[i].value !== 2 && fullDeck[i].value !== 5 && fullDeck[i].value !== 8 && fullDeck[i].value !== 14 && fullDeck[i].value !== 20) {
              starterIndex = i;
              break;
            }
          }
          const starterCard = fullDeck.splice(starterIndex, 1)[0];
          if (fullDeck.length > 30) {
            fullDeck.splice(30);
          }

          const inviteChallenge: MatchChallenge = {
            id: sessionId,
            senderId: userProfile.uid,
            senderName: userProfile.username,
            receiverId: 'pending',
            gameType: friendChallenge.gameType,
            entryFee: friendChallenge.entryFee,
            status: 'pending',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            opponentType: 'player'
          };

          let initialSession: any = null;
          if (friendChallenge.gameType === 'TicTacToe') {
            initialSession = TicTacToeLogicService.initializeBoard(sessionId, 'host', 'guest');
          } else if (friendChallenge.gameType === 'Draft') {
            initialSession = DraftLogicService.initializeBoard(sessionId, 'host', 'guest');
          } else if (friendChallenge.gameType === 'Whot') {
            initialSession = {
              sessionId: sessionId,
              playerIds: [userProfile.uid, ''],
              playerHands: {
                [userProfile.uid]: hostHand,
                '': guestHand
              },
              deckCount: fullDeck.length,
              discardPile: [starterCard],
              activeSuit: starterCard.suit as any,
              activePlayerId: userProfile.uid,
              status: 'playing',
              turnTimer: 120,
              penaltyCount: 0,
              lastActionMessage: 'Session initialized. Waiting for opponent to join...'
            };
          } else if (friendChallenge.gameType === 'Chess') {
            initialSession = { sessionId, activeColor: 'w', status: 'playing', playerIds: [userProfile.uid, ''] };
          } else if (friendChallenge.gameType === 'Ludo') {
            initialSession = { sessionId, activePlayer: 'red', status: 'playing', playerIds: [userProfile.uid, ''] };
          } else {
            initialSession = { sessionId, status: 'playing', playerIds: [userProfile.uid, ''] };
          }

          whotDeckRef.current = fullDeck;
          if (friendChallenge.gameType === 'Whot') {
            _setWhotGameState(initialSession);
          }
          setLiveGameState(initialSession);
          setActiveChallenge(inviteChallenge);
          setGamePlayStatus('playing');

          const rawHostData = {
            sessionId,
            gameType: friendChallenge.gameType || 'Chess',
            hostId: userProfile.uid || 'host',
            hostName: userProfile.username || 'Host',
            opponentId: '',
            opponentName: friendChallenge.senderName || '',
            status: 'waiting',
            entryFee: friendChallenge.entryFee || 0,
            gameState: initialSession || {},
            deck: fullDeck || [],
            pauseRequest: null,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          setDoc(doc(db, 'gameSessions', sessionId), sanitizeFirestoreData(rawHostData)).catch((err) => {
            console.error("Firestore setDoc Host error:", err);
          });

          setGamePlayLogs([
            `[ESCROW LOCK] Atomic escrow write success. STAKE: ${friendChallenge.entryFee} coins escrowed.`,
            `[MULTIPLAYER] Game created! Share link with opponent to begin.`
          ]);
        } else {
          // Setup Guest joining
          getDoc(doc(db, 'gameSessions', sessionId)).then((docSnap) => {
            if (docSnap.exists()) {
              const sessionData = docSnap.data();
              const isParticipant = sessionData.hostId === userProfile.uid || sessionData.opponentId === userProfile.uid;
              if (sessionData.status === 'waiting' || (sessionData.status === 'playing' && isParticipant)) {
                const updatedGameState = {
                  ...(sessionData.gameState || {}),
                  playerIds: [sessionData.hostId, userProfile.uid],
                  playerHands: {
                    ...(sessionData.gameState?.playerHands || {}),
                    [sessionData.hostId]: sessionData.gameState?.playerHands?.[sessionData.hostId] || [],
                    [userProfile.uid]: sessionData.gameState?.playerHands?.[''] || []
                  },
                  lastActionMessage: `${userProfile.username} has joined! Match starts now.`
                };

                const inviteChallenge: MatchChallenge = {
                  id: sessionId,
                  senderId: sessionData.hostId,
                  senderName: sessionData.hostName,
                  receiverId: userProfile.uid,
                  gameType: friendChallenge.gameType,
                  entryFee: friendChallenge.entryFee,
                  status: 'accepted',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  opponentType: 'player'
                };

                setActiveChallenge(inviteChallenge);
                setGamePlayStatus('playing');
                _setWhotGameState(updatedGameState);
                setLiveGameState(sessionData.gameState || updatedGameState);
                whotDeckRef.current = sessionData.deck || [];

                updateDoc(doc(db, 'gameSessions', sessionId), sanitizeFirestoreData({
                  opponentId: userProfile.uid,
                  opponentName: userProfile.username,
                  status: 'playing',
                  gameState: updatedGameState,
                  updatedAt: Date.now()
                })).catch(console.error);

                setGamePlayLogs([
                  `[ESCROW LOCK] Atomic escrow write success. STAKE: ${friendChallenge.entryFee} coins escrowed.`,
                  `[MULTIPLAYER] Joined active session successfully!`
                ]);
              } else {
                alert("This game session is no longer available or already full.");
                setGamePlayStatus('none');
                setActiveChallenge(null);
                _setWhotGameState(null);
                setUserProfile(prev => ({ ...prev, status: 'online' }));
              }
            } else {
              // Self-healing fallback: If session doc was not found on Firestore, initialize & set it up now
              const fallbackSessionData = sanitizeFirestoreData({
                sessionId,
                gameType: friendChallenge.gameType || 'Chess',
                hostId: friendChallenge.senderName || 'Host',
                hostName: friendChallenge.senderName || 'Host',
                opponentId: userProfile.uid,
                opponentName: userProfile.username,
                status: 'playing',
                entryFee: friendChallenge.entryFee || 0,
                gameState: initialSession || {},
                deck: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
              });

              setDoc(doc(db, 'gameSessions', sessionId), fallbackSessionData).catch(console.error);

              const inviteChallenge: MatchChallenge = {
                id: sessionId,
                senderId: friendChallenge.senderName || 'Host',
                senderName: friendChallenge.senderName || 'Host',
                receiverId: userProfile.uid,
                gameType: friendChallenge.gameType,
                entryFee: friendChallenge.entryFee,
                status: 'accepted',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                opponentType: 'player'
              };

              setActiveChallenge(inviteChallenge);
              setGamePlayStatus('playing');
              _setWhotGameState(initialSession);
              setLiveGameState(initialSession);

              setGamePlayLogs([
                `[ESCROW LOCK] Atomic escrow write success. STAKE: ${friendChallenge.entryFee} coins escrowed.`,
                `[MULTIPLAYER] Joined live session successfully!`
              ]);
            }
          }).catch(console.error);
        }

        if (setFriendChallenge) {
          setFriendChallenge(null);
        }
        return;
      }

      // Setup the MatchChallenge object
      const inviteChallenge: MatchChallenge = {
        id: `friend_${Date.now()}`,
        senderId: 'friend_user',
        senderName: friendChallenge.senderName,
        receiverId: userProfile.uid,
        gameType: friendChallenge.gameType,
        entryFee: friendChallenge.entryFee,
        status: 'accepted',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        botDifficulty: (friendChallenge.opponentType === 'bot' && friendChallenge.entryFee > 0)
          ? 'hard'
          : friendChallenge.botDifficulty,
        opponentType: friendChallenge.opponentType,
        rewardMultiplier: friendChallenge.rewardMultiplier
      };

      // Set state variables
      setActiveChallenge(inviteChallenge);
      setGamePlayStatus('playing');

      // Deduct entry fee
      if (friendChallenge.entryFee > 0) {
        setUserProfile(prev => ({
          ...prev,
          coins: Math.max(0, prev.coins - friendChallenge.entryFee),
          status: 'in-game'
        }));

        // Add a staking transaction log
        const stakeTx: WalletTransaction = {
          id: `escrow_${Date.now()}`,
          type: 'stake_lock',
          amount: friendChallenge.entryFee,
          description: `Escrow Friend Challenge Lock: ${friendChallenge.gameType} vs ${friendChallenge.senderName}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setTransactions(prev => [stakeTx, ...prev]);
      } else {
        setUserProfile(prev => ({
          ...prev,
          status: 'in-game'
        }));
      }

      // Initialize the games
      if (friendChallenge.gameType === 'Whot') {
        const fullDeck = shuffleDeck(generateWhotDeck(whotSettings.optional20));
        const humanHand = fullDeck.splice(0, 6);
        const botHand = fullDeck.splice(0, 6);
        
        let starterIndex = 0;
        for (let i = 0; i < fullDeck.length; i++) {
          if (fullDeck[i].value !== 1 && fullDeck[i].value !== 2 && fullDeck[i].value !== 5 && fullDeck[i].value !== 8 && fullDeck[i].value !== 14 && fullDeck[i].value !== 20) {
            starterIndex = i;
            break;
          }
        }
        const starterCard = fullDeck.splice(starterIndex, 1)[0];

        // Cap remaining draw pile to 30 max
        if (fullDeck.length > 30) {
          fullDeck.splice(30);
        }

        const startPlayerId = Math.random() < 0.5 ? userProfile.uid : 'friend_user';
        const isHumanTurn = startPlayerId === userProfile.uid;

        _setWhotGameState({
          sessionId: inviteChallenge.id,
          playerIds: [userProfile.uid, 'friend_user'],
          playerHands: {
            [userProfile.uid]: humanHand,
            'friend_user': botHand
          },
          deckCount: fullDeck.length,
          discardPile: [starterCard],
          activeSuit: starterCard.suit as any,
          activePlayerId: startPlayerId,
          status: 'playing',
          turnTimer: 30,
          penaltyCount: 0,
          lastActionMessage: isHumanTurn
            ? `Friend Challenge started! Top card is ${starterCard.suit} ${starterCard.value}. Lead Developer's turn.`
            : `Friend Challenge started! Top card is ${starterCard.suit} ${starterCard.value}. Opponent's turn.`
        });
        whotDeckRef.current = fullDeck;    setGamePlayLogs([
          `[ESCROW LOCK] Atomic escrow write success. STAKE: ${friendChallenge.entryFee} coins escrowed.`,
          `[DECK INITIALIZED] Safe Fisher-Yates generator shuffling card deck. Dealt 6 cards to each player.`,
          `[TURN VALIDATION] Starter card dealt to discard stack: ${starterCard.suit} ${starterCard.value}.`,
          `[PRESENCE SYNC] Opponent ${friendChallenge.senderName} connected safely!`
        ]);
      } else if (friendChallenge.gameType === 'Ludo') {
        setGamePlayLogs([
          `[ESCROW LOCK] Atomic escrow write success. STAKE: ${friendChallenge.entryFee} coins escrowed.`,
          `[PRESENCE SYNC] Player status switched: in-game. Opponent: ${friendChallenge.senderName}`,
          `[LUDO START] Ludo match session active. Choose a piece to spawn or slide on path.`
        ]);
      } else {
        setGamePlayLogs([
          `[ESCROW LOCK] Atomic escrow write success. STAKE: ${friendChallenge.entryFee} coins escrowed.`,
          `[PRESENCE SYNC] Player status switched: in-game. Opponent: ${friendChallenge.senderName}`,
          `[CHESS START] Standard initial layout configured. Play move with White!`
        ]);
      }

      // Clear friend challenge trigger
      if (setFriendChallenge) {
        setFriendChallenge(null);
      }
    }
  }, [friendChallenge, setFriendChallenge, userProfile.uid, setUserProfile, setTransactions]);

  // Simulated Log States
  const [gamePlayLogs, setGamePlayLogs] = useState<string[]>([]);
  const [gamePlayStatus, setGamePlayStatus] = useState<'none' | 'escrow_lock' | 'playing' | 'completed'>('none');
  const [isTyping, setIsTyping] = useState(false);
  const [typingBot, setTypingBot] = useState<string | null>(null);

  const [_whotGameState, _setWhotGameState] = useState<WhotGameState | null>(null);
  const whotGameState = _whotGameState;
  
  const setWhotGameState = (value: React.SetStateAction<WhotGameState | null>) => {
    _setWhotGameState(prev => {
      const nextState = typeof value === 'function' ? (value as Function)(prev) : value;
      if (nextState && activeChallenge?.opponentType === 'player' && activeChallenge?.id) {
        const sessionRef = doc(db, 'gameSessions', activeChallenge.id);
        updateDoc(sessionRef, {
          gameState: nextState,
          deck: whotDeckRef.current,
          updatedAt: Date.now()
        }).catch(console.error);
      }
      return nextState;
    });
  };
  const [selectedSuitToClaim, setSelectedSuitToClaim] = useState<boolean>(false);
  const [pendingWhotCardObj, setPendingWhotCardObj] = useState<WhotCard | null>(null);
  const whotDeckRef = useRef<WhotCard[]>([]);

  // Safety & Escrow Timer States
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    return parseInt(localStorage.getItem('duellio-admin-total-game-time') || '1800', 10);
  });
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(() => {
    return parseInt(localStorage.getItem('duellio-admin-player-turn-time') || '120', 10);
  });
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showReconciliation, setShowReconciliation] = useState<boolean>(false);
  const [reconciliationInfo, setReconciliationInfo] = useState<{
    gameType: string;
    timeLeft: number;
    userCards: number;
    botCards: number;
    winner: string;
    pointsMsg: string;
    entryFee: number;
    refundedCoins: number;
  } | null>(null);

  const opponentId = activeChallenge
    ? (activeChallenge.opponentType === 'player'
        ? (activeChallenge.senderId === userProfile.uid 
            ? (activeChallenge.receiverId === 'pending' ? '' : activeChallenge.receiverId) 
            : activeChallenge.senderId)
        : (activeChallenge.senderId === userProfile.uid ? selectedBot?.uid || 'bot' : activeChallenge.senderId))
    : '';

  const opponentProfile = activeChallenge
    ? (activeChallenge.opponentType === 'bot' && activeChallenge.senderId === 'friend_user'
        ? {
            uid: 'bot',
            username: activeChallenge.senderName || 'Nebula_AI',
            avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
            wins: 15,
            losses: 15,
            draws: 0,
            coins: 1000,
            status: 'online' as const
          }
        : (activeChallenge.opponentType === 'bot'
            ? selectedBot
            : (allProfiles.find(p => (opponentId && p.uid === opponentId) || (p.username && p.username !== userProfile.username && (p.username === activeChallenge.senderName || p.username === activeChallenge.receiverId))) || {
                uid: opponentId || 'player-2',
                username: (activeChallenge.senderName !== userProfile.username ? activeChallenge.senderName : 'Challenger'),
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
                wins: 0,
                losses: 0,
                draws: 0,
                coins: 0,
                status: 'online'
              })))
    : selectedBot;

  const handleTurnTimeout = () => {
    if (!whotGameState || whotGameState.status !== 'playing') return;
    
    const activePlayerId = whotGameState.activePlayerId;
    if (lastTimeoutPlayerRef.current === activePlayerId) return; // Prevent double timeout execution in the same turn!
    lastTimeoutPlayerRef.current = activePlayerId;

    const botId = activeChallenge?.senderId === userProfile.uid ? selectedBot?.uid : activeChallenge?.senderId;
    if (!botId) return;

    if (activePlayerId === userProfile.uid) {
      drawCardForPlayer(userProfile.uid, 1);
      const message = `Time limit exceeded! You drew 1 card as penalty. Turn passed.`;
      
      setWhotGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          activePlayerId: botId,
          penaltyCount: 0,
          lastActionMessage: message
        };
      });

      setGamePlayLogs(prev => [
        ...prev,
        `[TIMEOUT] Time limit exceeded. You drew 1 card as penalty.`
      ]);
    } else {
      drawCardForPlayer(activePlayerId, 1);
      const message = `${opponentProfile?.username || 'Opponent'} timed out, drew 1 card as penalty & passed turn.`;
      
      setWhotGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          activePlayerId: userProfile.uid,
          penaltyCount: 0,
          lastActionMessage: message
        };
      });

      setGamePlayLogs(prev => [
        ...prev,
        `[TIMEOUT] ${opponentProfile?.username || 'Opponent'} timed out and drew 1 card as penalty.`
      ]);
    }
  };

  const handleMatchTimerExpiry = () => {
    if (!activeChallenge) return;
    
    const opponentId = activeChallenge.opponentType === 'player'
      ? (activeChallenge.senderId === userProfile.uid ? (activeChallenge.receiverId === 'pending' ? '' : activeChallenge.receiverId) : activeChallenge.senderId)
      : (selectedBot?.uid || 'bot');
    
    let winnerName = "";
    let pointsMsg = "";
    let userWon = false;
    let refundedCoins = 0;
    
    if (activeChallenge.gameType === 'Whot' && whotGameState) {
      const userHandCount = whotGameState?.playerHands?.[userProfile.uid]?.length || 0;
      const opponentHandCount = whotGameState?.playerHands?.[opponentId]?.length || 0;
      
      const userPoints = whotGameState?.playerHands?.[userProfile.uid]?.reduce((acc, c) => acc + (c.suit === 'Whot' ? 20 : c.value), 0) || 0;
      const opponentPoints = whotGameState?.playerHands?.[opponentId]?.reduce((acc, c) => acc + (c.suit === 'Whot' ? 20 : c.value), 0) || 0;
      
      if (userHandCount < opponentHandCount) {
        userWon = true;
        winnerName = "Lead Developer (Fewest Cards)";
        pointsMsg = `Your Cards: ${userHandCount} (Score: ${userPoints}) vs Opponent: ${opponentHandCount} (Score: ${opponentPoints})`;
      } else if (opponentHandCount < userHandCount) {
        userWon = false;
        winnerName = `${activeChallenge.senderName} (Fewest Cards)`;
        pointsMsg = `Your Cards: ${userHandCount} (Score: ${userPoints}) vs Opponent: ${opponentHandCount} (Score: ${opponentPoints})`;
      } else {
        if (userPoints < opponentPoints) {
          userWon = true;
          winnerName = "Lead Developer (Lowest Points sum)";
          pointsMsg = `Tied Card Count (${userHandCount} each). Your Score: ${userPoints} is lower than Opponent Score: ${opponentPoints}.`;
        } else {
          userWon = false;
          winnerName = `${activeChallenge.senderName} (Lowest Points sum)`;
          pointsMsg = `Tied Card Count (${userHandCount} each). Opponent Score: ${opponentPoints} is lower or equal to yours (${userPoints}).`;
        }
      }
    } else if (activeChallenge.gameType === 'Chess') {
      userWon = Math.random() < 0.6;
      winnerName = userWon ? "Lead Developer" : activeChallenge.senderName;
      pointsMsg = userWon 
        ? "Lead Developer reached superior positional dominance (Material advantage +3 pawns)." 
        : "Opponent achieved strong spatial control and bishop pair advantage.";
    } else {
      userWon = Math.random() < 0.55;
      winnerName = userWon ? "Lead Developer" : activeChallenge.senderName;
      pointsMsg = userWon 
        ? "Lead Developer tokens achieved furthest path progress (Closest to home)." 
        : "Opponent secured more capture cells and better piece dispersion.";
    }

    const multiplier = activeChallenge.rewardMultiplier !== undefined ? activeChallenge.rewardMultiplier : 1.0;
    const winPayout = Math.floor(activeChallenge.entryFee * (1 + multiplier));
    
    const rakeRate = 0.1;
    let rakeAmount = 0;
    let finalUserPayout = 0;

    if (userWon) {
      rakeAmount = winPayout > 0 ? Math.floor(winPayout * rakeRate) : 0;
      finalUserPayout = winPayout - rakeAmount;
      refundedCoins = finalUserPayout;

      setUserProfile(prev => ({ 
        ...prev, 
        coins: prev.coins + finalUserPayout,
        wins: prev.wins + 1,
        status: 'online'
      }));
      
      if (finalUserPayout > 0) {
        const payoutTx: WalletTransaction = {
          id: `recon_win_${Date.now()}`,
          userId: userProfile.uid,
          type: 'win_payout',
          amount: finalUserPayout,
          description: `Timer Expiry Escrow Reconciliation Claim (90%): ${activeChallenge.gameType} vs ${activeChallenge.senderName}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'completed'
        };
        setTransactions(prev => [payoutTx, ...prev]);

        // Save transaction to Firestore
        setDoc(doc(db, 'transactions', payoutTx.id), payoutTx).catch(console.error);

        // Record developer rake transaction
        if (rakeAmount > 0) {
          const devTx: WalletTransaction = {
            id: `rake_${Date.now()}`,
            userId: 'developer',
            type: 'credit',
            amount: rakeAmount,
            description: `Rake Commission (10%) from ${activeChallenge.gameType} Match: ${userProfile.username} vs ${activeChallenge.senderName}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'completed'
          };
          setDoc(doc(db, 'transactions', devTx.id), devTx).catch(console.error);
          setDoc(doc(db, 'developer_stats', 'revenue'), { totalRake: increment(rakeAmount) }, { merge: true }).catch(console.error);
        }
      }
    } else {
      refundedCoins = 0;
      setUserProfile(prev => ({ 
        ...prev, 
        losses: prev.losses + 1,
        status: 'online'
      }));

      // If playing with a bot, the user loses their stake to the house
      const houseEarning = activeChallenge.entryFee;
      if (houseEarning > 0 && activeChallenge.opponentType === 'bot') {
        const devTx: WalletTransaction = {
          id: `house_${Date.now()}`,
          userId: 'developer',
          type: 'credit',
          amount: houseEarning,
          description: `House Win vs ${userProfile.username} in ${activeChallenge.gameType} Bot Match`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'completed'
        };
        setDoc(doc(db, 'transactions', devTx.id), devTx).catch(console.error);
        setDoc(doc(db, 'developer_stats', 'revenue'), { totalRake: increment(houseEarning) }, { merge: true }).catch(console.error);
      }
    }

    setReconciliationInfo({
      gameType: activeChallenge.gameType,
      timeLeft: 0,
      userCards: whotGameState?.playerHands[userProfile.uid]?.length || 0,
      botCards: whotGameState?.playerHands[opponentId]?.length || 0,
      winner: winnerName,
      pointsMsg,
      entryFee: activeChallenge.entryFee,
      refundedCoins
    });
    
    setGamePlayStatus('completed');
    setShowReconciliation(true);
    setOnlineBots(prev => prev.map(b => b.uid === activeChallenge.senderId ? { ...b, status: 'online' } : b));
  };

  // Timer Countdown Safeguard Effect
  useEffect(() => {
    const adminTotalTime = parseInt(localStorage.getItem('duellio-admin-total-game-time') || '1800', 10);
    if (gamePlayStatus !== 'playing') {
      setTimeLeft(adminTotalTime);
      return;
    }

    const interval = setInterval(() => {
      if (isPaused) return; // Freeze countdown
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleMatchTimerExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gamePlayStatus, whotGameState, isPaused]);

  // Turn Timer Countdown Safeguard Effect
  useEffect(() => {
    const adminTurnTime = parseInt(localStorage.getItem('duellio-admin-player-turn-time') || '120', 10);
    if (gamePlayStatus !== 'playing' || !whotGameState || whotGameState.status !== 'playing') {
      setTurnTimeLeft(adminTurnTime);
      return;
    }

    setTurnTimeLeft(adminTurnTime);
    lastTimeoutPlayerRef.current = null; // Clear safeguard flag for the new turn!

    const interval = setInterval(() => {
      if (isPaused) return; // Freeze countdown
      setTurnTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [whotGameState?.activePlayerId, whotGameState?.status, gamePlayStatus, isPaused]);

  // Handle Turn Timeout when time runs out
  useEffect(() => {
    if (gamePlayStatus === 'playing' && whotGameState && whotGameState.status === 'playing' && turnTimeLeft <= 0) {
      handleTurnTimeout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnTimeLeft, gamePlayStatus]);

  // Trigger note/notification for card count warnings ("semi last card", "last card", "checkup")
  useEffect(() => {
    if (!whotGameState || (whotGameState.status !== 'playing' && whotGameState.status !== 'completed')) {
      prevHandsRef.current = {};
      return;
    }

    const botId = activeChallenge?.senderId === userProfile.uid ? selectedBot?.uid : activeChallenge?.senderId;
    const players = [
      { id: userProfile.uid, name: 'Lead Developer' },
      ...(botId ? [{ id: botId, name: opponentProfile?.username || 'Opponent' }] : [])
    ];

    for (const player of players) {
      const currentCount = whotGameState?.playerHands?.[player.id]?.length || 0;
      const prevCount = prevHandsRef.current[player.id];

      // Only alert if there was a real state change
      if (prevCount !== undefined && currentCount !== prevCount) {
        if (currentCount === 2) {
          setWhotNotification({ text: `${player.name}: SEMI LAST CARD! 🃟`, type: 'semi' });
        } else if (currentCount === 1) {
          setWhotNotification({ text: `${player.name}: LAST CARD! 🂱`, type: 'last' });
        } else if (currentCount === 0 && prevCount > 0) {
          setWhotNotification({ text: `${player.name}: CHECKUP! 👑`, type: 'checkup' });
        }
      }
      prevHandsRef.current[player.id] = currentCount;
    }
  }, [whotGameState, userProfile.uid, activeChallenge, selectedBot, opponentProfile]);

  // Clear notification timer
  useEffect(() => {
    if (whotNotification) {
      const timer = setTimeout(() => {
        setWhotNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [whotNotification]);

  // Notify parent of active game changes to hide/show main header
  useEffect(() => {
    if (onGameActiveChange) {
      onGameActiveChange(gamePlayStatus !== 'none');
    }
  }, [gamePlayStatus, onGameActiveChange]);

  // Dynamically compute tension CSS class based on remaining card counts
  const getTensionClass = () => {
    if (!whotGameState || whotGameState.status !== 'playing') return '';
    const botId = activeChallenge?.senderId === userProfile.uid ? selectedBot?.uid : activeChallenge?.senderId;
    const userCount = whotGameState?.playerHands?.[userProfile.uid]?.length || 0;
    const botCount = botId ? (whotGameState?.playerHands?.[botId]?.length || 0) : 0;
    
    if (userCount === 1 || botCount === 1) {
      return 'tension-last';
    }
    if (userCount === 2 || botCount === 2) {
      return 'tension-semi';
    }
    return '';
  };

  // End Game Check when draw pile is empty and no playable cards remain
  useEffect(() => {
    if (gamePlayStatus !== 'playing' || !whotGameState || whotGameState.status !== 'playing') return;
    
    if (whotGameState.deckCount === 0) {
      const opponentId = activeChallenge?.senderId === userProfile.uid ? selectedBot?.uid : activeChallenge?.senderId;
      if (!opponentId) return;

      const userHand = whotGameState?.playerHands?.[userProfile.uid] || [];
      const botHand = whotGameState?.playerHands?.[opponentId] || [];

      const userHasPlayable = hasAnyPlayableCard(userHand, whotGameState.activeSuit, whotGameState.discardPile[0], whotGameState.penaltyCount);
      const botHasPlayable = hasAnyPlayableCard(botHand, whotGameState.activeSuit, whotGameState.discardPile[0], whotGameState.penaltyCount);

      if (!userHasPlayable && !botHasPlayable) {
        // Both players cannot play, and draw deck is empty. Game ends!
        const userSum = userHand.reduce((acc, c) => acc + (c.suit === 'Whot' ? 20 : c.value), 0);
        const botSum = botHand.reduce((acc, c) => acc + (c.suit === 'Whot' ? 20 : c.value), 0);
        
        const userWins = userSum <= botSum;
        const winnerId = userWins ? userProfile.uid : opponentId;
        const message = `No valid moves left for both players and draw pile is empty! Game ended. ${
          userWins ? 'Lead Developer wins by points sum' : `${opponentProfile?.username || 'Opponent'} wins by points sum`
        } (${userSum} vs ${botSum}).`;

        setWhotGameState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'completed',
            winnerId,
            lastActionMessage: message
          };
        });

        setGamePlayLogs(prev => [
          ...prev,
          `[GAME OVER - NO MOVES] ${message}`
        ]);

        completeMatchWithOutcome(userWins);
      }
    }
  }, [whotGameState, gamePlayStatus, activeChallenge, selectedBot, opponentProfile]);

  const handleRematch = () => {
    if (!activeChallenge) return;
    setGamePlayStatus('playing');
    setShowReconciliation(false);

    if (activeChallenge.gameType === 'Whot') {
      startInteractiveWhotGame(activeChallenge);
    } else {
      let resetState: any = null;
      const sessionId = activeChallenge.id;
      if (activeChallenge.gameType === 'TicTacToe') resetState = TicTacToeLogicService.initializeBoard(sessionId, 'host', 'guest');
      else if (activeChallenge.gameType === 'Draft') resetState = DraftLogicService.initializeBoard(sessionId, 'host', 'guest');
      else if (activeChallenge.gameType === 'Chess') resetState = { sessionId, activeColor: 'w', status: 'playing' };
      else if (activeChallenge.gameType === 'Ludo') resetState = { sessionId, activePlayer: 'red', status: 'playing' };
      else resetState = { sessionId, status: 'playing' };

      setLiveGameState(resetState);
      if (activeChallenge.opponentType === 'player') {
        updateDoc(doc(db, 'gameSessions', sessionId), {
          gameState: resetState,
          status: 'playing',
          updatedAt: Date.now()
        }).catch(console.error);
      }
    }

    setGamePlayLogs([
      `[REMATCH] New game started against ${opponentProfile?.username || 'Opponent'}!`
    ]);
  };

  const handleBackToLobbies = () => {
    setWhotGameState(null);
    setActiveChallenge(null);
    setGamePlayStatus('none');
    setUserProfile(prev => ({ ...prev, status: 'online' }));
  };

  const handleExitActiveSession = () => {
    _setWhotGameState(null);
    setActiveChallenge(null);
    setGamePlayStatus('none');
    setUserProfile(prev => ({ ...prev, status: 'online' }));
  };

  // Active Multiplayer Game Firestore Synchronization Effect
  useEffect(() => {
    if (!activeChallenge || activeChallenge.opponentType !== 'player') return;
    const sessionId = activeChallenge.id;
    
    const unsubscribe = onSnapshot(doc(db, 'gameSessions', sessionId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Sync local game state
        if (data.gameState) {
          _setWhotGameState(data.gameState);
          setLiveGameState(data.gameState);
        }
        if (data.deck) {
          whotDeckRef.current = data.deck;
        }
        
        // Sync pause state
        if (data.status === 'paused') {
          setIsPaused(true);
        } else {
          setIsPaused(false);
        }
        
        // Sync pause request handshake
        setPauseRequest(data.pauseRequest || null);
        
        // Sync recipient profile details when guest joins
        if (data.opponentId && data.opponentName && activeChallenge.receiverId === 'pending') {
          setActiveChallenge(prev => prev ? {
            ...prev,
            receiverId: data.opponentId,
            status: 'accepted'
          } : null);
        }

        // Handle completed state
        if (data.status === 'completed' || (data.gameState && data.gameState.status === 'completed')) {
          setGamePlayStatus('completed');
        }
      }
    }, (error) => {
      console.warn("gameSessions Firestore listener error:", error);
    });

    // Sub-listener for in-game Live Duel chat messages
    const msgQuery = query(collection(db, 'gameSessions', sessionId, 'messages'), orderBy('timestamp', 'asc'));
    const msgUnsub = onSnapshot(msgQuery, (msgSnap) => {
      const msgs: ChatMessage[] = [];
      msgSnap.forEach(mDoc => {
        const mData = mDoc.data();
        msgs.push({
          id: mDoc.id,
          senderId: mData.senderId,
          senderName: mData.senderName,
          senderAvatar: mData.senderAvatar,
          text: mData.text,
          timestamp: typeof mData.timestamp === 'string' ? mData.timestamp : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } as ChatMessage);
      });
      if (msgs.length > 0) {
        setChatMessages(msgs);
      }
    }, (error) => {
      console.warn("gameSessions messages listener error:", error);
    });

    return () => {
      unsubscribe();
      msgUnsub();
    };
  }, [activeChallenge?.id, activeChallenge?.opponentType, userProfile.uid]);

  // Loader for all active multiplayer lobbies and sessions from Firestore
  useEffect(() => {
    const q = query(collection(db, 'gameSessions'), where('status', 'in', ['waiting', 'playing', 'paused']));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push(data);
      });
      setActiveSessions(sessions);
    }, (error) => {
      console.error("Error loading active sessions:", error);
    });

    return () => unsubscribe();
  }, []);

  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Periodic random bot challenging system
  useEffect(() => {
    const triggerRandomChallenge = () => {
      if (activeChallenge || gamePlayStatus !== 'none') return;
      
      const challengers = onlineBots.filter(b => b.status === 'online');
      if (challengers.length === 0) return;
      const randomBot = challengers[Math.floor(Math.random() * challengers.length)];
      
      const simulatedFee = [100, 200, 300, 500][Math.floor(Math.random() * 4)];
      const simulatedGame = (['Whot', 'Ludo', 'Chess'] as const)[Math.floor(Math.random() * 3)];

      const incomingChallenge: MatchChallenge = {
        id: `challenge_${Date.now()}`,
        senderId: randomBot.uid,
        senderName: randomBot.username,
        receiverId: userProfile.uid,
        gameType: simulatedGame,
        entryFee: simulatedFee,
        status: 'pending',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setActiveChallenge(incomingChallenge);
    };

    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        triggerRandomChallenge();
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [activeChallenge, gamePlayStatus, onlineBots, userProfile]);

  // Bottom action: Bot trigger plays automatically
  useEffect(() => {
    if (!whotGameState || whotGameState.status !== 'playing') return;
    if (activeChallenge?.opponentType === 'player') return; // Don't auto-play for real players
    if (whotGameState.activePlayerId === userProfile.uid) return; // User turn

    const botId = activeChallenge?.senderId === userProfile.uid ? selectedBot?.uid : activeChallenge?.senderId;
    if (!botId) return;

    const timer = setTimeout(() => {
      executeBotTurn(botId);
    }, 300);

    return () => clearTimeout(timer);
  }, [whotGameState?.activePlayerId, whotGameState?.status, whotGameState?.discardPile, activeChallenge?.opponentType]);

  // Fountain token credits click handler
  const handleFountainCredit = () => {
    const amount = 1000;
    setUserProfile(prev => ({ ...prev, coins: prev.coins + amount }));
    
    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: 'credit',
      amount,
      description: 'Simulator testing token faucet credit',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  // Chat message submit click callback
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      senderId: userProfile.uid,
      senderName: userProfile.username,
      senderAvatar: userProfile.avatar,
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    if (activeChallenge?.id && activeChallenge.opponentType === 'player') {
      addDoc(collection(db, 'gameSessions', activeChallenge.id, 'messages'), {
        ...userMsg,
        timestamp: serverTimestamp()
      }).catch(console.error);
    }
  };

  const renderChatPanelContent = () => {
    return (
      <div className="flex-1 flex flex-col bg-black/30 backdrop-blur-md overflow-hidden h-full">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {chatMessages.map((msg) => {
            const isMe = msg.senderId === userProfile.uid;
            return (
              <div key={msg.id} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <img 
                  src={msg.senderAvatar} 
                  alt={msg.senderName} 
                  className="w-9 h-9 rounded-full object-cover border border-white/15 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <div className="max-w-[75%] space-y-1">
                  <div className={`flex items-baseline gap-2 text-[10px] text-neutral-400 font-mono ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="font-bold text-neutral-300">{msg.senderName}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans shadow-md ${
                    isMe 
                      ? 'bg-purple-350 text-neutral-950 font-bold rounded-tr-none shadow-[0_0_15px_rgba(235,211,255,0.15)]' 
                      : 'bg-white/5 text-neutral-100 rounded-tl-none border border-white/10 backdrop-blur-md'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-purple-300 font-mono pl-3.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>{typingBot} is typing...</span>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Emoji Selector Bar */}
        <div className="px-4 py-2 bg-black/40 border-t border-white/10 flex flex-wrap gap-1.5 justify-start select-none backdrop-blur-md">
          {['😂', '😮', '👑', '🔥', '💀', '🧠', '🃏', '♟️', '🎲', '👍', '🎉', '💪'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setInputMessage(prev => prev + emoji)}
              className="p-1 px-2 text-xs rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-white/10 hover:text-white transition-all cursor-pointer select-none active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="p-3.5 bg-black/60 border-t border-white/10 flex gap-2.5 backdrop-blur-md">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message in lobby chat..."
            className="flex-1 bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-2xl px-4 py-2.5 text-xs font-sans text-white placeholder:text-neutral-500 outline-none transition-all backdrop-blur-md"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-purple-350 hover:bg-purple-300 text-neutral-950 rounded-2xl cursor-pointer font-extrabold transition-all shadow-[0_0_15px_rgba(235,211,255,0.2)] hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  };

  const openChallengePanel = (bot: UserProfile) => {
    if (gamePlayStatus !== 'none') return;
    setSelectedBot(bot);
    setShowChallengeModal(true);
  };

  // Launch Staking lock & start Whot interactive game / simulation
  const executeChallengeAction = (accept: boolean) => {
    if (!activeChallenge) return;

    if (accept) {
      if (activeChallenge.entryFee > 0 && userProfile.coins < activeChallenge.entryFee) {
        alert("Transaction Failed: Insufficient Wallet Coins. Utilize the faucet to credit more.");
        setActiveChallenge(null);
        return;
      }

      // Debit local cash
      if (activeChallenge.entryFee > 0) {
        setUserProfile(prev => ({ ...prev, coins: prev.coins - activeChallenge.entryFee }));
        
        const lockTx: WalletTransaction = {
          id: `escrow_${Date.now()}`,
          type: 'stake_lock',
          amount: activeChallenge.entryFee,
          description: `Escrow atomic lock: ${activeChallenge.gameType} vs ${activeChallenge.senderName}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setTransactions(prev => [lockTx, ...prev]);
      }

      setGamePlayStatus('playing');
      const activeObj = { ...activeChallenge, status: 'accepted' as const };
      setActiveChallenge(activeObj);
      setUserProfile(prev => ({ ...prev, status: 'in-game' }));
      setOnlineBots(prev => prev.map(b => b.uid === activeChallenge.senderId ? { ...b, status: 'in-game' } : b));

      if (activeChallenge.gameType === 'Whot') {
        setGamePlayLogs([
          `[ESCROW LOCK] Atomic escrow write success. STAKE: ${activeChallenge.entryFee} coins escrowed.`,
          `[PRESENCE SYNC] Player status switched: in-game`,
          `[DECK INITIALIZED] Safe Fisher-Yates generator shuffling card deck. Dealt 6 cards to each player.`,
          `[TURN VALIDATION] Starter card dealt to discard stack.`
        ]);
        startInteractiveWhotGame(activeChallenge);
      } else if (activeChallenge.gameType === 'Ludo') {
        setGamePlayLogs([
          `[ESCROW LOCK] Atomic escrow write success. STAKE: ${activeChallenge.entryFee} coins escrowed.`,
          `[PRESENCE SYNC] Player status switched: in-game`,
          `[LUDO START] Ludo match session active. Choose a piece to spawn or slide on path.`
        ]);
      } else if (activeChallenge.gameType === 'Draft') {
        setGamePlayLogs([
          `[ESCROW LOCK] Atomic escrow write success. STAKE: ${activeChallenge.entryFee} coins escrowed.`,
          `[PRESENCE SYNC] Player status switched: in-game`,
          `[DRAFTS START] Standard checkers layout configured. Command your cyan pieces!`
        ]);
      } else if (activeChallenge.gameType === 'Stickman') {
        setGamePlayLogs([
          `[ESCROW LOCK] Atomic escrow write success. STAKE: ${activeChallenge.entryFee} coins escrowed.`,
          `[PRESENCE SYNC] Player status switched: in-game`,
          `[STICKMAN START] Kung-Fu Arena combat session active. Fight!`
        ]);
      } else {
        setGamePlayLogs([
          `[ESCROW LOCK] Atomic escrow write success. STAKE: ${activeChallenge.entryFee} coins escrowed.`,
          `[PRESENCE SYNC] Player status switched: in-game`,
          `[CHESS START] Standard initial layout configured. Play move with White!`
        ]);
      }
    } else {
      setActiveChallenge(null);
    }
  };

  const sendManualChallengeToBot = () => {
    if (!selectedBot) return;
    if (userProfile.coins < entryFee) {
      alert("Verification Error: Staking stake amount exceeds current available virtual wallet supply.");
      return;
    }

    setShowChallengeModal(false);

    const manualChallenge: MatchChallenge = {
      id: `manual_${Date.now()}`,
      senderId: userProfile.uid,
      senderName: userProfile.username,
      receiverId: selectedBot.uid,
      gameType,
      entryFee,
      status: 'pending',
      opponentType: 'bot',
      botDifficulty: entryFee > 0 ? 'hard' : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setActiveChallenge(manualChallenge);

    setTimeout(() => {
      const isAccepted = Math.random() < 0.85;
      if (isAccepted) {
        executeChallengeAction(true);
      } else {
        alert(`${selectedBot.username} declined your stake challenge.`);
        setActiveChallenge(null);
      }
    }, 1500);
  };

  // Core Whot Game State Initializer
  const startInteractiveWhotGame = (challenge: MatchChallenge) => {
    const fullDeck = shuffleDeck(generateWhotDeck(whotSettings.optional20));
    
    // Deal 6 to each
    const humanHand = fullDeck.splice(0, 6);
    const botHand = fullDeck.splice(0, 6);
    
    // Find valid starter card (no action card triggers initially for balance)
    let starterIndex = -1;
    for (let i = 0; i < fullDeck.length; i++) {
      const card = fullDeck[i];
      if (card.value !== 1 && card.value !== 2 && card.value !== 5 && card.value !== 8 && card.value !== 14 && card.value !== 20) {
        starterIndex = i;
        break;
      }
    }
    
    if (starterIndex === -1) starterIndex = 0;
    const starterCard = fullDeck.splice(starterIndex, 1)[0];

    // Cap remaining draw pile to 30 max
    if (fullDeck.length > 30) {
      fullDeck.splice(30);
    }
    
    const opId = challenge.senderId === userProfile.uid ? challenge.receiverId : challenge.senderId;

    const startPlayerId = Math.random() < 0.5 ? userProfile.uid : opId;
    const isHumanTurn = startPlayerId === userProfile.uid;

    const initialSession: WhotGameState = {
      sessionId: challenge.id,
      playerIds: [userProfile.uid, opId],
      playerHands: {
        [userProfile.uid]: humanHand,
        [opId]: botHand
      },
      deckCount: fullDeck.length,
      discardPile: [starterCard],
      activeSuit: starterCard.suit as any,
      activePlayerId: startPlayerId,
      status: 'playing',
      turnTimer: 20,
      penaltyCount: 0,
      lastActionMessage: isHumanTurn
        ? 'Match started! Top pile represents ' + starterCard.suit + ' ' + starterCard.value + '. Lead Developer turn.'
        : 'Match started! Top pile represents ' + starterCard.suit + ' ' + starterCard.value + '. Opponent turn.'
    };
    
    whotDeckRef.current = fullDeck;
    setWhotGameState(initialSession);
  };

  // Safe Draw Engine for players
  const drawCardForPlayer = (playerId: string, count: number): WhotCard[] => {
    let resultCards: WhotCard[] = [];
    let currentDeck = [...whotDeckRef.current];

    for (let i = 0; i < count; i++) {
      if (currentDeck.length === 0) {
        break; // Draw pile is empty, do not reset/recycle discard pile until game ends
      }
      
      const card = currentDeck.pop();
      if (card) {
        resultCards.push(card);
      }
    }

    whotDeckRef.current = currentDeck;

    setWhotGameState(prev => {
      if (!prev) return null;
      const existingHand = prev?.playerHands?.[playerId] || [];
      return {
        ...prev,
        playerHands: {
          ...(prev?.playerHands || {}),
          [playerId]: [...existingHand, ...resultCards]
        },
        deckCount: currentDeck.length
      };
    });

    return resultCards;
  };

  // Human player makes a draw
  const handleHumanDrawCard = () => {
    if (!whotGameState || whotGameState.status !== 'playing') return;
    if (whotGameState.activePlayerId !== userProfile.uid) return;

    const penaltyActive = whotGameState.penaltyCount > 0;
    const targetOpponentId = opponentId || (activeChallenge?.opponentType === 'player' 
      ? (activeChallenge.senderId === userProfile.uid ? (activeChallenge.receiverId === 'pending' ? '' : activeChallenge.receiverId) : activeChallenge.senderId)
      : (activeChallenge?.senderId === userProfile.uid ? selectedBot?.uid || 'bot' : activeChallenge?.senderId));

    if (penaltyActive) {
      const pCount = whotGameState.penaltyCount;
      drawCardForPlayer(userProfile.uid, pCount);
      const message = `You drew ${pCount} penalty cards from market & passed turn.`;

      setWhotGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          activePlayerId: targetOpponentId,
          penaltyCount: 0,
          lastActionMessage: message
        };
      });

      setGamePlayLogs(prev => [
        ...prev,
        `[PENALTY APPLIED] You took ${pCount} penalty cards.`
      ]);
    } else {
      drawCardForPlayer(userProfile.uid, 1);
      const message = `You drew 1 card from deck. Turn passed.`;

      setWhotGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          activePlayerId: targetOpponentId,
          lastActionMessage: message
        };
      });

      setGamePlayLogs(prev => [
        ...prev,
        `[TURN SYNCHRONIZATION] Lead Developer drew 1 card.`
      ]);
    }
  };

  // Play a standard chosen card
  const handlePlayCard = (card: WhotCard) => {
    if (!whotGameState || whotGameState.status !== 'playing') return;
    if (whotGameState.activePlayerId !== userProfile.uid) return;

    const penaltyActive = whotGameState.penaltyCount > 0;
    const topCard = whotGameState.discardPile[0];
    const activeSuit = whotGameState.activeSuit;

    let isValid = false;
    if (penaltyActive) {
      if (topCard.value === 14) {
        isValid = false; // General market (14) cannot be countered!
      } else {
        isValid = card.value === topCard.value;
      }
    } else {
      isValid = card.suit === 'Whot' || card.suit === activeSuit || card.value === topCard.value;
    }

    if (!isValid) {
      alert("Invalid play! Card must match the current active suit or number, or be a Whot (20) wildcard.");
      return;
    }

    if (card.suit === 'Whot') {
      setPendingWhotCardObj(card);
      setSelectedSuitToClaim(true);
      return;
    }

    executePlayCardMove(card);
  };

  // Claim suit for card 20
  const handleClaimSuitSelection = (suit: 'Circles' | 'Triangles' | 'Crosses' | 'Stars' | 'Squares') => {
    if (!pendingWhotCardObj) return;
    setSelectedSuitToClaim(false);
    executePlayCardMove(pendingWhotCardObj, suit);
    setPendingWhotCardObj(null);
  };

  // Single card playing move core state-machine changes
  const executePlayCardMove = (card: WhotCard, claimedSuit?: 'Circles' | 'Triangles' | 'Crosses' | 'Stars' | 'Squares') => {
    if (!whotGameState) return;

    const targetOpponentId = opponentId || (activeChallenge?.opponentType === 'player' 
      ? (activeChallenge.senderId === userProfile.uid ? (activeChallenge.receiverId === 'pending' ? '' : activeChallenge.receiverId) : activeChallenge.senderId)
      : (activeChallenge?.senderId === userProfile.uid ? selectedBot?.uid || 'bot' : activeChallenge?.senderId));

    const playerHand = whotGameState?.playerHands?.[userProfile.uid] || [];
    const nextPlayerHand = playerHand.filter(c => c.id !== card.id);
    const isWinner = nextPlayerHand.length === 0;

    let nextPlayer = targetOpponentId;
    let nextPenalty = whotGameState.penaltyCount;
    let message = `You played ${card.suit} ${card.value}.`;

    let suffix = "";
    if (nextPlayerHand.length === 2) {
      suffix = " - SEMI LAST CARD!";
    } else if (nextPlayerHand.length === 1) {
      suffix = " - LAST CARD!";
    } else if (nextPlayerHand.length === 0) {
      suffix = " - CHECKUP!";
    }

    if (card.value === 1) { // Hold On
      if (whotSettings.playAgainOn1or8) {
        nextPlayer = userProfile.uid; 
        message = `You played Hold On (1)! Gained an extra turn.`;
      } else {
        nextPlayer = targetOpponentId;
        message = `You played Hold On (1). Extra turn setting is disabled.`;
      }
    } else if (card.value === 2) { // Pick Two
      if (whotSettings.defendOn2) {
        if (whotGameState.penaltyCount > 0) {
          nextPenalty = 0; // cleared
          message = `You countered the Pick Two (2) with another 2! Obligation cleared. Next user plays on.`;
          nextPlayer = targetOpponentId;
        } else {
          nextPenalty = 2;
          message = `You played Pick Two (2)! Opponent must draw 2 cards or counter with another 2.`;
          nextPlayer = targetOpponentId;
        }
      } else {
        nextPenalty += 2;
        message = `You played Pick Two (2)! Opponent pickup obligations: ${nextPenalty}.`;
      }
    } else if (card.value === 5) { // Pick Three
      if (whotGameState.penaltyCount > 0) {
        nextPenalty = 0; // cleared
        message = `You countered the Pick Three (5) with another 5! Obligation cleared. Next user plays on.`;
        nextPlayer = targetOpponentId;
      } else {
        nextPenalty = 3;
        message = `You played Pick Three (5)! Opponent must draw 3 cards or counter with another 5.`;
        nextPlayer = targetOpponentId;
      }
    } else if (card.value === 8) { // Suspension
      if (whotSettings.playAgainOn1or8) {
        nextPlayer = userProfile.uid; // opponent is suspended, turn matches developer again!
        message = `You played Suspension (8)! Opponent's turn skipped.`;
      } else {
        nextPlayer = targetOpponentId;
        message = `You played Suspension (8). Extra turn setting is disabled.`;
      }
    } else if (card.value === 14) { // General market
      if (whotSettings.forcePickOn14) {
        nextPenalty = 1;
        message = `You played General Market (14)! Opponent is forced to draw 1 card.`;
      } else {
        message = `You played General Market (14). Opponent draw setting is disabled.`;
      }
    } else if (card.suit === 'Whot') {
      message = `You played Whot (20) & declared ${claimedSuit}!`;
    }

    message += suffix;

    setWhotGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        playerHands: {
          ...prev.playerHands,
          [userProfile.uid]: nextPlayerHand
        },
        discardPile: [card, ...prev.discardPile],
        activeSuit: card.suit === 'Whot' ? claimedSuit! : (card.suit as any),
        activePlayerId: isWinner ? userProfile.uid : nextPlayer,
        penaltyCount: nextPenalty,
        lastActionMessage: message,
        whotClaimedSuit: claimedSuit,
        status: isWinner ? 'completed' : 'playing',
        winnerId: isWinner ? userProfile.uid : undefined
      };
    });

    setGamePlayLogs(prev => [
      ...prev,
      `[USER ACTION] ${message}`
    ]);

    if (isWinner) {
      completeMatchWithOutcome(true);
    }
  };

  // Bot Turn State Logic
  const executeBotTurn = (botId: string) => {
    if (!whotGameState) return;
    
    const botHand = whotGameState?.playerHands?.[botId] || [];
    const topCard = whotGameState.discardPile[0];
    const activeSuit = whotGameState.activeSuit;
    const penaltyActive = whotGameState.penaltyCount > 0;

    let playedCard: WhotCard | null = null;
    let newClaimedSuit: 'Circles' | 'Triangles' | 'Crosses' | 'Stars' | 'Squares' | undefined = undefined;

    const isPlayable = (card: WhotCard) => {
      if (penaltyActive) {
        if (topCard.value === 14) return false; // General market (14) cannot be countered!
        return card.value === topCard.value;
      }
      return card.suit === 'Whot' || card.suit === activeSuit || card.value === topCard.value;
    };

    const playableCards = botHand.filter(isPlayable);

    if (playableCards.length > 0) {
      // Pick strategy based on difficulty
      const isHard = activeChallenge?.botDifficulty === 'hard' || (activeChallenge?.opponentType === 'bot' && (activeChallenge?.entryFee || 0) > 0);
      
      if (isHard) {
        // Hard mode: prioritize attack cards (Pick 2, Pick 3, Hold On, Whot wildcards) and high value cards
        const attackCards = playableCards.filter(c => [2, 5, 1, 14, 20].includes(c.value));
        const highValueCards = [...playableCards].sort((a, b) => b.value - a.value);
        playedCard = attackCards[0] || highValueCards[0] || playableCards[0];
      } else {
        const specCards = playableCards.filter(c => [1, 2, 5, 8, 14, 20].includes(c.value));
        playedCard = specCards.length > 0 
          ? specCards[Math.floor(Math.random() * specCards.length)] 
          : playableCards[Math.floor(Math.random() * playableCards.length)];
      }

      if (playedCard.suit === 'Whot') {
        const remainingSuits = botHand
          .filter(c => c.suit !== 'Whot')
          .map(c => c.suit);
        
        const counts = remainingSuits.reduce((acc, s) => {
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        let maxSuit: 'Circles' | 'Triangles' | 'Crosses' | 'Stars' | 'Squares' = 'Circles';
        let maxCount = -1;
        (['Circles', 'Triangles', 'Crosses', 'Stars', 'Squares'] as const).forEach(s => {
          if ((counts[s] || 0) > maxCount) {
            maxCount = counts[s] || 0;
            maxSuit = s;
          }
        });
        newClaimedSuit = maxSuit;
      }
    }

    if (playedCard) {
      const nextBotHand = botHand.filter(c => c.id !== playedCard!.id);
      const isWinner = nextBotHand.length === 0;

      let nextPlayer = userProfile.uid;
      let nextPenalty = whotGameState.penaltyCount;
      let message = `${opponentProfile?.username || 'Opponent'} played ${playedCard.suit} ${playedCard.value}.`;

      let suffix = "";
      if (nextBotHand.length === 2) {
        suffix = " - SEMI LAST CARD!";
      } else if (nextBotHand.length === 1) {
        suffix = " - LAST CARD!";
      } else if (nextBotHand.length === 0) {
        suffix = " - CHECKUP!";
      }

      if (playedCard.value === 1) { // Hold On
        if (whotSettings.playAgainOn1or8) {
          nextPlayer = botId;
          message = `${opponentProfile?.username || 'Opponent'} played Hold On (1)! Opponent gets another turn.`;
        } else {
          nextPlayer = userProfile.uid;
          message = `${opponentProfile?.username || 'Opponent'} played Hold On (1). Extra turn setting is disabled.`;
        }
      } else if (playedCard.value === 2) {
        if (whotSettings.defendOn2) {
          if (whotGameState.penaltyCount > 0) {
            nextPenalty = 0; // cleared
            message = `${opponentProfile?.username || 'Opponent'} countered the Pick Two (2) with another 2! Obligation cleared. Next user plays on.`;
            nextPlayer = userProfile.uid;
          } else {
            nextPenalty = 2;
            message = `${opponentProfile?.username || 'Opponent'} played Pick Two (2)! Lead Developer must draw 2 cards or counter with another 2.`;
            nextPlayer = userProfile.uid;
          }
        } else {
          nextPenalty += 2;
          message = `${opponentProfile?.username || 'Opponent'} played Pick Two (2)! Penalties stacked to ${nextPenalty}.`;
        }
      } else if (playedCard.value === 5) {
        if (whotGameState.penaltyCount > 0) {
          nextPenalty = 0; // cleared
          message = `${opponentProfile?.username || 'Opponent'} countered the Pick Three (5) with another 5! Obligation cleared. Next user plays on.`;
          nextPlayer = userProfile.uid;
        } else {
          nextPenalty = 3;
          message = `${opponentProfile?.username || 'Opponent'} played Pick Three (5)! Lead Developer must draw 3 cards or counter with another 5.`;
          nextPlayer = userProfile.uid;
        }
      } else if (playedCard.value === 8) {
        if (whotSettings.playAgainOn1or8) {
          nextPlayer = botId;
          message = `${opponentProfile?.username || 'Opponent'} played Suspension (8)! Lead Developer turn skipped.`;
        } else {
          nextPlayer = userProfile.uid;
          message = `${opponentProfile?.username || 'Opponent'} played Suspension (8). Extra turn setting is disabled.`;
        }
      } else if (playedCard.value === 14) {
        if (whotSettings.forcePickOn14) {
          nextPenalty = 1;
          message = `${opponentProfile?.username || 'Opponent'} played General Market (14)! Lead Developer is forced to draw 1 card.`;
        } else {
          message = `${opponentProfile?.username || 'Opponent'} played General Market (14). Opponent draw setting is disabled.`;
        }
      } else if (playedCard.suit === 'Whot') {
        message = `${opponentProfile?.username || 'Opponent'} played Whot (20) & declared ${newClaimedSuit}!`;
      }

      message += suffix;

      setWhotGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          playerHands: {
            ...prev.playerHands,
            [botId]: nextBotHand
          },
          discardPile: [playedCard!, ...prev.discardPile],
          activeSuit: playedCard!.suit === 'Whot' ? newClaimedSuit! : (playedCard!.suit as any),
          activePlayerId: isWinner ? botId : nextPlayer,
          penaltyCount: nextPenalty,
          lastActionMessage: message,
          whotClaimedSuit: newClaimedSuit,
          status: isWinner ? 'completed' : 'playing',
          winnerId: isWinner ? botId : undefined
        };
      });

      setGamePlayLogs(prev => [
        ...prev,
        `[TURN VALIDATION] ${message}`
      ]);

      if (isWinner) {
        completeMatchWithOutcome(false);
      }

    } else {
      if (penaltyActive) {
        drawCardForPlayer(botId, whotGameState.penaltyCount);
        const message = `${opponentProfile?.username || 'Opponent'} drawing pick-penalties (${whotGameState.penaltyCount} cards) & passed.`;
        
        setWhotGameState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            activePlayerId: userProfile.uid,
            penaltyCount: 0,
            lastActionMessage: message
          };
        });

        setGamePlayLogs(prev => [
          ...prev,
          `[PENALTY APPLIED] Opponent took ${whotGameState.penaltyCount} penalty cards.`
        ]);
      } else {
        drawCardForPlayer(botId, 1);
        const message = `${opponentProfile?.username || 'Opponent'} had no match. Drew 1 card & passed.`;

        setWhotGameState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            activePlayerId: userProfile.uid,
            lastActionMessage: message
          };
        });

        setGamePlayLogs(prev => [
          ...prev,
          `[ACTION DRAW] Opponent drew 1 card.`
        ]);
      }
    }
  };

  const completeMatchWithOutcome = (winnerIsMe: boolean) => {
    if (!activeChallenge) return;
    const multiplier = activeChallenge.rewardMultiplier !== undefined ? activeChallenge.rewardMultiplier : 1.0;
    const totalPayout = Math.floor(activeChallenge.entryFee * (1 + multiplier));
    
    setGamePlayStatus('completed');
    setOnlineBots(prev => prev.map(b => b.uid === activeChallenge.senderId ? { ...b, status: 'online' } : b));

    const rakeRate = 0.1;
    let rakeAmount = 0;
    let finalUserPayout = 0;

    if (winnerIsMe) {
      rakeAmount = totalPayout > 0 ? Math.floor(totalPayout * rakeRate) : 0;
      finalUserPayout = totalPayout - rakeAmount;

      setUserProfile(prev => ({ 
        ...prev, 
        coins: prev.coins + finalUserPayout,
        wins: prev.wins + 1
      }));
      
      if (finalUserPayout > 0) {
        const payoutTx: WalletTransaction = {
          id: `payout_${Date.now()}`,
          userId: userProfile.uid,
          type: 'win_payout',
          amount: finalUserPayout,
          description: `Winner payout credited (90%): ${activeChallenge.gameType} vs ${activeChallenge.senderName}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'completed'
        };
        setTransactions(prev => [payoutTx, ...prev]);

        // Save transaction to Firestore
        setDoc(doc(db, 'transactions', payoutTx.id), payoutTx).catch(console.error);

        // Record developer rake transaction
        if (rakeAmount > 0) {
          const devTx: WalletTransaction = {
            id: `rake_${Date.now()}`,
            userId: 'developer',
            type: 'credit',
            amount: rakeAmount,
            description: `Rake Commission (10%) from ${activeChallenge.gameType} Match: ${userProfile.username} vs ${activeChallenge.senderName}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'completed'
          };
          setDoc(doc(db, 'transactions', devTx.id), devTx).catch(console.error);
          setDoc(doc(db, 'developer_stats', 'revenue'), { totalRake: increment(rakeAmount) }, { merge: true }).catch(console.error);
        }
      }

      if (activeChallenge.entryFee > 0) {
        setGamePlayLogs(prev => [
          ...prev,
          `--- VICTORY SECURED ---`,
          `Fabulous! Lead Developer cleared their hand! Match payout verified.`,
          `Rake fee deducted: ${rakeAmount} Coins (10% platform fee).`,
          `Atomic Payout Dispatched: Credited ${finalUserPayout} virtual coins into wallet.`
        ]);
      } else {
        setGamePlayLogs(prev => [
          ...prev,
          `--- VICTORY SECURED ---`,
          `Fabulous! Lead Developer cleared their hand! Free practice match completed.`
        ]);
      }
    } else {
      setUserProfile(prev => ({ 
        ...prev, 
        losses: prev.losses + 1
      }));

      // If playing with a bot, the user loses their stake to the house
      const houseEarning = activeChallenge.entryFee;
      if (houseEarning > 0 && activeChallenge.opponentType === 'bot') {
        const devTx: WalletTransaction = {
          id: `house_${Date.now()}`,
          userId: 'developer',
          type: 'credit',
          amount: houseEarning,
          description: `House Win vs ${userProfile.username} in ${activeChallenge.gameType} Bot Match`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'completed'
        };
        setDoc(doc(db, 'transactions', devTx.id), devTx).catch(console.error);
        setDoc(doc(db, 'developer_stats', 'revenue'), { totalRake: increment(houseEarning) }, { merge: true }).catch(console.error);
      }

      if (activeChallenge.entryFee > 0) {
        setGamePlayLogs(prev => [
          ...prev,
          `--- MATCH DEFEAT ---`,
          `Opponent cleared their hand first. Staked coins claimed by opponent escrow.`
        ]);
      } else {
        setGamePlayLogs(prev => [
          ...prev,
          `--- MATCH DEFEAT ---`,
          `Opponent cleared their hand first. Free practice match completed.`
        ]);
      }
    }

    setTimeout(() => {
      setGamePlayStatus('none');
      setActiveChallenge(null);
      setWhotGameState(null);
      setUserProfile(prev => ({ ...prev, status: 'online' }));
    }, 7000);
  };

  const executeGameplaySimulation = (challenge: MatchChallenge) => {
    setGamePlayStatus('playing');
    let currentRound = 1;

    const gameDetails: Record<string, string[][]> = {
      'Ludo': [
        ['Virtual random integer seed successfully calculated by secure transaction.', 'Lead Developer rolls a 6! Escaped home circle position.'],
        ['Move vectors computed on board segment coordinate matrix.', 'Bot tokens captured! Bot returns safely back to home zone.'],
        ['Token reached final star quadrant safe zones.', 'Roll multiplier bonus is locked. Player turn index rotations valid.']
      ],
      'Chess': [
        ['Dual-clocks synchronized within latency constraints.', 'Algebraic notations tracked. e4 e5 played by opponents.'],
        ['Castling action checked: King side security passes.', 'Opponent castle indicator updated on FEN matrix string.'],
        ['Attacker King position validated under check status checking.', 'No valid escaping check moves discovered. Game over detected.']
      ]
    };

    const runRound = () => {
      if (currentRound <= 3) {
        const roundSteps = gameDetails[challenge.gameType]?.[currentRound - 1] || [];
        setGamePlayLogs(prev => [
          ...prev,
          `--- Round ${currentRound} Move Logic Check ---`,
          ...roundSteps
        ]);
        currentRound++;
        setTimeout(runRound, 2000);
      } else {
        const developerVictory = Math.random() < 0.55;
        completeMatchWithOutcome(developerVictory);
      }
    };

    setTimeout(runRound, 1500);
  };

  // Helper helper: styling mapping for aesthetic Whot cards
  const renderWhotCard = (card: WhotCard, isButton: boolean, onClick?: () => void, isHand = false) => {
    const isPlayable = whotGameState && whotGameState.activePlayerId === userProfile.uid && (
      whotGameState.penaltyCount > 0 
        ? card.value === whotGameState.discardPile[0].value 
        : (card.suit === 'Whot' || card.suit === whotGameState.activeSuit || card.value === whotGameState.discardPile[0].value)
    );

    let suitStyle = 'text-gray-950 border-gray-400 bg-white shadow-[0_4px_10px_rgba(0,0,0,0.15)]';
    let symbol = '●';
    let symbolColor = 'text-red-600';

    if (card.suit === 'Circles') {
      suitStyle = 'border-red-300 bg-white text-red-600';
      symbol = '●';
      symbolColor = 'text-red-600';
    } else if (card.suit === 'Triangles') {
      suitStyle = 'border-emerald-300 bg-white text-emerald-700';
      symbol = '▲';
      symbolColor = 'text-emerald-700';
    } else if (card.suit === 'Crosses') {
      suitStyle = 'border-blue-300 bg-white text-blue-700';
      symbol = '✚';
      symbolColor = 'text-blue-700';
    } else if (card.suit === 'Stars') {
      suitStyle = 'border-purple-300 bg-white text-purple-700';
      symbol = '★';
      symbolColor = 'text-purple-700';
    } else if (card.suit === 'Squares') {
      suitStyle = 'border-orange-300 bg-white text-orange-600';
      symbol = '■';
      symbolColor = 'text-orange-600';
    } else if (card.suit === 'Whot') {
      suitStyle = 'border-rose-400 bg-rose-50 text-rose-700 ring-2 ring-rose-500';
      symbol = '★';
      symbolColor = 'text-rose-600';
    }

    const cardContent = (
      <div className="h-full flex flex-col justify-between p-1 sm:p-2.5 relative">
        {/* Top Corner with Big Numbers */}
        <div className="flex justify-between items-start leading-none">
          <span className="font-mono text-xs xs:text-sm sm:text-lg md:text-xl font-black tracking-tighter">{card.value}</span>
          <span className={`text-[8px] xs:text-[10px] sm:text-xs uppercase font-extrabold ${symbolColor}`}>{symbol}</span>
        </div>
        
        {/* Large Central Icon/Shape */}
        <div className="flex flex-col items-center justify-center flex-1 my-0.5 sm:my-1">
          <span className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black leading-none drop-shadow-sm ${symbolColor}`}>{symbol}</span>
          <span className="text-[7px] xs:text-[8px] sm:text-[10px] font-mono tracking-wider font-extrabold opacity-75 mt-0.5 uppercase text-gray-700">
            {card.suit === 'Whot' ? 'WHOT!' : card.suit}
          </span>
        </div>
        
        {/* Bottom Corner with Big Numbers */}
        <div className="flex justify-between items-end leading-none">
          <span className="text-[7px] xs:text-[8px] sm:text-[10px] opacity-75 font-mono text-gray-500 font-bold">#{card.id}</span>
          {card.suit === 'Stars' && (
            <span className="text-[6px] xs:text-[7px] sm:text-[9px] bg-amber-400 text-amber-950 px-1 rounded font-bold uppercase font-mono tracking-wider">
              2x
            </span>
          )}
          <span className="font-mono text-xs xs:text-sm sm:text-lg md:text-xl font-black tracking-tighter">{card.value}</span>
        </div>
      </div>
    );

    const sizeClass = (isButton || isHand)
      ? 'w-[70px] h-[102px] xs:w-[82px] xs:h-[120px] sm:w-[100px] sm:h-[148px] md:w-[110px] md:h-[160px]'
      : 'w-[64px] h-[94px] xs:w-[74px] xs:h-[108px] sm:w-[88px] sm:h-[130px] md:w-[98px] md:h-[144px]';

    if (isButton) {
      return (
        <motion.button
          key={card.id}
          layoutId={card.id}
          layout
          initial={{ scale: 0.6, y: -250, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: -30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          disabled={!isPlayable}
          title={isPlayable ? "Tap card to play" : "Can't play this card right now"}
          onClick={onClick}
          className={`${sizeClass} rounded-2xl border-2 text-left cursor-pointer transition-all relative select-none shrink-0 ${suitStyle} ${is3DMode ? 'whot-card-3d' : ''} ${
            isPlayable 
              ? 'ring-[4px] ring-emerald-400 shadow-[0_10px_20px_rgba(0,0,0,0.3)] scale-102 hover:-translate-y-2.5' 
              : 'opacity-50 grayscale-[15%] cursor-not-allowed scale-95'
          }`}
        >
          {cardContent}
        </motion.button>
      );
    }

    return (
      <motion.div
        key={card.id}
        layoutId={card.id}
        layout
        className={`${sizeClass} rounded-2xl border-2 text-left shadow-md flex flex-col relative shrink-0 ${suitStyle}`}
      >
        {cardContent}
      </motion.div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="sandbox-root-v2">
      
      {/* Profile Sidebar */}
      {gamePlayStatus === 'none' && (
        <div className="lg:col-span-1 space-y-4">
        <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center text-center space-y-4 relative overflow-hidden backdrop-blur-xl group hover:border-purple-500/30 transition-all">
          <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-purple-500/15 via-purple-500/5 to-transparent pointer-events-none" />

          <div className="relative">
            <img 
              src={userProfile.avatar} 
              alt={userProfile.username} 
              className="w-20 h-20 rounded-full ring-2 ring-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.35)] object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#070709] shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-white tracking-tight">{userProfile.username}</h3>
            <span className="text-[9px] font-mono font-bold text-purple-300 px-3 py-0.5 bg-purple-500/15 border border-purple-500/30 rounded-full uppercase tracking-wider mt-1 inline-block">
              ● {userProfile.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full border-y border-white/10 py-3.5 text-xs font-mono">
            <div className="bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-xl">
              <span className="block font-bold text-emerald-400 text-sm">{userProfile.wins}</span>
              <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Wins</span>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 py-2 rounded-xl">
              <span className="block font-bold text-rose-400 text-sm">{userProfile.losses}</span>
              <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Loss</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 py-2 rounded-xl">
              <span className="block font-bold text-amber-400 text-sm">{userProfile.draws}</span>
              <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Draws</span>
            </div>
          </div>

          <div className="w-full flex items-center justify-between bg-black/40 px-4 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <Wallet className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="font-bold font-display uppercase tracking-wider text-[11px] text-purple-300">Wallet Coins</span>
            </div>
            <span className="font-mono text-base font-extrabold text-white tracking-tight">{userProfile.coins.toLocaleString()}</span>
          </div>

          <button
            onClick={handleFountainCredit}
            className="w-full text-xs font-display py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 rounded-xl transition-all cursor-pointer font-black select-none shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <span>Claim +1,000 Free Coins</span>
          </button>
        </div>

        {/* Challenge match info widget */}
        {gamePlayStatus !== 'none' && (
          <div className="glass-card p-5 rounded-3xl text-white border border-purple-500/30 shadow-2xl space-y-3 font-mono text-xs backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-purple-400 animate-pulse" />
              <h4 className="text-xs font-bold text-purple-300 font-display uppercase tracking-wider">Escrow Match State</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-neutral-400">
                <span>Opponent:</span>
                <span className="font-bold text-white">
                  {activeChallenge?.senderId === userProfile.uid ? selectedBot?.username : activeChallenge?.senderName}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Staking Pool:</span>
                <span className="font-bold text-emerald-400">
                  {Math.floor((activeChallenge?.entryFee || 300) * (1 + (activeChallenge?.rewardMultiplier !== undefined ? activeChallenge.rewardMultiplier : 1.0)))} Units
                </span>
              </div>
              <div className="flex justify-between text-neutral-400 items-center">
                <span>State Node:</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[10px] text-purple-300 font-bold border border-purple-500/30 uppercase tracking-wider animate-pulse">
                  {(gamePlayStatus as string).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Main Sandbox Board Area */}
      <div className={`${gamePlayStatus !== 'none' ? 'lg:col-span-4' : 'lg:col-span-3'} flex flex-col space-y-4`}>
        
        {/* If no match is running, show lobby panels */}
        {gamePlayStatus === 'none' ? (
          <div className="glass-card rounded-3xl border border-white/10 shadow-2xl flex flex-col h-[530px] overflow-hidden backdrop-blur-xl">
            <div className="flex justify-between items-center px-4 py-3.5 bg-neutral-950/80 border-b border-white/10 gap-2 overflow-x-auto">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 rounded-xl text-xs font-display transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider font-bold ${
                    activeTab === 'chat' ? 'bg-purple-350 text-neutral-950 shadow-[0_0_15px_rgba(235,211,255,0.25)]' : 'text-neutral-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Lobby Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={`px-4 py-2 rounded-xl text-xs font-display transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider font-bold ${
                    activeTab === 'wallet' ? 'bg-purple-350 text-neutral-950 shadow-[0_0_15px_rgba(235,211,255,0.25)]' : 'text-neutral-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Wallet Ledger</span>
                </button>
                <button
                  onClick={() => setActiveTab('presence')}
                  className={`px-4 py-2 rounded-xl text-xs font-display transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider font-bold ${
                    activeTab === 'presence' ? 'bg-purple-350 text-neutral-950 shadow-[0_0_15px_rgba(235,211,255,0.25)]' : 'text-neutral-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Challengers</span>
                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-mono rounded-full border border-purple-500/30">
                    {onlineBots.filter(b => b.status === 'online').length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2 rounded-xl text-xs font-display transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider font-bold ${
                    activeTab === 'settings' ? 'bg-purple-350 text-neutral-950 shadow-[0_0_15px_rgba(235,211,255,0.25)]' : 'text-neutral-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>👑 Admin Settings</span>
                </button>
                <button
                  onClick={() => setActiveTab('active-sessions')}
                  className={`px-4 py-2 rounded-xl text-xs font-display transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider font-bold ${
                    activeTab === 'active-sessions' ? 'bg-purple-350 text-neutral-950 shadow-[0_0_15px_rgba(235,211,255,0.25)]' : 'text-neutral-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Active Duels</span>
                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-mono rounded-full border border-purple-500/30">
                    {activeSessions.length}
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="font-bold">LOBBY ENCRYPTED</span>
              </div>
            </div>
            {/* Lobby messages sub-tab */}
            {activeTab === 'chat' && renderChatPanelContent()}

            {/* Wallet sub-tab */}
            {activeTab === 'wallet' && (
              <div className="flex-1 p-5 overflow-y-auto bg-black/20">
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="glass-card p-4 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-white block">{tx.description}</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                          <span>TxID: {tx.id}</span>
                          <span>•</span>
                          <span>{tx.timestamp}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                        {tx.type === 'credit' || tx.type === 'win_payout' ? (
                          <div className="text-emerald-300 flex items-center bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                            <ArrowDownLeft className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                            +{tx.amount.toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-purple-300 flex items-center bg-purple-500/15 border border-purple-500/30 px-3 py-1.5 rounded-xl">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-1 text-purple-400" />
                            -{tx.amount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Online presence challengers list */}
            {activeTab === 'presence' && (
              <div className="flex-1 p-4 overflow-y-auto bg-neutral-920/40">
                
                {/* PVP Share Invitation Link Generator */}
                <div className="bg-[#0D0D12] p-5 rounded-2xl border border-purple-500/20 shadow-lg space-y-4.5 mb-6 relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-[20%] -translate-y-[20%] h-32 w-32 bg-purple-500/10 rounded-full blur-2xl" />
                  
                  <div className="flex items-start gap-3 relative">
                    <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.15)] mt-0.5">
                      <Share2 className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-100 uppercase tracking-wider font-sans">⚔️ Multiplayer Duel: Play with Friends</h4>
                      <p className="text-[11px] text-neutral-450 mt-1 max-w-lg leading-relaxed">
                        Generate a custom staking invitation link and send it to your friend! When they open it on their browser, the smart escrow contract validates the stakes and starts the live match immediately.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
                    {/* Select Game base */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-450 font-mono font-bold uppercase tracking-wider">Configure Arena Option</label>
                      <div className="grid grid-cols-5 gap-1 font-sans">
                        {(['Stickman', 'Chess', 'Ludo', 'Whot', 'Draft', 'TicTacToe'] as const).map((game) => (
                          <button
                            key={game}
                            onClick={() => setFriendGame(game)}
                            className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                              friendGame === game
                                ? 'border-purple-550 bg-purple-500/10 text-purple-300 font-bold'
                                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                            }`}
                          >
                            {game}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Choose Stake */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-neutral-450 font-mono font-bold uppercase tracking-wider">
                        <span>Staking Amount</span>
                        <span className="text-purple-300 font-bold font-sans">{friendStake} Coins</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="1000"
                        step="100"
                        value={friendStake}
                        onChange={(e) => setFriendStake(Number(e.target.value))}
                        className="w-full accent-purple-500 bg-neutral-900 rounded-lg cursor-pointer h-1.5 border border-neutral-800"
                      />
                      <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                        <span>100 coins</span>
                        <span>1000 coins</span>
                      </div>
                    </div>
                  </div>

                  {/* Generated Link Panel and Button */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1 font-sans">
                    <div className="flex-1 flex gap-2 items-center bg-neutral-950 px-3 py-2 border border-neutral-800 text-neutral-350 select-all font-mono text-[10px] truncate max-w-full">
                      <Link className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">
                        {`${window.location.origin}${window.location.pathname}?friendInvite=true&game=${friendGame}&stake=${friendStake}&sender=${encodeURIComponent(userProfile.username)}`}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const generatedLink = `${window.location.origin}${window.location.pathname}?friendInvite=true&game=${friendGame}&stake=${friendStake}&sender=${encodeURIComponent(userProfile.username)}`;
                        navigator.clipboard.writeText(generatedLink);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0 ${
                        copiedLink 
                          ? 'bg-emerald-500 text-neutral-950 font-black' 
                          : 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold shadow-md shadow-purple-950/40'
                      }`}
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Generate & Copy Challenge Link
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="border-t border-neutral-800/60 my-5 pt-1" />
                
                {/* Heading for original bots */}
                <div className="mb-4 flex justify-between items-center px-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Offline/Online AI Challengers</span>
                  <span className="text-[10px] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md font-mono text-neutral-500">Live Simulation</span>
                </div>

                <div className="space-y-3">
                  {onlineBots.map((bot) => (
                    <div key={bot.uid} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 shadow-sm flex justify-between items-center group hover:border-neutral-700 transition-all">
                      <div className="flex items-center gap-3">
                        <img 
                          src={bot.avatar} 
                          alt={bot.username} 
                          className="w-10 h-10 rounded-full object-cover border border-neutral-800"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-neutral-200">{bot.username}</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-neutral-900 animate-pulse" />
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-450 mt-0.5 font-mono">
                            <span className="flex items-center gap-0.5">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              W:{bot.wins} L:{bot.losses}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => openChallengePanel(bot)}
                        className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 hover:scale-105 text-neutral-950 text-xs font-sans font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-sm"
                      >
                        Challenge Match
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Settings sub-tab */}
            {activeTab === 'settings' && (
              <div className="flex-1 p-5 overflow-y-auto bg-neutral-920/40 text-neutral-200 space-y-6">
                <div className="border-b border-neutral-800 pb-3">
                  <h4 className="font-display font-black text-sm text-white uppercase tracking-wider">👑 Whot Game Admin Configuration</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">Customize active card value rule chains, pickup penalties, and wildcard mechanics.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 14 Force Draw setting */}
                  <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-3.5 flex flex-col justify-between">
                    <div>
                      <span className="block text-xs font-bold text-neutral-100">General Market Rule (Card 14)</span>
                      <p className="text-[10px] text-neutral-450 mt-1 leading-relaxed">
                        When enabled, playing card 14 forces the opponent to draw 1 card from the pile immediately.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer self-start select-none">
                      <input 
                        type="checkbox" 
                        checked={whotSettings.forcePickOn14} 
                        onChange={(e) => setWhotSettings(prev => ({ ...prev, forcePickOn14: e.target.checked }))} 
                        className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold">Force Opponent to Pick</span>
                    </label>
                  </div>

                  {/* Card 2 Defend setting */}
                  <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-3.5 flex flex-col justify-between">
                    <div>
                      <span className="block text-xs font-bold text-neutral-100">Pick Two Defense (Card 2)</span>
                      <p className="text-[10px] text-neutral-450 mt-1 leading-relaxed">
                        When enabled, the opponent can defend against a Pick Two (2) by playing another card 2, avoiding drawing and passing turn back.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer self-start select-none">
                      <input 
                        type="checkbox" 
                        checked={whotSettings.defendOn2} 
                        onChange={(e) => setWhotSettings(prev => ({ ...prev, defendOn2: e.target.checked }))} 
                        className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold">Enable Defense with Card 2</span>
                    </label>
                  </div>

                  {/* Hold On & Suspension extra turn setting */}
                  <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-3.5 flex flex-col justify-between">
                    <div>
                      <span className="block text-xs font-bold text-neutral-100">Extra Turns Rule (Card 1 & 8)</span>
                      <p className="text-[10px] text-neutral-450 mt-1 leading-relaxed">
                        When enabled, playing Hold On (1) or Suspension (8) grants the active player another turn immediately.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer self-start select-none">
                      <input 
                        type="checkbox" 
                        checked={whotSettings.playAgainOn1or8} 
                        onChange={(e) => setWhotSettings(prev => ({ ...prev, playAgainOn1or8: e.target.checked }))} 
                        className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold">Grant Play Again on 1 & 8</span>
                    </label>
                  </div>

                  {/* Whot 20 wildcard settings */}
                  <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-3.5 flex flex-col justify-between">
                    <div>
                      <span className="block text-xs font-bold text-neutral-100">Whot Wildcards (Card 20)</span>
                      <p className="text-[10px] text-neutral-450 mt-1 leading-relaxed">
                        Include Card 20 wildcards in the Whot deck. Disabling this removes wildcard suit claims from the game.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer self-start select-none">
                      <input 
                        type="checkbox" 
                        checked={whotSettings.optional20} 
                        onChange={(e) => setWhotSettings(prev => ({ ...prev, optional20: e.target.checked }))} 
                        className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold">Include Card 20 in Deck</span>
                    </label>
                  </div>
                </div>

                <div className="border-b border-neutral-800 pb-3 pt-4">
                  <h4 className="font-display font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    👥 User Directory & Administration
                  </h4>
                  <p className="text-[10px] text-neutral-450 mt-0.5 font-mono">Manage registered users, deactivate login sessions, or purge profiles from the database.</p>
                </div>

                <div className="space-y-3">
                  {allProfiles.filter(p => p.uid !== userProfile.uid).length === 0 ? (
                    <div className="text-center py-6 bg-neutral-900/40 rounded-xl border border-neutral-800/80">
                      <p className="text-xs text-neutral-450 font-mono">No other registered users found in directory.</p>
                    </div>
                  ) : (
                    allProfiles
                      .filter(p => p.uid !== userProfile.uid)
                      .map((profile) => (
                        <div key={profile.uid} className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                          <div className="flex items-center gap-3">
                            <img 
                              src={profile.avatar} 
                              alt={profile.username} 
                              className="w-10 h-10 rounded-full object-cover border border-neutral-800"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-neutral-200">{profile.username}</span>
                                {profile.deactivated ? (
                                  <span className="text-[8px] bg-red-950/80 text-red-400 border border-red-800/40 px-1.5 py-0.5 rounded font-mono font-bold uppercase">DEACTIVATED</span>
                                ) : (
                                  <span className={`w-2.5 h-2.5 rounded-full border border-neutral-900 ${profile.status === 'online' ? 'bg-emerald-500 animate-pulse' : profile.status === 'in-game' ? 'bg-purple-500 animate-ping' : 'bg-neutral-600'}`} />
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[10px] text-neutral-450 mt-0.5 font-mono">
                                <span>{profile.email}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-0.5">Coins: {profile.coins}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>W: {profile.wins} / L: {profile.losses}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              onClick={() => {
                                if (handleToggleDeactivate) {
                                  handleToggleDeactivate(profile.uid, !profile.deactivated);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                                profile.deactivated
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-neutral-950'
                                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-750'
                              }`}
                            >
                              {profile.deactivated ? 'Activate' : 'Deactivate'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`⚠️ Are you sure you want to permanently delete the profile for "${profile.username}"? This action is irreversible.`)) {
                                  if (handleDeleteProfile) {
                                    handleDeleteProfile(profile.uid);
                                  }
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer select-none"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* Active Sessions sub-tab */}
            {activeTab === 'active-sessions' && (
              <div className="flex-1 p-5 overflow-y-auto bg-neutral-920/40 text-neutral-200 space-y-6">
                <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-display font-black text-sm text-white uppercase tracking-wider">⚔️ Active P2P Game Lobbies</h4>
                    <p className="text-[10px] text-neutral-450 mt-0.5 font-mono">Join waiting lobbies or resume your current active duels.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Your Active Sessions */}
                  <div>
                    <span className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-widest font-display">Your Matches</span>
                    {activeSessions.filter(s => s.hostId === userProfile.uid || s.opponentId === userProfile.uid).length === 0 ? (
                      <p className="text-xs text-neutral-500 font-mono italic p-3 bg-neutral-900/40 rounded-xl border border-neutral-800">You have no active matches.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {activeSessions.filter(s => s.hostId === userProfile.uid || s.opponentId === userProfile.uid).map(s => {
                          const isHost = s.hostId === userProfile.uid;
                          const opponentName = isHost ? (s.opponentName || 'Waiting...') : s.hostName;
                          return (
                            <div key={s.sessionId} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md font-sans">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-[9px] font-mono text-purple-300 font-bold uppercase">{s.gameType}</span>
                                  <span className="text-xs font-bold text-white">vs {opponentName}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-neutral-450 mt-1 font-mono">
                                  <span>Stakes: {s.entryFee} Coins</span>
                                  <span>•</span>
                                  <span className="capitalize">Status: <strong className={s.status === 'playing' ? 'text-emerald-400 font-bold' : s.status === 'paused' ? 'text-amber-400 font-bold' : 'text-purple-400 font-bold'}>{s.status}</strong></span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const inviteChallenge: MatchChallenge = {
                                    id: s.sessionId,
                                    senderId: s.hostId,
                                    senderName: s.hostName,
                                    receiverId: s.opponentId || 'pending',
                                    gameType: s.gameType,
                                    entryFee: s.entryFee,
                                    status: s.status === 'waiting' ? 'pending' : 'accepted',
                                    timestamp: new Date(s.createdAt).toLocaleTimeString(),
                                    opponentType: 'player'
                                  };
                                  setActiveChallenge(inviteChallenge);
                                  setGamePlayStatus('playing');
                                  _setWhotGameState(s.gameState);
                                  whotDeckRef.current = s.deck || [];
                                }}
                                className="px-3.5 py-1.5 bg-purple-500 hover:bg-purple-600 text-neutral-950 hover:text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0"
                              >
                                {s.status === 'waiting' ? 'Rejoin Lobby' : 'Resume Play'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Open Game Lobbies */}
                  <div className="pt-4 border-t border-neutral-800">
                    <span className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-widest font-display">Open Lobbies</span>
                    {activeSessions.filter(s => s.status === 'waiting' && s.hostId !== userProfile.uid).length === 0 ? (
                      <p className="text-xs text-neutral-500 font-mono italic p-3 bg-neutral-900/40 rounded-xl border border-neutral-800">No open lobbies available right now.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {activeSessions.filter(s => s.status === 'waiting' && s.hostId !== userProfile.uid).map(s => (
                          <div key={s.sessionId} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md font-sans">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-[9px] font-mono text-purple-300 font-bold uppercase">{s.gameType}</span>
                                <span className="text-xs font-bold text-white">Host: {s.hostName}</span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-neutral-450 mt-1 font-mono">
                                <span>Stakes: {s.entryFee} Coins</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (userProfile.coins < s.entryFee) {
                                  alert("You do not have enough coins to join this lobby.");
                                  return;
                                }
                                
                                // Join session
                                const updatedGameState = {
                                  ...(s.gameState || {}),
                                  playerIds: [s.hostId, userProfile.uid],
                                  playerHands: {
                                    ...(s.gameState?.playerHands || {}),
                                    [s.hostId]: s.gameState?.playerHands?.[s.hostId] || [],
                                    [userProfile.uid]: s.gameState?.playerHands?.[''] || []
                                  },
                                  lastActionMessage: `${userProfile.username} has joined! Match starts now.`
                                };

                                // Deduct entry fee
                                if (s.entryFee > 0) {
                                  setUserProfile(prev => ({
                                    ...prev,
                                    coins: Math.max(0, prev.coins - s.entryFee),
                                    status: 'in-game'
                                  }));

                                  const stakeTx: WalletTransaction = {
                                    id: `escrow_${Date.now()}`,
                                    type: 'stake_lock',
                                    amount: s.entryFee,
                                    description: `Escrow Multiplayer Challenge Lock: ${s.gameType}`,
                                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  };
                                  setTransactions(prev => [stakeTx, ...prev]);
                                }

                                const inviteChallenge: MatchChallenge = {
                                  id: s.sessionId,
                                  senderId: s.hostId,
                                  senderName: s.hostName,
                                  receiverId: userProfile.uid,
                                  gameType: s.gameType,
                                  entryFee: s.entryFee,
                                  status: 'accepted',
                                  timestamp: new Date().toLocaleTimeString(),
                                  opponentType: 'player'
                                };

                                setActiveChallenge(inviteChallenge);
                                setGamePlayStatus('playing');
                                _setWhotGameState(updatedGameState);
                                whotDeckRef.current = s.deck || [];

                                updateDoc(doc(db, 'gameSessions', s.sessionId), {
                                  opponentId: userProfile.uid,
                                  opponentName: userProfile.username,
                                  status: 'playing',
                                  gameState: updatedGameState,
                                  updatedAt: Date.now()
                                }).catch(console.error);

                                setGamePlayLogs([
                                  `[ESCROW LOCK] Atomic escrow write success. STAKE: ${s.entryFee} coins escrowed.`,
                                  `[MULTIPLAYER] Joined lobby successfully!`
                                ]);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 hover:text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0"
                            >
                              Join & Play
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeChallenge && activeChallenge.status === 'pending' && activeChallenge.senderId === userProfile.uid ? (
          /* Dedicated Host Lobby Matchmaking Waiting Room */
          <div className="bg-neutral-950/95 border-2 border-purple-500/40 rounded-3xl p-8 sm:p-12 max-w-2xl mx-auto shadow-[0_0_50px_rgba(168,85,247,0.25)] backdrop-blur-2xl text-center space-y-6 my-6 font-sans">
            {/* Animated Radar Swords Icon */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-purple-500/20 border-2 border-purple-500/40 animate-ping opacity-75" />
              <div className="w-20 h-20 rounded-full bg-purple-500/20 border-2 border-purple-500/60 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)] z-10">
                <Swords className="w-10 h-10 text-purple-300 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-mono font-black uppercase tracking-widest">
                ⌛ LOBBY MATCHMAKING WAITING ROOM
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
                Waiting for {opponentProfile?.username || activeChallenge.senderName || 'Opponent'} to Accept Challenge
              </h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                Your entry stake of <strong className="text-emerald-400 font-mono font-bold">{activeChallenge.entryFee} Coins</strong> has been locked in atomic escrow. A live notification was dispatched to <strong>{opponentProfile?.username || activeChallenge.senderName || 'your opponent'}</strong>.
              </p>
            </div>

            {/* Live Status Card */}
            <div className="bg-black/60 border border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-left">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-amber-400 animate-ping shrink-0" />
                <div>
                  <span className="block text-[10px] text-neutral-500 uppercase font-bold">Match Status</span>
                  <span className="text-white font-bold">Awaiting Opponent Acceptance...</span>
                </div>
              </div>
              <div className="text-right sm:text-right w-full sm:w-auto">
                <span className="block text-[10px] text-neutral-500 uppercase font-bold">Session ID</span>
                <code className="text-cyan-300 font-bold text-xs bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">{activeChallenge.id}</code>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const inviteLink = `${window.location.origin}${window.location.pathname}?friendInvite=true&game=${activeChallenge.gameType}&stake=${activeChallenge.entryFee}&sender=${encodeURIComponent(userProfile.username)}&sessionId=${activeChallenge.id}`;
                  try {
                    navigator.clipboard.writeText(inviteLink);
                  } catch (e) {
                    console.warn("Clipboard error:", e);
                  }
                  alert(`📋 Invitation Link Copied!\n\n${inviteLink}\n\nShare this link with your challenger to start instantly!`);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-purple-500 hover:bg-purple-400 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-500/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                🔗 Copy Invite Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveChallenge(prev => prev ? { ...prev, status: 'accepted', opponentType: 'bot' } : null);
                  setGamePlayLogs(prev => [...prev, `[SESSION MODE] Converted match to single-player Bot mode.`]);
                }}
                className="w-full sm:w-auto px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                🤖 Play vs Bot
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserProfile(prev => ({ ...prev, coins: prev.coins + activeChallenge.entryFee, status: 'online' }));
                  setActiveChallenge(null);
                  setGamePlayStatus('none');
                }}
                className="w-full sm:w-auto px-4 py-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                Cancel Match
              </button>
            </div>
          </div>
        ) : (
          /* Render Active Interactive Game matches */
          <div className={`grid grid-cols-1 ${activeChallenge?.opponentType === 'bot' ? 'xl:grid-cols-1' : 'xl:grid-cols-4'} gap-6 items-start`}>
            <div className={`${activeChallenge?.opponentType === 'bot' ? 'xl:col-span-1' : 'xl:col-span-3'} flex flex-col space-y-4`}>
              {/* Real-time escrow safe timer safeguard banner */}
              {/* Mobile: compact strip — tap shield to expand. Desktop: always full. */}
              <div className="bg-neutral-950/95 border-2 border-purple-500/30 rounded-2xl shadow-xl overflow-hidden">

                {/* Always-visible compact row (mobile-first) */}
                <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
                  {/* Shield icon — tappable on mobile to reveal details */}
                  <button
                    type="button"
                    onClick={() => setShowEscrowDetails(v => !v)}
                    className={`p-2 rounded-xl shrink-0 transition-all cursor-pointer ${
                      timeLeft <= 60 ? 'bg-rose-500/20 text-rose-300 animate-pulse' : 'bg-purple-500/20 text-purple-300'
                    }`}
                    title="Tap to view escrow details"
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </button>

                  {/* Label — hidden on mobile, shown on sm+ */}
                  <span className="hidden sm:block text-xs font-bold text-white uppercase tracking-wider font-display whitespace-nowrap">
                    🛡️ Escrow Safeguard Active
                  </span>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Timer + Reconcile — always visible */}
                  <div className="flex items-center gap-2">
                    <div className="text-right shrink-0">
                      <span className="block text-[9px] text-neutral-450 font-mono font-bold uppercase">Time Left:</span>
                      <span className={`font-mono text-sm font-black px-2 py-0.5 rounded-lg ${
                        timeLeft <= 60
                          ? 'text-rose-400 bg-rose-950/80 border border-rose-500/30'
                          : 'text-purple-300 bg-purple-950/50 border border-purple-500/20'
                      }`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleMatchTimerExpiry}
                      className="px-3 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-black font-sans shadow-md border border-rose-500/20 cursor-pointer active:scale-95 transition-all select-none uppercase tracking-wider whitespace-nowrap"
                    >
                      ⚖️ Reconcile
                    </button>
                  </div>
                </div>

                {/* Expandable detail row — shown when shield tapped on mobile, always shown on sm+ */}
                {(showEscrowDetails) && (
                  <div className="px-4 pb-4 text-[11px] text-neutral-400 font-sans border-t border-purple-500/15 pt-3 flex items-start gap-2">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono px-1.5 py-0.5 rounded-md font-bold uppercase shrink-0 mt-0.5">SECURE</span>
                    <p>
                      Match stake of <strong className="text-white font-mono font-bold text-xs">{activeChallenge?.entryFee} Coins</strong> is protected.
                      In case of timeout or disconnects, tap <strong className="text-white">Reconcile</strong> to automatically resolve stakes safely based on current game points.
                    </p>
                  </div>
                )}
              </div>

              {/* Host Waiting Banner Overlay when waiting for guest to join */}
              {activeChallenge && activeChallenge.status === 'pending' && activeChallenge.senderId === userProfile.uid && (
                <div className="bg-gradient-to-r from-purple-950/90 via-neutral-900 to-indigo-950/90 border-2 border-purple-500/40 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30 shrink-0">
                      <Swords className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider">
                        ⌛ Live Duel Created — Waiting for Challenger to Join
                      </span>
                      <span className="text-xs font-bold text-white">
                        Session ID: <code className="font-mono text-cyan-300 px-1.5 py-0.5 bg-black/50 rounded">{activeChallenge.id}</code> | Stakes: <strong className="text-emerald-400 font-mono">{activeChallenge.entryFee} Coins</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const inviteLink = `${window.location.origin}${window.location.pathname}?friendInvite=true&game=${activeChallenge.gameType}&stake=${activeChallenge.entryFee}&sender=${encodeURIComponent(userProfile.username)}&sessionId=${activeChallenge.id}`;
                        try {
                          navigator.clipboard.writeText(inviteLink);
                        } catch (e) {
                          console.warn("Clipboard error:", e);
                        }
                        alert(`📋 Invitation Link Copied!\n\n${inviteLink}\n\nShare this link with your challenger to start!`);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-purple-500 hover:bg-purple-400 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-md whitespace-nowrap"
                    >
                      🔗 Copy Invite Link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveChallenge(prev => prev ? { ...prev, status: 'accepted', opponentType: 'bot' } : null);
                        setGamePlayLogs(prev => [...prev, `[SESSION MODE] Match converted to single-player Bot mode while waiting.`]);
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-xl text-xs cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                    >
                      🤖 Play vs Bot
                    </button>
                  </div>
                </div>
              )}

            {activeChallenge?.gameType === 'Whot' && whotGameState ? (
              /* Playable Whot card game table! */
              <LayoutGroup id="whot-game-group">
                <div className={`rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6 relative overflow-hidden whot-game-table select-none ${is3DMode ? 'mode-3d' : ''} ${getTensionClass()}`} id="whot-card-table-arena">
                
                {/* Board header matching parameters */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10 relative">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-sm font-display font-black text-white uppercase tracking-wider">
                      🍀 Whot Arena: Dual Stadium
                    </span>
                  </div>
                  
                  {/* Collapsible Rules & 3D Toggle */}
                  <div className="flex flex-row items-center gap-2 select-none">
                    <button
                      type="button"
                      onClick={() => setIs3DMode(!is3DMode)}
                      className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-350 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <span>{is3DMode ? 'Perspective: 3D ⛶' : 'Perspective: 2D ▢'}</span>
                    </button>
                    <div className="relative flex flex-col items-end gap-1">
                      <button
                        onClick={() => setShowRules(!showRules)}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-350 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <span>{showRules ? 'Hide Rules ✕' : 'Show Rules ℹ️'}</span>
                      </button>
                      {showRules && (
                        <div className="bg-amber-950/95 border-2 border-amber-600/60 p-3 rounded-xl text-amber-100 text-[10px] sm:text-[11px] font-sans leading-normal max-w-xs shadow-xl absolute z-30 mt-8 right-0 border-white/10">
                          <span className="block font-black text-amber-300 uppercase tracking-widest text-xs mb-0.5">💡 Quick Table Rules:</span>
                          <ul className="list-disc pl-3.5 space-y-1">
                            <li>Match the card's <strong>Number</strong> (e.g. 5) OR <strong>Suit Shape</strong> (e.g. ▲).</li>
                            <li><strong>★ WHOT! (20)</strong> is Wild - tap it anytime to pick the active suit!</li>
                            <li>Must tap draw pile if you do not have a playable card in color.</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3D Stage — wraps all zones to preserve the 3D coordinate space */}
                <div className={is3DMode ? 'whot-3d-stage space-y-6' : 'space-y-6'}>

                {/* Opponent Zone (top space) */}
                <div className={`flex flex-col md:flex-row items-center justify-between gap-4 bg-black/40 p-3.5 rounded-2xl border border-white/5 shadow-md ${is3DMode ? 'whot-opponent-zone' : ''}`}>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <img 
                      src={opponentProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'} 
                      alt="Opponent" 
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-white">{opponentProfile?.username}</span>
                        {whotGameState.activePlayerId !== userProfile.uid && (
                          <span className="text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-black animate-pulse uppercase">THINKING...</span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-200/80 font-mono">Opponent's Hand Status</p>
                      <div className="mt-1 bg-black/60 text-white text-[10px] font-mono px-2.5 py-1 rounded-xl font-bold border border-white/10 inline-block">
                        {whotGameState?.playerHands?.[opponentId]?.length || 0} Cards
                      </div>
                    </div>
                  </div>

                  {/* Opponent Zone Hand: Opened if completed, otherwise face-down lined out */}
                  <div className="w-full md:flex-1 max-w-full overflow-hidden relative group">
                    <div 
                      ref={opponentScrollRowRef}
                      className="w-full max-w-full overflow-x-auto overflow-y-hidden pb-3 pt-1 shadow-inner scrollbar-thin select-none touch-pan-x whot-cards-row scroll-smooth"
                    >
                      <div className="flex gap-2 sm:gap-3 min-w-max mx-auto px-3 justify-center items-center">
                        {whotGameState?.status === 'completed' ? (
                          whotGameState?.playerHands?.[opponentId]?.map((card) => 
                            renderWhotCard(card, false, undefined, true)
                          )
                        ) : (
                          whotGameState?.playerHands?.[opponentId]?.map((card) => (
                            <motion.div 
                              key={card.id} 
                              layoutId={card.id}
                              layout
                              initial={{ scale: 0.6, y: 250, opacity: 0 }}
                              animate={{ scale: 1, y: 0, opacity: 1 }}
                              exit={{ scale: 0.8, y: 30, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                              className={`w-[70px] h-[102px] xs:w-[82px] xs:h-[120px] sm:w-[100px] sm:h-[148px] md:w-[110px] md:h-[160px] bg-gradient-to-br from-red-600 to-red-800 border-2 border-white rounded-2xl shadow-lg flex flex-col justify-between p-2 sm:p-2.5 text-white relative shrink-0 select-none items-center justify-center font-bold hover:scale-102 transition-transform ${is3DMode ? 'whot-opponent-card-3d' : ''}`}
                            >
                              <div className="absolute inset-1 sm:inset-1.5 border border-dashed border-white/20 rounded-xl flex items-center justify-center">
                                <span className="text-[9px] xs:text-[10px] sm:text-xs font-serif font-black opacity-95 uppercase tracking-widest">Whot!</span>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Draw pile & card discard community area - Unified same row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 py-2 items-stretch">
                  
                  {/* Community table: full width on mobile (feed hidden), 2 cols on desktop */}
                  <div className={`col-span-1 md:col-span-2 bg-black/25 p-5 rounded-3xl border border-white/5 shadow-inner flex flex-col items-center justify-center space-y-4 ${is3DMode ? 'whot-community-table' : ''}`}>
                    <span className="text-[11px] font-mono text-emerald-300 font-extrabold uppercase tracking-widest bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                      Community Card Table
                    </span>
                    
                    <div className="flex flex-row items-center justify-center gap-8 sm:gap-16 py-2">
                      {/* Draw Pile Stack (cards on the pile) */}
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Draw Pile</span>
                        <button
                          onClick={handleHumanDrawCard}
                          disabled={whotGameState.activePlayerId !== userProfile.uid || whotGameState.status === 'completed'}
                          className={`relative group shrink-0 select-none ${
                            is3DMode ? 'whot-draw-deck-3d' : ''
                          } ${
                            whotGameState.activePlayerId === userProfile.uid && whotGameState.status !== 'completed'
                              ? 'opacity-100 cursor-pointer active:scale-95'
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {/* Shadow stack items */}
                          <div className="absolute top-1 left-1 w-[65px] h-[95px] sm:w-[85px] sm:h-[120px] bg-red-900 border-2 border-white rounded-2xl shadow-md rotate-3 translate-x-1" />
                          <div className="absolute top-0.5 left-0.5 w-[65px] h-[95px] sm:w-[85px] sm:h-[120px] bg-red-800 border-2 border-white rounded-2xl shadow-md -rotate-2" />
                          
                          <div className="w-[65px] h-[95px] sm:w-[85px] sm:h-[120px] bg-red-700 border-2 border-white rounded-2xl shadow-lg flex flex-col justify-between p-2 text-white relative transition-all group-hover:scale-105 group-hover:-translate-y-1">
                            <div className="absolute inset-1 border border-dashed border-white/20 rounded-xl flex items-center justify-center">
                              <span className="text-xs sm:text-sm font-serif font-black opacity-90 uppercase tracking-widest select-none font-bold">Whot!</span>
                            </div>
                            <div className="z-10 bg-black/60 px-1.5 py-0.5 rounded-md font-mono text-[8px] sm:text-[9px] font-black tracking-tight self-center mt-auto">
                              {whotGameState.deckCount} Left
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Discard Pile (active card) */}
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Active Play</span>
                        <div className={`p-1.5 bg-[#0c4021] rounded-2xl border border-[#1b6b3b] shadow-inner ${is3DMode ? 'whot-discard-card-3d' : ''}`}>
                          {renderWhotCard(whotGameState.discardPile[0], false)}
                        </div>
                      </div>
                    </div>

                    <div className="text-center space-y-1.5">
                      <p className="text-xs text-emerald-100">
                        Current active Suit: <strong className="text-amber-300 uppercase font-black tracking-wider bg-black/30 px-2.5 py-1 rounded-md">{whotGameState.activeSuit}</strong>
                      </p>
                      {whotGameState.whotClaimedSuit && (
                        <span className="text-xs bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full font-black inline-block animate-bounce shadow-md">
                          ★ Obligated Suit: {whotGameState.whotClaimedSuit}
                        </span>
                      )}
                      <div className="pt-1 text-center">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${whotSettings.optional20 ? 'text-amber-300 bg-amber-950/40 border border-amber-500/20' : 'text-neutral-450 bg-neutral-900 border border-neutral-800'}`}>
                          {whotSettings.optional20 ? "✅ Whot 20 Wildcards Enabled" : "⚠️ Whot 20 Wildcards Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Alerts Feed panel — hidden on mobile, visible on md+ */}
                  <div className="hidden md:flex bg-black/35 p-4 rounded-3xl border border-white/5 text-xs text-white leading-relaxed font-sans flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
                        <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Game Stadium Feed:</span>
                      </div>
                      <p className="font-mono text-xs text-emerald-250 bg-black/50 p-3 border border-white/5 rounded-xl leading-relaxed">
                        🔊 {whotGameState.lastActionMessage}
                      </p>
                      {whotGameState.penaltyCount > 0 && (
                        <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs font-black text-rose-100 bg-rose-950/70 border border-rose-500/30 p-2.5 rounded-xl animate-pulse">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>Draw {whotGameState.penaltyCount} cards or play matching value!</span>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-neutral-450 mt-3 border-t border-white/5 pt-2 text-center">
                      {whotGameState.activePlayerId === userProfile.uid 
                        ? "👉 Tap red deck to draw, or select a card to play" 
                        : "⌛ Wait for opponent..."}
                    </div>
                  </div>

                  {/* Mobile-only: compact penalty alert strip (only shows when penalty is active) */}
                  {whotGameState.penaltyCount > 0 && (
                    <div className="md:hidden flex items-center gap-2 font-mono text-[10px] font-black text-rose-100 bg-rose-950/70 border border-rose-500/30 p-2.5 rounded-xl animate-pulse">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Draw {whotGameState.penaltyCount} cards or play matching value!</span>
                    </div>
                  )}
                </div>

                {/* Close 3D Stage wrapper */}
                </div>

                {/* Suit declaration overlay choice card */}
                <AnimatePresence>
                  {selectedSuitToClaim && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 p-4"
                    >
                      <div className="bg-[#0b3c20] p-6 rounded-3xl max-w-sm w-full space-y-4 text-center border-2 border-amber-400 shadow-2xl">
                        <div className="p-2 bg-amber-400/10 border border-amber-400/35 text-amber-300 rounded-xl inline-block text-xs font-black uppercase tracking-wider">★ WILD 20 WHOT PLAYED!</div>
                        <h4 className="font-display font-black text-white text-base">Declare required Suit/Shape</h4>
                        <p className="text-xs text-emerald-200">Select which card shape your opponent must match next.</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {(['Circles', 'Triangles', 'Crosses', 'Stars', 'Squares'] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => handleClaimSuitSelection(s)}
                              className="py-3 px-4 bg-black/40 border border-emerald-600 rounded-xl hover:border-amber-400 font-bold transition-all text-emerald-100 hover:text-amber-300 hover:bg-black/60 cursor-pointer"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Human Player Hand card tray (bottom space) */}
                <div className={`space-y-4 border-t border-white/10 pt-5 ${is3DMode ? 'whot-player-zone' : ''}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 text-xs">
                    <span className="font-black text-white text-sm flex items-center gap-1.5 font-display uppercase tracking-wider">
                      <User className="w-5 h-5 text-amber-400 shrink-0" />
                      Your Hand Deck ({whotGameState?.playerHands?.[userProfile.uid]?.length || 0} cards)
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {/* Fan / Spin mode toggle — most useful on mobile */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsFanMode(v => !v);
                          setFanCenterIndex(0);
                        }}
                        title={isFanMode ? 'Switch to scroll layout' : 'Switch to fan/spin layout'}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 select-none"
                      >
                        <span>{isFanMode ? '↔ Scroll' : '🌀 Fan'}</span>
                      </button>

                      <span className={`text-xs font-mono tracking-wider font-extrabold px-3 py-1.5 rounded-full border ${
                        whotGameState.activePlayerId === userProfile.uid 
                          ? (turnTimeLeft <= 15 
                              ? 'bg-rose-500 text-white border-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce' 
                              : 'bg-emerald-400 text-neutral-950 border-white shadow-[0_0_15px_rgba(52,211,153,0.3)] animate-pulse')
                          : 'bg-black/40 text-emerald-300 border-white/10'
                      }`}>
                        {whotGameState.activePlayerId === userProfile.uid 
                          ? `👉 YOUR TURN: Tap card to play! (${turnTimeLeft}s left)` 
                          : `⌛ ${opponentProfile?.username || 'Opponent'}'s turn... (${turnTimeLeft}s)`}
                      </span>
                    </div>
                  </div>

                  {isFanMode ? (
                    /* ── FAN / SPIN LAYOUT ── */
                    (() => {
                      const hand = whotGameState?.playerHands?.[userProfile.uid] || [];
                      const count = hand.length;
                      if (count === 0) return null;

                      // clamp center index
                      const safeCenter = Math.max(0, Math.min(fanCenterIndex, count - 1));

                      // fan spread: max 120deg total, each card gets up to 18deg
                      const maxSpread = Math.min(120, count * 14);
                      const spreadPerCard = count > 1 ? maxSpread / (count - 1) : 0;

                      // radius of the arc (larger = cards spread out more)
                      const arcRadius = Math.max(160, 120 + count * 8);

                      return (
                        <div
                          className="relative w-full select-none"
                          style={{ height: `${arcRadius * 0.72 + 20}px` }}
                          onTouchStart={(e) => {
                            fanTouchStartX.current = e.touches[0].clientX;
                            fanTouchStartY.current = e.touches[0].clientY;
                          }}
                          onTouchEnd={(e) => {
                            const dx = e.changedTouches[0].clientX - fanTouchStartX.current;
                            const dy = e.changedTouches[0].clientY - fanTouchStartY.current;
                            // Only treat as horizontal swipe (dx dominates)
                            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
                              if (dx < 0) {
                                // swipe left → next card
                                setFanCenterIndex(i => Math.min(count - 1, i + 1));
                              } else {
                                // swipe right → previous card
                                setFanCenterIndex(i => Math.max(0, i - 1));
                              }
                            }
                          }}
                        >
                          {/* Arc of cards */}
                          {hand.map((card, i) => {
                            const offset = i - safeCenter;
                            const angleDeg = offset * spreadPerCard;
                            const angleRad = (angleDeg * Math.PI) / 180;
                            const tx = Math.sin(angleRad) * arcRadius;
                            const ty = arcRadius - Math.cos(angleRad) * arcRadius;
                            const scale = i === safeCenter ? 1.08 : Math.max(0.72, 1 - Math.abs(offset) * 0.08);
                            const opacity = i === safeCenter ? 1 : Math.max(0.45, 1 - Math.abs(offset) * 0.12);
                            const zIndex = count - Math.abs(offset);

                            return (
                              <div
                                key={card.id}
                                style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: '50%',
                                  transform: `translateX(calc(-50% + ${tx}px)) translateY(${-ty * 0.55}px) rotate(${angleDeg * 0.75}deg) scale(${scale})`,
                                  zIndex,
                                  opacity,
                                  transition: 'transform 0.32s cubic-bezier(0.2,0.8,0.2,1), opacity 0.28s ease',
                                  transformOrigin: 'bottom center',
                                }}
                                onClick={() => {
                                  if (i !== safeCenter) {
                                    // First tap brings card to center
                                    setFanCenterIndex(i);
                                  } else {
                                    // Second tap on center card plays it
                                    handlePlayCard(card);
                                  }
                                }}
                              >
                                {renderWhotCard(card, false)}
                                {/* Center card glow indicator */}
                                {i === safeCenter && (
                                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                                )}
                              </div>
                            );
                          })}

                          {/* Left / Right navigation arrows */}
                          <button
                            type="button"
                            onClick={() => setFanCenterIndex(i => Math.max(0, i - 1))}
                            disabled={safeCenter === 0}
                            className="absolute left-0 bottom-2 z-50 w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/80 active:scale-90 transition-all cursor-pointer"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={() => setFanCenterIndex(i => Math.min(count - 1, i + 1))}
                            disabled={safeCenter === count - 1}
                            className="absolute right-0 bottom-2 z-50 w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/80 active:scale-90 transition-all cursor-pointer"
                          >
                            ›
                          </button>

                          {/* Card counter label */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-white/10">
                            {safeCenter + 1} / {count} · tap center to play
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    /* ── SCROLL LAYOUT (default) ── */
                    <div className="relative w-full max-w-full group">
                      {/* Left scroll navigation arrow */}
                      <button
                        type="button"
                        onClick={() => {
                          if (scrollRowRef.current) {
                            scrollRowRef.current.scrollBy({ left: -220, behavior: 'smooth' });
                          }
                        }}
                        className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100 select-none"
                        title="Scroll hand left"
                      >
                        ‹
                      </button>
                      
                      {/* Right scroll navigation arrow */}
                      <button
                        type="button"
                        onClick={() => {
                          if (scrollRowRef.current) {
                            scrollRowRef.current.scrollBy({ left: 220, behavior: 'smooth' });
                          }
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100 select-none"
                        title="Scroll hand right"
                      >
                        ›
                      </button>

                      {/* Responsive horizontal card scroll track */}
                      <div 
                        ref={scrollRowRef}
                        className="w-full max-w-full overflow-x-auto overflow-y-hidden pb-4 pt-2.5 shadow-inner scrollbar-thin select-none touch-pan-x whot-cards-row scroll-smooth"
                      >
                        <div className="flex gap-2 sm:gap-3 min-w-max mx-auto px-4 justify-center items-center">
                          {whotGameState?.playerHands?.[userProfile.uid]?.map((card) => 
                            renderWhotCard(card, true, () => handlePlayCard(card))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Game Over Screen */}
                {whotGameState.status === 'completed' && (
                  <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-[80] p-4 text-center space-y-6">
                    {/* Animated Confetti / Cheers */}
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                        className="absolute inset-0 -m-8 bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-amber-500/20 rounded-full blur-2xl opacity-75"
                      />
                      <motion.div
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: [1, 1.1, 1], opacity: 1 }}
                        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                        className="text-5xl sm:text-6xl"
                      >
                        {whotGameState.winnerId === userProfile.uid ? '🎉🏆👑' : '💩🤖💤'}
                      </motion.div>
                    </div>

                    <div className="space-y-2 max-w-sm">
                      <h3 className="text-2xl font-black tracking-tight text-glow-purple uppercase font-display">
                        {whotGameState.winnerId === userProfile.uid ? 'Congratulations!' : 'Bot Victory!'}
                      </h3>
                      <p className="text-sm font-bold text-amber-305">
                        {whotGameState.winnerId === userProfile.uid 
                          ? 'You won the match!' 
                          : `${opponentProfile?.username || 'Opponent'} won the match.`}
                      </p>
                      <p className="text-xs text-neutral-400 font-mono leading-relaxed mt-2 bg-neutral-900/80 p-3.5 rounded-xl border border-white/5">
                        {whotGameState.lastActionMessage}
                      </p>
                    </div>

                    {/* Rematch & Back to Games Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
                      <button
                        onClick={handleRematch}
                        className="flex-1 py-3 bg-purple-350 hover:bg-purple-400 text-neutral-950 font-bold rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all text-xs font-display uppercase tracking-wider cursor-pointer animate-pulse"
                      >
                        🔄 Rematch
                      </button>
                      <button
                        onClick={handleBackToLobbies}
                        className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white font-bold rounded-2xl shadow-md transition-all text-xs font-display uppercase tracking-wider cursor-pointer"
                      >
                        🎮 Games Lobby
                      </button>
                    </div>
                  </div>
                )}

                {/* Floating game alert notifications (semi last card, last card, checkup) */}
                <AnimatePresence>
                  {whotNotification && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -50 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 50 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                      className={`absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99] px-6 py-4 rounded-3xl border-2 shadow-2xl flex flex-col items-center justify-center space-y-1.5 text-center font-display font-black uppercase tracking-wider select-none ${
                        whotNotification.type === 'semi'
                          ? 'bg-amber-400 border-amber-300 text-neutral-950 shadow-amber-500/30'
                          : whotNotification.type === 'last'
                          ? 'bg-rose-600 border-rose-400 text-white shadow-rose-600/30 animate-pulse'
                          : 'bg-emerald-500 border-emerald-300 text-neutral-950 shadow-emerald-500/30'
                      }`}
                    >
                      <span className="text-[10px] opacity-80 font-mono tracking-widest font-black uppercase">
                        {whotNotification.type === 'semi' ? '⚠️ Alert Warning' : whotNotification.type === 'last' ? '🚨 Danger Alert' : '🏆 Game Outcome'}
                      </span>
                      <span className="text-sm sm:text-base whitespace-nowrap font-black">
                        {whotNotification.text}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </LayoutGroup>
            ) : activeChallenge?.gameType === 'Ludo' ? (
              <InteractiveLudoBoard
                entryFee={activeChallenge.entryFee}
                opponentName={opponentProfile?.username || 'Bot'}
                opponentAvatar={opponentProfile?.avatar || ''}
                onGameOver={(winnerIsMe) => completeMatchWithOutcome(winnerIsMe)}
                onAddLog={(log) => setGamePlayLogs(prev => [log, ...prev])}
                botDifficulty={activeChallenge.botDifficulty || (activeChallenge.opponentType === 'bot' && activeChallenge.entryFee > 0 ? 'hard' : undefined)}
                isBot={activeChallenge?.opponentType === 'bot'}
                sessionId={activeChallenge?.id}
                isHost={activeChallenge?.senderId === userProfile.uid}
                liveGameState={liveGameState}
                onUpdateLiveState={(newState) => {
                  if (activeChallenge?.id && activeChallenge.opponentType === 'player') {
                    updateDoc(doc(db, 'gameSessions', activeChallenge.id), sanitizeFirestoreData({ gameState: newState, updatedAt: Date.now() })).catch(console.error);
                  }
                }}
              />
            ) : activeChallenge?.gameType === 'Draft' ? (
              <InteractiveDraftBoard
                entryFee={activeChallenge.entryFee}
                opponentName={opponentProfile?.username || 'Bot'}
                opponentAvatar={opponentProfile?.avatar || ''}
                onGameOver={(winnerIsMe) => completeMatchWithOutcome(winnerIsMe)}
                onAddLog={(log) => setGamePlayLogs(prev => [log, ...prev])}
                botDifficulty={activeChallenge.botDifficulty || (activeChallenge.opponentType === 'bot' && activeChallenge.entryFee > 0 ? 'hard' : undefined)}
                isBot={activeChallenge?.opponentType === 'bot'}
                sessionId={activeChallenge?.id}
                isHost={activeChallenge?.senderId === userProfile.uid}
                liveGameState={liveGameState}
                onUpdateLiveState={(newState) => {
                  if (activeChallenge?.id && activeChallenge.opponentType === 'player') {
                    updateDoc(doc(db, 'gameSessions', activeChallenge.id), sanitizeFirestoreData({ gameState: newState, updatedAt: Date.now() })).catch(console.error);
                  }
                }}
              />
            ) : activeChallenge?.gameType === 'TicTacToe' ? (
              <InteractiveTicTacToeBoard
                entryFee={activeChallenge.entryFee}
                opponentName={opponentProfile?.username || 'Bot'}
                opponentAvatar={opponentProfile?.avatar || ''}
                onGameOver={(winnerIsMe) => completeMatchWithOutcome(winnerIsMe)}
                onAddLog={(log) => setGamePlayLogs(prev => [log, ...prev])}
                botDifficulty={activeChallenge.botDifficulty || (activeChallenge.opponentType === 'bot' && activeChallenge.entryFee > 0 ? 'hard' : undefined)}
                isBot={activeChallenge?.opponentType === 'bot'}
                sessionId={activeChallenge?.id}
                isHost={activeChallenge?.senderId === userProfile.uid}
                liveGameState={liveGameState}
                onUpdateLiveState={(newState) => {
                  if (activeChallenge?.id && activeChallenge.opponentType === 'player') {
                    updateDoc(doc(db, 'gameSessions', activeChallenge.id), sanitizeFirestoreData({ gameState: newState, updatedAt: Date.now() })).catch(console.error);
                  }
                }}
              />
            ) : activeChallenge?.gameType === 'Stickman' ? (
              <InteractiveStickmanBoard
                entryFee={activeChallenge.entryFee}
                opponentName={opponentProfile?.username || 'Bot'}
                opponentAvatar={opponentProfile?.avatar || ''}
                onGameOver={(winnerIsMe) => completeMatchWithOutcome(winnerIsMe)}
                onAddLog={(log) => setGamePlayLogs(prev => [log, ...prev])}
                botDifficulty={activeChallenge.botDifficulty || (activeChallenge.opponentType === 'bot' && activeChallenge.entryFee > 0 ? 'hard' : undefined)}
                isBot={activeChallenge?.opponentType === 'bot'}
                sessionId={activeChallenge?.id}
                isHost={activeChallenge?.senderId === userProfile.uid}
                liveGameState={liveGameState}
                onUpdateLiveState={(newState) => {
                  if (activeChallenge?.id && activeChallenge.opponentType === 'player') {
                    updateDoc(doc(db, 'gameSessions', activeChallenge.id), sanitizeFirestoreData({ gameState: newState, updatedAt: Date.now() })).catch(console.error);
                  }
                }}
              />
            ) : (
              <InteractiveChessBoard
                entryFee={activeChallenge.entryFee}
                opponentName={opponentProfile?.username || 'Bot'}
                opponentAvatar={opponentProfile?.avatar || ''}
                onGameOver={(winnerIsMe) => completeMatchWithOutcome(winnerIsMe)}
                onAddLog={(log) => setGamePlayLogs(prev => [log, ...prev])}
                botDifficulty={activeChallenge.botDifficulty || (activeChallenge.opponentType === 'bot' && activeChallenge.entryFee > 0 ? 'hard' : undefined)}
                isBot={activeChallenge?.opponentType === 'bot'}
                sessionId={activeChallenge?.id}
                isHost={activeChallenge?.senderId === userProfile.uid}
                liveGameState={liveGameState}
                onUpdateLiveState={(newState) => {
                  if (activeChallenge?.id && activeChallenge.opponentType === 'player') {
                    updateDoc(doc(db, 'gameSessions', activeChallenge.id), sanitizeFirestoreData({ gameState: newState, updatedAt: Date.now() })).catch(console.error);
                  }
                }}
              />
            )}
          </div>
          
          {/* Live Duel Chat Panel */}
          {activeChallenge?.opponentType !== 'bot' && (
            <div className="xl:col-span-1 bg-neutral-900 rounded-3xl border border-neutral-800 shadow-xl flex flex-col h-[520px] md:h-[620px] overflow-hidden sticky top-24">
              <div className="px-4 py-3 bg-neutral-920 border-b border-neutral-800 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  Live Duel Chat
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-neutral-450 uppercase font-black">Connected</span>
                </span>
              </div>
              {renderChatPanelContent()}
            </div>
          )}
        </div>
      )}

        {/* Incoming match challenge banner overlay alerts */}
        <AnimatePresence>
          {activeChallenge && activeChallenge.status === 'pending' && activeChallenge.senderId !== userProfile.uid && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white border-2 border-neutral-950 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                  <Swords className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-amber-600 uppercase font-bold tracking-wider">Stake Match Request</span>
                  <span className="text-xs font-semibold text-neutral-800">
                    {activeChallenge.senderName} is challenging you to {activeChallenge.gameType}!
                  </span>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Match Staking Entry: <strong className="text-emerald-700 font-mono font-bold">{activeChallenge.entryFee} coins</strong>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => executeChallengeAction(false)}
                  className="flex-1 sm:flex-none px-3.5 py-2 border border-neutral-200 hover:border-neutral-350 text-neutral-600 rounded-xl text-xs font-sans font-semibold cursor-pointer whitespace-nowrap"
                >
                  Decline
                </button>
                <button
                  onClick={() => executeChallengeAction(true)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-white rounded-xl text-xs font-sans font-semibold cursor-pointer transition-all hover:scale-102"
                >
                  Accept Stakes
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Manual Challenge dialog overlay modal */}
      {showChallengeModal && selectedBot && (
        <div className="fixed inset-0 bg-neutral-950/45 backdrop-blur-3xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-2xl border border-neutral-200 max-w-sm w-full space-y-5 shadow-2x"
          >
            <div className="text-center space-y-2">
              <h3 className="font-sans font-bold text-neutral-900 text-base">Challenge - {selectedBot.username}</h3>
              <p className="text-xs text-neutral-500">Specify game types and coin staking values below.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-550 font-mono font-semibold">Select Game Base</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['Stickman', 'Whot', 'Ludo', 'Chess', 'Draft', 'TicTacToe'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGameType(g)}
                      className={`py-2 text-xs font-sans border rounded-xl font-medium transition-all cursor-pointer ${
                        gameType === g 
                          ? 'border-neutral-950 bg-neutral-50 text-neutral-950 font-bold' 
                          : 'border-neutral-200 text-neutral-500 hover:border-neutral-350 bg-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-550 font-mono flex justify-between font-semibold">
                  <span>Match Entry Fee</span>
                  <span className="font-semibold text-emerald-700 font-sans">{entryFee} coins</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="100"
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number(e.target.value))}
                  className="w-full accent-neutral-950 bg-neutral-100 rounded-lg cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>100 coins</span>
                  <span>1000 coins</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowChallengeModal(false)}
                className="flex-1 py-2 border border-neutral-200 hover:border-neutral-350 text-neutral-600 rounded-xl text-xs font-sans font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={sendManualChallengeToBot}
                className="flex-1 py-2 bg-neutral-950 hover:bg-neutral-850 text-white rounded-xl text-xs font-sans font-semibold cursor-pointer shadow-xs font-bold"
              >
                Send Challenge
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Safety Escrow Reconciliation Audit Overlay Dialog */}
      <AnimatePresence>
        {showReconciliation && reconciliationInfo && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-4 font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -15 }}
              className="bg-[#0B0B0F] border-2 border-rose-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full text-center relative shadow-[0_0_55px_rgba(239,68,68,0.15)] space-y-6"
            >
              <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-rose-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-rose-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <ShieldCheck className="w-8 h-8 text-rose-400" />
              </div>

              <div className="space-y-2">
                <span className="bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full text-[10px] font-mono text-rose-300 font-bold uppercase tracking-widest leading-none">
                  Anti-Lag Escrow Reconciliation
                </span>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight font-display mt-2">
                  Match Audit Resolved!
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  The match safety timer has concluded. Real-time game state validator nodes resolved the winner and dispatched stakes according to fair play rules.
                </p>
              </div>

              {/* Status details card */}
              <div className="bg-[#121217] rounded-2xl p-4.5 border border-white/[0.04] text-left space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-semibold">Arena Style:</span>
                  <span className="text-white font-extrabold uppercase font-mono">{reconciliationInfo.gameType} Mode</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-semibold">Declared Winner:</span>
                  <span className="text-emerald-400 font-extrabold font-display uppercase tracking-wider">{reconciliationInfo.winner}</span>
                </div>
                <div className="bg-neutral-900/60 p-3 rounded-xl border border-white/5 text-[11px] text-neutral-300 font-mono leading-relaxed">
                  <strong className="block font-bold text-[9px] uppercase tracking-wider text-rose-300 mb-1">State Evaluation Details:</strong>
                  {reconciliationInfo.pointsMsg}
                </div>
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-white/5">
                  <span className="text-neutral-400 font-semibold">Entry Stake Refund:</span>
                  <span className="text-amber-400 font-bold font-sans text-sm">
                    {reconciliationInfo.refundedCoins > 0 ? `+${reconciliationInfo.refundedCoins} coins credited` : '0 coins (Opponent claimed escrow)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowReconciliation(false);
                  setReconciliationInfo(null);
                  setGamePlayStatus('none');
                  setActiveChallenge(null);
                  setWhotGameState(null);
                  setUserProfile(prev => ({ ...prev, status: 'online' }));
                }}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs rounded-xl cursor-pointer transition-all active:scale-[1.02] select-none uppercase tracking-wider"
              >
                Acknowledge & Release Escrow
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
