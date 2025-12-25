// ===========================================
// GAME.JS - Game loop principale
// ===========================================

const Game = {
    // Canvas e context
    canvas: null,
    ctx: null,

    // Stato gioco
    state: GameState.MENU,
    numPlayers: 1,
    currentLevel: 1,

    // Entità
    players: [],
    enemies: [],
    snowballs: [],
    powerups: [],
    platforms: [],
    projectiles: [],

    // Timer
    levelTime: 0,
    lastTime: 0,
    deltaTime: 0,

    // Punteggi
    scores: [0, 0],

    // Menu
    menuSelection: 0,

    /**
     * Inizializza il gioco
     */
    init() {
        // Setup canvas
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');

        // Disabilita antialiasing per pixel art
        this.ctx.imageSmoothingEnabled = false;

        // Genera sprites
        Sprites.generateAll();

        // Avvia game loop
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));

        Debug.log('Game initialized');
    },

    /**
     * Game loop principale
     */
    loop(currentTime) {
        // Calcola delta time
        this.deltaTime = (currentTime - this.lastTime) / FRAME_TIME;
        this.lastTime = currentTime;

        // Limita delta time per evitare salti
        this.deltaTime = Math.min(this.deltaTime, 3);

        // Update
        this.update();

        // Render
        this.render();

        // Reset input "just pressed"
        Input.resetJustPressed();

        // Prossimo frame
        requestAnimationFrame((time) => this.loop(time));
    },

    /**
     * Update logica di gioco
     */
    update() {
        switch (this.state) {
            case GameState.MENU:
                this.updateMenu();
                break;
            case GameState.PLAYING:
                this.updatePlaying();
                break;
            case GameState.PAUSED:
                this.updatePaused();
                break;
            case GameState.LEVEL_COMPLETE:
                this.updateLevelComplete();
                break;
            case GameState.GAME_OVER:
                this.updateGameOver();
                break;
            case GameState.VICTORY:
                this.updateVictory();
                break;
        }
    },

    /**
     * Render grafica
     */
    render() {
        // Pulisci canvas
        this.ctx.fillStyle = Colors.SKY;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        switch (this.state) {
            case GameState.MENU:
                this.renderMenu();
                break;
            case GameState.PLAYING:
            case GameState.PAUSED:
                this.renderPlaying();
                if (this.state === GameState.PAUSED) {
                    this.renderPauseOverlay();
                }
                break;
            case GameState.LEVEL_COMPLETE:
                this.renderPlaying();
                this.renderLevelComplete();
                break;
            case GameState.GAME_OVER:
                this.renderGameOver();
                break;
            case GameState.VICTORY:
                this.renderVictory();
                break;
        }

        // Debug info
        if (Debug.enabled && Debug.showFPS) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '8px monospace';
            this.ctx.fillText(`FPS: ${Math.round(60 / this.deltaTime)}`, 4, 10);
        }
    },

    // ===========================================
    // MENU
    // ===========================================

    updateMenu() {
        const menu = Input.getMenu();

        if (menu.up || menu.down) {
            this.menuSelection = this.menuSelection === 0 ? 1 : 0;
            Audio.play('menu');
        }

        if (menu.confirm || menu.select1P || menu.select2P) {
            if (menu.select2P) {
                this.menuSelection = 1;
            }
            this.numPlayers = this.menuSelection + 1;
            this.startGame();
        }
    },

    renderMenu() {
        const ctx = this.ctx;

        // Titolo
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SNOW BROS', CANVAS_WIDTH / 2, 60);

        // Sottotitolo
        ctx.font = '8px monospace';
        ctx.fillStyle = Colors.NICK_BLUE;
        ctx.fillText('Nick & Tom', CANVAS_WIDTH / 2, 75);

        // Opzioni
        ctx.font = '10px monospace';
        const options = ['1 PLAYER', '2 PLAYERS'];

        options.forEach((opt, i) => {
            ctx.fillStyle = this.menuSelection === i ? '#fff' : '#888';
            const prefix = this.menuSelection === i ? '> ' : '  ';
            ctx.fillText(prefix + opt, CANVAS_WIDTH / 2, 120 + i * 20);
        });

        // Istruzioni
        ctx.fillStyle = '#666';
        ctx.font = '6px monospace';
        ctx.fillText('PRESS ENTER OR SPACE TO START', CANVAS_WIDTH / 2, 180);
        ctx.fillText('P1: ARROWS + SPACE | P2: WASD + Q', CANVAS_WIDTH / 2, 195);

        ctx.textAlign = 'left';
    },

    // ===========================================
    // PLAYING
    // ===========================================

    startGame() {
        this.state = GameState.PLAYING;
        this.currentLevel = 1;
        this.scores = [0, 0];

        this.loadLevel(this.currentLevel);

        Audio.play('start');
        Debug.log('Game started with', this.numPlayers, 'player(s)');
    },

    loadLevel(levelNum) {
        // Reset entità
        this.enemies = [];
        this.snowballs = [];
        this.powerups = [];
        this.projectiles = [];

        // Carica dati livello
        const levelData = Levels.get(levelNum);
        if (!levelData) {
            this.state = GameState.VICTORY;
            return;
        }

        // Crea piattaforme
        this.platforms = levelData.platforms.map(p => new Platform(p.x, p.y, p.width, p.height, p.type));

        // Crea player(s)
        this.players = [];
        for (let i = 0; i < this.numPlayers; i++) {
            const spawn = levelData.playerSpawns[i] || levelData.playerSpawns[0];
            this.players.push(new Player(spawn.x, spawn.y, i + 1));
        }

        // Spawn nemici
        levelData.enemies.forEach(e => {
            this.enemies.push(new Enemy(e.x, e.y, e.type));
        });

        // Reset timer
        this.levelTime = LEVEL_TIME;

        Debug.log('Level', levelNum, 'loaded');
    },

    updatePlaying() {
        // Pausa
        if (Input.isPausePressed()) {
            this.state = GameState.PAUSED;
            Audio.play('pause');
            return;
        }

        // Timer livello
        this.levelTime -= this.deltaTime * FRAME_TIME;

        // Update players
        this.players.forEach(player => {
            if (player.alive) {
                player.update(this.deltaTime);
            }
        });

        // Update nemici
        this.enemies.forEach(enemy => enemy.update(this.deltaTime));

        // Update palle di neve
        this.snowballs = this.snowballs.filter(s => s.active);
        this.snowballs.forEach(s => s.update(this.deltaTime));

        // Update proiettili
        this.projectiles = this.projectiles.filter(p => p.active);
        this.projectiles.forEach(p => p.update(this.deltaTime));

        // Update power-up
        this.powerups = this.powerups.filter(p => p.active);
        this.powerups.forEach(p => p.update(this.deltaTime));

        // Controlla collisioni
        this.checkCollisions();

        // Controlla vittoria livello
        if (this.enemies.length === 0) {
            this.levelComplete();
        }

        // Controlla game over
        if (this.players.every(p => p.lives <= 0)) {
            this.state = GameState.GAME_OVER;
            Audio.play('gameOver');
        }
    },

    checkCollisions() {
        // Proiettili neve vs nemici
        this.projectiles.forEach(proj => {
            if (proj.type !== 'snow') return;

            this.enemies.forEach(enemy => {
                if (enemy.state !== EnemyState.SNOWBALL && collideAABB(proj, enemy)) {
                    enemy.hitBySnow();
                    proj.active = false;
                    Audio.play('hit');
                }
            });
        });

        // Palle di neve rotolanti vs nemici
        this.snowballs.forEach(ball => {
            this.enemies.forEach(enemy => {
                if (enemy.state !== EnemyState.SNOWBALL && collideAABB(ball, enemy)) {
                    enemy.hitBySnowball(ball);
                    ball.addCombo();
                    Audio.play('kill');
                }
            });
        });

        // Player vs nemici
        this.players.forEach(player => {
            if (!player.alive || player.invincible) return;

            this.enemies.forEach(enemy => {
                if (enemy.state === EnemyState.SNOWBALL) {
                    // Può spingere la palla
                    if (collideAABB(player, enemy)) {
                        this.pushSnowball(player, enemy);
                    }
                } else if (collideAABB(player, enemy)) {
                    player.hit();
                    Audio.play('hurt');
                }
            });
        });

        // Player vs power-up
        this.players.forEach(player => {
            if (!player.alive) return;

            this.powerups.forEach(powerup => {
                if (collideAABB(player, powerup)) {
                    powerup.collect(player);
                    Audio.play('powerup');
                }
            });
        });
    },

    pushSnowball(player, frozenEnemy) {
        // Converti nemico congelato in palla rotolante
        const direction = player.facing;
        const ball = new RollingSnowball(
            frozenEnemy.x,
            frozenEnemy.y,
            direction
        );
        this.snowballs.push(ball);

        // Rimuovi nemico
        const idx = this.enemies.indexOf(frozenEnemy);
        if (idx > -1) {
            this.enemies.splice(idx, 1);
        }

        // Punti
        this.addScore(player.playerNum, 100);
        Audio.play('push');
    },

    levelComplete() {
        this.state = GameState.LEVEL_COMPLETE;
        Audio.play('levelComplete');
    },

    nextLevel() {
        this.currentLevel++;

        if (this.currentLevel > 10) {
            // Boss fight o vittoria
            if (this.currentLevel === 11) {
                // TODO: Boss fight
                this.state = GameState.VICTORY;
            }
        } else {
            this.loadLevel(this.currentLevel);
            this.state = GameState.PLAYING;
        }
    },

    renderPlaying() {
        const ctx = this.ctx;

        // Piattaforme
        this.platforms.forEach(p => p.render(ctx));

        // Power-up
        this.powerups.forEach(p => p.render(ctx));

        // Nemici
        this.enemies.forEach(e => e.render(ctx));

        // Palle di neve
        this.snowballs.forEach(s => s.render(ctx));

        // Proiettili
        this.projectiles.forEach(p => p.render(ctx));

        // Player
        this.players.forEach(p => p.render(ctx));

        // HUD
        this.renderHUD();
    },

    renderHUD() {
        const ctx = this.ctx;
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';

        // Score P1
        ctx.fillStyle = Colors.NICK_BLUE;
        ctx.fillText('1P', 4, 10);
        ctx.fillStyle = '#fff';
        ctx.fillText(String(this.scores[0]).padStart(6, '0'), 20, 10);

        // Lives P1
        for (let i = 0; i < this.players[0]?.lives || 0; i++) {
            ctx.fillStyle = Colors.NICK_BLUE;
            ctx.fillRect(4 + i * 8, 14, 6, 6);
        }

        // Score P2 (se attivo)
        if (this.numPlayers === 2) {
            ctx.textAlign = 'right';
            ctx.fillStyle = Colors.TOM_GREEN;
            ctx.fillText('2P', CANVAS_WIDTH - 50, 10);
            ctx.fillStyle = '#fff';
            ctx.fillText(String(this.scores[1]).padStart(6, '0'), CANVAS_WIDTH - 4, 10);

            // Lives P2
            for (let i = 0; i < this.players[1]?.lives || 0; i++) {
                ctx.fillStyle = Colors.TOM_GREEN;
                ctx.fillRect(CANVAS_WIDTH - 10 - i * 8, 14, 6, 6);
            }
        }

        // Livello
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('STAGE ' + this.currentLevel, CANVAS_WIDTH / 2, 10);

        ctx.textAlign = 'left';
    },

    // ===========================================
    // PAUSA
    // ===========================================

    updatePaused() {
        if (Input.isPausePressed()) {
            this.state = GameState.PLAYING;
            Audio.play('pause');
        }
    },

    renderPauseOverlay() {
        const ctx = this.ctx;

        // Overlay semi-trasparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Testo pausa
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        ctx.font = '8px monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('Press ENTER to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

        ctx.textAlign = 'left';
    },

    // ===========================================
    // LEVEL COMPLETE
    // ===========================================

    updateLevelComplete() {
        if (Input.getMenu().confirm) {
            this.nextLevel();
        }
    },

    renderLevelComplete() {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE ' + this.currentLevel + ' CLEAR!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        ctx.font = '8px monospace';
        ctx.fillText('Press ENTER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

        ctx.textAlign = 'left';
    },

    // ===========================================
    // GAME OVER
    // ===========================================

    updateGameOver() {
        if (Input.getMenu().confirm) {
            this.state = GameState.MENU;
        }
    },

    renderGameOver() {
        const ctx = this.ctx;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#f00';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.fillText('Press ENTER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);

        ctx.textAlign = 'left';
    },

    // ===========================================
    // VICTORY
    // ===========================================

    updateVictory() {
        if (Input.getMenu().confirm) {
            this.state = GameState.MENU;
        }
    },

    renderVictory() {
        const ctx = this.ctx;

        ctx.fillStyle = '#001';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#0f0';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CONGRATULATIONS!', CANVAS_WIDTH / 2, 80);

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText('You saved the princess!', CANVAS_WIDTH / 2, 110);

        ctx.font = '8px monospace';
        ctx.fillText('Final Score:', CANVAS_WIDTH / 2, 140);
        ctx.fillText('P1: ' + this.scores[0], CANVAS_WIDTH / 2, 155);
        if (this.numPlayers === 2) {
            ctx.fillText('P2: ' + this.scores[1], CANVAS_WIDTH / 2, 170);
        }

        ctx.fillStyle = '#888';
        ctx.fillText('Press ENTER', CANVAS_WIDTH / 2, 200);

        ctx.textAlign = 'left';
    },

    // ===========================================
    // UTILITY
    // ===========================================

    addScore(playerNum, points) {
        this.scores[playerNum - 1] += points;
    },

    spawnPowerUp(x, y) {
        if (Math.random() < 0.3) {
            const type = randomChoice(Object.values(PowerUpType));
            this.powerups.push(new PowerUp(x, y, type));
        }
    }
};

// Avvia il gioco quando la pagina è caricata
window.addEventListener('load', () => {
    Game.init();
});
