// ===========================================
// UTILS.JS - Costanti e utility globali
// ===========================================

// --- Costanti Canvas ---
const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 224;
const SCALE = 3;

// --- Costanti Fisica ---
const GRAVITY = 0.35;
const MAX_FALL_SPEED = 6;
const FRICTION = 0.85;

// --- Costanti Gioco ---
const TILE_SIZE = 16;
const FPS = 60;
const FRAME_TIME = 1000 / FPS;

// --- Costanti Player ---
const PLAYER_SPEED = 1.8;
const PLAYER_JUMP_FORCE = -5.5;
const PLAYER_WIDTH = 14;
const PLAYER_HEIGHT = 16;
const PLAYER_LIVES = 3;
const INVINCIBILITY_TIME = 2000; // ms

// --- Costanti Neve ---
const SNOW_SPEED = 4;
const SNOW_RANGE = 60;
const SNOW_HITS_TO_FREEZE = 3;
const SNOWBALL_ROLL_SPEED = 3;
const SNOWBALL_BOUNCE_DECAY = 0.7;
const FREEZE_RELEASE_TIME = 5000; // ms

// --- Costanti Nemici ---
const ENEMY_SPEED = 0.8;
const ENEMY_WIDTH = 14;
const ENEMY_HEIGHT = 16;

// --- Costanti Power-up ---
const POWERUP_DURATION = 10000; // ms
const POWERUP_FALL_SPEED = 1.5;

// --- Costanti Timer Livello ---
const LEVEL_TIME = 90000; // ms (90 secondi)
const HURRY_TIME = 20000; // ms - avviso quando rimangono 20s

// --- Costanti Transizioni ---
const STAGE_INTRO_DURATION = 2500; // ms - durata schermata "STAGE X"
const FADE_DURATION = 500; // ms - durata fade in/out
const TIME_BONUS_PER_SECOND = 100; // punti per secondo rimanente
const TIME_BONUS_COUNT_SPEED = 50; // ms tra ogni tick conteggio bonus

// --- Stati di Gioco ---
const GameState = {
    MENU: 'menu',
    STAGE_INTRO: 'stage_intro',  // Schermata "STAGE X" prima del livello
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// --- Stati Nemico ---
const EnemyState = {
    NORMAL: 'normal',
    PARTIAL_1: 'partial_1',
    PARTIAL_2: 'partial_2',
    SNOWBALL: 'snowball'
};

// --- Tipi Power-up ---
const PowerUpType = {
    SPEED: 'speed',       // Rosso
    RANGE: 'range',       // Blu
    FIRE_RATE: 'fire_rate', // Giallo
    FLY: 'fly'            // Verde
};

// --- Colori ---
const Colors = {
    SKY: '#1a1a2e',
    PLATFORM: '#4a4a6a',
    NICK_BLUE: '#4a9fff',
    TOM_GREEN: '#4aff4a',
    ENEMY_RED: '#ff4a4a',
    ENEMY_BLUE: '#4a4aff',
    SNOW_WHITE: '#ffffff',
    POWERUP_RED: '#ff6b6b',
    POWERUP_BLUE: '#6b6bff',
    POWERUP_YELLOW: '#ffff6b',
    POWERUP_GREEN: '#6bff6b'
};

// ===========================================
// FUNZIONI UTILITY
// ===========================================

/**
 * Limita un valore tra min e max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Numero random tra min e max (inclusi)
 */
function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Numero random float tra min e max
 */
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Scelta casuale da un array
 */
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Collisione AABB tra due rettangoli
 */
function collideAABB(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

/**
 * Collisione punto dentro rettangolo
 */
function pointInRect(px, py, rect) {
    return px >= rect.x &&
           px <= rect.x + rect.width &&
           py >= rect.y &&
           py <= rect.y + rect.height;
}

/**
 * Distanza tra due punti
 */
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Lerp (interpolazione lineare)
 */
function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Converte gradi in radianti
 */
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Wrap di un valore (utile per scroll orizzontale)
 */
function wrap(value, min, max) {
    const range = max - min;
    return ((value - min) % range + range) % range + min;
}

// ===========================================
// DEBUG
// ===========================================

const Debug = {
    enabled: false,
    showHitboxes: false,
    showFPS: false,
    invincible: false,

    toggle() {
        this.enabled = !this.enabled;
        console.log('Debug mode:', this.enabled ? 'ON' : 'OFF');
    },

    log(...args) {
        if (this.enabled) {
            console.log('[DEBUG]', ...args);
        }
    }
};

// Attiva debug con tasto D (in sviluppo)
document.addEventListener('keydown', (e) => {
    if (e.key === 'd' && e.ctrlKey) {
        Debug.toggle();
    }
});
