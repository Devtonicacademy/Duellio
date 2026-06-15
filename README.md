# Duellio - Decentralized Multi-Game Matchmaking & Virtuel Staking Platform

Duellio is a high-fidelity, peer-to-peer (P2P) gaming lobby and virtual staking platform designed for zero-trust match verification and fair-play tournament tracking. Bridging competitive classic board games with modern transactional integrity, Duellio allows users to challenge bots or real players, manage virtual portfolios, lock competitive stake ledgers, and audit game-state telemetry logs in real time.

---

## 🎨 Creative Architecture & Interface Design
Duellio employs an ultra-modern, high-contrast, cyberpunk-themed **Cosmic Slate Theme** constructed with dark, depth-layered glassmorphism panels, vivid cyan action glows, and amber tactical indicators. Every aspect of the platform's visual interface—from the interactive chess cylinders to the three-dimensional rendering grids—utilizes precise typography, spacious negative padding limits, and micro-interaction animations built with Tailwind CSS and Framer Motion (`motion/react`).

---

## 🚀 Fully Implemented Features

### 1. The Interactive Phase Sandbox Dashboard
* **Dynamic Multi-Tab Console**: Navigate seamlessly between **Discover**, **Tournaments**, **Lobbies / Sandbox**, and **My Profile**.
* **Zero-Trust Matchmaking Simulator**: Fully interactive player-to-lobby dispatcher that supports hosting match stakes, choosing game parameters, and simulating challenge loops with virtual online opponents.
* **Global Tactical Chat**: A real-time sandbox chat server featuring system broadcast updates, automated matching confirmations, and custom timestamp logs.
* **Virtual Multi-currency Wallet Faucet**: Allows users to instantly claim test tokens (`+1,000 Coins`) through the header widget and immediately deploy them into active staking match rules.
* **Deep-Linked Challenges**: Parses incoming tournament and game invitations directly from browsers’ URL query parameters (e.g. `?invite=true&game=Chess&stake=400&sender=Architect`). Users entering through these links claim an instant onboarding stake bonus and are greeted with custom acceptance prompts.

---

### 2. High-Fidelity Cyber Chess Arena (3D & 2D)
The Chess Arena is a feature-rich, full-featured interactive Chess simulator built against an automated computer AI opponent.
* **3D Holographic Perspective**: Toggleable 3D Camera Projection utilizing custom canvas skew-rotations and z-depth transforms (`preserve-3d`) to give the feel of a holographic tactical desk.
* **Futuristic Cylinder Glass Pieces**: Chess units are rendered as translucent dual-colored glowing glass cylinders, decorated with custom high-contrast unicode symbols and stamped with bold white label text indicating the unit type.
* **Tactical Green Target Highlights**: Selecting any cyan piece instantly highlights legitimate movement possibilities with glowing green pulse circles to prevent misclicks.
* **FIDE Vector Logic Rules Guard**: A custom built heuristic engine monitors pawn strides, knight leaps, bishop corridors, castle horizons, and royalty boundaries, immediately alerting players about illegal moves with detailed diagnostics.
* **Action Notation Grid Ledger**: Generates standard Chess notations on every successful move alongside verified `LEGIT PASS` security badges.
* **Active FEN Stream Telemetry**: Real-time export and display of the active board state in Standard Forsyth-Edwards Notation (FEN) for transparency.
* **Countdown Duel Clocks**: Simultaneous white and black turn-timers that countdown actively during the respective player's turn to prevent stalling.
* **Unit Codex Manual**: Built-in interactive cheat sheet detailing the movement properties, rules, and symbols of every Chess piece.

---

### 3. Cyber Ludo Arena
A complete local-turn board game simulation featuring high-fidelity token paths.
* **15x15 Color Camp Grid**: A stylized neon-accented Ludo board complete with separate home bases, designated runway quadrants, and safe zone cells.
* **Dual-Dice Random Generator**: High-fidelity animated rolling dice showing dual outcome values.
* **Authentic Ludo Trajectories**: Supports Red (User) vs Green (Bot) piece dispatch.
* **Safe Star Segments**: Zero-collision zones protect pieces from captures when landing on safe nodes.
* **Streak Counter**: Incorporates roll-again mechanics on rolling a double-six, restricted by a consecutive-roll threshold.

