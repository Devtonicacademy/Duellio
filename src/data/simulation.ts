/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, ChatMessage, MatchChallenge, WalletTransaction } from '../types';

export const BOT_PLAYERS: UserProfile[] = [
  {
    uid: 'bot_dotun',
    username: 'Dotun_WhotMaster',
    email: 'dotun@gamerplatform.io',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    wins: 412,
    losses: 231,
    draws: 88,
    coins: 4500,
    status: 'online'
  },
  {
    uid: 'bot_chidi',
    username: 'Chidi_LudoKing',
    email: 'chidi@gamerplatform.io',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    wins: 589,
    losses: 420,
    draws: 110,
    coins: 10200,
    status: 'online'
  },
  {
    uid: 'bot_elena',
    username: 'Elena_ChessGrandmaster',
    email: 'elena@gamerplatform.io',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    wins: 1205,
    losses: 312,
    draws: 411,
    coins: 24500,
    status: 'online'
  },
  {
    uid: 'bot_sam',
    username: 'Sam_Staker',
    email: 'sam@gamerplatform.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    wins: 95,
    losses: 90,
    draws: 2,
    coins: 750,
    status: 'offline'
  }
];

export const INITIAL_USER: UserProfile = {
  uid: 'user_architect',
  username: 'Lead_Developer',
  email: 'architect@gamerplatform.io',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  wins: 12,
  losses: 4,
  draws: 1,
  coins: 2500,
  status: 'online'
};

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'm1',
    senderId: 'bot_dotun',
    senderName: 'Dotun_WhotMaster',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    text: 'Welcome to the platform blueprint playground! Turn validation looks incredibly clean here inside Phase 1 specs.',
    timestamp: '06:20'
  },
  {
    id: 'm2',
    senderId: 'bot_chidi',
    senderName: 'Chidi_LudoKing',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    text: 'Anyone up for a virtual coin challenge? Let’s stake 500 coins and test the atomic Escrow lock!',
    timestamp: '06:21'
  },
  {
    id: 'm3',
    senderId: 'bot_elena',
    senderName: 'Elena_ChessGrandmaster',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    text: 'I parsed the Firestore security definitions. The isValidId checks look extremely airtight. Excellent zero-trust policy setup.',
    timestamp: '06:22'
  }
];

export const INITIAL_TX: WalletTransaction[] = [
  {
    id: 'tx1',
    type: 'credit',
    amount: 2500,
    description: 'Sandbox initial developer credit',
    timestamp: '06:00'
  }
];

export const BOT_RESPONSES: Record<string, string[]> = {
  greeting: [
    "Hey! Loving this real-time lobby prototype.",
    "Hello Chief! Staking system has zero delay.",
    "Nice to meet you. Click my profile to send a direct challenge!"
  ],
  wallet: [
    "Agreed! Lock and unlock steps prevent race-condition bugs.",
    "I'm keeping my coins in the wallet. The staking escrow rules are mathematically verified.",
    "Virtual staking makes game testing extremely convenient."
  ],
  game: [
    "I specialize in Ludo, but chess moves are where the real architect matches take place.",
    "I challenge you! Select Chess, entry fee 300, and let’s verify turn sync.",
    "Whot Card 20 matches suit claims brilliantly. The deck- recycling rule acts as a solid guard."
  ]
};

export function getRandomBotResponse(text: string): { botId: string; text: string } {
  const lowercase = text.toLowerCase();
  const botList = BOT_PLAYERS.filter(b => b.status === 'online');
  const selectedBot = botList[Math.floor(Math.random() * botList.length)];

  let list = BOT_RESPONSES.greeting;
  if (lowercase.includes('wallet') || lowercase.includes('coin') || lowercase.includes('stake') || lowercase.includes('money')) {
    list = BOT_RESPONSES.wallet;
  } else if (lowercase.includes('game') || lowercase.includes('whot') || lowercase.includes('ludo') || lowercase.includes('chess') || lowercase.includes('play')) {
    list = BOT_RESPONSES.game;
  }

  const responseText = list[Math.floor(Math.random() * list.length)];
  return {
    botId: selectedBot.uid,
    text: responseText
  };
}
