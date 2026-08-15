/**
 * audioPlayback.ts
 *
 * Dedicated, frame-synchronized audio controller for TTS playback,
 * real-time frequency analysis, exact time reporting, and instant interruption.
 */

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  amplitude: number;
}

export type AudioLifecycleEvent = 'AUDIO_START' | 'AUDIO_PLAYING' | 'AUDIO_PAUSED' | 'AUDIO_INTERRUPTED' | 'AUDIO_ENDED';

class AudioPlaybackController {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;

  private currentBlobUrl: string | null = null;
  private isSynthetic: boolean = false;
  private syntheticStartTime: number = 0;
  private syntheticDuration: number = 0;
  private syntheticInterval: any = null;

  private interruptListeners: Set<() => void> = new Set();
  private endListeners: Set<() => void> = new Set();
  private lifecycleListeners: Set<(event: AudioLifecycleEvent) => void> = new Set();

  constructor() {
    // Lazy initialized on first user interaction
  }

  private initAudioElement() {
    if (typeof window === 'undefined') return;
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'auto';

      this.audioElement.addEventListener('ended', () => {
        this.emitLifecycle('AUDIO_ENDED');
        this.handlePlaybackEnded();
      });

      this.audioElement.addEventListener('play', () => this.emitLifecycle('AUDIO_PLAYING'));
      this.audioElement.addEventListener('pause', () => {
        if (!this.audioElement?.ended) this.emitLifecycle('AUDIO_PAUSED');
      });

      this.audioElement.addEventListener('error', (e) => {
        console.warn('[AudioPlayback] Playback error:', e);
        this.handlePlaybackEnded();
      });
    }
  }

  private setupWebAudio() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      if (!this.analyser && this.audioContext && this.audioElement) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.4;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        if (!this.mediaSource) {
          this.mediaSource = this.audioContext.createMediaElementSource(this.audioElement);
          this.mediaSource.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
        }
      }
    } catch (err) {
      console.warn('[AudioPlayback] Web Audio setup warning:', err);
    }
  }

  public async playAudioBlob(blob: Blob): Promise<{ duration: number }> {
    this.interrupt(); // Halt any active audio
    this.initAudioElement();
    this.setupWebAudio();

    if (!this.audioElement) throw new Error('Audio element unavailable');

    const url = URL.createObjectURL(blob);
    this.currentBlobUrl = url;
    this.audioElement.src = url;
    this.audioElement.volume = 1.0;
    this.isSynthetic = false;
    this.emitLifecycle('AUDIO_START');

    return new Promise<{ duration: number }>((resolve, reject) => {
      if (!this.audioElement) return reject(new Error('Audio element lost'));

      const playAudio = () => {
        if (!this.audioElement) return;
        const dur = this.audioElement.duration || 1.0;
        
        // Resume audio context if suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }

        this.audioElement.play()
          .then(() => resolve({ duration: dur }))
          .catch((err) => {
            console.warn('[AudioPlayback] play() was prevented:', err);
            reject(err);
          });
      };

      if (this.audioElement.readyState >= 2) {
        playAudio();
      } else {
        this.audioElement.addEventListener('loadeddata', playAudio, { once: true });
        this.audioElement.addEventListener('canplay', playAudio, { once: true });
      }
    });
  }

  /**
   * Fallback for browser Web Speech Synthesis with high-resolution synthetic clock
   */
  public startSyntheticPlayback(durationSec: number, onEnd?: () => void) {
    this.interrupt();
    this.isSynthetic = true;
    this.syntheticStartTime = performance.now() / 1000;
    this.syntheticDuration = Math.max(0.2, durationSec);

    if (onEnd) {
      this.endListeners.add(onEnd);
    }

    if (this.syntheticInterval) clearInterval(this.syntheticInterval);
    this.syntheticInterval = setInterval(() => {
      const now = performance.now() / 1000;
      if (now - this.syntheticStartTime >= this.syntheticDuration) {
        this.handlePlaybackEnded();
      }
    }, 50);
  }

  /**
   * Returns the exact current playback time in seconds (time-locked to audio stream).
   */
  public getCurrentTime(): number {
    if (this.isSynthetic) {
      const now = performance.now() / 1000;
      return Math.max(0, Math.min(this.syntheticDuration, now - this.syntheticStartTime));
    }
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  /**
   * Returns total duration of the currently playing audio.
   */
  public getDuration(): number {
    if (this.isSynthetic) return this.syntheticDuration;
    return this.audioElement ? this.audioElement.duration || 0 : 0;
  }

  /**
   * Returns whether audio is currently actively playing.
   */
  public isPlaying(): boolean {
    if (this.isSynthetic) {
      const now = performance.now() / 1000;
      return now - this.syntheticStartTime < this.syntheticDuration;
    }
    return !!(this.audioElement && !this.audioElement.paused && !this.audioElement.ended);
  }

  /**
   * Measures current audio amplitude (0.0 to 1.0) from the Web Audio analyser.
   */
  public getAmplitude(): number {
    if (this.isSynthetic) {
      // Procedural speaking rhythm modulation when synthetic
      return this.isPlaying() ? 0.3 + Math.sin(performance.now() / 80) * 0.25 : 0;
    }
    if (!this.analyser || !this.dataArray || !this.isPlaying()) {
      return 0.0;
    }

    this.analyser.getByteFrequencyData(this.dataArray);
    let sum = 0;
    // Inspect speech frequencies (approx 100Hz - 4kHz, first ~60 bins)
    const binLimit = Math.min(60, this.dataArray.length);
    for (let i = 0; i < binLimit; i++) {
      sum += this.dataArray[i];
    }
    const avg = sum / binLimit;
    return Math.min(1.0, avg / 120);
  }

  public getElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  public getDebugState(): AudioPlaybackState & { source: 'elevenlabs-audio' | 'synthetic-fallback' | 'idle' } {
    return {
      isPlaying: this.isPlaying(),
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      amplitude: this.getAmplitude(),
      source: this.isSynthetic ? 'synthetic-fallback' : this.audioElement?.src ? 'elevenlabs-audio' : 'idle',
    };
  }

  /**
   * Immediately stops audio, cleans up resources, and dispatches interruption event.
   */
  public interrupt(): void {
    const wasActive = this.isPlaying();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    if (this.syntheticInterval) {
      clearInterval(this.syntheticInterval);
      this.syntheticInterval = null;
    }
    this.isSynthetic = false;

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (wasActive) {
      this.emitLifecycle('AUDIO_INTERRUPTED');
      this.notifyInterrupted();
    }
  }

  private handlePlaybackEnded(): void {
    if (this.syntheticInterval) {
      clearInterval(this.syntheticInterval);
      this.syntheticInterval = null;
    }
    this.isSynthetic = false;

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    this.endListeners.forEach((cb) => {
      try { cb(); } catch (e) { console.error(e); }
    });
    this.endListeners.clear();
  }

  public onEnded(cb: () => void): () => void {
    this.endListeners.add(cb);
    return () => this.endListeners.delete(cb);
  }

  public onInterrupted(cb: () => void): () => void {
    this.interruptListeners.add(cb);
    return () => this.interruptListeners.delete(cb);
  }

  public onLifecycle(cb: (event: AudioLifecycleEvent) => void): () => void {
    this.lifecycleListeners.add(cb);
    return () => this.lifecycleListeners.delete(cb);
  }

  private emitLifecycle(event: AudioLifecycleEvent): void {
    this.lifecycleListeners.forEach((cb) => {
      try { cb(event); } catch (error) { console.error('[AudioPlayback] Lifecycle listener error:', error); }
    });
  }

  private notifyInterrupted(): void {
    this.interruptListeners.forEach((cb) => {
      try { cb(); } catch (e) { console.error(e); }
    });
  }
}

export const audioController = new AudioPlaybackController();
