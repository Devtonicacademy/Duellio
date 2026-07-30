/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import GameCanvas from '../game/stickman/GameCanvas';
import HUD from '../game/stickman/HUD';
import MobileControls from '../game/stickman/MobileControls';
import OrientationPrompt from '../game/stickman/OrientationPrompt';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Swords, 
  Trophy, 
  Sparkles, 
  Flame, 
  ShieldAlert,
  HelpCircle,
  X,
  ArrowRight
} from 'lucide-react';

interface InteractiveStickmanBoardProps {
  entryFee: number;
  opponentName: string;
  opponentAvatar: string;
  userName?: string;
  onGameOver: (winnerIsMe: boolean) => void;
  onAddLog: (log: string) => void;
  onReMatch?: () => void;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  isBot?: boolean;
  sessionId?: string;
  isHost?: boolean;
  liveGameState?: any;
  onUpdateLiveState?: (newState: any) => void;
}

export const InteractiveStickmanBoard: React.FC<InteractiveStickmanBoardProps> = ({
  entryFee,
  opponentName,
  opponentAvatar,
  userName,
  onGameOver,
  onAddLog,
  onReMatch,
  botDifficulty = 'medium',
  isBot = true,
  sessionId,
  isHost = true,
  liveGameState,
  onUpdateLiveState
}) => {
  const isPractice = opponentName.toUpperCase().includes('PRACTICE') || entryFee === 0;

  // Game configuration
  const [mode, setMode] = useState<'p1_vs_cpu' | 'p1_vs_p2' | 'practice' | 'survival'>(
    isPractice ? 'practice' : (isBot ? 'p1_vs_cpu' : 'p1_vs_p2')
  );
  const [selectedMap, setSelectedMap] = useState<'arena' | 'dojo' | 'temple' | 'volcano' | 'snow'>('dojo');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isRestartTriggered, setIsRestartTriggered] = useState<boolean>(false);
  const [showControlsGuide, setShowControlsGuide] = useState<boolean>(false);

  // Practice Toggles
  const [practiceInfiniteHealth, setPracticeInfiniteHealth] = useState<boolean>(false);
  const [practiceInfiniteChi, setPracticeInfiniteChi] = useState<boolean>(false);

  // UI state from engine
  const [uiState, setUiState] = useState<any>({
    gameState: 'fight',
    winner: 0,
    fightText: '',
    fightTextOpacity: 0,
    p1Health: 100,
    p1HealthLag: 100,
    p1Chi: 0,
    p1Wins: 0,
    p1Combo: 0,
    p1Weapon: null,
    p1WeaponHint: null,
    p2Health: 100,
    p2HealthLag: 100,
    p2Chi: 0,
    p2Wins: 0,
    p2Combo: 0,
    p2Weapon: null,
    p2WeaponHint: null,
    round: 1,
    timer: 60,
    inputLog: []
  });

  const reportedOutcomeRef = useRef<boolean>(false);

  const player1Name = React.useMemo(() => {
    if (isBot) return userName || 'Player 1';
    return isHost ? (userName || 'Player 1') : (opponentName || 'Player 1');
  }, [isBot, isHost, userName, opponentName]);

  const player2Name = React.useMemo(() => {
    if (isBot) return opponentName;
    return isHost ? (opponentName || 'Player 2') : (userName || 'Player 2');
  }, [isBot, isHost, userName, opponentName]);

  const lastFirestoreUpdateRef = useRef<number>(0);

  const gameConfig = React.useMemo(() => ({
    mode,
    difficulty: botDifficulty,
    p1Color: '#06b6d4', // Cyan
    p2Color: '#ec4899', // Pink
    p1Name: player1Name,
    p2Name: player2Name,
    map: selectedMap,
    weaponSpawnEnabled: true,
    isRemoteClient: !isBot && !isHost
  }), [mode, botDifficulty, player1Name, player2Name, selectedMap, isBot, isHost]);

  // Sync live state from Firestore snapshot for non-host subscriber
  useEffect(() => {
    if (!isBot && !isHost && liveGameState) {
      setUiState(liveGameState);
      if ((window as any).gameEngine && typeof (window as any).gameEngine.syncLiveState === 'function') {
        (window as any).gameEngine.syncLiveState(liveGameState);
      }
      if (liveGameState.gameState === 'gameover' && !reportedOutcomeRef.current) {
        reportedOutcomeRef.current = true;
        const winnerIsMe = liveGameState.winner === 2;
        setTimeout(() => {
          onGameOver(winnerIsMe);
        }, 3500);
      }
    }
  }, [liveGameState, isBot, isHost, onGameOver]);

  // Host syncs P2 remote input from Guest Firestore updates
  useEffect(() => {
    if (!isBot && isHost && liveGameState?.p2Input) {
      if ((window as any).gameEngine?.input?.setRemoteP2Input) {
        (window as any).gameEngine.input.setRemoteP2Input(liveGameState.p2Input);
      }
    }
  }, [liveGameState, isBot, isHost]);

  // Guest polls local inputs and transmits P2 control inputs to Host via Firestore
  const lastGuestInputStrRef = useRef<string>('');
  useEffect(() => {
    if (isBot || isHost || !onUpdateLiveState) return;

    const interval = setInterval(() => {
      const engine = (window as any).gameEngine;
      if (engine?.input?.getActiveInputs) {
        const inputs = engine.input.getActiveInputs(2);
        const inputStr = JSON.stringify(inputs);
        if (inputStr !== lastGuestInputStrRef.current) {
          lastGuestInputStrRef.current = inputStr;
          onUpdateLiveState({ p2Input: inputs });
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isBot, isHost, onUpdateLiveState]);

  const handleUIUpdate = useCallback((state: any) => {
    setUiState(state);

    // ONLY the host writes authoritative live game state to Firestore to prevent clashing writes
    // Throttle Firestore writes to max once every 50ms (20 updates/sec) to avoid network queue congestion
    const now = Date.now();
    if (!isBot && isHost && onUpdateLiveState && (now - lastFirestoreUpdateRef.current >= 50 || state.gameState === 'gameover')) {
      lastFirestoreUpdateRef.current = now;
      onUpdateLiveState(state);
    }

    if (state.gameState === 'gameover' && !reportedOutcomeRef.current) {
      reportedOutcomeRef.current = true;
      const winnerIsMe = isHost ? state.winner === 1 : state.winner === 2;
      const winnerName = state.winner === 1 ? player1Name : player2Name;
      if (winnerIsMe) {
        onAddLog(`[STICKMAN DUEL] Victory achieved! ${userName || 'You'} defeated ${opponentName}.`);
      } else {
        onAddLog(`[STICKMAN DUEL] Defeat in match vs ${opponentName}. ${winnerName} won.`);
      }
      setTimeout(() => {
        onGameOver(winnerIsMe);
      }, 3500);
    }
  }, [opponentName, userName, player1Name, player2Name, onGameOver, onAddLog, isBot, isHost, onUpdateLiveState]);

  const toggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    if ((window as any).gameEngine && (window as any).gameEngine.sound) {
      (window as any).gameEngine.sound.muted = !next;
    }
  };

  const triggerRestart = () => {
    reportedOutcomeRef.current = false;
    setIsRestartTriggered(true);
    setIsPaused(false);
    onAddLog(`[MATCH RESTART] Stickman duel reset for round 1.`);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center bg-zinc-950 rounded-2xl border border-zinc-800/80 shadow-2xl p-3 md:p-5 overflow-hidden select-none">
      
      {/* Top Header Controls & Info */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-3 px-2 border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/stickman_icon.png" 
            alt="Stickman Kung-Fu" 
            className="w-10 h-10 rounded-xl object-cover border border-cyan-500/40 shadow-lg shrink-0" 
          />
          <div>
            <h3 className="text-base md:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              Stickman Kung-Fu Arena
              {isPractice && (
                <span className="text-[10px] bg-violet-900/60 border border-violet-500/40 text-violet-300 font-bold px-2 py-0.5 rounded-full">
                  PRACTICE MODE
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              STAKE: <span className="text-amber-400 font-bold">{entryFee} COINS</span> • VS <span className="text-pink-400 font-bold">{opponentName}</span> ({botDifficulty.toUpperCase()})
            </p>
          </div>
        </div>

        {/* Map Selector & Utility Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedMap}
            onChange={(e) => setSelectedMap(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-700/80 text-xs font-extrabold uppercase text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="dojo">Dojo Arena</option>
            <option value="arena">Classic Arena</option>
            <option value="temple">Dragon Temple</option>
            <option value="volcano">Volcanic Pit</option>
            <option value="snow">Snow Mountain</option>
          </select>

          <button
            onClick={() => setShowControlsGuide(!showControlsGuide)}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors"
            title="Controls & Moves"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors"
            title="Toggle Sound"
          >
            {isSoundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900 text-cyan-300 font-bold text-xs flex items-center gap-1.5 px-3 transition-all"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Main Canvas & HUD Container */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-900 shadow-2xl">
        <GameCanvas
          config={gameConfig}
          onUIUpdate={handleUIUpdate}
          isPaused={isPaused}
          isRestartTriggered={isRestartTriggered}
          onRestartCompleted={() => setIsRestartTriggered(false)}
        />

        {/* HUD Layer */}
        <HUD uiState={uiState} />

        {/* Orientation Prompt for Mobile devices */}
        <OrientationPrompt />

        {/* Mobile Virtual Joystick & Touch Controls */}
        <MobileControls inputHandler={(window as any).gameEngine?.input} p1Chi={uiState.p1Chi} playerNumber={isHost ? 1 : 2} />

        {/* Controls Guide Overlay Modal */}
        {showControlsGuide && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 p-6 flex flex-col justify-center items-center text-zinc-200">
            <button
              onClick={() => setShowControlsGuide(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <h4 className="text-xl font-black uppercase text-cyan-400 mb-4 tracking-wider">Kung-Fu Move Controls</h4>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono max-w-md w-full">
              <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                <span className="text-cyan-400 font-bold block mb-1">MOVEMENT</span>
                <p>A / D : Move Left / Right</p>
                <p>W : Jump / Double Jump</p>
                <p>S : Block / Crouch</p>
              </div>
              <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                <span className="text-pink-400 font-bold block mb-1">ATTACKS</span>
                <p>J : Light Punch</p>
                <p>K : Kick</p>
                <p>L : Special Chi Blast</p>
                <p>U : Pick Weapon</p>
              </div>
            </div>
            <button
              onClick={() => setShowControlsGuide(false)}
              className="mt-6 bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold px-6 py-2 rounded-lg uppercase text-xs tracking-wider"
            >
              Got It!
            </button>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {isPaused && (
          <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md z-40 flex flex-col items-center justify-center animate-fade-in p-4">
            <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800 shadow-2xl max-w-sm w-full text-center space-y-4">
              <h3 className="text-2xl font-black italic uppercase tracking-wider text-cyan-400 drop-shadow">
                MATCH PAUSED
              </h3>

              {isPractice && (
                <div className="bg-zinc-950/80 border border-violet-800/40 rounded-xl p-3 text-left space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">Practice Options</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const next = !practiceInfiniteHealth;
                        setPracticeInfiniteHealth(next);
                        if ((window as any).gameEngine) (window as any).gameEngine.practiceInfiniteHealth = next;
                      }}
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded transition-colors border ${practiceInfiniteHealth ? 'bg-violet-900 text-white border-violet-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                    >
                      Inf Health: {practiceInfiniteHealth ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => {
                        const next = !practiceInfiniteChi;
                        setPracticeInfiniteChi(next);
                        if ((window as any).gameEngine) (window as any).gameEngine.practiceInfiniteChi = next;
                      }}
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded transition-colors border ${practiceInfiniteChi ? 'bg-violet-900 text-white border-violet-500' : 'bg-zinc-800 text-zinc-700'}`}
                    >
                      Inf Chi: {practiceInfiniteChi ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => setIsPaused(false)}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold uppercase text-xs py-2.5 rounded-lg shadow-lg transition-all"
                >
                  Resume Duel
                </button>
                <button
                  onClick={triggerRestart}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold uppercase text-xs py-2.5 rounded-lg transition-all"
                >
                  Restart Round
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MATCH GAME OVER OVERLAY */}
        {uiState.gameState === 'gameover' && (
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md z-40 flex flex-col items-center justify-center animate-fade-in p-4">
            <div className="bg-zinc-900/90 p-8 rounded-2xl border border-zinc-800 shadow-2xl text-center max-w-sm w-full space-y-4">
              <h2 className={`text-3xl font-black italic uppercase tracking-wider ${uiState.winner === 1 ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]'}`}>
                {uiState.winner === 1 ? 'VICTORY!' : 'DEFEAT'}
              </h2>
              <p className="text-zinc-300 text-xs font-extrabold uppercase tracking-wider">
                {uiState.winner === 1 ? 'Player 1 Wins the Match' : `${opponentName} Wins the Match`}
              </p>
              
              <div className="flex items-center justify-center gap-4 text-xs font-semibold text-zinc-400 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800">
                <span>P1 Wins: {uiState.p1Wins}</span>
                <span className="text-zinc-700">|</span>
                <span>P2 Wins: {uiState.p2Wins}</span>
              </div>
              
              <div className="flex flex-col gap-2 pt-4">
                <button
                  onClick={() => {
                    if (onReMatch) onReMatch();
                    triggerRestart();
                  }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-black font-black uppercase text-xs py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again ({entryFee > 0 ? `Restake ${entryFee} Coins` : 'Free'})
                </button>
                <button
                  onClick={() => onGameOver(uiState.winner === 1)}
                  className="w-full bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold uppercase text-xs py-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ArrowRight className="w-4 h-4" />
                  Exit Arena
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
