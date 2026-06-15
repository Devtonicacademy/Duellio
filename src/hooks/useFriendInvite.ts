import { useState, useEffect } from 'react';

export function useFriendInvite() {
  const [friendInvite, setFriendInvite] = useState<{
    game: 'Chess' | 'Ludo' | 'Whot' | 'Draft';
    stake: number;
    sender: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasInvite = params.get('friendInvite') === 'true' || params.get('invite') === 'true';
    const inviteGame = params.get('game');
    const inviteStake = params.get('stake');
    const inviteSender = params.get('sender');

    if (hasInvite && inviteGame && inviteStake && inviteSender) {
      const validGames = ['Chess', 'Ludo', 'Whot', 'Draft'];
      const gameType = validGames.includes(inviteGame) ? (inviteGame as 'Chess' | 'Ludo' | 'Whot' | 'Draft') : 'Chess';
      const stakeVal = Math.max(100, Math.min(1000, parseInt(inviteStake) || 300));
      
      setFriendInvite({
        game: gameType,
        stake: stakeVal,
        sender: inviteSender
      });
    }
  }, []);

  return {
    friendInvite,
    setFriendInvite
  };
}