---

### 4. Cyber Whot Card Table
An interactive 1-vs-1 simulation of the traditional card game featuring a high-fidelity turn state machine.
* **Sleek Cards Selection**: Responsive card animations that hover, flip, and slide.
* **Complete Rules Engine**: Automatically handles suit and number validation (matching Circles, Triangles, Crosses, Stars, and Squares) against the active pile.
* **Whot Wildcards**: Fully-interactive "Whot (20)" wildcard support that allows declaring new suits, forcing the opponent computer to draw.
* **Deck Handling**: Fisher-Yates shuffling simulation and pile exhaustion deck-recycling logic.

---

### 5. Tournaments Console
* **Match Brackets**: Displays live, pending, and finalized esports tournament brackets.
* **Simulated Entry Registration**: Lock virtual stakes, register for open competitive seasons, and view live pool stakes.

---

### 6. User Profile & Achievements Dashboard
* **Dynamic Charts**: Multi-axis ranking visualizations demonstrating performance metrics and total staking volumes.
* **Editable Bio / Avatars**: Update profiles dynamically with customized avatars and bios.
* **Transaction Ledger**: Historical, immutable credit/debit records specifying logs for match winnings, faucet claims, and platform stake debits.

---

## 🔮 Planned & Partially Implemented Features (Roadmap)

To reach full release readiness, Duellio’s architecture outlines the transition from a client-side simulated sandbox into full multiplayer network environments.

### Phase 1: Real-Time Multi-User Database Sync
* **The Goal**: Transition current transient states to real-time, durable cloud databases.
* **Unimplemented Mechanics**:
  * Replacing simulated chat lines and challenges with live **Google Firebase Firestore** triggers.
  * Synchronizing authentic player presence states via active background service polling.
  * Hardening profile operations with robust Firestore Security Rules (`firestore.rules`) to guarantee users can never overwrite other profiles or falsify coin property balances.
  * Restricting coin transactions through atomic, server-validated transaction operations to prevent double-spending exploits.

### Phase 2: Live Server-Authoritative Whot Engines
* **The Goal**: Protect match fairness by moving all game state decisions server-side.
* **Unimplemented Mechanics**:
  * Implementing secure Node/Express backend endpoints to host, shuffle, and deal cards, keeping opponents' hands strictly hidden from the browser client's inspector.
  * Server-driven automatic turn countdown timers with forced draws/forfeits if a player disconnects or stalls.
  * Immediate automated disbursement of locked escrow stake coins to the winner upon game termination verified by the server.

### Phase 3: Relational Database & Ludo Verification Engine
* **The Goal**: Deploy transactional ledger infrastructure and verify rolling mechanics.
* **Unimplemented Mechanics**:
  * Integrating **Cloud SQL (PostgreSQL)** via an ORM (like Drizzle) to store tournament brackets, user match history, and audit records.
  * Server-authoritative dice rolling endpoints that generate cryptographic random face indices instead of trusting client-side math routines.
  * Precise SQL queries tracking user victory streaks and matchmaking lobby performance indices.

### Phase 4: Decentralized Tournament Standings Engine
* **The Goal**: Dynamic brackets and active real-time multi-person matchmaking.
* **Unimplemented Mechanics**:
  * Server-side algorithms grouping online players into 4-person Ludo matches or multi-tier Chess brackets based on rating weights.
  * Automated bracket propagation and round-advancement timers that automatically declare winners if an opponent fails to check-in.
  * Native castling paths, draw claims (threefold repetition, 50-move rules), and absolute checkmate-checker algorithms running on the Chess cluster.

---

## 🛠️ Tech Stack & Workspace Development

* **Frontend Framework**: React 18+ (Vite)
* **Programming Language**: TypeScript (Strict Typings)
* **Style Engine**: Tailwind CSS
* **Animations**: Framer Motion (`motion/react`)
* **Icons Library**: Lucide React
* **Data Visualizations**: Recharts `d3` components
