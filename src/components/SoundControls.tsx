/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Interactive Sound Control Button & Volume Popover Component for Duellio Games
 */

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, SlidersHorizontal, Music, Zap } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

export const SoundControls: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getIsMuted());
  const [showPopover, setShowPopover] = useState<boolean>(false);
  const [bgmVol, setBgmVol] = useState<number>(soundEngine.getBgmVolume());
  const [sfxVol, setSfxVol] = useState<number>(soundEngine.getSfxVolume());

  useEffect(() => {
    setIsMuted(soundEngine.getIsMuted());
  }, []);

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleBgmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setBgmVol(val);
    soundEngine.setBgmVolume(val);
    if (isMuted && val > 0) {
      handleToggleMute();
    }
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSfxVol(val);
    soundEngine.setSfxVolume(val);
    if (isMuted && val > 0) {
      handleToggleMute();
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md border border-amber-500/30 rounded-xl p-1 shadow-lg">
        <button
          onClick={handleToggleMute}
          className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title={isMuted ? 'Unmute Game Sounds' : 'Mute Game Sounds'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-zinc-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
          )}
          <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio On'}</span>
        </button>

        <button
          onClick={() => setShowPopover(!showPopover)}
          className="p-1.5 rounded-lg hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 transition-colors"
          title="Sound Volume Settings"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Volume Popover */}
      {showPopover && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-950/95 border border-amber-500/30 rounded-2xl p-3 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Music className="w-3.5 h-3.5" /> Audio Mixer
            </span>
            <button
              onClick={() => setShowPopover(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Soundtrack BGM Volume */}
            <div>
              <div className="flex justify-between text-[11px] font-medium text-zinc-300 mb-1">
                <span className="flex items-center gap-1"><Music className="w-3 h-3 text-cyan-400" /> Soundtrack BGM</span>
                <span className="text-cyan-400 font-mono">{Math.round(bgmVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgmVol}
                onChange={handleBgmChange}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Sound Effects SFX Volume */}
            <div>
              <div className="flex justify-between text-[11px] font-medium text-zinc-300 mb-1">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Sound Effects (SFX)</span>
                <span className="text-amber-400 font-mono">{Math.round(sfxVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={handleSfxChange}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
