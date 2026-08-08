import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Star, 
  Send, 
  MessageSquare, 
  Gamepad2, 
  Check, 
  X, 
  ChevronLeft, 
  Brain, 
  Coins, 
  Sparkles,
  Award,
  Plus,
  MoreVertical,
  Archive,
  Flag,
  FolderArchive,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, ChatMessage, WalletTransaction } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { sanitizeFirestoreData } from '../utils/firestoreSanitizer';
import { ChatModerationService } from '../services/chatModeration';
import { ReportService } from '../services/reportService';

interface ChatTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  allProfiles: UserProfile[];
  setActiveTab: (tab: 'discover' | 'tournaments' | 'lobbies' | 'profile' | 'play-arena' | 'spectate' | 'chat') => void;
  setFriendChallenge: (challenge: {
    senderName: string;
    gameType: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe';
    entryFee: number;
    opponentType?: 'bot' | 'player';
    botDifficulty?: 'easy' | 'medium' | 'hard';
    rewardMultiplier?: number;
    sessionId?: string;
    isHost?: boolean;
  } | null) => void;
  addTransaction: (tx: WalletTransaction) => void;
}

interface ActiveChat {
  id: string; // user uid or group name
  name: string;
  avatar: string;
  isGroup: boolean;
  status?: 'online' | 'offline' | 'in-game';
  wins?: number;
  coins?: number;
  rawProfile?: UserProfile;
}

const GAME_GROUPS = [
  { id: 'Group_Chess', name: 'Cyber Chess Lounge', avatar: '♟️', gameType: 'Chess', desc: 'Tactical diagonal Chess wagers and strategies.' },
  { id: 'Group_Ludo', name: 'Ludo Quadrant Matrix', avatar: '🎲', gameType: 'Ludo', desc: 'Coordinate multiplayer Ludo tables and matches.' },
  { id: 'Group_Whot', name: 'Whot Card Lounge', avatar: '🃏', gameType: 'Whot', desc: 'Connect for Whot card matches and wagers.' },
  { id: 'Group_Draft', name: 'Drafts Diagonal Matrix', avatar: '🔴', gameType: 'Draft', desc: 'Discuss checkers and drafts gameplay tactics.' }
];

