/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { BOT_PLAYERS, INITIAL_CHAT, getRandomBotResponse } from '../data/simulation';
import { InteractiveLudoBoard } from './InteractiveLudoBoard';
import { InteractiveChessBoard } from './InteractiveChessBoard';

interface PhaseSandboxTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  transactions: WalletTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<WalletTransaction[]>>;
  preselectedGame?: 'Chess' | 'Ludo' | 'Whot' | null;
  setPreselectedGame?: React.Dispatch<React.SetStateAction<'Chess' | 'Ludo' | 'Whot' | null>>;
  suggestedStake?: number;
  friendChallenge?: {
    senderName: string;
    gameType: 'Chess' | 'Ludo' | 'Whot';
    entryFee: number;
  } | null;
  setFriendChallenge?: React.Dispatch<React.SetStateAction<{
    senderName: string;
    gameType: 'Chess' | 'Ludo' | 'Whot';
    entryFee: number;
  } | null>>;
}

// Helper: Standard Whot cards generator
function generateWhotDeck(): WhotCard[] {
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
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `w_${idCounter++}`, suit: 'Whot', value: 20 });
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

export const PhaseSandboxTab: React.FC<PhaseSandboxTabProps> = ({
  userProfile,
  setUserProfile,
  transactions,
  setTransactions,
  preselectedGame,
  setPreselectedGame,
  suggestedStake,
  friendChallenge,
  setFriendChallenge
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'wallet' | 'presence'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => INITIAL_CHAT);
  const [inputMessage, setInputMessage] = useState('');
  const [onlineBots, setOnlineBots] = useState<UserProfile[]>(() => BOT_PLAYERS);
  
  // Custom Friend Challenge state parameters
  const [friendGame, setFriendGame] = useState<'Chess' | 'Ludo' | 'Whot'>('Chess');
  const [friendStake, setFriendStake] = useState<number>(300);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Staking challenge state
  const [activeChallenge, setActiveChallenge] = useState<MatchChallenge | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedBot, setSelectedBot] = useState<UserProfile | null>(() => BOT_PLAYERS[0]);
  const [gameType, setGameType] = useState<'Whot' | 'Ludo' | 'Chess'>('Chess');
  const [entryFee, setEntryFee] = useState<number>(300);

  // Pre-fill parameters when redirected from Discover cards
  useEffect(() => {
    if (preselectedGame) {
      setGameType(preselectedGame);
      setEntryFee(suggestedStake || 300);
      
      const bot = onlineBots.find(b => b.status === 'online') || onlineBots[0] || BOT_PLAYERS[0];
      setSelectedBot(bot);
      
      if (setPreselectedGame) {
        setPreselectedGame(null);
      }
    }
  }, [preselectedGame, suggestedStake, onlineBots, setPreselectedGame]);

  // Trigger Friend Invite Matches
  useEffect(() => {
    if (friendChallenge) {
      // Setup the MatchChallenge object
      const inviteChallenge: MatchChallenge = {
        id: `friend_${Date.now()}`,
        senderId: 'friend_user',
        senderName: friendChallenge.senderName,
        receiverId: userProfile.uid,
        gameType: friendChallenge.gameType,
        entryFee: friendChallenge.entryFee,
        status: 'accepted',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Set state variables
      setActiveChallenge(inviteChallenge);
      setGamePlayStatus('playing');

      // Deduct entry fee
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

      // Initialize the games
      if (friendChallenge.gameType === 'Whot') {
        const fullDeck = shuffleDeck(generateWhotDeck());
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

        setWhotGameState({
          sessionId: inviteChallenge.id,
          playerIds: [userProfile.uid, 'friend_user'],
          playerHands: {
            [userProfile.uid]: humanHand,
            'friend_user': botHand
          },
          discardPile: [starterCard],
          activeSuit: starterCard.suit as any,
          activePlayerId: userProfile.uid,
          status: 'playing',
          penaltyCount: 0,
          lastActionMessage: `Friend Challenge Whot session: Starter card is ${starterCard.suit} ${starterCard.value}.`
        });

        setGamePlayLogs([
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

  // High-Fidelity Interactive Whot Game Engine States
  const [whotGameState, setWhotGameState] = useState<WhotGameState | null>(null);
  const [selectedSuitToClaim, setSelectedSuitToClaim] = useState<boolean>(false);
  const [pendingWhotCardObj, setPendingWhotCardObj] = useState<WhotCard | null>(null);
  const whotDeckRef = useRef<WhotCard[]>([]);

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
    if (whotGameState.activePlayerId === userProfile.uid) return; // User turn

    const botId = activeChallenge?.senderId === userProfile.uid ? selectedBot?.uid : activeChallenge?.senderId;
    if (!botId) return;

    const timer = setTimeout(() => {
      executeBotTurn(botId);
    }, 1800);

    return () => clearTimeout(timer);
  }, [whotGameState?.activePlayerId, whotGameState?.status]);

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
    const storedInput = inputMessage;
    setInputMessage('');

    setIsTyping(true);
    const botReply = getRandomBotResponse(storedInput);
    const respondingBot = onlineBots.find(b => b.uid === botReply.botId);
    setTypingBot(respondingBot?.username || 'Gamer');

    setTimeout(() => {
      setIsTyping(false);
      setTypingBot(null);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        senderId: botReply.botId,
        senderName: respondingBot?.username || 'Gamer',
        senderAvatar: respondingBot?.avatar || '',
        text: botReply.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, botMsg]);
    }, 1200 + Math.random() * 800);
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
      if (userProfile.coins < activeChallenge.entryFee) {
        alert("Transaction Failed: Insufficient Wallet Coins. Utilize the faucet to credit more.");
        setActiveChallenge(null);
        return;
      }

      // Debit local cash
      setUserProfile(prev => ({ ...prev, coins: prev.coins - activeChallenge.entryFee }));
      
      const lockTx: WalletTransaction = {
        id: `escrow_${Date.now()}`,
        type: 'stake_lock',
        amount: activeChallenge.entryFee,
        description: `Escrow atomic lock: ${activeChallenge.gameType} vs ${activeChallenge.senderName}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTransactions(prev => [lockTx, ...prev]);

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
    const fullDeck = shuffleDeck(generateWhotDeck());
    
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
    
    const initialSession: WhotGameState = {
      sessionId: challenge.id,
      playerIds: [userProfile.uid, challenge.senderId],
      playerHands: {
        [userProfile.uid]: humanHand,
        [challenge.senderId]: botHand
      },
      deckCount: fullDeck.length,
      discardPile: [starterCard],
      activeSuit: starterCard.suit as any,
      activePlayerId: userProfile.uid, // Lead Developer goes first
      status: 'playing',
      turnTimer: 20,
      penaltyCount: 0,
      lastActionMessage: 'Match started! Top pile represents Circle ' + starterCard.value + '. Lead Developer turn.'
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
        // Recycle discard pile
        if (!whotGameState || whotGameState.discardPile.length <= 1) break;
        const [activeTop, ...discarded] = whotGameState.discardPile;
        currentDeck = shuffleDeck(discarded);
        
        setWhotGameState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            discardPile: [activeTop]
          };
        });
        
        setGamePlayLogs(prev => [
          ...prev,
          `[DECK RECYCLING] Draw pool exhausted. Discard pile recycled and shuffled into deck.`
        ]);
      }
      
      const card = currentDeck.pop();
      if (card) {
        resultCards.push(card);
      }
    }

    whotDeckRef.current = currentDeck;

    setWhotGameState(prev => {
      if (!prev) return null;
      const existingHand = prev.playerHands[playerId] || [];
      return {
        ...prev,
        playerHands: {
          ...prev.playerHands,
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
    const botId = activeChallenge?.senderId === userProfile.uid ? selectedBot?.uid : activeChallenge?.senderId;
    if (!botId) return;

    if (penaltyActive) {
      const pCount = whotGameState.penaltyCount;
      drawCardForPlayer(userProfile.uid, pCount);
      const message = `You drew ${pCount} penalty cards from market & passed turn.`;

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
        `[PENALTY APPLIED] You took ${pCount} penalty cards.`
      ]);
    } else {
      drawCardForPlayer(userProfile.uid, 1);
      const message = `You drew 1 card from deck. Turn passed.`;

      setWhotGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          activePlayerId: botId,
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
      isValid = card.value === topCard.value;
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

    const botId = activeChallenge?.senderId === userProfile.uid ? selectedBot?.uid : activeChallenge?.senderId;
    if (!botId) return;

    const playerHand = whotGameState.playerHands[userProfile.uid] || [];
    const nextPlayerHand = playerHand.filter(c => c.id !== card.id);
    const isWinner = nextPlayerHand.length === 0;

    let nextPlayer = botId;
    let nextPenalty = whotGameState.penaltyCount;
    let message = `You played ${card.suit} ${card.value}.`;

    if (card.value === 1) { // Hold On
      nextPlayer = userProfile.uid; 
      message = `You played Hold On (1)! Gained an extra turn.`;
    } else if (card.value === 2) { // Pick Two
      nextPenalty += 2;
      message = `You played Pick Two (2)! Opponent pickup obligations: ${nextPenalty}.`;
    } else if (card.value === 5) { // Pick Three
      nextPenalty += 3;
      message = `You played Pick Three (5)! Opponent pickup obligations: ${nextPenalty}.`;
    } else if (card.value === 8) { // Suspension
      nextPlayer = userProfile.uid; // opponent is suspended, turn matches developer again!
      message = `You played Suspension (8)! Opponent's turn skipped.`;
    } else if (card.value === 14) { // General market
      drawCardForPlayer(botId, 1);
      message = `You played General Market (14)! Opponent draws 1.`;
    } else if (card.suit === 'Whot') {
      message = `You played Whot (20) & declared ${claimedSuit}!`;
    }

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
    
    const botHand = whotGameState.playerHands[botId] || [];
    const topCard = whotGameState.discardPile[0];
    const activeSuit = whotGameState.activeSuit;
    const penaltyActive = whotGameState.penaltyCount > 0;

    let playedCard: WhotCard | null = null;
    let newClaimedSuit: 'Circles' | 'Triangles' | 'Crosses' | 'Stars' | 'Squares' | undefined = undefined;

    const isPlayable = (card: WhotCard) => {
      if (penaltyActive) {
        return card.value === topCard.value;
      }
      return card.suit === 'Whot' || card.suit === activeSuit || card.value === topCard.value;
    };

    const playableCards = botHand.filter(isPlayable);

    if (playableCards.length > 0) {
      // Pick strategy
      const specCards = playableCards.filter(c => [1, 2, 5, 8, 14, 20].includes(c.value));
      playedCard = specCards.length > 0 
        ? specCards[Math.floor(Math.random() * specCards.length)] 
        : playableCards[Math.floor(Math.random() * playableCards.length)];

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
      let message = `${selectedBot?.username || 'Opponent'} played ${playedCard.suit} ${playedCard.value}.`;

      if (playedCard.value === 1) { // Hold On
        nextPlayer = botId;
        message = `${selectedBot?.username || 'Opponent'} played Hold On (1)! Bot gets another turn.`;
      } else if (playedCard.value === 2) {
        nextPenalty += 2;
        message = `${selectedBot?.username || 'Opponent'} played Pick Two (2)! Penalties stacked to ${nextPenalty}.`;
      } else if (playedCard.value === 5) {
        nextPenalty += 3;
        message = `${selectedBot?.username || 'Opponent'} played Pick Three (5)! Penalties stacked to ${nextPenalty}.`;
      } else if (playedCard.value === 8) {
        nextPlayer = botId;
        message = `${selectedBot?.username || 'Opponent'} played Suspension (8)! Lead Developer turn skipped.`;
      } else if (playedCard.value === 14) {
        drawCardForPlayer(userProfile.uid, 1);
        message = `${selectedBot?.username || 'Opponent'} played General Market (14)! Lead Developer draws 1.`;
      } else if (playedCard.suit === 'Whot') {
        message = `${selectedBot?.username || 'Opponent'} played Whot (20) & declared ${newClaimedSuit}!`;
      }

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
        const message = `${selectedBot?.username || 'Opponent'} drawing pick-penalties (${whotGameState.penaltyCount} cards) & passed.`;
        
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
        const message = `${selectedBot?.username || 'Opponent'} had no match. Drew 1 card & passed.`;

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
    const totalPayout = activeChallenge.entryFee * 2;
    
    setGamePlayStatus('completed');
    setOnlineBots(prev => prev.map(b => b.uid === activeChallenge.senderId ? { ...b, status: 'online' } : b));

    if (winnerIsMe) {
      setUserProfile(prev => ({ 
        ...prev, 
        coins: prev.coins + totalPayout,
        wins: prev.wins + 1,
        status: 'online'
      }));
      
      const payoutTx: WalletTransaction = {
        id: `payout_${Date.now()}`,
        type: 'win_payout',
        amount: totalPayout,
        description: `Winner payout credited: ${activeChallenge.gameType} vs ${activeChallenge.senderName}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTransactions(prev => [payoutTx, ...prev]);

      setGamePlayLogs(prev => [
        ...prev,
        `--- VICTORY SECURED ---`,
        `Fabulous! Lead Developer cleared their hand! Match payout verified.`,
        `Atomic Payout Dispatched: Credited ${totalPayout} virtual coins into wallet.`
      ]);
    } else {
      setUserProfile(prev => ({ 
        ...prev, 
        losses: prev.losses + 1,
        status: 'online'
      }));

      setGamePlayLogs(prev => [
        ...prev,
        `--- LOSS DETECTED ---`,
        `Opponent bot cleared their hand! Stake coins shifted to Winner escrow node.`
      ]);
    }

    setTimeout(() => {
      setGamePlayStatus('none');
      setActiveChallenge(null);
      setWhotGameState(null);
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
  const renderWhotCard = (card: WhotCard, isButton: boolean, onClick?: () => void) => {
    const isPlayable = whotGameState && whotGameState.activePlayerId === userProfile.uid && (
      whotGameState.penaltyCount > 0 
        ? card.value === whotGameState.discardPile[0].value 
        : (card.suit === 'Whot' || card.suit === whotGameState.activeSuit || card.value === whotGameState.discardPile[0].value)
    );

    let suitStyle = 'text-neutral-900 border-neutral-200 bg-white ring-1 ring-neutral-200';
    let label = card.suit === 'Whot' ? '★ WHOT' : card.suit;
    let symbol = '●';

    if (card.suit === 'Circles') {
      suitStyle = 'text-amber-600 border-amber-200 bg-amber-50/50';
      symbol = '●';
    } else if (card.suit === 'Triangles') {
      suitStyle = 'text-emerald-600 border-emerald-200 bg-emerald-50/50';
      symbol = '▲';
    } else if (card.suit === 'Crosses') {
      suitStyle = 'text-indigo-600 border-indigo-200 bg-indigo-50/50';
      symbol = '✚';
    } else if (card.suit === 'Stars') {
      suitStyle = 'text-purple-600 border-purple-200 bg-purple-50/50 ring-1 ring-purple-300';
      symbol = '★';
    } else if (card.suit === 'Squares') {
      suitStyle = 'text-orange-600 border-orange-200 bg-orange-50/50';
      symbol = '■';
    } else if (card.suit === 'Whot') {
      suitStyle = 'text-rose-950 border-rose-300 bg-linear-to-b from-rose-50 to-white ring-2 ring-rose-950';
      symbol = '★';
    }

    const cardContent = (
      <div className="h-full flex flex-col justify-between p-2.5 relative">
        <div className="flex justify-between items-start">
          <span className="font-mono text-xs font-bold">{card.value}</span>
          <span className="text-[10px] uppercase font-semibold font-sans scale-85 opacity-80">{symbol}</span>
        </div>
        
        <div className="flex flex-col items-center justify-center flex-1 my-2">
          <span className="text-2xl font-bold font-mono">{symbol}</span>
          <span className="text-[9px] font-mono tracking-wider opacity-60 mt-1 uppercase">
            {card.suit === 'Whot' ? 'WILDCARD' : card.suit}
          </span>
        </div>
        
        <div className="flex justify-between items-end">
          <span className="text-[10px] opacity-40 font-mono">#{card.id}</span>
          {card.suit === 'Stars' && <span className="text-[8px] bg-amber-400 text-amber-950 px-1 rounded font-bold uppercase font-mono tracking-[0.1em]">2x</span>}
          <span className="font-mono text-xs font-bold">{card.value}</span>
        </div>
      </div>
    );

    if (isButton) {
      return (
        <button
          key={card.id}
          disabled={!isPlayable}
          onClick={onClick}
          className={`w-28 h-40 rounded-xl border-2 text-left cursor-pointer transition-all relative select-none hover:-translate-y-3.5 ${suitStyle} ${
            isPlayable 
              ? 'ring-4 ring-emerald-500/80 shadow-md scale-102 hover:shadow-xl' 
              : 'opacity-40 cursor-not-allowed hover:translate-y-0 scale-98'
          }`}
        >
          {cardContent}
        </button>
      );
    }

    return (
      <div
        key={card.id}
        className={`w-24 h-36 rounded-xl border-2 text-left shadow-xs flex-col relative ${suitStyle}`}
      >
        {cardContent}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="sandbox-root-v2">
      
      {/* Profile Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 shadow-md flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img 
              src={userProfile.avatar} 
              alt={userProfile.username} 
              className="w-16 h-16 rounded-full ring-2 ring-amber-400/55 object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-neutral-900 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-sm text-neutral-100">{userProfile.username}</h3>
            <span className="text-[9px] font-mono text-neutral-400 px-2 py-0.5 bg-neutral-800 rounded-full">presence: {userProfile.status}</span>
          </div>

          <div className="grid grid-cols-3 gap-1 w-full border-t border-b border-neutral-800 py-3 text-xs">
            <div>
              <span className="block font-sans font-medium text-neutral-200">{userProfile.wins}</span>
              <span className="text-[10px] text-neutral-500 uppercase font-mono">Wins</span>
            </div>
            <div>
              <span className="block font-sans font-medium text-neutral-200">{userProfile.losses}</span>
              <span className="text-[10px] text-neutral-500 uppercase font-mono font-medium">Loss</span>
            </div>
            <div>
              <span className="block font-sans font-medium text-neutral-200">{userProfile.draws}</span>
              <span className="text-[10px] text-neutral-500 uppercase font-mono font-medium">Draws</span>
            </div>
          </div>

          <div className="w-full flex items-center justify-between bg-neutral-920 px-3 py-2.5 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-1.5 text-xs text-neutral-300">
              <Wallet className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-semibold text-emerald-400">Wallet Coins</span>
            </div>
            <span className="font-mono text-sm font-bold text-neutral-100">{userProfile.coins}</span>
          </div>

          <button
            onClick={handleFountainCredit}
            className="w-full text-xs font-mono py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg transition-all cursor-pointer font-bold select-none shadow-md shadow-emerald-950/20"
          >
            Faucet: Claim +1000 Coins
          </button>
        </div>

        {/* Challenge match info widget */}
        {gamePlayStatus !== 'none' && (
          <div className="bg-neutral-950 p-5 rounded-2xl text-white border border-neutral-800 shadow-md space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-500 animate-pulse" />
              <h4 className="text-xs font-medium text-amber-400">Escrow Match State</h4>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Opponent:</span>
                <span className="font-medium text-neutral-250">
                  {activeChallenge?.senderId === userProfile.uid ? selectedBot?.username : activeChallenge?.senderName}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Staking Pool:</span>
                <span className="font-medium text-emerald-400 font-bold">{(activeChallenge?.entryFee || 300) * 2} Units</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>State Node:</span>
                <span className="px-1.5 py-0.5 rounded-md bg-neutral-800 text-[10px] text-amber-300 font-bold animate-pulse">
                  {gamePlayStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Sandbox Board Area */}
      <div className="lg:col-span-3 flex flex-col space-y-4">
        
        {/* If no match is running, show lobby panels */}
        {gamePlayStatus === 'none' ? (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-xl flex flex-col h-[490px] overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 bg-neutral-920 border-b border-neutral-800">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer font-medium ${
                    activeTab === 'chat' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Lobby Chat
                </button>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer font-medium ${
                    activeTab === 'wallet' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Wallet Ledger
                </button>
                <button
                  onClick={() => setActiveTab('presence')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer font-medium ${
                    activeTab === 'presence' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Online Challengers ({onlineBots.filter(b => b.status === 'online').length})
                </button>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lobby Live Server</span>
              </div>
            </div>

            {/* Lobby messages sub-tab */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col bg-neutral-900 overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                  {chatMessages.map((msg) => {
                    const isMe = msg.senderId === userProfile.uid;
                    return (
                      <div key={msg.id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <img 
                          src={msg.senderAvatar} 
                          alt={msg.senderName} 
                          className="w-8 h-8 rounded-full object-cover border border-neutral-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="max-w-[70%] space-y-1">
                          <div className={`flex items-baseline gap-2 text-[10px] text-neutral-500 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="font-semibold text-neutral-300">{msg.senderName}</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isMe 
                              ? 'bg-amber-400 text-neutral-950 font-medium rounded-tr-none' 
                              : 'bg-neutral-800 text-neutral-100 rounded-tl-none border border-neutral-700/50'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {isTyping && (
                    <div className="flex items-center gap-2 text-xs text-neutral-550 font-mono pl-3.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse animate-ping" />
                      <span>{typingBot} is typing...</span>
                    </div>
                  )}
                  <div ref={messageEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 bg-neutral-920 border-t border-neutral-800 flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about atomic stakes, or type: Let's challenge a bot to Whot card game..."
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-xs font-sans text-white outline-hidden focus:border-neutral-700"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 rounded-xl cursor-pointer font-bold transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Wallet sub-tab */}
            {activeTab === 'wallet' && (
              <div className="flex-1 p-4 overflow-y-auto bg-neutral-920/40">
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800 shadow-sm flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-neutral-200 block">{tx.description}</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                          <span>TxID: {tx.id}</span>
                          <span>•</span>
                          <span>{tx.timestamp}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                        {tx.type === 'credit' || tx.type === 'win_payout' ? (
                          <div className="text-emerald-400 flex items-center bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                            <ArrowDownLeft className="w-3.5 h-3.5 mr-0.5" />
                            +{tx.amount}
                          </div>
                        ) : (
                          <div className="text-amber-400 flex items-center bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                            -{tx.amount}
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
                      <div className="grid grid-cols-3 gap-1.5 font-sans">
                        {(['Chess', 'Ludo', 'Whot'] as const).map((game) => (
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
          </div>
        ) : (
          /* Render Active Interactive Game matches */
          <div className="flex flex-col space-y-4">
            {activeChallenge?.gameType === 'Whot' && whotGameState ? (
              /* Playable Whot card game table! */
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 lg:p-6 shadow-xl space-y-6 relative overflow-hidden" id="whot-card-table-arena">
                
                {/* Board header matching parameters */}
                <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-sans font-bold text-neutral-100 uppercase tracking-wider">
                      Whot! Duel (1 vs 1 Game)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs bg-neutral-950 py-1.5 px-3.5 border border-neutral-800 rounded-full shadow-md">
                    <span className="text-neutral-400 font-medium">STAKING POOL:</span>
                    <strong className="text-emerald-400 font-mono font-bold">{(activeChallenge.entryFee) * 2} Coins</strong>
                  </div>
                </div>

                {/* Opponent Zone (top space) */}
                <div className="flex items-center justify-between bg-neutral-920 p-3 rounded-xl border border-neutral-850 shadow-md">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedBot?.avatar} 
                      alt="Opponent bot" 
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-neutral-800"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-neutral-200">{selectedBot?.username}</span>
                        {whotGameState.activePlayerId !== userProfile.uid && (
                          <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold animate-pulse">THINKING...</span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500 font-mono">Opponent card counts</p>
                    </div>
                  </div>

                  {/* Face-down bot cards visualization deck stack */}
                  <div className="flex gap-1">
                    {Array.from({ length: whotGameState.playerHands[selectedBot?.uid || '']?.length || 6 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-7 h-11 bg-neutral-950 border border-neutral-800 rounded-lg shadow-sm flex items-center justify-center text-[10px] text-neutral-500 font-bold leading-none -ml-2 select-none"
                      >
                        W
                      </div>
                    ))}
                    <div className="ml-2 bg-neutral-950 text-neutral-200 text-[11px] font-mono px-2 py-1 rounded-md font-bold self-center">
                      x{whotGameState.playerHands[selectedBot?.uid || '']?.length || 6}
                    </div>
                  </div>
                </div>

                {/* Draw pile & card discard community area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 items-center">
                  
                  {/* Left Discard Pile panel */}
                  <div className="bg-neutral-920 p-4.5 rounded-2xl border border-neutral-800 shadow-xl flex flex-col items-center justify-center space-y-4">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase font-semibold">Discard pile (Stacked tops)</span>
                    
                    <div className="flex items-center justify-center relative">
                      {/* Top card of discard pile */}
                      {renderWhotCard(whotGameState.discardPile[0], false)}
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-neutral-300">
                        Current active Suit: <strong className="text-neutral-100 uppercase font-bold">{whotGameState.activeSuit}</strong>
                      </p>
                      {whotGameState.whotClaimedSuit && (
                        <span className="text-[10px] bg-amber-950/60 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-md font-bold mt-1 inline-block animate-bounce">
                          ★ Suit declared: {whotGameState.whotClaimedSuit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right pile and logs and states interaction buttons */}
                  <div className="space-y-4 flex flex-col justify-between self-stretch">
                    
                    {/* Draw stack */}
                    <div className="bg-neutral-920 p-4 rounded-xl border border-neutral-800 shadow-xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-neutral-200 block">DRAW DECK</span>
                        <p className="text-[10px] font-mono text-neutral-500">Click to draw from {whotGameState.deckCount} total cards remaining</p>
                      </div>
                      <button
                        onClick={handleHumanDrawCard}
                        disabled={whotGameState.activePlayerId !== userProfile.uid || whotGameState.status === 'completed'}
                        className={`w-20 h-28 rounded-xl border-2 bg-neutral-950 border-neutral-850 text-white text-xs font-bold transition-all relative cursor-pointer flex flex-col items-center justify-center select-none shadow-xl ${
                          whotGameState.activePlayerId === userProfile.uid && whotGameState.status !== 'completed'
                            ? 'hover:scale-103 ring-2 ring-emerald-400/60 border-emerald-450'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <Layers className="w-5 h-5 text-neutral-500 animate-pulse mb-2" />
                        <span className="text-[10px] font-mono text-neutral-300">DRAW</span>
                        <span className="text-[9px] font-mono p-1 bg-neutral-900 rounded-md mt-1 border border-neutral-800">{whotGameState.deckCount} left</span>
                      </button>
                    </div>

                    {/* Alerts panel */}
                    <div className="bg-neutral-920 p-4.5 rounded-xl border border-neutral-800 text-xs text-neutral-300 leading-relaxed font-sans space-y-2">
                      <div className="flex items-center gap-2 text-neutral-200 font-bold">
                        <Hash className="w-4 h-4 text-emerald-400" />
                        <span>Live State Feed:</span>
                      </div>
                      <p className="font-mono text-[11px] text-emerald-450 bg-neutral-950 p-2 border border-neutral-800 rounded-lg">
                        {whotGameState.lastActionMessage}
                      </p>
                      {whotGameState.penaltyCount > 0 && (
                        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-900/40 p-2 rounded-lg animate-pulse">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span>PICK PENALTY OF {whotGameState.penaltyCount} CARDS ACTIVE! PLAY ACTION OF SAME VALUE OR DRAW!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Suit declaration overlay choice card */}
                <AnimatePresence>
                  {selectedSuitToClaim && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 bg-neutral-950/80 flex flex-col items-center justify-center z-30 p-4"
                    >
                      <div className="bg-neutral-900 p-5 rounded-2xl max-w-sm w-full space-y-4 text-center border-2 border-amber-500/40 shadow-2xl">
                        <div className="p-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-lg inline-block text-xs font-semibold">★ WILD WHOT 20 CARD PLAYED</div>
                        <h4 className="font-sans font-bold text-neutral-100 text-sm">Declare Suit/Shape obligation</h4>
                        <p className="text-xs text-neutral-450">Pick the required suite next player must match.</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {(['Circles', 'Triangles', 'Crosses', 'Stars', 'Squares'] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => handleClaimSuitSelection(s)}
                              className="py-2.5 px-3 border border-neutral-800 rounded-xl hover:border-amber-400 font-medium transition-all text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
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
                <div className="space-y-3.5 border-t border-neutral-800 pt-5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-400" />
                      YOUR HAND ({whotGameState.playerHands[userProfile.uid]?.length || 0} cards)
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {whotGameState.activePlayerId === userProfile.uid ? '● YOUR MOVE (Click valid card to play)' : 'WAITING FOR OPPA TEAM...'}
                    </span>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto pb-5 pt-1.5 scrollbar-thin select-none max-w-full justify-start">
                    {whotGameState.playerHands[userProfile.uid]?.map((card) => 
                      renderWhotCard(card, true, () => handlePlayCard(card))
                    )}
                  </div>
                </div>

              </div>
            ) : activeChallenge?.gameType === 'Ludo' ? (
              <InteractiveLudoBoard
                entryFee={activeChallenge.entryFee}
                opponentName={activeChallenge?.senderId === 'friend_user' ? activeChallenge.senderName : (selectedBot?.username || 'Bot')}
                opponentAvatar={activeChallenge?.senderId === 'friend_user' ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80' : (selectedBot?.avatar || '')}
                onGameOver={(winnerIsMe) => completeMatchWithOutcome(winnerIsMe)}
                onAddLog={(log) => setGamePlayLogs(prev => [log, ...prev])}
              />
            ) : (
              <InteractiveChessBoard
                entryFee={activeChallenge.entryFee}
                opponentName={activeChallenge?.senderId === 'friend_user' ? activeChallenge.senderName : (selectedBot?.username || 'Bot')}
                opponentAvatar={activeChallenge?.senderId === 'friend_user' ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80' : (selectedBot?.avatar || '')}
                onGameOver={(winnerIsMe) => completeMatchWithOutcome(winnerIsMe)}
                onAddLog={(log) => setGamePlayLogs(prev => [log, ...prev])}
              />
            )}
          </div>
        )}

        {/* Incoming/Outgoing match challenge banner overlay alerts */}
        <AnimatePresence>
          {activeChallenge && activeChallenge.status === 'pending' && (
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
                <div className="grid grid-cols-3 gap-2">
                  {(['Whot', 'Ludo', 'Chess'] as const).map((g) => (
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
    </div>
  );
};
