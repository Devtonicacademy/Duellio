import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Timer, Zap, CheckCircle2, Save } from 'lucide-react';

export function AdminTab() {
  const [totalGameTime, setTotalGameTime] = useState<number>(() => {
    return parseInt(localStorage.getItem('duellio-admin-total-game-time') || '1800', 10);
  });

  const [playerTurnTime, setPlayerTurnTime] = useState<number>(() => {
    return parseInt(localStorage.getItem('duellio-admin-player-turn-time') || '120', 10);
  });

  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = () => {
    localStorage.setItem('duellio-admin-total-game-time', String(totalGameTime));
    localStorage.setItem('duellio-admin-player-turn-time', String(playerTurnTime));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 font-sans">
      {/* Premium Admin Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/40 via-neutral-900/80 to-purple-900/40 border border-purple-500/20 rounded-3xl p-8 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />
        <div className="flex items-center gap-5">
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.2)] animate-pulse">
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-wider text-white font-display uppercase">Admin Control Room</h1>
              <span className="bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-widest uppercase">
                Secure Access
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 font-mono">AUTHORIZED CREDENTIAL: devtonicllc@gmail.com</p>
          </div>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="bg-neutral-900/60 border border-white/[0.06] rounded-3xl p-8 shadow-xl backdrop-blur-md mb-8">
        <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider font-display flex items-center gap-2.5">
          <Zap className="w-5 h-5 text-purple-400" />
          Match Physics & Time Parameters
        </h2>

        <div className="space-y-8">
          {/* Total Game Time Control */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-neutral-200 flex items-center gap-2 font-display">
                <Timer className="w-4.5 h-4.5 text-neutral-400" />
                TOTAL MATCH PLAY DURATION
              </label>
              <span className="text-xs font-mono font-black text-purple-355 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-lg">
                {Math.floor(totalGameTime / 60)} min ({totalGameTime}s)
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
              Sets the overall countdown limit for the entire match session. Upon expiration, stakes are auto-reconciled based on accumulated card weights.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <input
                type="range"
                min="60"
                max="3600"
                step="60"
                value={totalGameTime}
                onChange={(e) => setTotalGameTime(parseInt(e.target.value))}
                className="flex-1 accent-purple-500 cursor-pointer h-2 bg-neutral-850 rounded-lg appearance-none"
              />
            </div>
          </div>

          <hr className="border-white/[0.06]" />

          {/* Player Turn Time Control */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-neutral-200 flex items-center gap-2 font-display">
                <Timer className="w-4.5 h-4.5 text-neutral-400" />
                PLAYER MOVE TIME LIMIT
              </label>
              <span className="text-xs font-mono font-black text-purple-355 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-lg">
                {playerTurnTime} seconds
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
              Sets the maximum duration allowed for a single move action. Exceeding this limit forces automatic card drawing penalty rules.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={playerTurnTime}
                onChange={(e) => setPlayerTurnTime(parseInt(e.target.value))}
                className="flex-1 accent-purple-500 cursor-pointer h-2 bg-neutral-850 rounded-lg appearance-none"
              />
            </div>
          </div>

          <hr className="border-white/[0.06]" />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              {isSaved && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-xs text-emerald-450 font-bold font-mono"
                >
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                  PARAMETERS APPLIED SUCCESSFULLY
                </motion.div>
              )}
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-purple-350 hover:bg-purple-400 text-neutral-950 font-bold rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all font-display uppercase text-xs tracking-wider cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Apply Settings
            </button>
          </div>
        </div>
      </div>

      {/* Network Audit Logs */}
      <div className="bg-neutral-900/30 border border-white/[0.04] rounded-3xl p-6">
        <h3 className="text-xs font-bold text-neutral-450 uppercase tracking-widest font-mono mb-4">
          SYSTEM AUDIT STATUS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/20 p-4 rounded-2xl border border-white/[0.02]">
            <p className="text-[10px] text-neutral-500 font-mono uppercase">LOBBY ESCROW GATEWAY</p>
            <p className="text-sm font-bold text-emerald-455 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-455 animate-ping inline-block" />
              ACTIVE
            </p>
          </div>
          <div className="bg-black/20 p-4 rounded-2xl border border-white/[0.02]">
            <p className="text-[10px] text-neutral-500 font-mono uppercase">SECURITY PROTOCOL</p>
            <p className="text-sm font-bold text-purple-400 mt-1">AES-GCM ACTIVE</p>
          </div>
          <div className="bg-black/20 p-4 rounded-2xl border border-white/[0.02]">
            <p className="text-[10px] text-neutral-500 font-mono uppercase">LEDGER SYNCHRONIZER</p>
            <p className="text-sm font-bold text-emerald-455 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-455 animate-ping inline-block" />
              SYNCED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
