/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, ShieldCheck, Timer, Award, AlertTriangle, Play, Eye, EyeOff, HelpCircle, Trophy } from 'lucide-react';
import { Chess3DScene } from './Chess3DScene';
import { ChessRulesService, CastlingRights, INITIAL_CASTLING_RIGHTS } from '../services/chessRulesService';

interface InteractiveChessBoardProps {
  entryFee: number;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winnerIsMe: boolean) => void;
  onAddLog: (log: string) => void;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  isBot?: boolean;
  sessionId?: string;
  isHost?: boolean;
  liveGameState?: any;
  onUpdateLiveState?: (newState: any) => void;
}

type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
type Color = 'w' | 'b';

interface ChessPiece {
  type: PieceType;
  color: Color;
}

type BoardGrid = Array<Array<ChessPiece | null>>;

const INITIAL_BOARD: BoardGrid = [
  [
    { type: 'r', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'q', color: 'b' },
    { type: 'k', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'r', color: 'b' }
  ],
  [
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' }
  ],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' }
  ],
  [
    { type: 'r', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'q', color: 'w' },
    { type: 'k', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'r', color: 'w' }
  ]
];

// Helper: unicode converter
const PIECE_SYMBOLS: Record<string, string> = {
  'r_b': '♜', 'n_b': '♞', 'b_b': '♝', 'q_b': '♛', 'k_b': '♚', 'p_b': '♟',
  'r_w': '♜', 'n_w': '♞', 'b_w': '♝', 'q_w': '♛', 'k_w': '♚', 'p_w': '♟'
};

const PIECE_NAMES: Record<string, string> = {
  'p': 'Pawn', 'r': 'Rook', 'n': 'Knight', 'b': 'Bishop', 'q': 'Queen', 'k': 'King'
};

