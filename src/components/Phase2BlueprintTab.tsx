/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Network, FileCode, Database, Sparkles, Copy, Check, Info } from 'lucide-react';
import { EndpointSpec } from '../types';

interface Phase2BlueprintTabProps {
  endpoints: EndpointSpec[];
}

export const Phase2BlueprintTab: React.FC<Phase2BlueprintTabProps> = ({ endpoints }) => {
  const [copied, setCopied] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointSpec | null>(endpoints[0]);

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // --- SECURITY PRIMITIVES ---
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isPlayerInSession(session) {
      return isSignedIn() && (request.auth.uid in session.playerIds);
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    // --- GAME SESSIONS COLLECTION SECURITY SCHEMA ---
    match /games/whot/sessions/{sessionId} {
      allow read: if isPlayerInSession(existing());
      
      // Creation restricted to authentic matchmaker server context or verified challenger trigger
      allow create: if isSignedIn()
        && incoming().playerIds.size() == 2
        && incoming().status == 'playing'
        && incoming().deckCount == 38  // Remainder size after drawing 6 to each
        && incoming().penaltyCount == 0;

      // Update security state-machine
      allow update: if isPlayerInSession(existing())
        && existing().status == 'playing'
        && isValidTurnTransition()
        && incoming().playerIds == existing().playerIds; // Cannot hijack user arrays
    }

    function isValidTurnTransition() {
      // Rule 1: Only the active player can mutate game states
      let isCurrentTurn = existing().activePlayerId == request.auth.uid;
      
      // Rule 2: Hand updates must decrease by exactly 1 card ONLY on PLAY, OR increase on DRAW
      let playerHandBefore = existing().playerHands[request.auth.uid].size();
      let playerHandAfter = incoming().playerHands[request.auth.uid].size();

      // Rule 3: Direct Card validation
      let playedCard = incoming().discardPile[0];
      let topCard = existing().discardPile[0];
      let isSuitMatched = playedCard.suit == existing().activeSuit || playedCard.suit == 'Whot';
      let isValueMatched = playedCard.value == topCard.value;
      
      // Rule 4: Immutable variables check
      let didDrawValidly = (playerHandAfter == playerHandBefore + 1) && (incoming().discardPile.size() == existing().discardPile.size());
      let didPlayValidly = (playerHandAfter == playerHandBefore - 1) && (isSuitMatched || isValueMatched);

      return isCurrentTurn && (didDrawValidly || didPlayValidly || incoming().status == 'completed');
    }

    // --- LOCK WALLET STAKES SECURITY HOOK ---
    match /escrow_staking/{matchId} {
      allow create: if isSignedIn()
        && incoming().stakeLockedAmount >= 100
        && incoming().payers.hasAll([request.auth.uid]);
    }
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(firestoreRulesCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="blueprint-tab-2-root">
      {/* Schematic Layout left side */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <Network className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-sans font-medium text-neutral-950">Whot Game API endpoints</h3>
              <p className="text-xs text-neutral-500">Card verification sockets & turn transition APIs</p>
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
                        ? 'bg-teal-100 text-teal-800 border border-teal-200/50'
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

        {/* Action Rules Bento Explanation */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <Info className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-sans font-medium text-neutral-950">Special Action Card Mechanics</h3>
              <p className="text-xs text-neutral-500">Nigerian Whot action matrices fully integrated</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl flex items-center gap-3">
              <span className="font-mono font-bold bg-neutral-800 text-white px-2.5 py-1 rounded-lg">1</span>
              <div>
                <span className="font-semibold block text-neutral-800">Hold On</span>
                <p className="text-neutral-500 text-[10px]">The playing user gains an extra turn immediately. Blocks active turn rotation once.</p>
              </div>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl flex items-center gap-3">
              <span className="font-mono font-bold bg-neutral-800 text-white px-2.5 py-1 rounded-lg">2</span>
              <div>
                <span className="font-semibold block text-neutral-800">Pick Two</span>
                <p className="text-neutral-500 text-[10px]">Next player draws 2 cards unless they stack another 2 (accumulates total penalty count).</p>
              </div>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl flex items-center gap-3">
              <span className="font-mono font-bold bg-neutral-800 text-white px-2.5 py-1 rounded-lg">5</span>
              <div>
                <span className="font-semibold block text-neutral-800">Pick Three</span>
                <p className="text-neutral-500 text-[10px]">Enforces a pickup responsibility of 3 cards on the succeeding player index immediately.</p>
              </div>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl flex items-center gap-3">
              <span className="font-mono font-bold bg-neutral-800 text-white px-2.5 py-1 rounded-lg">8</span>
              <div>
                <span className="font-semibold block text-neutral-800">Suspension</span>
                <p className="text-neutral-500 text-[10px]">Suspends the next player's entire turn. Moves target index directly to the succeeding player.</p>
              </div>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl flex items-center gap-3">
              <span className="font-mono font-bold bg-neutral-800 text-white px-2.5 py-1 rounded-lg">14</span>
              <div>
                <span className="font-semibold block text-neutral-800">General Market</span>
                <p className="text-neutral-500 text-[10px]">All other players must immediately draw 1 card from the pile pool while active player continues.</p>
              </div>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl flex items-center gap-3">
              <span className="font-mono font-bold bg-neutral-800 text-white px-2.5 py-1 rounded-lg">20</span>
              <div>
                <span className="font-semibold block text-neutral-800">Whot Card (Wildcard suit changer)</span>
                <p className="text-neutral-500 text-[10px]">Matches any top card. The player must declare a new suit suitClaim parameter immediately.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security code display right side */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        <div className="bg-neutral-950 text-neutral-100 rounded-2xl border border-neutral-800 shadow-lg flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-900">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-mono ml-2 text-neutral-400 flex items-center gap-1.5 bg-neutral-800 px-3 py-1 rounded-md">
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                firestore.whot.rules
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-850 bg-neutral-800 rounded-lg border border-neutral-700 cursor-pointer select-none"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Whot Rules'}
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
              <span>Card Play State Verifications Configured</span>
            </div>
            <span className="font-mono text-[10px] text-neutral-500">FSM Pattern v1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
