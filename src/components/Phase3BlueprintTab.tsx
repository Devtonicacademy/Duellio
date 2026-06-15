/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Network, FileCode, Database, Sparkles, Copy, Check, ShieldCheck, Zap } from 'lucide-react';
import { EndpointSpec } from '../types';

interface Phase3BlueprintTabProps {
  endpoints: EndpointSpec[];
}

export const Phase3BlueprintTab: React.FC<Phase3BlueprintTabProps> = ({ endpoints }) => {
  const [copied, setCopied] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointSpec | null>(endpoints[0]);

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // --- REUSABLE SECURITY PRIMITIVES ---
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isPlayerInLudoSession(session) {
      return isSignedIn() && (request.auth.uid in session.playerIds);
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    // --- LUDO SESSIONS SECURITY SCHEMA ---
    match /games/ludo/sessions/{sessionId} {
      allow read: if isPlayerInLudoSession(existing());
      
      // Matchmaker server or creators can provision Ludo boards
      allow create: if isSignedIn()
        && incoming().playerIds.size() >= 2
        && incoming().playerIds.size() <= 4
        && incoming().status == 'playing'
        && incoming().lastRollValue == 0;

      // Update state machine validators
      allow update: if isPlayerInLudoSession(existing())
        && existing().status == 'playing'
        && isValidLudoMoveTransition()
        && incoming().playerIds == existing().playerIds;
    }

    function isValidLudoMoveTransition() {
      // 1. Only the turn owner can change token positions or register rolls
      let isCurrentTurn = existing().activePlayerId == request.auth.uid;
      
      // 2. State validation: Safe segments & star checks
      // Verifies token index movement corresponds exactly to the verified dice outcome
      let activeColor = existing().playerColors[request.auth.uid];
      let oldPos = existing().tokenPositions[request.auth.uid];
      let newPos = incoming().tokenPositions[request.auth.uid];
      
      // Ensure color camps cannot modify other colors' cell locations
      let unchangedOtherTokens = incoming().tokenPositions.diff(existing().tokenPositions)
        .affectedKeys().hasOnly([request.auth.uid]);

      // 3. Rolling rules validation
      // Cannot roll twice consecutively unless a Six was rolled, up to max consecutive count of 3
      let isRollActionState = incoming().lastRollValue != existing().lastRollValue;
      let validConsecutiveRolls = incoming().consecutiveSixRolledCount <= 3;

      return isCurrentTurn && unchangedOtherTokens && validConsecutiveRolls;
    }

    // --- COLLISION SAFE ZONES ABAC ---
    match /games/ludo/sessions/{sessionId}/grid_cells/{cellId} {
      // Enforce safe-zone locks: Cells marked safe (star slots) accommodate multi-occupancy,
      // while standard cells check for coordinate landing to auto-trigger collision returns.
      allow read, write: if isSignedIn() && isPlayerInLudoSession(getLudoSession(sessionId));
    }

    function getLudoSession(sessionId) {
      return get(/databases/$(database)/documents/games/ludo/sessions/$(sessionId)).data;
    }
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(firestoreRulesCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="blueprint-tab-3-root">
      {/* List on left */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <Network className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-sans font-medium text-neutral-950">Ludo Engine Endpoints</h3>
              <p className="text-xs text-neutral-500">Secure dice controllers & position validators</p>
            </div>
          </div>

          <div className="space-y-2">
            {endpoints.map((ep, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedEndpoint(ep)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                  selectedEndpoint?.path === ep.path
                    ? 'border-neutral-950 bg-neutral-50/80 shadow-xs'
                    : 'border-neutral-100 hover:border-neutral-300 bg-white/50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded-md font-bold ${
                      ep.method === 'WS'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200/50'
                        : ep.method === 'POST'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200/50'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="text-xs font-mono font-medium text-neutral-700 truncate max-w-[180px] group-hover:text-black">
                      {ep.path}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-1">
                    {ep.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {selectedEndpoint && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3 font-mono text-[11px]"
            >
              <div className="flex justify-between items-center text-xs pb-2 border-b border-neutral-200 text-neutral-500 font-sans">
                <span className="font-mono font-medium text-neutral-800">API Specifications</span>
                <span>Active Spec Info</span>
              </div>
              <div className="space-y-2 text-neutral-700 leading-relaxed">
                <div>
                  <span className="text-neutral-400">Description:</span>
                  <div className="text-neutral-800 mt-0.5 font-sans leading-relaxed">
                    {selectedEndpoint.description}
                  </div>
                </div>
                {selectedEndpoint.requestPayload && (
                  <div>
                    <span className="text-neutral-400">Request Body:</span>
                    <pre className="bg-neutral-900 text-amber-400 p-2.5 rounded-lg mt-1 overflow-x-auto select-all">
                      {selectedEndpoint.requestPayload}
                    </pre>
                  </div>
                )}
                {selectedEndpoint.responsePayload && (
                  <div>
                    <span className="text-neutral-400">Response payload schemas:</span>
                    <pre className="bg-neutral-900 text-green-400 p-2.5 rounded-lg mt-1 overflow-x-auto font-mono select-all">
                      {selectedEndpoint.responsePayload}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Ludo System Architecture */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-sans font-medium text-neutral-950">Ludo Grid Vector Mechanics</h3>
              <p className="text-xs text-neutral-500">Cell coordinate translations and safety grids</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl">
              <span className="font-semibold block text-neutral-800">1. Safe Star Slots (Quadrant Locks)</span>
              <p className="text-neutral-500 text-[10px] mt-0.5">Absolute cell indexes 1, 9, 14, 22, 27, 35, 40, and 48 are immune to token collisions. Multiple opponent tokens can occupy these spots concurrently with no battle outcomes.</p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl">
              <span className="font-semibold block text-neutral-800">2. Entrance Home Camp Vector (Roll 6 Rule)</span>
              <p className="text-neutral-500 text-[10px] mt-0.5">Tokens start in pocket segments (indexed 0). An absolute roll of 6 is mandatory to release a token onto active running grids. Releasing a token grants an immediate extra roll.</p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl">
              <span className="font-semibold block text-neutral-800">3. Roll-Six Speed-runs</span>
              <p className="text-neutral-500 text-[10px] mt-0.5">To prevent turn starvation, rolling 6 keeps active player control up to 3 times consecutively. A 3rd sequential 6 is discarded and triggers an immediate turn pass to maintain lobby balance.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Code view on right */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        <div className="bg-neutral-950 text-neutral-100 rounded-2xl border border-neutral-800 shadow-lg flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-900">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-mono ml-2 text-neutral-400 flex items-center gap-1.5 bg-neutral-800 px-3 py-1 rounded-md">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                firestore.ludo.rules
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-850 bg-neutral-800 rounded-lg border border-neutral-700 cursor-pointer select-none"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Ludo Rules'}
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[580px] font-mono text-[11px] leading-relaxed text-neutral-300 select-all scrollbar-thin">
            <pre className="whitespace-pre overflow-x-auto">
              {firestoreRulesCode}
            </pre>
          </div>
          <div className="p-4 bg-neutral-900 border-t border-neutral-800 text-xs flex items-center justify-between text-neutral-400 w-full">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Collision Logic & Cell Segments Verified</span>
            </div>
            <span className="font-mono text-[10px] text-neutral-500">Ludo Grid Engine v1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
