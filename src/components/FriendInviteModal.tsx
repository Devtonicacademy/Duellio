import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords } from 'lucide-react';

interface FriendInviteModalProps {
  friendInvite: {
    game: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe';
    stake: number;
    sender: string;
    sessionId?: string;
  } | null;
  onAccept: () => void;
  onIgnore: () => void;
}

export function FriendInviteModal({
  friendInvite,
  onAccept,
  onIgnore
}: FriendInviteModalProps) {
  return (
    <AnimatePresence>
      {friendInvite && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -15, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-[#0B0B0F] border border-purple-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full text-center relative shadow-[0_0_50px_rgba(147,51,234,0.15)] space-y-6"
          >
            {/* Glowing purple badge indicator */}
            <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 shadow-[0_0_20px_rgba(147,51,234,0.2)]">
              <Swords className="w-8 h-8 text-purple-400" />
            </div>

            <div className="space-y-2">
              <span className="bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-[10px] font-mono text-purple-300 font-bold uppercase tracking-widest leading-none">
                Incoming Game Invitation
              </span>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight font-display mt-2">
                Challenge from <span className="text-purple-400 font-extrabold">{friendInvite.sender}</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Accept the stakes and enter the Duellio Smart P2P Matchmaker Arena instantly.
              </p>
            </div>

            {/* Match setup status indicators */}
            <div className="bg-[#121217] rounded-2xl p-4.5 border border-white/[0.04] text-left space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium font-sans">Selected Arena:</span>
                <span className="text-white font-bold font-display uppercase tracking-wider">{friendInvite.game} Board</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium font-sans">Match Stakes:</span>
                <span className="text-purple-300 font-bold font-mono text-sm">{friendInvite.stake} Coins</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium font-sans">Onboarding Bonus:</span>
                <span className="text-emerald-400 font-mono font-bold uppercase text-[10px]">Claimed +1,000 Coins Setup Benefit</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2 font-sans">
              <button
                onClick={onAccept}
                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-purple-800 hover:from-purple-450 hover:to-purple-750 text-white font-black text-sm rounded-xl cursor-pointer transition-all shadow-lg hover:scale-[1.02] select-none uppercase tracking-wider"
              >
                Accept Stakes & Duel Now
              </button>
              <button
                onClick={onIgnore}
                className="w-full py-2.5 bg-neutral-900/60 hover:bg-neutral-850 border border-white/[0.05] hover:border-white/[0.1] text-neutral-400 hover:text-white font-medium text-xs rounded-xl cursor-pointer transition-all select-none uppercase tracking-wider"
              >
                Ignore Challenge
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
