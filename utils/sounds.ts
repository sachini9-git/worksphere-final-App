// Web Audio API Synthesizer for Premium UI Sounds

class SoundEngine {
    private ctx: AudioContext | null = null;
    private ambientOscNode: OscillatorNode | null = null;
    private ambientGainNode: GainNode | null = null;

    private initCtx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // A tiny, soft click for generic interactions (buttons, dragging)
    playClick() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);
            
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.05);
        } catch (e) { console.warn("Audio disabled", e); }
    }

    // A gentle, high-quality chime for completing tasks
    playChime() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc2.type = 'triangle';
            
            // Bright major chord interval
            osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
            osc2.frequency.setValueAtTime(659.25, this.ctx.currentTime); // E5
            
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
            
            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc2.start();
            osc.stop(this.ctx.currentTime + 1.5);
            osc2.stop(this.ctx.currentTime + 1.5);
        } catch (e) { console.warn("Audio disabled", e); }
    }

    // A more energetic sound for earning XP or completing a focus session
    playSuccessLevelUp() {
        try {
            this.initCtx();
            const ctx = this.ctx;
            if (!ctx) return;
            
            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const duration = 0.15;
            
            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * duration));
                
                gain.gain.setValueAtTime(0, ctx.currentTime + (idx * duration));
                gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + (idx * duration) + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (idx * duration) + 0.5);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(ctx.currentTime + (idx * duration));
                osc.stop(ctx.currentTime + (idx * duration) + 0.5);
            });
        } catch (e) { console.warn("Audio disabled", e); }
    }

    // A soft ambient, brown-noise-esque warm hum for Deep Work mode
    startAmbientHum() {
        try {
            this.initCtx();
            const ctx = this.ctx;
            if (!ctx || this.ambientOscNode) return;
            
            this.ambientOscNode = ctx.createOscillator();
            this.ambientGainNode = ctx.createGain();
            
            // Very low frequency drone
            this.ambientOscNode.type = 'sine';
            this.ambientOscNode.frequency.setValueAtTime(55, ctx.currentTime); // Low A
            
            // Slight detune for warmth
            this.ambientOscNode.detune.setValueAtTime(5, ctx.currentTime);
            
            // Filter to make it sound like distant rushing water / warm thrum
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, ctx.currentTime);
            
            this.ambientGainNode.gain.setValueAtTime(0, ctx.currentTime);
            // Slowly fade in over 3 seconds
            this.ambientGainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3);
            
            this.ambientOscNode.connect(filter);
            filter.connect(this.ambientGainNode);
            this.ambientGainNode.connect(ctx.destination);
            
            this.ambientOscNode.start();
        } catch (e) { console.warn("Audio disabled", e); }
    }

    stopAmbientHum() {
        try {
            const ctx = this.ctx;
            if (!ctx || !this.ambientOscNode || !this.ambientGainNode) return;
            
            // Fade out over 2 seconds
            this.ambientGainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
            
            this.ambientOscNode.stop(ctx.currentTime + 2.1);
            
            setTimeout(() => {
                this.ambientOscNode = null;
                this.ambientGainNode = null;
            }, 2100);
        } catch (e) { console.warn("Audio disabled", e); }
    }

    playMotivationalMusic() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            
            // A sweeping, lush major 9th arpeggio
            const freqs = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99, 1046.50];
            
            freqs.forEach((freq, i) => {
                const osc = this.ctx!.createOscillator();
                const gain = this.ctx!.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + (i * 0.12));
                
                gain.gain.setValueAtTime(0, now + (i * 0.12));
                gain.gain.linearRampToValueAtTime(0.12, now + (i * 0.12) + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.12) + 2.5);
                
                osc.connect(gain);
                gain.connect(this.ctx!.destination);
                
                osc.start(now + (i * 0.12));
                osc.stop(now + (i * 0.12) + 3.0);
            });
        } catch(e) { console.warn(e); }
    }

    speak(text: string) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech so it doesn't queue up awkwardly
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.05; // Slightly faster/upbeat
            utterance.pitch = 1.1; // Slightly enthusiastic
            utterance.volume = 1.0;
            
            // Try to grab a more natural English voice if available
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes('en-US') && (v.name.includes('Female') || v.name.includes('Google'))) || voices[0];
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        }
    }
}

export const sounds = new SoundEngine();
