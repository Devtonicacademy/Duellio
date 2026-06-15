import React from 'react';
import { DraftGameState, DraftPiece } from '../types';

interface DraftBoardProps {
  gameState: DraftGameState;
  onPieceClick?: (pieceId: string) => void;
  onCellClick?: (row: number, col: number) => void;
  selectedPieceId?: string | null;
}

export const DraftBoard: React.FC<DraftBoardProps> = ({
  gameState,
  onPieceClick,
  onCellClick,
  selectedPieceId
}) => {
  const boardSize = 8;
  const boardRows = Array.from({ length: boardSize }, (_, i) => i);
  const boardCols = Array.from({ length: boardSize }, (_, i) => i);

  return (
    <div className="w-full max-w-md mx-auto aspect-square bg-[#3d2314] p-2 rounded-xl shadow-2xl border-4 border-[#5c3a21]">
      <div className="w-full h-full grid grid-cols-8 grid-rows-8 border-2 border-black">
        {boardRows.map((row) =>
          boardCols.map((col) => {
            const isDark = (row + col) % 2 === 1;
            
            // Find if there is a piece on this cell
            const piece = gameState.pieces.find(
              (p) => p.position.row === row && p.position.col === col
            );
            
            const isSelected = piece && piece.id === selectedPieceId;

            return (
              <div
                key={`${row}-${col}`}
                onClick={() => onCellClick && onCellClick(row, col)}
                className={`
                  relative flex items-center justify-center
                  ${isDark ? 'bg-[#8b5a2b]' : 'bg-[#f4d0a4]'}
                `}
              >
                {piece && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPieceClick) onPieceClick(piece.id);
                    }}
                    className={`
                      w-4/5 h-4/5 rounded-full shadow-md cursor-pointer transition-transform
                      ${piece.playerId === gameState.playerIds[0] ? 'bg-white border-2 border-gray-300' : 'bg-black border-2 border-gray-800'}
                      ${isSelected ? 'ring-4 ring-yellow-400 scale-110' : 'hover:scale-105'}
                      ${piece.isKing ? 'flex items-center justify-center after:content-["♔"] after:text-xl' : ''}
                    `}
                  >
                    {piece.isKing && (
                      <span className={`text-xl ${piece.playerId === gameState.playerIds[0] ? 'text-black' : 'text-white'}`}>
                        ♔
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
