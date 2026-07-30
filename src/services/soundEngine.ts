/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Duellio Unified Web Audio API Sound & Soundtrack Engine
 * Provides unique background soundtracks & sound effects for every game:
 * Chess, Ludo, Whot, Draft (Checkers), TicTacToe, and Stickman Brawler.
 */

export type GameAudioType = 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = false;
  private bgmVolume: number = 0.5;
  private sfxVolume: number = 0.8;

  private currentBgmGame: GameAudioType | null = null;
  private bgmNodes: any[] = [];
  private bgmTimer: any = null;
  private isBgmPlaying: boolean = false;

  constructor() {
    // Load persisted user preferences if available
    try {
      const savedMute = localStorage.getItem('duellio_sound_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';

      const savedBgmVol = localStorage.getItem('duellio_bgm_vol');
      if (savedBgmVol !== null) this.bgmVolume = parseFloat(savedBgmVol);

      const savedSfxVol = localStorage.getItem('duellio_sfx_vol');
      if (savedSfxVol !== null) this.sfxVolume = parseFloat(savedSfxVol);
    } catch {
      /* ignore SSR / storage errors */
    }
  }

  // Initializer & Auto-Resume
  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 1.0;
      this.masterGain.connect(this.ctx.destination);

      // BGM Channel
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmVolume;
      this.bgmGain.connect(this.masterGain);

      // SFX Channel
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      // Auto-resume helper for browser user-gesture restrictions
      const resumeAudio = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('keydown', resumeAudio);
            window.removeEventListener('touchstart', resumeAudio);
            if (this.currentBgmGame && !this.isBgmPlaying) {
              this.startBgm(this.currentBgmGame);
            }
          });
        }
      };

      window.addEventListener('click', resumeAudio);
      window.addEventListener('keydown', resumeAudio);
      window.addEventListener('touchstart', resumeAudio);
    } catch (e) {
      console.warn('[SoundEngine] Web Audio API not supported', e);
    }
  }

  // ---------------------------------------------------------------------------
  // Audio Controls API
  // ---------------------------------------------------------------------------

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('duellio_sound_muted', String(muted));
    } catch {}

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
    }

    if (!this.isMuted && this.currentBgmGame && !this.isBgmPlaying) {
      this.startBgm(this.currentBgmGame);
    }
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public setBgmVolume(volume: number) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    try {
      localStorage.setItem('duellio_bgm_vol', String(this.bgmVolume));
    } catch {}
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    try {
      localStorage.setItem('duellio_sfx_vol', String(this.sfxVolume));
    } catch {}
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  // ---------------------------------------------------------------------------
  // Unique Background Music (Soundtrack) Synthesizers
  // ---------------------------------------------------------------------------

  public startBgm(gameType: GameAudioType) {
    this.init();
    this.currentBgmGame = gameType;

    if (this.isMuted) return;
    if (this.isBgmPlaying) {
      this.stopBgm();
      this.currentBgmGame = gameType;
    }
    if (!this.ctx || !this.bgmGain) return;

    this.isBgmPlaying = true;
    const now = this.ctx.currentTime;

    switch (gameType) {
      case 'Chess':
        this.synthChessSoundtrack(now);
        break;
      case 'Ludo':
        this.synthLudoSoundtrack(now);
        break;
      case 'Whot':
        this.synthWhotSoundtrack(now);
        break;
      case 'Draft':
        this.synthDraftSoundtrack(now);
        break;
      case 'TicTacToe':
        this.synthTicTacToeSoundtrack(now);
        break;
      case 'Stickman':
        this.synthStickmanSoundtrack(now);
        break;
    }
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }

    const now = this.ctx ? this.ctx.currentTime : 0;
    this.bgmNodes.forEach((node) => {
      try {
        if (node.gain) {
          node.gain.cancelScheduledValues(now);
          node.gain.linearRampToValueAtTime(0.0001, now + 0.3);
        }
        node.stop(now + 0.35);
      } catch {}
    });
    this.bgmNodes = [];
  }

  // --- Chess: Royal Gambit Sonata (Solemn, Baroque Cello & Piano Arpeggios) ---
  private synthChessSoundtrack(now: number) {
    if (!this.ctx || !this.bgmGain) return;

    // Deep cello/organ C drone
    const drone1 = this.ctx.createOscillator();
    const drone2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    drone1.type = 'sawtooth';
    drone1.frequency.value = 65.41; // C2
    drone2.type = 'triangle';
    drone2.frequency.value = 130.81; // C3

    filter.type = 'lowpass';
    filter.frequency.value = 220;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 3);

    drone1.connect(filter);
    drone2.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    drone1.start(now);
    drone2.start(now);
    this.bgmNodes.push(drone1, drone2);

    // Baroque Piano/Harpsichord Arpeggio Loop (C Minor / Doric scale: C, Eb, F, G, Bb)
    const scale = [261.63, 311.13, 349.23, 392.0, 466.16, 523.25, 622.25];
    let noteIndex = 0;

    const playNextBaroqueNote = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      const freq = scale[noteIndex % scale.length];
      noteIndex = (noteIndex + (Math.random() > 0.4 ? 1 : 2)) % scale.length;

      osc.type = 'sine';
      osc.frequency.value = freq;

      noteGain.gain.setValueAtTime(0.025, t);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

      osc.connect(noteGain);
      noteGain.connect(this.bgmGain);

      osc.start(t);
      osc.stop(t + 1.85);
    };

    playNextBaroqueNote();
    this.bgmTimer = setInterval(playNextBaroqueNote, 1400);
  }

  // --- Ludo: Quadrant Carnival (Upbeat Tropical Marimba & Bass) ---
  private synthLudoSoundtrack(now: number) {
    if (!this.ctx || !this.bgmGain) return;

    // Bouncy Tropical Marimba scale (C Major Pentatonic)
    const marimbaNotes = [261.63, 329.63, 392.0, 440.0, 523.25, 659.25, 783.99];
    let step = 0;

    const playMarimbaBeat = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;

      // Marimba Note
      if (step % 2 === 0 || Math.random() > 0.3) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const note = marimbaNotes[(step + Math.floor(step / 4)) % marimbaNotes.length];

        osc.type = 'sine';
        osc.frequency.value = note;

        gainNode.gain.setValueAtTime(0.04, t);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

        osc.connect(gainNode);
        gainNode.connect(this.bgmGain);

        osc.start(t);
        osc.stop(t + 0.4);
      }

      // Bass beat on every 4th step
      if (step % 4 === 0) {
        const bass = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bass.type = 'triangle';
        bass.frequency.value = step % 8 === 0 ? 130.81 : 164.81;

        bassGain.gain.setValueAtTime(0.05, t);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

        bass.connect(bassGain);
        bassGain.connect(this.bgmGain);

        bass.start(t);
        bass.stop(t + 0.45);
      }

      step++;
    };

    playMarimbaBeat();
    this.bgmTimer = setInterval(playMarimbaBeat, 320); // ~187 BPM upbeat rhythm
  }

  // --- Whot: Card Lounge Groove (Funky Jazz Lounge & Card-Shuffle Beats) ---
  private synthWhotSoundtrack(now: number) {
    if (!this.ctx || !this.bgmGain) return;

    // Funky bassline notes (E minor groove)
    const bassline = [82.41, 82.41, 110.0, 98.0, 82.41, 123.47, 110.0, 98.0];
    let step = 0;

    const playLoungeGroove = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;

      // Bassline pulse
      const bass = this.ctx.createOscillator();
      const bassFilter = this.ctx.createBiquadFilter();
      const bassGain = this.ctx.createGain();

      bass.type = 'sawtooth';
      bass.frequency.value = bassline[step % bassline.length];

      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 350;

      bassGain.gain.setValueAtTime(0.045, t);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

      bass.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.bgmGain);

      bass.start(t);
      bass.stop(t + 0.42);

      // Warm lounge chords on offbeats
      if (step % 2 === 1) {
        const chordNotes = [329.63, 392.0, 493.88, 587.33]; // Em7
        chordNotes.forEach((freq) => {
          const chordOsc = this.ctx!.createOscillator();
          const chordGain = this.ctx!.createGain();
          chordOsc.type = 'sine';
          chordOsc.frequency.value = freq;

          chordGain.gain.setValueAtTime(0.015, t);
          chordGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

          chordOsc.connect(chordGain);
          chordOsc.connect(this.bgmGain!);

          chordOsc.start(t);
          chordOsc.stop(t + 0.52);
        });
      }

      step++;
    };

    playLoungeGroove();
    this.bgmTimer = setInterval(playLoungeGroove, 420);
  }

  // --- Draft (Checkers): Zen Matrix Pulse (Deep Focus Ambient) ---
  private synthDraftSoundtrack(now: number) {
    if (!this.ctx || !this.bgmGain) return;

    // Warm analog synth pad
    const pad1 = this.ctx.createOscillator();
    const pad2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    pad1.type = 'sine';
    pad1.frequency.value = 110.0; // A2
    pad2.type = 'sine';
    pad2.frequency.value = 164.81; // E3

    filter.type = 'lowpass';
    filter.frequency.value = 400;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 4);

    pad1.connect(filter);
    pad2.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    pad1.start(now);
    pad2.start(now);
    this.bgmNodes.push(pad1, pad2);

    // Soft percussive felt tick & pentatonic chime loop
    const chimes = [440.0, 554.37, 659.25, 880.0];
    let chimeIdx = 0;

    const playZenPulse = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;

      // Soft chime
      const osc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = chimes[chimeIdx % chimes.length];
      chimeIdx++;

      chimeGain.gain.setValueAtTime(0.02, t);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);

      osc.connect(chimeGain);
      chimeGain.connect(this.bgmGain);

      osc.start(t);
      osc.stop(t + 2.25);
    };

    playZenPulse();
    this.bgmTimer = setInterval(playZenPulse, 2400);
  }

  // --- TicTacToe: Neon Grid Arcade (Retro 8-Bit Synthwave) ---
  private synthTicTacToeSoundtrack(now: number) {
    if (!this.ctx || !this.bgmGain) return;

    // Fast 8-bit chiptune arpeggio (Am: A, C, E, G)
    const arp = [440.0, 523.25, 659.25, 783.99, 880.0, 783.99, 659.25, 523.25];
    let arpIdx = 0;

    const playArcadeArp = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = arp[arpIdx % arp.length];
      arpIdx++;

      gainNode.gain.setValueAtTime(0.022, t);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

      osc.connect(gainNode);
      gainNode.connect(this.bgmGain);

      osc.start(t);
      osc.stop(t + 0.18);
    };

    playArcadeArp();
    this.bgmTimer = setInterval(playArcadeArp, 160); // Fast 8-bit tempo
  }

  // --- Stickman: Martial Zen Arena (Saw Drones & Pentatonic Bells) ---
  private synthStickmanSoundtrack(now: number) {
    if (!this.ctx || !this.bgmGain) return;

    const drone1 = this.ctx.createOscillator();
    const drone2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    drone1.type = 'sawtooth';
    drone1.frequency.value = 55.0; // A1
    drone2.type = 'sawtooth';
    drone2.frequency.value = 55.6;

    filter.type = 'lowpass';
    filter.frequency.value = 180;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.038, now + 2.5);

    drone1.connect(filter);
    drone2.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    drone1.start(now);
    drone2.start(now);
    this.bgmNodes.push(drone1, drone2);

    const pentatonic = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0];

    const playMartialBell = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = pentatonic[Math.floor(Math.random() * pentatonic.length)];

      bellGain.gain.setValueAtTime(0.035, t);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

      osc.connect(bellGain);
      bellGain.connect(this.bgmGain);

      osc.start(t);
      osc.stop(t + 1.65);
    };

    playMartialBell();
    this.bgmTimer = setInterval(playMartialBell, 2200);
  }

  // ---------------------------------------------------------------------------
  // Game-Specific Sound Effects (SFX)
  // ---------------------------------------------------------------------------

  // === CHESS SOUND EFFECTS ===
  public playChessMove() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.06);

    gainNode.gain.setValueAtTime(0.35, t);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playChessCapture() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Layer 1: Heavy Thud
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.1);
    gainNode.gain.setValueAtTime(0.5, t);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);

    // Layer 2: Noise Crackle
    const bufSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.11);
    noise.start(t);
    noise.stop(t + 0.05);
  }

  public playChessCheck() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    [880, 1320].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  public playChessVictory() {
    this.playVictoryFanfare();
  }

  public playChessDefeat() {
    this.playDefeatCadence();
  }

  // === LUDO SOUND EFFECTS ===
  public playLudoDiceRoll() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Rapid rattle of 6 micro clicks
    for (let i = 0; i < 6; i++) {
      const delay = t + i * 0.035;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400 + Math.random() * 300, delay);
      osc.frequency.exponentialRampToValueAtTime(150, delay + 0.025);

      gain.gain.setValueAtTime(0.25, delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, delay + 0.025);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(delay);
      osc.stop(delay + 0.03);
    }
  }

  public playLudoPieceStep() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.07);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playLudoKnockout() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.27);
  }

  public playLudoGoal() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.22);
    });
  }

  public playLudoVictory() {
    this.playVictoryFanfare();
  }

  // === WHOT CARD SOUND EFFECTS ===
  public playWhotCardPlay() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Crisp card slap: filtered noise + thud
    const bufSize = Math.floor(this.ctx.sampleRate * 0.05);
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.06);
  }

  public playWhotCardDraw() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const bufSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.09);
  }

  public playWhotSpecialCard() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Rising spark chime for Whot 20 / Pick 2 / Hold On
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.22);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playWhotLastCard() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    [600, 900].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.25, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.14);
    });
  }

  public playWhotVictory() {
    this.playVictoryFanfare();
  }

  // === DRAFT (CHECKERS) SOUND EFFECTS ===
  public playDraftMove() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.07);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playDraftCapture() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Double snap
    [0, 0.06].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t + offset);
      osc.frequency.exponentialRampToValueAtTime(80, t + offset + 0.05);

      gain.gain.setValueAtTime(0.4, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + offset);
      osc.stop(t + offset + 0.06);
    });
  }

  public playDraftKing() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    [523.25, 783.99, 1046.5].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + 0.52);
    });
  }

  public playDraftVictory() {
    this.playVictoryFanfare();
  }

  // === TIC TAC TOE SOUND EFFECTS ===
  public playTicTacToeX() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.exponentialRampToValueAtTime(1500, t + 0.06);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playTicTacToeO() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playTicTacToeWin() {
    this.playVictoryFanfare();
  }

  public playTicTacToeDraw() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.18, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.12);
    });
  }

  // === GENERAL FANFARES ===
  public playVictoryFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const fanfareNotes = [261.63, 329.63, 392.0, 523.25, 659.25];
    fanfareNotes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.001, t + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.3, t + i * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.55);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.6);
    });
  }

  public playDefeatCadence() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const sadNotes = [311.13, 277.18, 246.94, 220.0, 196.0];
    sadNotes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.001, t + i * 0.14);
      gain.gain.linearRampToValueAtTime(0.28, t + i * 0.14 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.14 + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + i * 0.14);
      osc.stop(t + i * 0.14 + 0.75);
    });
  }
}

export const soundEngine = new SoundEngine();
