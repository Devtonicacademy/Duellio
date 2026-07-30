import { useEffect, useRef } from 'react';
import { GameEngine } from './GameEngine';

export default function GameCanvas({ config, onUIUpdate, isPaused, isRestartTriggered, onRestartCompleted }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const requestRef = useRef(null);

  const isPausedRef = useRef(isPaused);
  const onUIUpdateRef = useRef(onUIUpdate);

  // Keep onUIUpdateRef fresh without tearing down the GameEngine instance
  useEffect(() => {
    onUIUpdateRef.current = onUIUpdate;
  }, [onUIUpdate]);

  const LOGICAL_WIDTH = 960;
  const LOGICAL_HEIGHT = 540;

  // Sync pause ref and control ambient music — no engine rebuild
  useEffect(() => {
    isPausedRef.current = isPaused;
    const sound = engineRef.current?.sound;
    if (sound) {
      if (isPaused) {
        sound.stopAmbient();
      } else {
        sound.startAmbient();
      }
    }
  }, [isPaused]);

  // Dynamic map updates on existing engine instance without rebuilding
  useEffect(() => {
    if (engineRef.current && config?.map) {
      engineRef.current.setMap(config.map);
    }
  }, [config?.map]);

  // Build engine ONLY ONCE per match session configuration (mode, difficulty, names, colors)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let targetWidth = Math.round(rect.width * dpr);
      let targetHeight = Math.round(rect.height * dpr);

      if (targetWidth === 0 || targetHeight === 0) {
        targetWidth = LOGICAL_WIDTH * dpr;
        targetHeight = LOGICAL_HEIGHT * dpr;
      }

      // Cap backing store resolution to 1920px width to prevent performance lag on 4K screens
      const maxBackingWidth = 1920;
      if (targetWidth > maxBackingWidth) {
        const scaleFactor = maxBackingWidth / targetWidth;
        targetWidth = maxBackingWidth;
        targetHeight = Math.round(targetHeight * scaleFactor);
      }

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
    };

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('fullscreenchange', resizeCanvas);

    const engine = new GameEngine(canvas, {
      mode: config.mode,
      difficulty: config.difficulty,
      p1Color: config.p1Color,
      p2Color: config.p2Color,
      p1Name: config.p1Name,
      p2Name: config.p2Name,
      weaponSpawnEnabled: config.weaponSpawnEnabled,
      isRemoteClient: config.isRemoteClient,
      onUIEvent: (state) => {
        if (onUIUpdateRef.current) {
          onUIUpdateRef.current(state);
        }
      }
    });

    if (config.map) {
      engine.setMap(config.map);
    }

    engineRef.current = engine;
    window.gameEngine = engine;
    engine.init();

    // Start ambient music
    engine.sound.startAmbient();

    // High-precision 60 FPS frame rate lock loop
    let lastTime = performance.now();
    let accumulator = 0;
    const TARGET_FPS = 60;
    const INTERVAL = 1000 / TARGET_FPS; // ~16.666ms per frame

    const tick = (currentTime) => {
      requestRef.current = requestAnimationFrame(tick);
      
      let delta = currentTime - lastTime;
      lastTime = currentTime;

      // Cap delta to 250ms to prevent physics warping/jumping on tab switches
      if (delta > 250) delta = 250;

      accumulator += delta;

      // Perform updates and render at strictly locked 60 FPS rate (~16.67ms per step)
      if (accumulator >= INTERVAL - 0.8) {
        accumulator = accumulator % INTERVAL;
        
        if (!isPausedRef.current && engine.gameState !== 'gameover') {
          engine.update();
        }
        engine.draw();
      }
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('fullscreenchange', resizeCanvas);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (engineRef.current) {
        engineRef.current.sound?.stopAmbient();
        engineRef.current.cleanUp();
        engineRef.current = null;
        window.gameEngine = null;
      }
    };
    // Only re-build engine when match session configuration primitives change!
  }, [config?.mode, config?.difficulty, config?.p1Color, config?.p2Color, config?.p1Name, config?.p2Name, config?.weaponSpawnEnabled]);

  // Handle restart triggers
  useEffect(() => {
    if (isRestartTriggered && engineRef.current) {
      engineRef.current.restartMatch();
      onRestartCompleted();
    }
  }, [isRestartTriggered, onRestartCompleted]);

  const handlePointerDown = () => {
    if (engineRef.current && engineRef.current.sound) {
      engineRef.current.sound.init();
    }
  };

  return (
    <div className="canvas-wrapper relative flex items-center justify-center bg-black w-full h-full overflow-hidden shadow-2xl rounded-2xl border border-zinc-900">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="game-canvas select-none"
        style={{
          width: '100%',
          maxHeight: '100%',
          aspectRatio: '16/9',
          display: 'block'
        }}
      />
    </div>
  );
}
