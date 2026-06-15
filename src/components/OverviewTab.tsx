/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Database, Wallet, Users, MessageSquare, Play, Flame, Swords } from 'lucide-react';
import { RoadmapPhase } from '../types';

interface OverviewTabProps {
  phases: RoadmapPhase[];
  activePhaseId: number;
  setActivePhaseId: (id: number) => void;
  userCoins: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  phases,
  activePhaseId,
  setActivePhaseId,
  userCoins
}) => {
  return (
    <div className="space-y-8" id="overview-tab-root">
      {/* Intro Hero banner */}
      <div className="bg-linear-to-r from-neutral-900 to-neutral-800 text-white rounded-2xl p-6 md:p-8 relative overflow-hidden border border-neutral-700 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-700/60 text-xs text-neutral-300 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            PRINCIPAL COMPILING WORKSPACE: RECONSTRUCTED
          </div>
          <h1 className="text-3xl md:text-4xl font-sans font-medium tracking-tight text-neutral-100">
            Multiplayer Gaming Platform
          </h1>
          <p className="text-neutral-300 text-sm md:text-base leading-relaxed">
            Welcome, Architect. You are viewing the high-fidelity developer workspace. Use this visual console to audit schemas, simulate Phase 1 logic blocks, review production-grade rulesets, and verify game development stages.
          </p>
          <div className="flex gap-4 pt-2">
            <div className="bg-neutral-800/80 px-4 py-2 rounded-xl border border-neutral-700/60 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
              <span className="text-xs font-mono text-neutral-200">System Presence Active</span>
            </div>
            <div className="bg-neutral-800/80 px-4 py-2 rounded-xl border border-neutral-700/60 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-neutral-200">{userCoins} Virtual Coins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-neutral-100 rounded-xl">
              <Shield className="w-6 h-6 text-neutral-800" />
            </div>
            <span className="text-xs font-mono text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200/40">Zero-Trust Active</span>
          </div>
          <div>
            <h3 className="font-sans font-medium text-neutral-900 leading-snug text-base">Security Isolation</h3>
            <p className="text-xs text-neutral-500 mt-1">Pre-enforced cell structures and atomic write transaction protection on coin wallets.</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-neutral-100 rounded-xl">
              <Database className="w-6 h-6 text-neutral-800" />
            </div>
            <span className="text-xs font-mono text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/40">Real-Time Sync</span>
          </div>
          <div>
            <h3 className="font-sans font-medium text-neutral-900 leading-snug text-base">Unified Presence Router</h3>
            <p className="text-xs text-neutral-500 mt-1">Simultaneous game sessions mapping to unified challenge channels and lobby events.</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-neutral-100 rounded-xl">
              <Swords className="w-6 h-6 text-neutral-800" />
            </div>
            <span className="text-xs font-mono text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/40">Scale-Ready</span>
          </div>
          <div>
            <h3 className="font-sans font-medium text-neutral-900 leading-snug text-base">Modular Interface Block</h3>
            <p className="text-xs text-neutral-500 mt-1">Abstract Game Sessions are ready to plug in Whot (Cards), Ludo (Dice), and Chess (Grid).</p>
          </div>
        </div>
      </div>

      {/* Developer Map / Timeline */}
      <div className="bg-white/90 backdrop-blur-md border border-neutral-200 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-sans font-medium text-neutral-950">Development Roadmap Timeline</h2>
            <p className="text-xs text-neutral-500">Incremental implementation sequences for multi-game deployment</p>
          </div>
          <span className="px-3 py-1 text-xs border border-neutral-200 rounded-full font-mono text-neutral-600 bg-neutral-50">
            FIDE/Whot standard
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {phases.map((phase, idx) => {
            const isSelected = activePhaseId === phase.id;
            const isReady = phase.status === 'ready_to_build';

            return (
              <motion.div
                key={phase.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setActivePhaseId(phase.id)}
                className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-56 relative overflow-hidden ${
                  isSelected
                    ? 'border-neutral-950 bg-neutral-50 shadow-xs'
                    : 'border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-50/80 hover:border-neutral-300'
                }`}
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  isReady ? 'bg-amber-500' : 'bg-neutral-300'
                }`} />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-neutral-400">0{idx + 1}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                      isReady
                        ? 'bg-amber-50 text-amber-700 border-amber-200/40 font-medium'
                        : 'bg-neutral-100 text-neutral-500 border-neutral-200/65'
                    }`}>
                      {isReady ? 'BUILDING NOW' : 'PLANNED'}
                    </span>
                  </div>
                  <h3 className="font-sans font-medium text-sm text-neutral-900 text-ellipsis line-clamp-2">
                    {phase.title.replace('Phase ' + phase.id + ': ', '')}
                  </h3>
                  <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed">
                    {phase.description}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-neutral-200/60">
                  <span className="text-[10px] font-mono text-neutral-400">Click to inspect</span>
                  <div className={`p-1.5 rounded-full transition-colors ${
                    isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    <Play className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
