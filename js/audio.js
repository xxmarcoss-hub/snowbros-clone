// ===========================================
// AUDIO.JS - Sistema audio con Web Audio API
// ===========================================

const Audio = {
    // Web Audio API context
    ctx: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,

    // Stato
    initialized: false,
    muted: false,
    volume: 0.5,
    musicVolume: 0.3,
    sfxVolume: 0.7,

    // Musica
    musicPlaying: false,
    musicNodes: [],
    musicInterval: null,
    currentNote: 0,

    /**
     * Inizializza il sistema audio
     * Deve essere chiamato dopo un'interazione utente (click/keypress)
     */
    init() {
        if (this.initialized) return;

        try {
            // Crea AudioContext
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Crea chain di gain nodes
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = this.volume;

            this.musicGain = this.ctx.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = this.musicVolume;

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = this.sfxVolume;

            this.initialized = true;
            Debug.log('Audio initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    },

    /**
     * Resume AudioContext se sospeso (necessario per autoplay policy)
     */
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    /**
     * Riproduce un effetto sonoro
     * @param {string} name - Nome del suono
     */
    play(name) {
        // Inizializza se necessario
        if (!this.initialized) {
            this.init();
        }

        if (!this.ctx || this.muted) return;

        this.resume();

        // Mappa nomi a funzioni di suono
        const sounds = {
            // Menu e UI
            'menu': () => this.playTone(440, 0.05, 'square', 0.2),
            'start': () => this.playStartSound(),
            'pause': () => this.playTone(330, 0.1, 'square', 0.3),

            // Player
            'jump': () => this.playJumpSound(),
            'shoot': () => this.playShootSound(),
            'hurt': () => this.playHurtSound(),
            'death': () => this.playDeathSound(),

            // Nemici
            'hit': () => this.playHitSound(),
            'freeze': () => this.playFreezeSound(),
            'push': () => this.playPushSound(),
            'kill': () => this.playKillSound(),
            'roll': () => this.playRollSound(),
            'bounce': () => this.playBounceSound(),
            'release': () => this.playReleaseSound(),
            'enemyJump': () => this.playEnemyJumpSound(),
            'enemyDeath': () => this.playEnemyDeathSound(),

            // Power-up e livello
            'powerup': () => this.playPowerUpSound(),
            'levelComplete': () => this.playLevelCompleteSound(),
            'gameOver': () => this.playGameOverSound(),
            'victory': () => this.playVictorySound()
        };

        if (sounds[name]) {
            sounds[name]();
        }
    },

    // ===========================================
    // SUONI GENERATI PROCEDURALMENTE
    // ===========================================

    /**
     * Suono base con oscillatore
     */
    playTone(freq, duration, type = 'square', volume = 0.3) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    /**
     * Suono con sweep di frequenza
     */
    playSweep(startFreq, endFreq, duration, type = 'square', volume = 0.3) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    /**
     * Genera rumore bianco
     */
    playNoise(duration, volume = 0.2) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();

        source.buffer = buffer;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        source.connect(gain);
        gain.connect(this.sfxGain);

        source.start();
    },

    // ===========================================
    // EFFETTI SONORI SPECIFICI
    // ===========================================

    /**
     * Suono inizio gioco - fanfara veloce
     */
    playStartSound() {
        const notes = [262, 330, 392, 523]; // C4, E4, G4, C5
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.15, 'square', 0.3);
            }, i * 80);
        });
    },

    /**
     * Suono salto - sweep verso l'alto
     */
    playJumpSound() {
        this.playSweep(200, 600, 0.15, 'square', 0.25);
    },

    /**
     * Suono sparo neve - pop breve
     */
    playShootSound() {
        this.playNoise(0.05, 0.15);
        this.playTone(880, 0.05, 'square', 0.2);
    },

    /**
     * Suono danno player - discendente
     */
    playHurtSound() {
        this.playSweep(400, 100, 0.3, 'sawtooth', 0.3);
    },

    /**
     * Suono colpo neve su nemico
     */
    playHitSound() {
        this.playTone(440, 0.05, 'square', 0.2);
        this.playNoise(0.03, 0.1);
    },

    /**
     * Suono nemico congelato
     */
    playFreezeSound() {
        const notes = [523, 659, 784]; // C5, E5, G5
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.1, 'triangle', 0.25);
            }, i * 50);
        });
    },

    /**
     * Suono spinta palla di neve
     */
    playPushSound() {
        this.playSweep(150, 300, 0.1, 'square', 0.25);
    },

    /**
     * Suono nemico eliminato - combo crescente
     */
    playKillSound() {
        this.playSweep(300, 800, 0.15, 'square', 0.3);
        setTimeout(() => {
            this.playTone(800, 0.1, 'square', 0.25);
        }, 100);
    },

    /**
     * Suono palla di neve che rotola
     */
    playRollSound() {
        this.playTone(100, 0.05, 'triangle', 0.15);
    },

    /**
     * Suono rimbalzo palla di neve
     */
    playBounceSound() {
        this.playTone(200, 0.08, 'square', 0.2);
        this.playTone(150, 0.05, 'triangle', 0.15);
    },

    /**
     * Suono nemico che si libera dalla neve
     */
    playReleaseSound() {
        this.playSweep(600, 200, 0.2, 'sawtooth', 0.25);
    },

    /**
     * Suono salto nemico
     */
    playEnemyJumpSound() {
        this.playSweep(150, 400, 0.12, 'square', 0.2);
    },

    /**
     * Suono morte nemico
     */
    playEnemyDeathSound() {
        this.playSweep(400, 100, 0.2, 'sawtooth', 0.3);
        setTimeout(() => {
            this.playNoise(0.1, 0.15);
        }, 50);
    },

    /**
     * Suono morte player
     */
    playDeathSound() {
        const notes = [523, 466, 415, 370, 330, 262];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.2, 'sawtooth', 0.35);
            }, i * 120);
        });
    },

    /**
     * Suono raccolta power-up
     */
    playPowerUpSound() {
        const notes = [392, 494, 587, 784]; // G4, B4, D5, G5
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.12, 'square', 0.3);
            }, i * 60);
        });
    },

    /**
     * Suono livello completato
     */
    playLevelCompleteSound() {
        const melody = [
            { freq: 523, dur: 0.15 },  // C5
            { freq: 587, dur: 0.15 },  // D5
            { freq: 659, dur: 0.15 },  // E5
            { freq: 784, dur: 0.15 },  // G5
            { freq: 659, dur: 0.15 },  // E5
            { freq: 784, dur: 0.3 }    // G5
        ];

        let time = 0;
        melody.forEach(note => {
            setTimeout(() => {
                this.playTone(note.freq, note.dur, 'square', 0.35);
            }, time * 1000);
            time += note.dur;
        });
    },

    /**
     * Suono game over
     */
    playGameOverSound() {
        const notes = [392, 370, 349, 330, 294, 262]; // Scala discendente
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.25, 'sawtooth', 0.3);
            }, i * 200);
        });
    },

    /**
     * Suono vittoria finale
     */
    playVictorySound() {
        const melody = [
            523, 523, 523, 523, 415, 466, 523, 466, 523
        ];
        melody.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.2, 'square', 0.35);
            }, i * 150);
        });
    },

    // ===========================================
    // MUSICA DI SOTTOFONDO
    // ===========================================

    /**
     * Pattern musicale 8-bit per il loop principale
     */
    getMusicPattern() {
        // Melodia semplice in stile Snow Bros (Do maggiore)
        // Note: C4=262, D4=294, E4=330, F4=349, G4=392, A4=440, B4=494, C5=523
        return {
            melody: [
                262, 330, 392, 330, 262, 330, 392, 523,
                494, 440, 392, 440, 494, 392, 330, 262,
                349, 392, 440, 392, 349, 392, 440, 523,
                494, 440, 392, 330, 294, 262, 294, 330
            ],
            bass: [
                131, 131, 165, 165, 131, 131, 165, 165,
                147, 147, 175, 175, 147, 147, 175, 175,
                175, 175, 196, 196, 175, 175, 196, 196,
                147, 147, 131, 131, 147, 147, 131, 131
            ],
            tempo: 180 // BPM
        };
    },

    /**
     * Avvia la musica di sottofondo
     */
    startMusic() {
        if (!this.initialized) this.init();
        if (!this.ctx || this.musicPlaying) return;

        this.resume();
        this.musicPlaying = true;
        this.currentNote = 0;

        const pattern = this.getMusicPattern();
        const noteLength = 60000 / pattern.tempo / 2; // Durata nota in ms

        this.musicInterval = setInterval(() => {
            if (this.muted) return;

            const melodyFreq = pattern.melody[this.currentNote];
            const bassFreq = pattern.bass[this.currentNote];

            // Melodia
            this.playMusicNote(melodyFreq, noteLength / 1000 * 0.8, 'square', 0.15);

            // Basso (ogni 2 note)
            if (this.currentNote % 2 === 0) {
                this.playMusicNote(bassFreq, noteLength / 1000 * 1.5, 'triangle', 0.2);
            }

            // Avanza alla nota successiva
            this.currentNote = (this.currentNote + 1) % pattern.melody.length;

        }, noteLength);

        Debug.log('Music started');
    },

    /**
     * Suona una nota musicale (connessa al musicGain)
     */
    playMusicNote(freq, duration, type, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration + 0.01);
    },

    /**
     * Ferma la musica di sottofondo
     */
    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        this.musicPlaying = false;
        this.currentNote = 0;

        Debug.log('Music stopped');
    },

    // ===========================================
    // CONTROLLI VOLUME
    // ===========================================

    /**
     * Attiva/disattiva mute
     */
    toggleMute() {
        this.muted = !this.muted;

        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : this.volume;
        }

        Debug.log('Audio muted:', this.muted);
        return this.muted;
    },

    /**
     * Imposta volume master (0-1)
     */
    setVolume(value) {
        this.volume = clamp(value, 0, 1);

        if (this.masterGain && !this.muted) {
            this.masterGain.gain.value = this.volume;
        }
    },

    /**
     * Imposta volume musica (0-1)
     */
    setMusicVolume(value) {
        this.musicVolume = clamp(value, 0, 1);

        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    },

    /**
     * Imposta volume effetti (0-1)
     */
    setSfxVolume(value) {
        this.sfxVolume = clamp(value, 0, 1);

        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    },

    /**
     * Ottiene stato mute
     */
    isMuted() {
        return this.muted;
    }
};

// ===========================================
// KEYBOARD SHORTCUT PER MUTE
// ===========================================
document.addEventListener('keydown', (e) => {
    // M per toggle mute
    if (e.key === 'm' || e.key === 'M') {
        Audio.toggleMute();
    }
});

// ===========================================
// INIZIALIZZA AUDIO AL PRIMO CLICK/KEYPRESS
// ===========================================
const initAudioOnInteraction = () => {
    Audio.init();
    Audio.resume();
    // Rimuovi listener dopo prima interazione
    document.removeEventListener('click', initAudioOnInteraction);
    document.removeEventListener('keydown', initAudioOnInteraction);
};

document.addEventListener('click', initAudioOnInteraction);
document.addEventListener('keydown', initAudioOnInteraction);
