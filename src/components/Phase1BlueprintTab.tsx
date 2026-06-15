/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Network, FileCode, CheckCircle2, ShieldAlert, KeyRound, Terminal, Database, Sparkles, Copy, Check } from 'lucide-react';
import { EndpointSpec } from '../types';

interface PhaseBlueprintTabProps {
  endpoints: EndpointSpec[];
}

export const Phase1BlueprintTab: React.FC<PhaseBlueprintTabProps> = ({ endpoints }) => {
  const [copied, setCopied] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointSpec | null>(endpoints[0]);

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 1. GLOBAL SAFETY NET: Default Deny Catch-All
    match /{document=**} {
      allow read, write: if false;
    }

    // --- REUSABLE SECURITY PRIMITIVES ---
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    // 2. USER PROFILE SCHEMA & PERMISSION BOUNDARIES
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() 
        && isOwner(userId)
        && isValidUser(incoming())
        && incoming().createdAt == request.time;
      
      allow update: if isOwner(userId)
        && isValidUser(incoming())
        && incoming().createdAt == existing().createdAt
        && (
          // Action: Presence Heartbeat (Presence updates)
          incoming().diff(existing()).affectedKeys().hasOnly(['status', 'updatedAt']) ||
          // Action: Profile Edit
          incoming().diff(existing()).affectedKeys().hasOnly(['username', 'avatar', 'updatedAt'])
        );
    }

    function isValidUser(user) {
      return user.username is string 
        && user.username.size() >= 3 && user.username.size() <= 32
        && user.email is string
        && user.coins is int && user.coins >= 0
        && user.status in ['online', 'offline', 'in-game'];
    }

    // 3. GLOBAL CHAT ENGINE
    match /lobby_chats/{msgId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn()
        && isValidId(msgId)
        && incoming().senderId == request.auth.uid
        && incoming().text is string 
        && incoming().text.size() <= 200
        && incoming().timestamp == request.time;
    }

    // 4. REAL-TIME MATCH CHALLENGE SYSTEM
    match /challenges/{challengeId} {
      allow read: if isSignedIn() && (
        resource.data.senderId == request.auth.uid || 
        resource.data.receiverId == request.auth.uid
      );
      
      allow create: if isSignedIn()
        && isValidId(challengeId)
        && incoming().senderId == request.auth.uid
        && incoming().status == 'pending'
        && incoming().entryFee is int && incoming().entryFee >= 0
        && incoming().createdAt == request.time;

      allow update: if isSignedIn() 
        && (existing().receiverId == request.auth.uid) // Only receiver can update status
        && incoming().diff(existing()).affectedKeys().hasOnly(['status', 'updatedAt'])
        && incoming().status in ['accepted', 'declined', 'completed']
        && incoming().updatedAt == request.time;
    }

    // 5. ATOMIC VIRTUAL WALLET LEDGER
    match /wallets/{txId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn()
        && isValidId(txId)
        && incoming().userId == request.auth.uid
        && incoming().amount is int
        && incoming().type in ['credit', 'debit', 'stake_lock', 'stake_refund', 'win_payout']
        && incoming().createdAt == request.time;
    }
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(firestoreRulesCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="blueprint-tab-root">
      {/* Schematic Layout left side */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-medium text-neutral-950">Foundation APIs & events</h3>
              <p className="text-xs text-neutral-500">WebSocket bindings and REST endpoints</p>
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
                <span>Payload Inspector</span>
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
                    <span className="text-neutral-400">Request:</span>
                    <pre className="bg-neutral-900 text-amber-400 p-2.5 rounded-lg mt-1 overflow-x-auto">
                      {selectedEndpoint.requestPayload}
                    </pre>
                  </div>
                )}
                {selectedEndpoint.responsePayload && (
                  <div>
                    <span className="text-neutral-400">Response / Event Data:</span>
                    <pre className="bg-neutral-900 text-green-400 p-2.5 rounded-lg mt-1 overflow-x-auto font-mono">
                      {selectedEndpoint.responsePayload}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* DB Schema bento card */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-medium text-neutral-950">Architectural Schemas</h3>
              <p className="text-xs text-neutral-500">Abstract definitions in firebase-blueprint.json</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-neutral-50 border border-neutral-200/60 rounded-xl">
              <span className="font-mono font-bold text-neutral-800">/users</span>
              <p className="text-neutral-500 text-[11px] mt-1">Saves presence status, total virtual coins, wins, losses, and avatar metadata.</p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/60 rounded-xl">
              <span className="font-mono font-bold text-neutral-800">/challenges</span>
              <p className="text-neutral-500 text-[11px] mt-1">Handles real-time dual-handshake game invite alerts with coins entry fee parameters.</p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/60 rounded-xl">
              <span className="font-mono font-bold text-neutral-800">/lobby_chats</span>
              <p className="text-neutral-500 text-[11px] mt-1">Stores chronological lobby messages with server timestamp validation.</p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200/60 rounded-xl">
              <span className="font-mono font-bold text-neutral-800">/wallets</span>
              <p className="text-neutral-500 text-[11px] mt-1">Tracks ledger transactions for auditing coin stakings, wins, and losses.</p>
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
                <FileCode className="w-3.5 h-3.5 text-orange-400" />
                firestore.rules
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-850 bg-neutral-800 rounded-lg border border-neutral-700 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Rules'}
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[580px] font-mono text-[11px] leading-relaxed text-neutral-300 select-all scrollbar-thin">
            <pre className="whitespace-pre overflow-x-auto">
              {firestoreRulesCode}
            </pre>
          </div>
          <div className="p-4 bg-neutral-900 border-t border-neutral-800 text-xs flex items-center justify-between text-neutral-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
              <span>Hardened Fortifications Configured</span>
            </div>
            <span className="font-mono text-[10px] text-neutral-500">ABAC Pattern v2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
