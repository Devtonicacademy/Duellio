/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoadmapPhase } from '../types';

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 1,
    title: 'Phase 1: Core Foundation & Infrastructure',
    tagline: 'Multiplayer lobby, challenges, chat, and virtual staking engine.',
    status: 'ready_to_build',
    description: 'Establish secure Firebase Authentication, Firestore databases, and real-time triggers for global matchmaking, wallet operations, and instantaneous player challenges.',
    blueprint: {
      title: 'Phase 1 Core Architecture',
      summary: 'High-Scale real-time synchronization utilizing Firebase Auth + global Firestore collections. Features atomic transaction-guaranteed wallet actions and user presence tracking.',
      technicalDetails: [
        'Secure Attribute-Based Access Control (ABAC) in firestore.rules ensuring users can only debit their own wallets.',
        'Presence detection via Firestore active heartbeat monitoring.',
        'Atomicity Guarantee: Staking matches requires atomic transaction locking of entry fee coins to prevent double-spending.',
        'Strict structure schemas under the `users`, `lobby_chats`, `challenges`, and `wallets` Firestore collections.'
      ],
      endpoints: [
        {
          method: 'POST',
          path: '/api/v1/user/profile',
          description: 'Synchronizes or creates user records in Firestore upon successful Auth sign-in.',
          requestPayload: '{ username: string, email: string, avatar: string }',
          responsePayload: '{ success: true, profile: UserProfile }'
        },
        {
          method: 'WS',
          path: 'challenges/onCreate',
          description: 'Triggers matching system overlay for the challenged user in real-time.',
          requestPayload: '{ senderId: string, receiverId: string, gameType: Whot/Ludo/Chess, entryFee: number }',
          responsePayload: '{ challengeId: string, challengeData: MatchChallenge }'
        },
        {
          method: 'POST',
          path: '/api/v1/wallet/stake',
          description: 'Locks stake coins for a match. Highly protected server-side controller using process.env.STAKING_ESCROW_ADDRESS.',
          requestPayload: '{ challengeId: string, entryFee: number }',
          responsePayload: '{ status: "locked", escrowTxId: string }'
        },
        {
          method: 'WS',
          path: 'lobby_chats/onCreate',
          description: 'Dispatches chat messages with visual indicators to all online players.',
          requestPayload: '{ text: string }',
          responsePayload: '{ id: string, senderId: string, text: string, timestamp: Timestamp }'
        }
      ]
    },
    checklist: [
      'Implement real-time presence sync updating `status: "online" | "in-game"`.',
      'Create standard schema for transactions with immutability guarantees (`createdAt` locked).',
      'Set up validation-gated challenges collection ensuring entryFee <= user.coins.',
      'Demonstrate secure multi-tab simulation of challenge broadcast, acceptance, and wallet debiting.'
    ]
  },
  {
    id: 2,
    title: 'Phase 2: Game 1 - Whot',
    tagline: 'Traditional card game logic, action rules, and turn state-machines.',
    status: 'planned',
    description: 'Implement card dealt mechanisms, special action numbers (1, 2, 5, 8, 14), pile syncing, and deck recycling when cards are exhausted.',
    blueprint: {
      title: 'Whot Card Game Architecture',
      summary: 'State-machine hosted in firestore under `/games/whot/sessions/{sessionId}`. Validates every card play against active top pile card.',
      technicalDetails: [
        'Card deck shuffled using Fisher-Yates and serialized strictly in a backend or cloud-function secure environment.',
        'Turn validator enforces: Player index must match active state index.',
        'Special card modifiers: 1 (Hold On), 2 (Pick Two), 5 (Pick Three), 8 (Suspension), 14 (General Market).',
        'State sync includes active top card (suit & number) and sizes of opponents’ hands.'
      ],
      endpoints: [
        {
          method: 'POST',
          path: '/api/v1/games/whot/create',
          description: 'Initializes a session, shuffles the 54-card deck, deals 6 cards to each user, and defines the start card.',
          requestPayload: '{ sessionId: string, players: string[] }',
          responsePayload: '{ deckCount: number, starterCard: Card, userHand: Card[] }'
        },
        {
          method: 'WS',
          path: 'games/whot/onStateChange',
          description: 'Real-time sync of active turn, turnTimer, topCard, pile size, and opponent cards remaining.',
          requestPayload: '{}',
          responsePayload: '{ gameState: WhotState }'
        },
        {
          method: 'POST',
          path: '/api/v1/games/whot/play',
          description: 'Submits card play. Checked backend-side: suit/number match or wild-card Whot (20) suit change validation.',
          requestPayload: '{ card: Card, suitClaim?: "Circles" | "Triangles" | "Crosses" | "Stars" | "Squares" }',
          responsePayload: '{ valid: boolean, actionTriggered: string, nextPlayer: number }'
        }
      ]
    },
    checklist: [
      'Configure automatic turn rotation countdown triggers (e.g., 20-second timers).',
      'Verify secure general market draws using state locks to prevent double-draw exploits.',
      'Validate card-play restrictions match game rules (must match symbol or number, or card 20).',
      'Confirm payout distribution of escrow-staked coins immediately to the winner upon `hand.length === 0`.'
    ]
  },
  {
    id: 3,
    title: 'Phase 3: Game 2 - Ludo',
    tagline: 'Dice rolls, cell movement vectors, safe segments, and collision zones.',
    status: 'ready_to_build',
    description: 'Map board slots to vector indexes, control safe quadrants (star zones), enforce turn rules (roll 6 to exit home, multiple rolls on 6), and block collision in safe spaces.',
    blueprint: {
      title: 'Ludo Board Game Engine',
      summary: 'Position indexing map with exact math calculations for paths, safe lines, home run, and collision checks.',
      technicalDetails: [
        'Client side dice roll renders high-fidelity animations, but final random seed or face value is validated/generated by secure API endpoints.',
        'Grid mapping of absolute positions to local path coordinates based on player start index.',
        'Collision Engine: If lands on opponent cell AND cell is not a marked safe space, captures token and returns them to Base Camp.',
        'Supports 2 to 4 concurrent active players.'
      ],
      endpoints: [
        {
          method: 'POST',
          path: '/api/v1/games/ludo/roll',
          description: 'Securely generates random dice integer (1-6) and checks if valid move exists for player tokens.',
          requestPayload: '{ sessionId: string, playerId: string }',
          responsePayload: '{ value: number, possibleMoves: Array<{ tokenId: number, delta: number }> }'
        },
        {
          method: 'POST',
          path: '/api/v1/games/ludo/move',
          description: 'Dispatches piece updates, checks safe space properties, and handles player base returns.',
          requestPayload: '{ tokenId: number, steps: number }',
          responsePayload: '{ victory: boolean, collisions: Array<{ tokenId: number, playerIndex: number }> }'
        }
      ]
    },
    checklist: [
      'Verify strict dice-roll bounds [1-6] server-side generator checks.',
      'Test exact grid indices translating to correct relative tiles across all 4 colored camps.',
      'Enforce zero-collision status on safe-star nodes when two different players land there.',
      'Validate that a rolling outcome of 6 triggers an extra roll up to a maximum of 3 times consecutively.'
    ]
  },
  {
    id: 4,
    title: 'Phase 4: Game 3 - Chess',
    tagline: 'FIDE standard move-check validation, timers, castling & checkmate tracking.',
    status: 'ready_to_build',
    description: 'Enforces complete Chess rules including en passant, castling, pawn promotion, check/checkmate verification, dynamic timers, and stalemate outcomes.',
    blueprint: {
      title: 'Chess Engine & Sync Infrastructure',
      summary: 'Integrates standard lightweight piece rules paired with WebSockets to stream SAN/LAN notation moves and time state values.',
      technicalDetails: [
        'Board represented utilizing Standard FEN (Forsyth-Edwards Notation) string format.',
        'Dynamic clock synchronization uses Server-Timestamp differences to lock timers securely without lag manipulation.',
        'FIDE complete move rule integration (king check path validation).',
        'Pawn promotion, castling indicators, and half-move clock tracking.'
      ],
      endpoints: [
        {
          method: 'POST',
          path: '/api/v1/games/chess/move',
          description: 'Submits a move in standard algebraic notation. Validated server-side using move matrix.',
          requestPayload: '{ from: string, to: string, promotion?: "q" | "r" | "b" | "n" }',
          responsePayload: '{ valid: boolean, fen: string, isCheck: boolean, isCheckmate: boolean, isStalemate: boolean }'
        },
        {
          method: 'POST',
          path: '/api/v1/games/chess/surrender',
          description: 'Declares premature loss. Distributes locked wallet coins to opponent and terminates socket sessions.',
          requestPayload: '{ sessionId: string }',
          responsePayload: '{ success: boolean, payoutsEscrowRef: string }'
        }
      ]
    },
    checklist: [
      'Synchronize dual-timers with clock drift correction (±50ms accuracy).',
      'Validate complete checkmate paths to ensure game auto-terminates upon mate.',
      'Enforce FIDE movement algorithms for Queen, Rook, Bishop, Knight, Pawn, and King.',
      'Confirm player color authorization (e.g., Black player cannot dispatch White player moves).'
    ]
  }
];
