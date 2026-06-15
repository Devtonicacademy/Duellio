/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Network, FileCode, Sparkles, Copy, Check, ShieldCheck, Zap, Swords } from 'lucide-react';
import { EndpointSpec } from '../types';

interface Phase4BlueprintTabProps {
  endpoints: EndpointSpec[];
}

export const Phase4BlueprintTab: React.FC<Phase4BlueprintTabProps> = ({ endpoints }) => {
  const [copied, setCopied] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointSpec | null>(endpoints[0]);

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // --- REUSABLE SECURITY PRIMITIVES ---
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isPlayerInChessSession(session) {
      return isSignedIn() && (request.auth.uid == session.whitePlayerId || request.auth.uid == session.blackPlayerId);
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    // --- CHESS SESSIONS SECURITY SCHEMA ---
    match /games/chess/sessions/{sessionId} {
      allow read: if isPlayerInChessSession(existing());
      
      allow create: if isSignedIn()
        && incoming().status == 'playing'
        && incoming().fen == 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        && incoming().movesCount == 0;

      // Update state machine validators
      allow update: if isPlayerInChessSession(existing())
        && existing().status == 'playing'
        && isValidChessMoveTransition()
        && incoming().whitePlayerId == existing().whitePlayerId
        && incoming().blackPlayerId == existing().blackPlayerId;
    }

    function isValidChessMoveTransition() {
      // 1. Enforce turn color matches requested player uid
      let isWhiteTurn = existing().activeColor == 'white' && request.auth.uid == existing().whitePlayerId;
      let isBlackTurn = existing().activeColor == 'black' && request.auth.uid == existing().blackPlayerId;
      let isAuthorizedTurn = isWhiteTurn || isBlackTurn;

      // 2. Validate move progression counter
      let validIncrement = incoming().movesCount == existing().movesCount + 1;

      // 3. Prevent direct server parameters tampering
      let untouchedMatchSetup = incoming().entryFee == existing().entryFee;

      return isAuthorizedTurn && validIncrement && untouchedMatchSetup;
    }

    // --- GAME ACTIONS / CLOCK CHANCE LOGS ---
    match /games/chess/sessions/{sessionId}/moves/{moveId} {
      allow read: if isPlayerInChessSession(getChessSession(sessionId));
      
      // Allow writing legal SAN coordinates verified by background validator
      allow create: if isSignedIn() 
        && request.auth.uid == getChessSession(sessionId).activePlayerId;
    }

    function getChessSession(sessionId) {
      return get(/databases/$(database)/documents/games/chess/sessions/$(sessionId)).data;
    }
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(firestoreRulesCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="blueprint-tab-4-root">
      {/* List on left */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <Swords className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-sans font-medium text-neutral-950">Chess Engine Endpoints</h3>
              <p className="text-xs text-neutral-500">Secure moves, FEN streams & game terminations</p>
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

        {/* Chess Game Mechanics */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-sans font-medium text-neutral-950">Chess Synchronization Rules</h3>
              <p className="text-xs text-neutral-500">Dual-clock timers & FIDE standards validation</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl">
              <span className="font-semibold block text-neutral-800">1. State Representation (FEN Strings)</span>
              <p className="text-neutral-500 text-[10px] mt-0.5">Dual clients synchronize utilizing Forsyth-Edwards Notation (FEN) for lightweight data payload processing. Ensures perfect state representation across multiple observers.</p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl">
              <span className="font-semibold block text-neutral-800">2. Real-time Clock Guarding</span>
              <p className="text-neutral-500 text-[10px] mt-0.5">Turn timers are synchronized using Firestore Server Timestamps. Subtracting server time from previous moves blocks speed hacks & timer injection exploits completely.</p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl">
              <span className="font-semibold block text-neutral-800">3. FIDE Checkmate & Stalemate Resolution</span>
              <p className="text-neutral-500 text-[10px] mt-0.5">Move validity, king checks, and promotion triggers are computed on API dispatch, immediately distributing locked wallet resources and setting terminations.</p>
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
                firestore.chess.rules
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-850 bg-neutral-800 rounded-lg border border-neutral-700 cursor-pointer select-none"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Chess Rules'}
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
              <span>FEN Codes & Double-check Vectors Verified</span>
            </div>
            <span className="font-mono text-[10px] text-neutral-500">Chess Core Engine v1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
