import { useState, useEffect } from 'react';

export function useFriendInvite() {
  const [friendInvite, setFriendInvite] = useState<{
    game: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman';
    stake: number;
    sender: string;
    sessionId?: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasInvite = params.get('friendInvite') === 'true' || params.get('invite') === 'true';
    const inviteGame = params.get('game');
    const inviteStake = params.get('stake');
    const inviteSender = params.get('sender');
    const sessionId = params.get('sessionId') || undefined;

    if (hasInvite && inviteGame && inviteStake && inviteSender) {
      const validGames = ['Chess', 'Ludo', 'Whot', 'Draft', 'TicTacToe', 'Stickman'];
      const gameType = validGames.includes(inviteGame) ? (inviteGame as 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman') : 'Stickman';
      const stakeVal = Math.max(100, Math.min(1000, parseInt(inviteStake) || 300));
      
      setFriendInvite({
        game: gameType,
        stake: stakeVal,
        sender: inviteSender,
        sessionId
      });
    }
  }, []);

  return {
    friendInvite,
    setFriendInvite
  };
}