export const InteractiveChessBoard: React.FC<InteractiveChessBoardProps> = ({
  entryFee,
  opponentName,
  opponentAvatar,
  onGameOver,
  onAddLog,
  botDifficulty,
  isBot = true,
  sessionId,
  isHost = true,
  liveGameState,
  onUpdateLiveState
}) => {
  const [board, setBoard] = useState<BoardGrid>(() => liveGameState?.board || JSON.parse(JSON.stringify(INITIAL_BOARD)));
  const [activeColor, setActiveColor] = useState<Color>(() => liveGameState?.activeColor || 'w'); // 'w' = Player 1 / White, 'b' = Player 2 / Black
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [castlingRights, setCastlingRights] = useState<CastlingRights>(() => liveGameState?.castlingRights || { ...INITIAL_CASTLING_RIGHTS });
  const [enPassantTarget, setEnPassantTarget] = useState<[number, number] | null>(() => liveGameState?.enPassantTarget || null);
  const [isCheck, setIsCheck] = useState<boolean>(false);
  const [whiteTimer, setWhiteTimer] = useState<number>(300); // 5 minutes standard speed
  const [blackTimer, setBlackTimer] = useState<number>(300);
  const [fenString, setFenString] = useState<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [gameResult, setGameResult] = useState<'playing' | 'white_won' | 'black_won' | 'draw'>('playing');
  const [moveAttemptLogs, setMoveAttemptLogs] = useState<string[]>([]);
  const [botIsThinking, setBotIsThinking] = useState<boolean>(false);
  const [view3D, setView3D] = useState<boolean>(true);
  const [showHelperRules, setShowHelperRules] = useState<boolean>(false);
  const [invalidMoveMessage, setInvalidMoveMessage] = useState<string | null>(null);
  const [selectedPieceTips, setSelectedPieceTips] = useState<string | null>(null);

  const myColor: Color = isBot ? 'w' : (isHost ? 'w' : 'b');

  // Sync live state from Firestore snapshot
  useEffect(() => {
    if (!isBot && liveGameState) {
      if (liveGameState.board) setBoard(liveGameState.board);
      if (liveGameState.activeColor) setActiveColor(liveGameState.activeColor);
      if (liveGameState.castlingRights) setCastlingRights(liveGameState.castlingRights);
      if (liveGameState.enPassantTarget !== undefined) setEnPassantTarget(liveGameState.enPassantTarget);
      if (liveGameState.status === 'completed') {
        if (liveGameState.winnerColor === myColor) {
          setGameResult(myColor === 'w' ? 'white_won' : 'black_won');
          onGameOver(true);
        } else {
          setGameResult(myColor === 'w' ? 'black_won' : 'white_won');
          onGameOver(false);
        }
      }
    }
  }, [liveGameState, isBot, myColor, onGameOver]);

  // Trigger feedback tips helper when white coordinates are selected to assist beginner path alignment
  useEffect(() => {
    if (selectedSquare) {
      const [r, c] = selectedSquare;
      const piece = board[r][c];
      if (piece) {
        const typeName = PIECE_NAMES[piece.type];
        let tip = '';
        if (piece.type === 'p') tip = 'moves 1 square forward (or 2 from its starting row) and captures exactly 1 square diagonally.';
        else if (piece.type === 'n') tip = 'moves in L-shapes (2 spaces forward, then 1 sideways). It is the only unit that can leap over other pieces!';
        else if (piece.type === 'b') tip = 'moves as many open squares diagonally as you wish. It must stay on its original tile color.';
        else if (piece.type === 'r') tip = 'moves any number of open squares in straight lines horizontally or vertically.';
        else if (piece.type === 'q') tip = 'is your most powerful asset! It moves any distance in any straight or diagonal direction.';
        else if (piece.type === 'k') tip = 'is your commander! It moves exactly 1 square in any direction. Defend it at all costs!';
        
        setSelectedPieceTips(`Selected ${typeName}: This unit ${tip}`);
      } else {
        setSelectedPieceTips(null);
      }
    } else {
      setSelectedPieceTips(null);
    }
  }, [selectedSquare, board]);

  // Generate a standard FEN string representation of the current grid state on changes
  useEffect(() => {
    let rows: string[] = [];
    for (let r = 0; r < 8; r++) {
      let fenRow = '';
      let consecutiveEmpty = 0;
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece === null) {
          consecutiveEmpty++;
        } else {
          if (consecutiveEmpty > 0) {
            fenRow += consecutiveEmpty.toString();
            consecutiveEmpty = 0;
          }
          const char = piece.type;
          fenRow += piece.color === 'w' ? char.toUpperCase() : char;
        }
      }
      if (consecutiveEmpty > 0) {
        fenRow += consecutiveEmpty.toString();
      }
      rows.push(fenRow);
    }
    const coreFen = rows.join('/') + ` ${activeColor} KQkq - 0 1`;
    setFenString(coreFen);
  }, [board, activeColor]);

  // Handle active timers counting down
  useEffect(() => {
    if (gameResult !== 'playing') return;

    const interval = setInterval(() => {
      if (activeColor === 'w') {
        setWhiteTimer(prev => {
          if (prev <= 1) {
            setGameResult('black_won');
            onAddLog(`[SESSION TERMINATED] White player timer expired lockouts.`);
            setTimeout(() => onGameOver(false), 2500);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTimer(prev => {
          if (prev <= 1) {
            setGameResult('white_won');
            onAddLog(`[SESSION TERMINATED] Black player timer expired lockouts.`);
            setTimeout(() => onGameOver(true), 2500);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeColor, gameResult]);

  // Convert row coordinates to algebraic coordinates (e.g., 0,0 is a8, 7,7 is h1)
  const getAlgebraicPos = (row: number, col: number): string => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return files[col] + ranks[row];
  };

  // Human click action handler on standard tiles
  const handleTileClick = (row: number, col: number) => {
    if (gameResult !== 'playing' || activeColor !== myColor || botIsThinking) return;

    if (selectedSquare) {
      const [selRow, selCol] = selectedSquare;

      // Clicked same square -> deselect
      if (selRow === row && selCol === col) {
        setSelectedSquare(null);
        return;
      }

      const actingPiece = board[selRow][selCol];
      const clickedPiece = board[row][col];

      // If clicked destination has our own piece -> update selection instead
      if (clickedPiece && clickedPiece.color === myColor) {
        setSelectedSquare([row, col]);
        return;
      }

      // FIDE Legal movement check
      const isLegal = ChessRulesService.isMoveLegal(board, selRow, selCol, row, col, castlingRights, enPassantTarget);
      if (!isLegal) {
        onAddLog(`[SAN VALIDATOR] Blocked move: Violates FIDE rules or leaves King in check!`);
        const itemType = actingPiece ? PIECE_NAMES[actingPiece.type] : 'Piece';
        setInvalidMoveMessage(`Illegal Move! Overlaid coordinates violate movement rules for your ${itemType} or expose your King to check.`);
        setSelectedSquare(null);
        return;
      }

      // Execute movement
      setInvalidMoveMessage(null);
      executeChessMove(selRow, selCol, row, col);
    } else {
      // Pick piece first
      const piece = board[row][col];
      if (piece && piece.color === myColor) {
        setSelectedSquare([row, col]);
        setInvalidMoveMessage(null);
      }
    }
  };

  const executeChessMove = (fromR: number, fromC: number, toR: number, toC: number) => {
    const piece = board[fromR][fromC]!;
    const destCoord = getAlgebraicPos(toR, toC);
    const destPiece = board[toR][toC];

    const isWhite = piece.color === 'w';
    const nextColor: Color = isWhite ? 'b' : 'w';

    // 1. Calculate board mutation
    const newBoard = board.map(row => [...row]);
    newBoard[fromR][fromC] = null;

    // Handle En Passant capture removal
    let capturedPiece = destPiece;
    if (piece.type === 'p' && enPassantTarget && toR === enPassantTarget[0] && toC === enPassantTarget[1]) {
      const pawnRowToRemove = isWhite ? toR + 1 : toR - 1;
      capturedPiece = newBoard[pawnRowToRemove][toC];
      newBoard[pawnRowToRemove][toC] = null;
    }

    // Handle Castling rook move
    let castlingNotation = '';
    if (piece.type === 'k' && Math.abs(toC - fromC) === 2) {
      if (toC === 6) { // Kingside
        const rook = newBoard[fromR][7];
        newBoard[fromR][5] = rook;
        newBoard[fromR][7] = null;
        castlingNotation = 'O-O';
      } else if (toC === 2) { // Queenside
        const rook = newBoard[fromR][0];
        newBoard[fromR][3] = rook;
        newBoard[fromR][0] = null;
        castlingNotation = 'O-O-O';
      }
    }

    // Handle Pawn Promotion (Auto-promote to Queen on back rank)
    let isPromoted = false;
    if (piece.type === 'p' && (toR === 0 || toR === 7)) {
      newBoard[toR][toC] = { type: 'q', color: piece.color };
      isPromoted = true;
    } else {
      newBoard[toR][toC] = piece;
    }

    // 2. Update Castling Rights & En Passant Target
    const nextCastling = { ...castlingRights };
    if (piece.type === 'k') {
      if (isWhite) { nextCastling.wK = false; nextCastling.wQ = false; }
      else { nextCastling.bK = false; nextCastling.bQ = false; }
    }
    if (piece.type === 'r') {
      if (fromR === 7 && fromC === 0) nextCastling.wQ = false;
      if (fromR === 7 && fromC === 7) nextCastling.wK = false;
      if (fromR === 0 && fromC === 0) nextCastling.bQ = false;
      if (fromR === 0 && fromC === 7) nextCastling.bK = false;
    }

    let nextEnPassant: [number, number] | null = null;
    if (piece.type === 'p' && Math.abs(toR - fromR) === 2) {
      const midR = fromR + (isWhite ? -1 : 1);
      nextEnPassant = [midR, fromC];
    }

    setCastlingRights(nextCastling);
    setEnPassantTarget(nextEnPassant);
    setBoard(newBoard);
    setActiveColor(nextColor);
    setSelectedSquare(null);

    // 3. Check for Check, Checkmate, and Stalemate
    const checkState = ChessRulesService.isKingInCheck(newBoard, nextColor);
    setIsCheck(checkState);

    const outcome = ChessRulesService.getGameStateOutcome(newBoard, nextColor, nextCastling, nextEnPassant);

    const moveNotation = castlingNotation 
      ? castlingNotation 
      : `${piece.type.toUpperCase()}${capturedPiece ? 'x' : ''}${destCoord}${isPromoted ? '=Q' : ''}${checkState ? '+' : ''}`;

    onAddLog(`[SAN VALIDATOR] ${isWhite ? 'Player' : opponentName} move: ${moveNotation}`);

    if (!isBot && onUpdateLiveState) {
      onUpdateLiveState({
        board: newBoard,
        activeColor: nextColor,
        castlingRights: nextCastling,
        enPassantTarget: nextEnPassant,
        status: outcome === 'checkmate' || outcome === 'stalemate' ? 'completed' : 'playing',
        winnerColor: outcome === 'checkmate' ? piece.color : undefined
      });
    }

    if (outcome === 'checkmate') {
      const winnerState = isWhite ? 'white_won' : 'black_won';
      setGameResult(winnerState);
      onAddLog(`[CHECKMATE] ${isWhite ? 'White' : 'Black'} has delivered CHECKMATE! Match concluded.`);
      setTimeout(() => onGameOver(isWhite === (myColor === 'w')), 2500);
      return;
    } else if (outcome === 'stalemate') {
      setGameResult('draw');
      onAddLog(`[STALEMATE] No legal moves available. Match declared a Draw.`);
      return;
    }

    setActiveColor(nextColor);

    setMoveAttemptLogs(prev => [
      `${isWhite ? 'White' : 'Black'}: ${moveNotation}`,
      ...prev
    ]);
  };

  // Bot Turn Engine
  useEffect(() => {
    if (!isBot || activeColor !== 'b' || gameResult !== 'playing' || botIsThinking) return;

    setBotIsThinking(true);
    onAddLog(`[TURN KICK] Bot player ${opponentName} evaluating legal moves with FEN engine.`);

    setTimeout(() => {
      const legalMoves = ChessRulesService.getAllLegalMoves(board, 'b', castlingRights, enPassantTarget);

      if (legalMoves.length === 0) {
        const inCheck = ChessRulesService.isKingInCheck(board, 'b');
        if (inCheck) {
          onAddLog(`[CHECKMATE] Bot is in checkmate! White wins.`);
          setGameResult('white_won');
          setTimeout(() => onGameOver(true), 2500);
        } else {
          onAddLog(`[STALEMATE] Bot has no legal moves. Match is a draw.`);
          setGameResult('draw');
        }
        setBotIsThinking(false);
        return;
      }

      // Score moves
      const scoredMoves = legalMoves.map(m => {
        const actingPiece = board[m.from[0]][m.from[1]]!;
        const targetPiece = board[m.to[0]][m.to[1]];
        let moveScore = 1;
        const isHard = botDifficulty === 'hard' || entryFee > 0;

        if (targetPiece) {
          const pieceVal: Record<PieceType, number> = { k: 999, q: 90, r: 50, b: 30, n: 30, p: 10 };
          moveScore = (pieceVal[targetPiece.type] || 10) * 10;
        } else if (isHard) {
          if ((m.to[0] === 3 || m.to[0] === 4) && (m.to[1] >= 2 && m.to[1] <= 5)) moveScore += 3;
          if (actingPiece.type === 'p') moveScore += m.to[0];
        }

        // Prioritize check delivery
        const tempBoard = board.map(row => [...row]);
        tempBoard[m.to[0]][m.to[1]] = actingPiece;
        tempBoard[m.from[0]][m.from[1]] = null;
        if (ChessRulesService.isKingInCheck(tempBoard, 'w')) {
          moveScore += 15;
        }

        return { ...m, score: moveScore };
      });

      scoredMoves.sort((x, y) => y.score - x.score);
      const chosen = scoredMoves[0];

      executeChessMove(chosen.from[0], chosen.from[1], chosen.to[0], chosen.to[1]);
      setBotIsThinking(false);
    }, 250);

  }, [activeColor, board, gameResult, castlingRights, enPassantTarget]);

  // Format digital timers
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Pre-calculate valid target destinations using FIDE rule legal checks
  const validDestinations = (selectedSquare && activeColor === 'w')
    ? ChessRulesService.getLegalMovesForPiece(board, selectedSquare[0], selectedSquare[1], castlingRights, enPassantTarget)
    : [];

  // Render highly-polished transparent glass cylindrical chess piece
  const renderChessPieceItem = (piece: ChessPiece, isSelected: boolean) => {
    const isPlayer = piece.color === 'w';
    const displayChar = PIECE_SYMBOLS[`${piece.type}_${piece.color}`];

    const schemas = isPlayer ? {
      glow: 'shadow-[0_0_15px_rgba(6,182,212,0.8)]',
      border: 'border-cyan-400',
      bg: 'from-cyan-500 to-cyan-700/60',
      text: 'text-cyan-100 drop-shadow-[0_0_5px_rgba(6,182,212,0.85)]'
    } : {
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.8)]',
      border: 'border-amber-400',
      bg: 'from-amber-600 to-amber-800/60',
      text: 'text-amber-100 drop-shadow-[0_0_5px_rgba(245,158,11,0.85)]'
    };

    return (
      <div 
        className="flex flex-col items-center justify-center relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div
          whileHover={{ scale: 1.15, y: -4 }}
          animate={isSelected ? { scale: 1.25, y: -8, translateZ: '25px' } : { scale: 1, y: 0, translateZ: '10px' }}
          style={{ transformStyle: 'preserve-3d' }}
          className={`relative w-8.5 h-8.5 md:w-10.5 md:h-10.5 rounded-full flex items-center justify-center cursor-pointer border ${schemas.border} ${schemas.glow} transition-all z-20`}
        >
          {/* Glass background fill */}
          <div className={`absolute inset-[2px] rounded-full bg-gradient-to-t ${schemas.bg} flex items-center justify-center`}>
            <span className={`text-[21px] md:text-2xl font-mono leading-none ${schemas.text} select-none`}>
              {displayChar}
            </span>
          </div>

          {/* Acrylic glossy reflection curve overlay */}
          <div className="absolute top-[2px] left-[5px] w-4.5 h-2 bg-white/40 rounded-full rotate-[-15deg] blur-[0.4px] pointer-events-none" />

          {/* Tiny sleek telemetry unit type tag label underneath cylinder */}
          <div className="absolute -bottom-2 text-[7px] font-mono tracking-wider text-[#cbd5e1] bg-[#020617] px-1 py-0.2 rounded border border-cyan-500/30 whitespace-nowrap select-none z-30 font-extrabold shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            {PIECE_NAMES[piece.type].toUpperCase()}
          </div>

          {/* Glowing active sonar scope circle */}
          {isSelected && (
            <span className="absolute -inset-1 rounded-full border border-cyan-400/70 animate-ping pointer-events-none" />
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div 
      className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#03060E] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-cyan-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)] animate-fade-in relative overflow-hidden" 
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Background elegant grid lines */}
      <div className="absolute top-2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent pointer-events-none" />
      <div className="absolute top-12 left-12 w-32 h-2.5 bg-cyan-400/10 rounded-full blur-[10px] rotate-[15deg] animate-pulse pointer-events-none" />

      {/* TACTICAL SUBBAR CONTROLS */}
      <div className="col-span-12 flex justify-between items-center px-2 pb-2.5 border-b border-cyan-500/15 z-10 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 bg-[#091522] rounded-lg border border-cyan-500/25 flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 tracking-wider">
            <Swords className="w-3.5 h-3.5 animate-pulse" />
            <span>CYBER CHESS MATCHMAKER v4.0.2</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelperRules(!showHelperRules)}
            className="p-1.5 bg-[#090F1B]/90 hover:bg-neutral-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1 font-mono uppercase cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>
          
          <button
            onClick={() => setView3D(!view3D)}
            className="p-1.5 bg-[#0e1627] hover:bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 rounded-lg transition-all text-xs flex items-center gap-1.5 font-mono uppercase font-bold shadow-[0_0_10px_rgba(6,182,212,0.15)] cursor-pointer"
          >
            {view3D ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{view3D ? '2D View' : '3D Camera'}</span>
          </button>
        </div>
      </div>

      {/* RULES PANEL DRAWER OVERLAY */}
      <AnimatePresence>
        {showHelperRules && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="col-span-12 bg-[#070D18]/95 backdrop-blur-md border border-cyan-500/40 p-4 rounded-2xl text-xs text-slate-350 space-y-2 z-40"
          >
            <h4 className="font-display font-black text-white uppercase text-sm tracking-wider">Duellio Chess Arena Contract</h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-450 font-mono text-[11px]">
              <li>You navigate the <span className="text-cyan-400 font-bold">CYAN pieces (White)</span>. Opponent runs the <span className="text-amber-400 font-bold">GOLD pieces (Black)</span>.</li>
              <li>A direct square touch chooses the unit. Valid tactical targets glow with discrete green targets on the grid.</li>
              <li>Timer countdown starts immediately on active turns. If your clock expires, the match is forfeited to Black.</li>
              <li>Eliminate the Opponent King to instantly resolve the transaction contract and claim the stakes ledger pools.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COGNITIVE DYNAMIC HUD ASSISTERS */}
      <div className="col-span-12 space-y-2 z-20">
        <AnimatePresence mode="wait">
          {invalidMoveMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              className="bg-rose-500/10 border-2 border-rose-500/45 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-200 shadow-[0_0_15px_rgba(239,68,68,0.15)] relative overflow-hidden"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 animate-bounce flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold uppercase tracking-wider text-rose-450 text-[10px] mb-0.5">Vector Collision / Invalid Target Row</p>
                <p className="font-mono text-slate-300 text-[11px] leading-relaxed">{invalidMoveMessage}</p>
              </div>
              <button 
                onClick={() => setInvalidMoveMessage(null)}
                className="text-slate-400 hover:text-white font-mono text-[10px] uppercase font-bold cursor-pointer bg-slate-900/60 p-1 px-1.5 rounded hover:bg-slate-950 border border-slate-800 ml-2"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {isCheck && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              className="bg-amber-500/15 border-2 border-amber-500/60 p-3 rounded-xl flex items-center justify-between text-xs text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 animate-bounce" />
                <div>
                  <p className="font-black uppercase tracking-wider text-amber-400 text-[11px]">⚠️ KING UNDER THREAT (+ CHECK)</p>
                  <p className="font-mono text-slate-300 text-[10px]">Your commander is in check! You must make a move that protects or moves your King.</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-500 text-neutral-950 font-black font-mono text-[10px] rounded uppercase tracking-widest shadow">
                CHECK!
              </span>
            </motion.div>
          )}

          {!invalidMoveMessage && !isCheck && selectedPieceTips && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              className="bg-cyan-500/10 border border-cyan-400/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
            >
              <div className="p-1 bg-cyan-500/20 rounded text-cyan-400 animate-pulse flex-shrink-0">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider text-cyan-455 text-[10px] mb-0.5">Tactical Guide Unit Protocol</p>
                <p className="font-mono text-slate-300 text-[11px] leading-relaxed">{selectedPieceTips}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 8x8 CHESS GRID MAP (Left Section) */}
      <div className="col-span-12 lg:col-span-8 flex flex-col items-center justify-center p-2">
        <div className="relative transition-all duration-700 ease-out flex items-center justify-center w-full max-w-[500px]">
          {view3D ? (
            <div className="w-full aspect-square bg-[#03060e] border border-cyan-500/35 p-1 rounded-2xl sm:rounded-[28px] shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(6,182,212,0.2)] relative overflow-hidden flex items-center justify-center">
              <Chess3DScene
                board={board}
                selectedSquare={selectedSquare}
                validDestinations={validDestinations}
                activeColor={activeColor}
                onTileClick={handleTileClick}
              />
            </div>
          ) : (
            <div 
              className="w-full max-w-[440px] aspect-square bg-[#070D18]/95 border border-cyan-500/35 p-1.5 sm:p-2.5 rounded-2xl sm:rounded-[28px] shadow-[0_30px_70px_rgba(0,0,0,0.8),0_0_35px_rgba(6,182,212,0.15)] flex flex-col relative chess-grid-canvas"
            >
              {/* Ambient inner bezel glow */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-[28px] border border-cyan-500/10 pointer-events-none" />

              <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-2xl overflow-hidden border border-neutral-850 bg-[#02050b]">
                {board.map((row, rIdx) => 
                  row.map((cell, cIdx) => {
                    const isSelected = selectedSquare && selectedSquare[0] === rIdx && selectedSquare[1] === cIdx;
                    const isDark = (rIdx + cIdx) % 2 === 1;
                    const isValidTarget = validDestinations.some(d => d[0] === rIdx && d[1] === cIdx);

                    // Color themes
                    let tileBg = isDark 
                      ? 'bg-[#040813]/90 hover:bg-[#071025]/80 border border-cyan-500/5' 
                      : 'bg-[#091122]/60 hover:bg-[#0f1a35]/70 border border-cyan-500/5';
                    
                    if (isSelected) {
                      tileBg = 'bg-cyan-500/15 border border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] z-10';
                    }

                    return (
                      <button
                        key={`${rIdx}_${cIdx}`}
                        onClick={() => handleTileClick(rIdx, cIdx)}
                        className={`aspect-square relative flex items-center justify-center cursor-pointer select-none transition-all ${tileBg}`}
                      >
                        {/* Render Chess pieces visually */}
                        {cell && renderChessPieceItem(cell, !!isSelected)}

                        {/* Tactical glowing valid targets indicators overlay */}
                        {isValidTarget && (
                          <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/5 cursor-pointer z-10 text-emerald-400">
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400/35 border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] animate-pulse" />
                          </div>
                        )}

                        {/* Left & Right rank numbers for clear line-of-sight tracking */}
                        {cIdx === 0 && (
                          <span className="absolute top-1 left-1.5 text-[9px] font-mono leading-none select-none font-extrabold text-cyan-450/60 pointer-events-none">
                            {8 - rIdx}
                          </span>
                        )}
                        {cIdx === 7 && (
                          <span className="absolute top-1 right-1.5 text-[9px] font-mono leading-none select-none font-extrabold text-cyan-450/60 pointer-events-none">
                            {8 - rIdx}
                          </span>
                        )}

                        {/* Top & Bottom file letters for clear column-of-sight tracking */}
                        {rIdx === 0 && (
                          <span className="absolute bottom-1 left-1.5 text-[9px] font-mono leading-none select-none font-extrabold text-cyan-455/60 pointer-events-none">
                            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][cIdx]}
                          </span>
                        )}
                        {rIdx === 7 && (
                          <span className="absolute bottom-1 right-1.5 text-[9px] font-mono leading-none select-none font-extrabold text-cyan-455/60 pointer-events-none">
                            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][cIdx]}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* METADATA COGNITIVE HUD AND HISTORICAL NOTATIONS (Right Section) */}
      <div className="col-span-12 lg:col-span-4 flex flex-col justify-between space-y-4 z-10">
        
        {/* State monitoring dashboard */}
        <div className="bg-[#070D18]/95 backdrop-blur-md p-4.5 rounded-2xl border border-cyan-500/20 space-y-4 flex-1 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-cyan-500/15">
              <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 tracking-wider">Active Chess Session</span>
              <div className="flex items-center gap-1.5 bg-[#091522] px-2.5 py-0.5 rounded-full text-[9px] font-mono text-emerald-400 font-bold border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>INTEGRITY SECURE</span>
              </div>
            </div>

            {/* Duel timing clocks */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* White Player clock */}
              <div className={`p-3 rounded-lg border text-center space-y-1.5 ${
                activeColor === 'w' 
                  ? 'bg-cyan-500/10 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/35' 
                  : 'bg-[#090F1B]/90 border-slate-900 text-slate-400'
              }`}>
                <span className="text-[9px] font-mono text-slate-400 uppercase block tracking-wider">You (Cyan)</span>
                <div className="flex items-center justify-center gap-1.5 font-mono text-sm font-black text-cyan-300">
                  <Timer className={`w-4 h-4 ${activeColor === 'w' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{formatTime(whiteTimer)}</span>
                </div>
              </div>

              {/* Black Bot Clock */}
              <div className={`p-3 rounded-lg border text-center space-y-1.5 ${
                activeColor === 'b' 
                  ? 'bg-amber-500/10 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/35' 
                  : 'bg-[#090F1B]/90 border-slate-900 text-slate-400'
              }`}>
                <span className="text-[9px] font-mono block uppercase tracking-wider">{opponentName} (Gold)</span>
                <div className="flex items-center justify-center gap-1.5 font-mono text-sm font-black text-amber-300">
                  <Timer className={`w-4 h-4 ${activeColor === 'b' ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{formatTime(blackTimer)}</span>
                </div>
              </div>
            </div>

            {/* Action notation historical grid ledger */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono text-slate-455 font-bold block uppercase tracking-wider font-extrabold">Action Notation Records</span>
              <div className="bg-[#040810] p-3 rounded-xl border border-slate-900 h-28 overflow-y-auto font-mono text-[10px] space-y-1.5 text-cyan-300 scrollbar-thin scrollbar-thumb-cyan-950/40">
                {moveAttemptLogs.length === 0 ? (
                  <span className="text-slate-500 italic block text-center pt-8">Tactical grid idle. Awaiting move deployment...</span>
                ) : (
                  moveAttemptLogs.map((log, index) => (
                    <div key={index} className="flex justify-between hover:bg-white/[0.02] px-1 py-0.5 rounded border-b border-slate-950">
                      <span className="text-slate-100">{log}</span>
                      <span className="text-[8px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded">LEGIT PASS</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* FEN Stream telemetry block */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-455 font-bold block uppercase tracking-wider font-extrabold pb-0.5">Active FEN Stream</span>
              <pre className="p-2.5 bg-[#02050B] text-cyan-400 rounded-xl text-[8.5px] font-mono whitespace-pre-wrap leading-normal border border-cyan-500/10 select-all font-bold">
                {fenString}
              </pre>
            </div>
          </div>

          {/* Active calculating notification block */}
          {activeColor === 'b' && (
            <div className="bg-[#111827]/80 text-white p-3.5 rounded-xl border border-amber-500/25 mt-4 flex items-center justify-between text-[11px] font-mono shadow-[0_0_15px_rgba(245,158,11,0.08)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-slate-300">{opponentName} calculates transaction paths...</span>
              </div>
            </div>
          )}

        </div>

        {/* Stake wager wallet block */}
        <div className="bg-[#050C16] text-[#FBBF24] p-3.5 rounded-xl border border-amber-500/20 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="font-bold uppercase tracking-wider text-slate-400">Ledger Stake Reward:</span>
          </div>
          <span className="font-black text-sm bg-amber-500/15 px-2.5 py-1 rounded text-amber-300 border border-amber-500/30">
            🪙 {entryFee * 2} Coins
          </span>
        </div>

      </div>

      {/* TACTICAL UNIT CODEX (BENTO GRID MANUAL) */}
      <div className="col-span-12 bg-[#050C16] rounded-2xl border border-cyan-500/15 p-4 z-10">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyan-500/10">
          <HelpCircle className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase">Interactive Unit Codex & Navigation Systems</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { symbol: '♟', name: 'Pawn', rules: 'Forward 1 (or 2 first move). Captures 1 diagonal.' },
            { symbol: '♞', name: 'Knight', rules: 'Moves in L-shapes (2x1). Can leap/hop over other units.' },
            { symbol: '♝', name: 'Bishop', rules: 'Unlimited diagonal corridors. Stays on original color.' },
            { symbol: '♜', name: 'Rook', rules: 'Unlimited straight horizons (vertical or horizontal lines).' },
            { symbol: '♛', name: 'Queen', rules: 'Unlimited straight or diagonal vectors. Extremely versatile!' },
            { symbol: '♚', name: 'King', rules: 'Exactly 1 square any direction. Capture ends the match.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#02050b]/80 border border-slate-900 rounded-xl p-3 flex flex-col justify-between text-center hover:border-cyan-500/30 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)] transition-all">
              <div className="flex items-center justify-center gap-1.5 mb-1 bg-slate-950/80 py-1 rounded border border-slate-900">
                <span className="text-xs text-cyan-400 font-bold">{item.symbol}</span>
                <span className="text-[10px] font-mono font-bold text-white tracking-wide uppercase">{item.name}</span>
              </div>
              <p className="text-[9.5px] font-mono leading-relaxed text-slate-400 mt-1 flex-1">{item.rules}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