const parseTimestamp = (rawTimestamp: any): string => {
  if (!rawTimestamp) {
    return new Date().toISOString();
  }
  if (typeof rawTimestamp.toDate === 'function') {
    try {
      return rawTimestamp.toDate().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
  if (typeof rawTimestamp === 'object' && typeof rawTimestamp.seconds === 'number') {
    return new Date(rawTimestamp.seconds * 1000).toISOString();
  }
  if (typeof rawTimestamp === 'string') {
    return rawTimestamp;
  }
  if (typeof rawTimestamp === 'number') {
    return new Date(rawTimestamp).toISOString();
  }
  return new Date().toISOString();
};

const getMsgTime = (ts: any): number => {
  if (!ts) return Date.now();
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (typeof ts === 'object' && typeof ts.seconds === 'number') return ts.seconds * 1000;
  const d = new Date(ts);
  if (!isNaN(d.getTime())) return d.getTime();
  return Date.now();
};

export const ChatTab: React.FC<ChatTabProps> = ({
  userProfile,
  setUserProfile,
  allProfiles,
  setActiveTab,
  setFriendChallenge,
  addTransaction
}) => {
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'recents' | 'groups' | 'favorites'>('recents');
  
  // Real-time direct chats
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Add Friend Modal/Overlay state
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendSearch, setAddFriendSearch] = useState('');

  // Dropdown menu state
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Archive panel state
  const [showArchivedList, setShowArchivedList] = useState(false);

  // Report Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<'toxicity' | 'cheating' | 'spam' | 'other'>('toxicity');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  
  // Challenge overlay state
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeGame, setChallengeGame] = useState<'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe'>('Chess');
  const [challengeStake, setChallengeStake] = useState<number>(250);

  // Group latest messages tracker to show unread states locally
  const [groupLatestMessages, setGroupLatestMessages] = useState<Record<string, { text: string; timestamp: string }>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for recent direct chats
  useEffect(() => {
    if (!userProfile) return;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('users', 'array-contains', userProfile.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        chats.push({
          id: docSnap.id,
          ...data,
          timestamp: parseTimestamp(data.timestamp)
        });
      });
      // Sort by timestamp descending
      chats.sort((a, b) => getMsgTime(b.timestamp) - getMsgTime(a.timestamp));
      setRecentChats(chats);
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);

  // Listen to Game Group chats metadata to track latest message timestamps
  useEffect(() => {
    const unsubscribes = GAME_GROUPS.map(group => {
      const groupRef = doc(db, 'group_chats', group.id);
      return onSnapshot(groupRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGroupLatestMessages(prev => ({
            ...prev,
            [group.id]: {
              text: data.lastMessage || 'No messages yet',
              timestamp: parseTimestamp(data.timestamp)
            }
          }));
        }
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  // Reset unread count for current user when selecting/viewing a direct chat
  useEffect(() => {
    if (!activeChat || activeChat.isGroup || !userProfile) return;

    const chatId = userProfile.uid < activeChat.id
      ? `${userProfile.uid}_${activeChat.id}`
      : `${activeChat.id}_${userProfile.uid}`;

    const existingChat = recentChats.find(c => c.id === chatId);
    if (existingChat && existingChat.unreadCount?.[userProfile.uid] > 0) {
      const chatRef = doc(db, 'chats', chatId);
      setDoc(chatRef, {
        unreadCount: {
          ...(existingChat.unreadCount || {}),
          [userProfile.uid]: 0
        }
      }, { merge: true }).catch(err => console.error("Error resetting unread count:", err));
    }
  }, [activeChat, recentChats, userProfile]);

  // Update local last viewed timestamp when viewing a group chat
  useEffect(() => {
    if (activeChat && activeChat.isGroup) {
      localStorage.setItem(`lastViewedGroup_${activeChat.id}`, new Date().toISOString());
      // Force component re-render to update badges
      setGroupLatestMessages(prev => ({ ...prev }));
    }
  }, [activeChat]);

  // Sync active conversation messages
  useEffect(() => {
    if (!userProfile || !activeChat) {
      setChatMessages([]);
      return;
    }

    let unsubscribe: () => void;

    if (activeChat.isGroup) {
      // Listen to group chat messages
      const messagesRef = collection(db, 'group_chats', activeChat.id, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          msgs.push({
            id: docSnap.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            text: data.text,
            timestamp: parseTimestamp(data.timestamp)
          } as ChatMessage);
        });
        msgs.sort((a, b) => getMsgTime(a.timestamp) - getMsgTime(b.timestamp));
        setChatMessages(msgs);
      });
    } else {
      // Listen to direct message chat messages
      const chatId = userProfile.uid < activeChat.id
        ? `${userProfile.uid}_${activeChat.id}`
        : `${activeChat.id}_${userProfile.uid}`;

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          msgs.push({
            id: docSnap.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            text: data.text,
            timestamp: parseTimestamp(data.timestamp),
            isChallenge: data.isChallenge,
            challengeId: data.challengeId,
            sessionId: data.sessionId,
            gameType: data.gameType,
            entryFee: data.entryFee,
            challengeStatus: data.challengeStatus
          } as ChatMessage);
        });
        msgs.sort((a, b) => getMsgTime(a.timestamp) - getMsgTime(b.timestamp));
        setChatMessages(msgs);

        // Auto join if sender's challenge was accepted
        const acceptedForMe = msgs.find(m => m.isChallenge && m.senderId === userProfile.uid && m.challengeStatus === 'accepted' && m.sessionId);
        if (acceptedForMe && acceptedForMe.gameType && acceptedForMe.entryFee) {
          // Join match as host
          setFriendChallenge({
            senderName: activeChat.name,
            gameType: acceptedForMe.gameType,
            entryFee: acceptedForMe.entryFee,
            opponentType: 'player',
            sessionId: acceptedForMe.sessionId,
            isHost: true
          });
          setActiveTab('lobbies');
        }
      });
    }

    return () => unsubscribe();
  }, [userProfile, activeChat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeChat]);

  // Toggle favorite helper
  const handleToggleFavorite = (targetId: string) => {
    setUserProfile(prev => {
      if (!prev) return null;
      const currentFavorites = prev.favorites || [];
      const isFav = currentFavorites.includes(targetId);
      const nextFavorites = isFav
        ? currentFavorites.filter(uid => uid !== targetId)
        : [...currentFavorites, targetId];
      return {
        ...prev,
        favorites: nextFavorites
      };
    });
  };

  // Toggle archive helper
  const handleToggleArchive = (targetId: string) => {
    setUserProfile(prev => {
      if (!prev) return null;
      const currentArchived = prev.archived || [];
      const isArchived = currentArchived.includes(targetId);
      const nextArchived = isArchived
        ? currentArchived.filter(id => id !== targetId)
        : [...currentArchived, targetId];
      
      // If we are archiving the currently active chat, deselect it
      if (!isArchived && activeChat?.id === targetId) {
        setActiveChat(null);
      }

      return {
        ...prev,
        archived: nextArchived
      };
    });
    setShowOptionsMenu(false);
  };

  // Submit User Report
  const handleSubmitReport = async () => {
    if (!userProfile || !activeChat || activeChat.isGroup) return;
    setReportSubmitting(true);
    try {
      await ReportService.submitReport(
        userProfile.uid,
        activeChat.id,
        reportReason,
        reportDescription
      );
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportDescription('');
      }, 1500);
    } catch (err) {
      console.error("Report submit error:", err);
      alert("Failed to submit user report. Please try again.");
    } finally {
      setReportSubmitting(false);
    }
  };

  // Send message helper
  const handleSendMessage = async (text: string, isChallengeMsg = false, challengeData?: any) => {
    const textTrimmed = text.trim();
    if (!textTrimmed && !isChallengeMsg) return;
    if (!userProfile || !activeChat) return;

    const cleanText = ChatModerationService.filterMessage(textTrimmed);

    if (activeChat.isGroup) {
      // 1. Group message send
      try {
        const groupRef = doc(db, 'group_chats', activeChat.id);
        await setDoc(groupRef, {
          lastMessage: `${userProfile.username}: ${cleanText}`,
          lastSenderId: userProfile.uid,
          lastSenderName: userProfile.username,
          timestamp: serverTimestamp()
        }, { merge: true });

        const messagesRef = collection(db, 'group_chats', activeChat.id, 'messages');
        await addDoc(messagesRef, {
          senderId: userProfile.uid,
          senderName: userProfile.username,
          senderAvatar: userProfile.avatar,
          text: cleanText,
          timestamp: serverTimestamp()
        });
        setInputMessage('');
      } catch (err) {
        console.error("Group message send error:", err);
      }
    } else {
      // 2. Direct message send
      const chatId = userProfile.uid < activeChat.id
        ? `${userProfile.uid}_${activeChat.id}`
        : `${activeChat.id}_${userProfile.uid}`;

      const existingChat = recentChats.find(c => c.id === chatId);
      const recipientUnread = existingChat?.unreadCount?.[activeChat.id] || 0;
      const newRecipientUnread = recipientUnread + 1;

      try {
        const chatRef = doc(db, 'chats', chatId);
        await setDoc(chatRef, {
          lastMessage: isChallengeMsg ? `Challenge: ${challengeData.gameType}` : cleanText,
          lastSenderId: userProfile.uid,
          timestamp: serverTimestamp(),
          users: [userProfile.uid, activeChat.id],
          unreadCount: {
            ...(existingChat?.unreadCount || {}),
            [activeChat.id]: newRecipientUnread,
            [userProfile.uid]: 0
          }
        }, { merge: true });

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const msgObj: any = {
          senderId: userProfile.uid,
          senderName: userProfile.username,
          senderAvatar: userProfile.avatar,
          text: isChallengeMsg ? `Staked Duel Challenge: ${challengeData.gameType}` : cleanText,
          timestamp: serverTimestamp()
        };

        if (isChallengeMsg && challengeData) {
          msgObj.isChallenge = true;
          msgObj.challengeId = `CHALL-CHAT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
          msgObj.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          msgObj.gameType = challengeData.gameType;
          msgObj.entryFee = challengeData.entryFee;
          msgObj.challengeStatus = 'pending';

          // Also dispatch real-time Firestore notification document to opponent
          const notifRef = collection(db, 'notifications');
          addDoc(notifRef, sanitizeFirestoreData({
            receiverId: activeChat.id || 'all',
            receiverName: activeChat.name || 'Challenger',
            senderId: userProfile.uid || 'sender',
            senderName: userProfile.username || 'Sender',
            senderAvatar: userProfile.avatar || '',
            type: 'challenge',
            title: '⚔️ Live Duel Challenge Received!',
            message: `${userProfile.username} has challenged you to a ${challengeData.gameType} match for ${challengeData.entryFee} Coins!`,
            gameType: challengeData.gameType,
            entryFee: challengeData.entryFee,
            sessionId: msgObj.sessionId,
            timestamp: Date.now(),
            timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            status: 'pending'
          })).catch(console.warn);
        }

        await addDoc(messagesRef, sanitizeFirestoreData(msgObj));
        if (!isChallengeMsg) {
          setInputMessage('');
        }
      } catch (err) {
        console.error("Direct message send error:", err);
      }
    }
  };

  // Accept Challenge handler
  const handleAcceptChallenge = async (msg: ChatMessage) => {
    if (!userProfile || !activeChat || activeChat.isGroup || !msg.entryFee || !msg.gameType) return;

    if (userProfile.coins < msg.entryFee) {
      alert(`Stake Lock Error: You have ${userProfile.coins} coins but this challenge stake is ${msg.entryFee} coins. Please claim some coins at the header faucet first.`);
      return;
    }

    const chatId = userProfile.uid < activeChat.id
      ? `${userProfile.uid}_${activeChat.id}`
      : `${activeChat.id}_${userProfile.uid}`;

    try {
      const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
      await setDoc(msgRef, { challengeStatus: 'accepted' }, { merge: true });

      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        lastMessage: `Challenge Accepted: ${msg.gameType}`,
        timestamp: serverTimestamp()
      }, { merge: true });

      const targetSessionId = msg.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      setFriendChallenge({
        senderName: activeChat.name,
        gameType: msg.gameType as any,
        entryFee: msg.entryFee,
        opponentType: 'player',
        sessionId: targetSessionId,
        isHost: false
      });
      setActiveTab('lobbies');
    } catch (err) {
      console.error("Accept challenge error:", err);
    }
  };

  // Decline Challenge handler
  const handleDeclineChallenge = async (msg: ChatMessage) => {
    if (!userProfile || !activeChat || activeChat.isGroup || !msg.gameType) return;

    const chatId = userProfile.uid < activeChat.id
      ? `${userProfile.uid}_${activeChat.id}`
      : `${activeChat.id}_${userProfile.uid}`;

    try {
      const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
      await setDoc(msgRef, { challengeStatus: 'declined' }, { merge: true });

      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        lastMessage: `Challenge Declined: ${msg.gameType}`,
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Decline challenge error:", err);
    }
  };

  // Create or retrieve direct chat doc on manual search selection
  const handleInitializeManualChat = async (selectedUser: UserProfile) => {
    if (!userProfile) return;
    const chatId = userProfile.uid < selectedUser.uid
      ? `${userProfile.uid}_${selectedUser.uid}`
      : `${selectedUser.uid}_${userProfile.uid}`;

    try {
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        users: [userProfile.uid, selectedUser.uid],
        lastMessage: "Chat started",
        lastSenderId: "",
        timestamp: serverTimestamp(),
        unreadCount: {
          [userProfile.uid]: 0,
          [selectedUser.uid]: 0
        }
      }, { merge: true });

      setActiveChat({
        id: selectedUser.uid,
        name: selectedUser.username,
        avatar: selectedUser.avatar,
        isGroup: false,
        status: selectedUser.status,
        wins: selectedUser.wins,
        coins: selectedUser.coins,
        rawProfile: selectedUser
      });

      setShowAddFriendModal(false);
      setAddFriendSearch('');
    } catch (err) {
      console.error("Chat initialization error:", err);
    }
  };

  // Filter lists based on states (excluding archived chats unless explicitly viewing archives)
  const archivedIds = userProfile.archived || [];
  const currentFavorites = userProfile.favorites || [];

  // 1. Direct chats list (DMs)
  const getFilteredDMs = () => {
    let list = recentChats.map(c => {
      const otherUid = c.users.find((uid: string) => uid !== userProfile.uid);
      const profile = allProfiles.find(p => p.uid === otherUid);
      return {
        chatId: c.id,
        unreadCount: c.unreadCount?.[userProfile.uid] || 0,
        lastMessage: c.lastMessage,
        lastSenderId: c.lastSenderId,
        timestamp: c.timestamp,
        profile: profile || {
          uid: otherUid,
          username: 'Unknown Gamer',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          status: 'offline',
          wins: 0,
          losses: 0,
          draws: 0,
          coins: 0
        }
      };
    }).filter(item => item.profile.uid);

    // Apply Search
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      list = list.filter(item => item.profile.username.toLowerCase().includes(qLower));
    }

    // Exclude archived
    list = list.filter(item => !archivedIds.includes(item.profile.uid));

    // Favorites filter
    if (filterMode === 'favorites') {
      list = list.filter(item => currentFavorites.includes(item.profile.uid));
    }

    return list;
  };

  // 2. Groups list
  const getFilteredGroups = () => {
    let list = GAME_GROUPS.map(group => {
      const latest = groupLatestMessages[group.id] || { text: 'No messages yet', timestamp: new Date(0).toISOString() };
      
      // Calculate local unread indicator
      const lastViewed = localStorage.getItem(`lastViewedGroup_${group.id}`) || new Date(0).toISOString();
      const hasUnread = new Date(latest.timestamp).getTime() > new Date(lastViewed).getTime();

      return {
        ...group,
        lastMessage: latest.text,
        timestamp: latest.timestamp,
        hasUnread
      };
    });

    // Apply Search
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      list = list.filter(item => item.name.toLowerCase().includes(qLower));
    }

    // Exclude archived
    list = list.filter(item => !archivedIds.includes(item.id));

    // Favorites filter
    if (filterMode === 'favorites') {
      list = list.filter(item => currentFavorites.includes(item.id));
    }

    return list;
  };

  // 3. Archived List Directory
  const getArchivedItems = () => {
    // Collect direct chats that are archived
    const directArchived = recentChats.map(c => {
      const otherUid = c.users.find((uid: string) => uid !== userProfile.uid);
      if (!archivedIds.includes(otherUid)) return null;
      const profile = allProfiles.find(p => p.uid === otherUid);
      return {
        id: otherUid,
        name: profile?.username || 'Unknown Gamer',
        avatar: profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        isGroup: false,
        lastMessage: c.lastMessage
      };
    }).filter(Boolean);

    // Collect groups that are archived
    const groupsArchived = GAME_GROUPS.filter(g => archivedIds.includes(g.id)).map(g => ({
      id: g.id,
      name: g.name,
      avatar: g.avatar,
      isGroup: true,
      lastMessage: groupLatestMessages[g.id]?.text || 'No messages yet'
    }));

    return [...directArchived, ...groupsArchived];
  };

  const directList = getFilteredDMs();
  const groupList = getFilteredGroups();
  const archivedList = getArchivedItems();

  // Add friend list (filter out profiles already in active recents)
  const getAddFriendList = () => {
    const activeRecentUids = recentChats.map(c => c.users.find((uid: string) => uid !== userProfile.uid));
    let list = allProfiles.filter(p => p.uid !== userProfile.uid && !activeRecentUids.includes(p.uid));

    if (addFriendSearch.trim()) {
      const qLower = addFriendSearch.toLowerCase();
      list = list.filter(p => p.username.toLowerCase().includes(qLower));
    }
    return list;
  };

  const addFriendList = getAddFriendList();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[78vh] md:h-[82vh] max-w-7xl mx-auto relative" id="chat-dashboard-tab">
      
      {/* LEFT COLUMN: Sidebar (Directory list / search / add / filters) */}
      <div className={`lg:col-span-4 bg-[#0B0B0E]/70 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-5 flex flex-col h-full shadow-[0_4px_30px_rgba(0,0,0,0.5)] ${
        activeChat ? 'hidden lg:flex' : 'flex'
      }`}>
        
        {/* Search Input and Add (+) Icon Row */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search chat sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070709] border border-white/[0.06] focus:border-purple-500/50 rounded-2xl pl-10 pr-4 py-3.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all text-white placeholder-neutral-500"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddFriendModal(true)}
            className="p-3 bg-[#070709] hover:bg-purple-500/10 border border-white/[0.06] hover:border-purple-500/35 rounded-2xl text-purple-400 hover:text-purple-300 transition-all cursor-pointer shadow-md shrink-0 flex items-center justify-center w-[46px] h-[46px]"
            title="Start chat with new player"
          >
            <Plus className="w-5 h-5 stroke-[2.5px]" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 border border-white/[0.04] rounded-2xl mb-4 select-none">
          <button
            type="button"
            onClick={() => setFilterMode('recents')}
            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider font-display transition-all cursor-pointer ${
              filterMode === 'recents'
                ? 'bg-purple-350 text-[#070709]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Recents
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('groups')}
            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider font-display transition-all cursor-pointer ${
              filterMode === 'groups'
                ? 'bg-purple-350 text-[#070709]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Groups
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('favorites')}
            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider font-display transition-all cursor-pointer ${
              filterMode === 'favorites'
                ? 'bg-purple-350 text-[#070709]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Favorites
          </button>
        </div>

        {/* Directory Lists */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-purple-950 scrollbar-track-transparent">
          
          {/* RENDER GROUPS LIST */}
          {filterMode === 'groups' && (
            groupList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-neutral-500">
                <Brain className="w-8 h-8 text-neutral-600 mb-2" />
                <p className="text-xs font-mono uppercase tracking-wider">No Groups Found</p>
              </div>
            ) : (
              groupList.map(group => {
                const isSelected = activeChat?.id === group.id;
                const isFav = currentFavorites.includes(group.id);

                return (
                  <div
                    key={group.id}
                    onClick={() => setActiveChat({ id: group.id, name: group.name, avatar: group.avatar, isGroup: true })}
                    className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-500/50 shadow-inner'
                        : 'bg-neutral-900/40 border-white/[0.03] hover:border-white/[0.08] hover:bg-neutral-800/35'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="shrink-0 text-xl w-10 h-10 bg-neutral-950/60 rounded-full flex items-center justify-center border border-white/[0.05] relative">
                        {group.avatar}
                        {group.hasUnread && !isSelected && (
                          <span className="absolute top-0 right-0 w-3 h-3 bg-purple-500 border border-[#070709] rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
                        )}
                      </div>
                      <div className="text-left min-w-0">
                        <span className="block text-xs font-bold font-display text-white group-hover:text-purple-300 transition-colors truncate">
                          {group.name}
                        </span>
                        <span className="block text-[10px] text-neutral-400 font-sans truncate pr-2">
                          {group.lastMessage}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(group.id);
                      }}
                      className="p-2 bg-neutral-950/40 hover:bg-neutral-900 border border-white/[0.04] rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      <Star className={`w-3.5 h-3.5 ${
                        isFav ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_3px_rgba(245,158,11,0.4)]' : 'text-neutral-500 hover:text-amber-400'
                      }`} />
                    </button>
                  </div>
                );
              })
            )
          )}

          {/* RENDER RECENTS OR FAVORITES (DMs) */}
          {filterMode !== 'groups' && (
            directList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-neutral-500">
                <MessageSquare className="w-8 h-8 text-neutral-600 mb-2.5 animate-pulse" />
                <p className="text-xs font-mono uppercase tracking-wider">No conversations found</p>
                <p className="text-[10px] text-neutral-600 mt-1 max-w-[200px]">
                  {filterMode === 'favorites' 
                    ? 'No favorite chats marked.' 
                    : 'Click the "+" button to find users and start a chat!'}
                </p>
              </div>
            ) : (
              directList.map((item) => {
                const isSelected = activeChat?.id === item.profile.uid;
                const isFav = currentFavorites.includes(item.profile.uid);

                return (
                  <div
                    key={item.profile.uid}
                    onClick={() => setActiveChat({
                      id: item.profile.uid,
                      name: item.profile.username,
                      avatar: item.profile.avatar,
                      isGroup: false,
                      status: item.profile.status,
                      wins: item.profile.wins,
                      coins: item.profile.coins,
                      rawProfile: item.profile as UserProfile
                    })}
                    className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-500/50 shadow-inner'
                        : 'bg-neutral-900/40 border-white/[0.03] hover:border-white/[0.08] hover:bg-neutral-800/35'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className={`p-0.5 rounded-full overflow-hidden w-10 h-10 border ${
                          isSelected ? 'border-purple-400' : 'border-neutral-700 group-hover:border-purple-500/50'
                        } transition-colors`}>
                          <img 
                            src={item.profile.avatar} 
                            alt={item.profile.username} 
                            className="w-full h-full rounded-full object-cover" 
                          />
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#070709] rounded-full ${
                          item.profile.status === 'online'
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            : item.profile.status === 'in-game'
                            ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'
                            : 'bg-neutral-500'
                        }`} />
                      </div>

                      <div className="text-left min-w-0">
                        <span className="block text-xs font-bold font-display text-white group-hover:text-purple-300 transition-colors truncate">
                          {item.profile.username}
                        </span>
                        <span className="block text-[10px] text-neutral-400 font-sans truncate pr-2">
                          {item.lastSenderId === userProfile.uid ? 'You: ' : ''}
                          {item.lastMessage}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Unread count badge */}
                      {item.unreadCount > 0 && !isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white animate-pulse">
                          {item.unreadCount}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item.profile.uid);
                        }}
                        className="p-2 bg-neutral-950/40 hover:bg-neutral-900 border border-white/[0.04] rounded-xl transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                      >
                        <Star className={`w-3.5 h-3.5 ${
                          isFav ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_3px_rgba(245,158,11,0.4)]' : 'text-neutral-500 hover:text-amber-400'
                        }`} />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* BOTTOM SECTION: Archived folder directory */}
        <div className="border-t border-white/[0.05] pt-3 mt-3">
          <button
            type="button"
            onClick={() => setShowArchivedList(prev => !prev)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer font-sans text-xs ${
              showArchivedList 
                ? 'bg-neutral-950 border-white/[0.08] text-white font-bold'
                : 'bg-neutral-900/30 border-white/[0.03] text-neutral-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-purple-400" />
              <span>Archived Directory</span>
            </div>
            <span className="bg-[#070709] border border-white/[0.06] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full text-neutral-500">
              {archivedList.length}
            </span>
          </button>

          {/* Archived list accordion drop */}
          <AnimatePresence>
            {showArchivedList && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-2 max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-purple-950"
              >
                {archivedList.length === 0 ? (
                  <div className="text-center py-4 text-[10px] font-mono text-neutral-600 uppercase">
                    Archive Folder Empty
                  </div>
                ) : (
                  archivedList.map(item => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-2.5 bg-black/30 border border-white/[0.02] rounded-xl text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.isGroup ? (
                          <div className="shrink-0 text-base w-7 h-7 bg-neutral-950/60 rounded-full flex items-center justify-center border border-white/[0.04]">
                            {item.avatar}
                          </div>
                        ) : (
                          <div className="shrink-0 w-7 h-7 rounded-full overflow-hidden border border-white/[0.04]">
                            <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="block text-[11px] font-bold text-neutral-300 truncate">{item.name}</span>
                          <span className="block text-[9px] text-neutral-500 truncate max-w-[150px]">{item.lastMessage}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleArchive(item.id)}
                        className="p-1.5 bg-neutral-950/40 hover:bg-neutral-900 border border-white/[0.04] rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                        title="Unarchive Chat"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat Board */}
      <div className={`lg:col-span-8 bg-[#0B0B0E]/70 backdrop-blur-xl border border-white/[0.05] rounded-3xl flex flex-col h-full overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative ${
        !activeChat ? 'hidden lg:flex justify-center items-center' : 'flex'
      }`}>
        
        {/* State: No Chat Selected */}
        {!activeChat ? (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-5">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-tr from-purple-500/20 via-cyan-500/10 to-transparent border border-purple-500/30 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/20 relative z-10">
                <MessageSquare className="w-10 h-10 text-purple-400" />
              </div>
              <span className="absolute -top-2 -right-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 p-1.5 rounded-full text-[10px] shadow-md z-20">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-2">
              <span className="bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider">
                COMMUNICATION MATRIX HUB
              </span>
              <h3 className="text-xl font-black text-white font-display uppercase tracking-tight">
                Duellio Gaming Messenger
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-md mx-auto">
                Select an active conversation from the sidebar, join a public game matrix channel, or start a new direct challenge message with an online player.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowAddFriendModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-[#ebd3ff] hover:bg-[#dfbeff] text-neutral-950 font-display text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-500/20 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5px]" />
                <span>+ Start Friend Chat</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setFilterMode('groups');
                  setActiveChat({
                    id: GAME_GROUPS[0].id,
                    name: GAME_GROUPS[0].name,
                    avatar: GAME_GROUPS[0].avatar,
                    isGroup: true
                  });
                }}
                className="px-4 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-850 border border-white/10 text-white font-mono text-[10px] uppercase font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Gamepad2 className="w-4 h-4 text-purple-400" />
                <span>♟️ Join Chess Lounge</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header block */}
            <div className="px-5 py-4 bg-black/30 border-b border-b-white/[0.05] flex items-center justify-between gap-4 shrink-0 relative z-30">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Back button (Mobile view only) */}
                <button
                  type="button"
                  onClick={() => setActiveChat(null)}
                  className="lg:hidden p-2 text-neutral-400 hover:text-white bg-white/[0.04] border border-white/[0.05] rounded-xl cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {activeChat.isGroup ? (
                  <div className="shrink-0 text-2xl w-10 h-10 bg-neutral-950/60 rounded-full flex items-center justify-center border border-white/[0.05]">
                    {activeChat.avatar}
                  </div>
                ) : (
                  <div className="relative shrink-0">
                    <div className="p-0.5 rounded-full border border-purple-500/40 w-10 h-10 overflow-hidden">
                      <img 
                        src={activeChat.avatar} 
                        alt={activeChat.name} 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#070709] rounded-full ${
                      activeChat.status === 'online'
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : activeChat.status === 'in-game'
                        ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'
                        : 'bg-neutral-500'
                    }`} />
                  </div>
                )}

                <div className="text-left min-w-0">
                  <h4 className="text-xs font-black font-display text-white tracking-tight leading-none truncate">
                    {activeChat.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {!activeChat.isGroup ? (
                      <>
                        <span className="text-[9px] font-mono text-purple-400 font-semibold bg-purple-950/20 border border-purple-500/10 px-1.5 py-0.5 rounded-sm uppercase">
                          {activeChat.wins} Victories
                        </span>
                        <span className="text-[9px] font-mono text-neutral-500 uppercase">
                          {activeChat.status === 'in-game' ? 'Playing' : activeChat.status}
                        </span>
                      </>
                    ) : (
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">
                        Active Game Group Channel
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-2">
                {/* Favorite Star */}
                <button
                  type="button"
                  onClick={() => handleToggleFavorite(activeChat.id)}
                  className="p-2.5 bg-neutral-900/60 hover:bg-neutral-800 border border-white/[0.05] rounded-xl transition-all cursor-pointer"
                  title={currentFavorites.includes(activeChat.id) ? "Starred Chat" : "Star Chat"}
                >
                  <Star className={`w-4 h-4 ${
                    currentFavorites.includes(activeChat.id)
                      ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_3px_rgba(245,158,11,0.4)]'
                      : 'text-neutral-400 hover:text-amber-400'
                  }`} />
                </button>

                {/* Challenge button (Direct chats only) */}
                {!activeChat.isGroup && (
                  <button
                    type="button"
                    onClick={() => setShowChallengeForm(prev => !prev)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer font-display text-[10px] font-black uppercase tracking-wider ${
                      showChallengeForm 
                        ? 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
                        : 'bg-purple-350 hover:bg-purple-400 text-neutral-950 font-black shadow-lg shadow-purple-500/10'
                    }`}
                  >
                    {showChallengeForm ? (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </>
                    ) : (
                      <>
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>Challenge</span>
                      </>
                    )}
                  </button>
                )}

                {/* Dropdown Options trigger */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowOptionsMenu(prev => !prev)}
                    className="p-2.5 bg-neutral-900/60 hover:bg-neutral-800 border border-white/[0.05] rounded-xl transition-all cursor-pointer text-neutral-400 hover:text-white"
                    title="Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown popover */}
                  <AnimatePresence>
                    {showOptionsMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 mt-2 w-48 bg-[#0F0F14] border border-white/[0.08] rounded-xl shadow-2xl p-1.5 z-40"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(activeChat.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-sans hover:bg-white/[0.04] text-neutral-300 hover:text-white rounded-lg transition-all cursor-pointer"
                        >
                          <Archive className="w-4 h-4 text-purple-400" />
                          <span>{archivedIds.includes(activeChat.id) ? 'Unarchive Session' : 'Archive Session'}</span>
                        </button>

                        {!activeChat.isGroup && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowReportModal(true);
                              setShowOptionsMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-sans hover:bg-red-500/10 text-neutral-300 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                          >
                            <Flag className="w-4 h-4 text-red-500" />
                            <span>Report Player</span>
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* MESSAGES DISPLAY CORE */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-black/10 scrollbar-thin scrollbar-thumb-purple-950 scrollbar-track-transparent relative">
              
              {/* Staking challenge overlay configuration panel */}
              <AnimatePresence>
                {showChallengeForm && !activeChat.isGroup && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-4 left-5 right-5 z-20 bg-[#0F0F14] border border-purple-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.8)] rounded-2xl p-5"
                  >
                    <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <h5 className="text-xs font-black font-display text-white uppercase tracking-wider">Configure Staked Duel</h5>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setShowChallengeForm(false)}
                        className="p-1 hover:bg-white/5 rounded-md text-neutral-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Game selector */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Select Board Module</label>
                        <div className="grid grid-cols-5 gap-1 p-1 bg-black/40 border border-white/[0.04] rounded-xl">
                          {(['Chess', 'Ludo', 'Whot', 'Draft', 'TicTacToe'] as const).map(game => (
                            <button
                              key={game}
                              type="button"
                              onClick={() => setChallengeGame(game)}
                              className={`py-1.5 rounded-lg text-[9px] font-black uppercase font-display cursor-pointer transition-all ${
                                challengeGame === game
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'text-neutral-500 hover:text-neutral-350'
                              }`}
                            >
                              {game}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stake selector */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Entry Stake Fee (Coins)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100000"
                            value={challengeStake}
                            onChange={(e) => setChallengeStake(Math.max(0, parseInt(e.target.value) || 0))}
                            className="bg-black/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-purple-500/50 w-24 text-white"
                          />
                          <div className="flex gap-1 flex-1">
                            {[100, 250, 500, 1000].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setChallengeStake(val)}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-mono font-bold cursor-pointer transition-all border ${
                                  challengeStake === val
                                    ? 'bg-purple-350 text-neutral-950 border-purple-400 font-bold'
                                    : 'bg-black/40 text-neutral-400 border-white/[0.04] hover:border-white/[0.08]'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/[0.05] flex justify-between items-center gap-3">
                      <div className="text-left font-sans text-[10px] text-neutral-500 leading-tight">
                        Escrow requires <strong className="text-purple-300 font-semibold">{challengeStake} Coins</strong> lock from each player.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (userProfile.coins < challengeStake) {
                            alert(`Balance Warning: You have ${userProfile.coins} coins but you set the stake to ${challengeStake} coins. Please claim faucet coins first.`);
                            return;
                          }
                          handleSendMessage('', true, { gameType: challengeGame, entryFee: challengeStake });
                          setShowChallengeForm(false);
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-display text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center gap-1.5 animate-none"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Issue Duel Challenge</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-neutral-500">
                  <div className="w-12 h-12 bg-white/[0.02] border border-white/[0.04] rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5 text-neutral-600" />
                  </div>
                  <p className="text-xs font-mono uppercase tracking-wider">Secure Signal Online</p>
                  <p className="text-[9px] text-neutral-600 mt-1">Send a message to open this dialogue tunnel.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === userProfile.uid;
                  const msgDate = new Date(msg.timestamp);
                  const time = !isNaN(msgDate.getTime()) 
                    ? msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now';

                  // Handle challenge messages
                  if (msg.isChallenge && !activeChat.isGroup) {
                    const isPending = msg.challengeStatus === 'pending';
                    const isAccepted = msg.challengeStatus === 'accepted';
                    const isDeclined = msg.challengeStatus === 'declined';

                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
                      >
                        <div className={`p-4.5 rounded-2xl border flex flex-col gap-3 min-w-[280px] max-w-[90%] shadow-lg transition-all ${
                          isAccepted
                            ? 'bg-emerald-500/10 border-emerald-500/35 shadow-emerald-950/10'
                            : isDeclined
                            ? 'bg-red-500/10 border-red-500/35 shadow-red-950/10 text-neutral-400'
                            : 'bg-gradient-to-tr from-purple-950/20 to-indigo-950/20 border-purple-500/30 shadow-purple-950/10'
                        }`}>
                          <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                            <span className="flex items-center gap-1 text-[9px] font-mono font-bold tracking-widest text-purple-300 uppercase">
                              <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                              <span>Staked Gaming Duel</span>
                            </span>
                            <span className="text-[9px] font-mono text-neutral-500">{time}</span>
                          </div>

                          <div className="text-left space-y-1">
                            <span className="block text-xs font-black font-display tracking-tight text-white uppercase">
                              {msg.gameType} Challenge
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                              <Coins className="w-3.5 h-3.5 text-amber-500" />
                              <span>Stake Wager:</span>
                              <strong className="text-white font-bold">{(msg.entryFee || 0).toLocaleString()} Coins</strong>
                            </div>
                          </div>

                          {/* Challenge Actions block */}
                          <div className="pt-2 border-t border-white/[0.04]">
                            {isPending ? (
                              isMe ? (
                                <div className="text-right text-[9px] font-mono text-purple-400 uppercase tracking-wider animate-pulse flex items-center justify-end gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" />
                                  Waiting for Challenger...
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDeclineChallenge(msg)}
                                    className="py-1.5 px-3 rounded-lg bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-400 font-display text-[9px] uppercase font-bold cursor-pointer transition-all"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAcceptChallenge(msg)}
                                    className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-display text-[9px] uppercase font-black cursor-pointer transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1"
                                  >
                                    <Check className="w-3 h-3 stroke-[3px]" />
                                    Accept
                                  </button>
                                </div>
                              )
                            ) : isAccepted ? (
                              <div className="text-center py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] uppercase font-black tracking-wider rounded-lg">
                                Duel Combat Completed / Active
                              </div>
                            ) : (
                              <div className="text-center py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[9px] uppercase font-bold tracking-wider rounded-lg">
                                Challenge Declined
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Standard direct/group messages bubbles
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Avatar */}
                      <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden border border-white/[0.04] mt-0.5">
                        <img 
                          src={msg.senderAvatar} 
                          alt={msg.senderName} 
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>

                      {/* Bubble */}
                      <div className="space-y-1">
                        {/* Sender tag for group chats */}
                        {activeChat.isGroup && !isMe && (
                          <span className="block text-[9px] font-mono text-purple-400 font-bold text-left pl-1">
                            {msg.senderName}
                          </span>
                        )}
                        
                        <div className={`px-4 py-2.5 rounded-2xl relative shadow-md text-left ${
                          isMe 
                            ? 'bg-gradient-to-r from-purple-650 to-indigo-650 text-white rounded-tr-none border border-purple-500/10' 
                            : 'bg-[#15151D] border border-white/[0.05] text-neutral-100 rounded-tl-none'
                        }`}>
                          <p className="text-[11px] font-sans leading-relaxed text-left whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                        <div className={`text-[8px] font-mono text-neutral-500 uppercase ${isMe ? 'text-right' : 'text-left'}`}>
                          {time}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* CHAT INPUT FORM FOOTER */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }}
              className="p-4 bg-black/40 border-t border-white/[0.05] flex gap-3 shrink-0 select-none"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={activeChat.isGroup ? `Message ${activeChat.name} group...` : `Type secure response to ${activeChat.name}...`}
                className="bg-[#070709] border border-white/[0.06] focus:border-purple-500/50 rounded-xl px-4 py-3 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-purple-500/50 flex-1 text-white placeholder-neutral-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                title="Send Message"
                className={`flex items-center justify-center p-3 rounded-xl transition-all cursor-pointer ${
                  inputMessage.trim() 
                    ? 'bg-purple-350 hover:bg-purple-400 text-neutral-950 font-black shadow-lg shadow-purple-500/10' 
                    : 'bg-neutral-900 border border-white/[0.04] text-neutral-600 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* OVERLAY: Add Friend Modal */}
      <AnimatePresence>
        {showAddFriendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
              onClick={() => setShowAddFriendModal(false)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0B0B0E]/90 border border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl p-6 w-full max-w-md relative z-10 flex flex-col max-h-[75vh]"
            >
              <div className="flex justify-between items-center border-b border-white/[0.06] pb-3.5 mb-4 shrink-0">
                <h3 className="text-sm font-black font-display text-white uppercase tracking-wider">Start A New Chat</h3>
                <button
                  type="button"
                  onClick={() => setShowAddFriendModal(false)}
                  className="p-1 text-neutral-500 hover:text-white hover:bg-white/[0.04] rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Local search inside modal */}
              <div className="relative shrink-0 mb-4">
                <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search registered gamers..."
                  value={addFriendSearch}
                  onChange={(e) => setAddFriendSearch(e.target.value)}
                  className="w-full bg-[#070709] border border-white/[0.06] focus:border-purple-500/50 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-500/50 text-white placeholder-neutral-550"
                />
              </div>

              {/* Users scroll list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-purple-950 scrollbar-track-transparent">
                {addFriendList.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 text-xs font-mono uppercase">
                    All players added or offline
                  </div>
                ) : (
                  addFriendList.map(profile => (
                    <div
                      key={profile.uid}
                      onClick={() => handleInitializeManualChat(profile)}
                      className="flex items-center justify-between p-3 bg-neutral-900/40 border border-white/[0.03] hover:border-purple-500/35 hover:bg-purple-500/5 rounded-2xl cursor-pointer transition-all select-none group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 p-0.5 rounded-full border border-neutral-700 w-9 h-9 overflow-hidden">
                          <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div className="text-left min-w-0">
                          <span className="block text-xs font-bold font-display text-white group-hover:text-purple-300 transition-colors truncate">
                            {profile.username}
                          </span>
                          <span className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-500 uppercase mt-0.5">
                            <Award className="w-3 h-3 text-purple-400" />
                            <span>{profile.wins} Wins</span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInitializeManualChat(profile)}
                        className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl transition-all cursor-pointer text-[10px] font-mono font-bold uppercase"
                      >
                        Start Chat
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: Report User Modal */}
      <AnimatePresence>
        {showReportModal && activeChat && !activeChat.isGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
              onClick={() => { if (!reportSubmitting) setShowReportModal(false); }}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0B0B0E]/90 border border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl p-6 w-full max-w-md relative z-10"
            >
              {reportSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                    <Check className="w-6 h-6 stroke-[3px]" />
                  </div>
                  <h4 className="text-base font-black text-white font-display uppercase tracking-wider">Report Logged</h4>
                  <p className="text-xs text-neutral-400 mt-2">
                    Security Matchmakers have been notified. We will review logs and take appropriate actions.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-3.5 mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      <h3 className="text-sm font-black font-display text-white uppercase tracking-wider">Report Player</h3>
                    </div>
                    <button
                      type="button"
                      disabled={reportSubmitting}
                      onClick={() => setShowReportModal(false)}
                      className="p-1 text-neutral-500 hover:text-white hover:bg-white/[0.04] rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4 text-left">
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      You are reporting <strong className="text-white">{activeChat.name}</strong>. Please select the primary violation reason.
                    </p>

                    {/* Reason Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Reason</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['toxicity', 'cheating', 'spam', 'other'] as const).map(reason => (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => setReportReason(reason)}
                            className={`py-2 px-3.5 rounded-xl border text-left text-xs font-sans font-bold capitalize transition-all cursor-pointer ${
                              reportReason === reason
                                ? 'bg-red-500/15 border-red-500/40 text-red-400'
                                : 'bg-black/30 border-white/[0.03] text-neutral-400 hover:border-white/[0.08] hover:text-white'
                            }`}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description Textarea */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Description (Optional)</label>
                      <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Provide details about the behavior..."
                        rows={3}
                        className="w-full bg-[#070709] border border-white/[0.06] focus:border-red-500/40 rounded-xl p-3 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-red-500/40 text-white placeholder-neutral-550 resize-none"
                      />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3.5 pt-3 border-t border-white/[0.05] justify-end">
                      <button
                        type="button"
                        disabled={reportSubmitting}
                        onClick={() => setShowReportModal(false)}
                        className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white border border-white/[0.04] rounded-xl text-xs font-display font-bold uppercase transition-all cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitReport}
                        disabled={reportSubmitting}
                        className="px-4 py-2.5 bg-red-500 hover:bg-red-400 text-neutral-950 rounded-xl text-xs font-display font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-500/10 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {reportSubmitting ? (
                          <span className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5px]" />
                        )}
                        <span>Log Report</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
