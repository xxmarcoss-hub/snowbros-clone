// ===========================================
// INPUT.JS - Gestione input tastiera
// ===========================================

const Input = {
    // Stato tasti premuti
    keys: {},

    // Tasti appena premuti (per azioni singole)
    justPressed: {},

    // Mapping tasti Player 1 (Frecce + Spazio)
    P1: {
        LEFT: 'ArrowLeft',
        RIGHT: 'ArrowRight',
        UP: 'ArrowUp',
        DOWN: 'ArrowDown',
        JUMP: 'ArrowUp',
        SHOOT: ' '  // Spazio
    },

    // Mapping tasti Player 2 (WASD + Q)
    P2: {
        LEFT: 'a',
        RIGHT: 'd',
        UP: 'w',
        DOWN: 's',
        JUMP: 'w',
        SHOOT: 'q'
    },

    // Tasti generali
    ENTER: 'Enter',
    PAUSE: 'Enter',
    SELECT_1P: '1',
    SELECT_2P: '2',
    ESCAPE: 'Escape',

    /**
     * Inizializza gli event listener
     */
    init() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Previeni scroll con frecce e spazio
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
    },

    /**
     * Gestisce keydown
     */
    onKeyDown(e) {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

        // Registra come "just pressed" solo se non era già premuto
        if (!this.keys[key]) {
            this.justPressed[key] = true;
        }

        this.keys[key] = true;
    },

    /**
     * Gestisce keyup
     */
    onKeyUp(e) {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        this.keys[key] = false;
    },

    /**
     * Controlla se un tasto è premuto
     */
    isDown(key) {
        const k = key.length === 1 ? key.toLowerCase() : key;
        return this.keys[k] === true;
    },

    /**
     * Controlla se un tasto è stato appena premuto (una volta)
     */
    isJustPressed(key) {
        const k = key.length === 1 ? key.toLowerCase() : key;
        return this.justPressed[k] === true;
    },

    /**
     * Reset dei tasti "just pressed" - chiamare a fine frame
     */
    resetJustPressed() {
        this.justPressed = {};
    },

    // ===========================================
    // HELPER PER PLAYER
    // ===========================================

    /**
     * Input Player 1
     */
    getP1() {
        return {
            left: this.isDown(this.P1.LEFT),
            right: this.isDown(this.P1.RIGHT),
            up: this.isDown(this.P1.UP),
            down: this.isDown(this.P1.DOWN),
            jump: this.isJustPressed(this.P1.JUMP),
            shoot: this.isJustPressed(this.P1.SHOOT),
            shootHeld: this.isDown(this.P1.SHOOT)
        };
    },

    /**
     * Input Player 2
     */
    getP2() {
        return {
            left: this.isDown(this.P2.LEFT),
            right: this.isDown(this.P2.RIGHT),
            up: this.isDown(this.P2.UP),
            down: this.isDown(this.P2.DOWN),
            jump: this.isJustPressed(this.P2.JUMP),
            shoot: this.isJustPressed(this.P2.SHOOT),
            shootHeld: this.isDown(this.P2.SHOOT)
        };
    },

    /**
     * Input generico per player N (1 o 2)
     */
    getPlayer(playerNum) {
        return playerNum === 1 ? this.getP1() : this.getP2();
    },

    // ===========================================
    // HELPER PER MENU
    // ===========================================

    /**
     * Input per navigazione menu
     */
    getMenu() {
        return {
            up: this.isJustPressed('ArrowUp') || this.isJustPressed('w'),
            down: this.isJustPressed('ArrowDown') || this.isJustPressed('s'),
            left: this.isJustPressed('ArrowLeft') || this.isJustPressed('a'),
            right: this.isJustPressed('ArrowRight') || this.isJustPressed('d'),
            confirm: this.isJustPressed(this.ENTER) || this.isJustPressed(' '),
            back: this.isJustPressed(this.ESCAPE),
            select1P: this.isJustPressed(this.SELECT_1P),
            select2P: this.isJustPressed(this.SELECT_2P)
        };
    },

    /**
     * Controlla se è stato premuto pausa
     */
    isPausePressed() {
        return this.isJustPressed(this.PAUSE);
    }
};

// Inizializza input al caricamento
Input.init();
