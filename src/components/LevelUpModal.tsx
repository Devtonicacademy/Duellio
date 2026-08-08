/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, Zap, ArrowRight, Shield } from 'lucide-react';
import { ProgressionRewardResult } from '../types';
import { getRankForLevel } from '../services/progressionService';

interface LevelUpModalProps {
  result: ProgressionRewardResult | null;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ result, onClose }) => {
  if (!result || (!result.isLevelUp && !result.isRankUp)) return null;

  const rankObj = getRankForLevel(result.newLevel);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-md bg-neutral-900 border border-purple-500/40 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden text-center text-white"
        >
          {/* Neon background ambient glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />

          <div className="relative z-10 space-y-6">
            {/* Header Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 border-4 border-neutral-900 shadow-xl shadow-purple-500/30 animate-bounce">
              {result.isRankUp ? (
                <Trophy className="w-10 h-10 text-amber-300" />
              ) : (
                <Sparkles className="w-10 h-10 text-cyan-300" />
              )}
            </div>

            {/* Title */}
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase block mb-1">
                {result.isRankUp ? '🎉 RANK ADVANCEMENT' : '⚡ LEVEL INCREASED'}
              </span>
              <h2 className="text-3xl font-extrabold font-display uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-300 to-amber-300">
                {result.isRankUp ? `RANK UP: ${result.newRank}` : `LEVEL UP!`}
              </h2>
            </div>

            {/* Level & Rank Stats Box */}
            <div className="bg-neutral-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">PREVIOUS</span>
                  <span className="text-lg font-extrabold text-neutral-300 font-display">Lv {result.oldLevel}</span>
                  <span className="text-[10px] block text-neutral-500">{result.oldRank}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-400 animate-pulse" />
                <div className="text-center">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">NEW LEVEL</span>
                  <span className="text-2xl font-black text-cyan-300 font-display">Lv {result.newLevel}</span>
                  <span className="text-xs font-bold block" style={{ color: rankObj.color }}>
                    {rankObj.badge} {result.newRank}
                  </span>
                </div>
              </div>

              {/* XP Gained Indicator */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs px-2 font-mono">
                <span className="text-neutral-400">Match XP Earned:</span>
                <span className="text-emerald-400 font-bold">+{result.xpGained} XP</span>
              </div>
            </div>

            {/* Progress Bar Preview */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                <span>Progress to Lv {result.newLevel + 1}</span>
                <span>{result.currentLevelXP.toLocaleString()} / {result.nextLevelXP.toLocaleString()} XP</span>
              </div>
              <div className="w-full bg-neutral-950 rounded-full h-2.5 overflow-hidden border border-white/10 p-0.5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, Math.floor((result.currentLevelXP / result.nextLevelXP) * 100)))}%` }}
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue Gaming 🚀
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
