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

    // Timer livello e Pumpkin Head
    hurryUpShown: false,
    hurryUpTimer: 0,
    pumpkinHead: null,

    // Punteggi
    scores: [0, 0],

    // Menu
    menuSelection: 0,
    gameOverSelection: 0, // 0 = Continue, 1 = Restart

    // Animazione titolo
    titleTimer: 0,
    titleSnowflakes: [],
    titleTransition: false,
    titleTransitionTimer: 0,

    // Transizioni livello
    stageIntroTimer: 0,
    stageIntroPhase: 'fade_in', // 'fade_in', 'display', 'fade_out'
    levelCompleteTimer: 0,
    levelCompletePhase: 'show', // 'show', 'counting', 'done'
    timeBonusRemaining: 0,
    timeBonusCountTimer: 0,
    victoryTimer: 0,

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

        // Inizializza fiocchi di neve per schermata titolo
        this.initTitleSnowflakes();

        // Avvia game loop
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));

        Debug.log('Game initialized');
    },

    /**
     * Inizializza fiocchi di neve decorativi per la schermata titolo
     */
    initTitleSnowflakes() {
        this.titleSnowflakes = [];
        for (let i = 0; i < 20; i++) {
            this.titleSnowflakes.push({
                x: randomRange(0, CANVAS_WIDTH),
                y: randomRange(0, CANVAS_HEIGHT),
                speed: randomFloat(0.3, 0.8),
                size: randomChoice([0.5, 0.75, 1]),
                wobble: randomFloat(0, Math.PI * 2)
            });
        }
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
            case GameState.STAGE_INTRO:
                this.updateStageIntro();
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
            case GameState.STAGE_INTRO:
                this.renderStageIntro();
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
        // Aggiorna timer animazione titolo
        this.titleTimer += this.deltaTime * FRAME_TIME;

        // Aggiorna fiocchi di neve
        this.updateTitleSnowflakes();

        // Gestione transizione
        if (this.titleTransition) {
            this.titleTransitionTimer -= this.deltaTime * FRAME_TIME;
            if (this.titleTransitionTimer <= 0) {
                this.titleTransition = false;
                this.startGame();
            }
            return;
        }

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
            // Avvia transizione
            this.titleTransition = true;
            this.titleTransitionTimer = 500; // 500ms di transizione
            Audio.play('start');
        }
    },

    updateTitleSnowflakes() {
        for (const flake of this.titleSnowflakes) {
            flake.y += flake.speed * this.deltaTime;
            flake.wobble += 0.02 * this.deltaTime;
            flake.x += Math.sin(flake.wobble) * 0.3;

            // Riposiziona fiocchi usciti dallo schermo
            if (flake.y > CANVAS_HEIGHT + 10) {
                flake.y = -10;
                flake.x = randomRange(0, CANVAS_WIDTH);
            }
            if (flake.x < -10) flake.x = CANVAS_WIDTH + 10;
            if (flake.x > CANVAS_WIDTH + 10) flake.x = -10;
        }
    },

    renderMenu() {
        const ctx = this.ctx;

        // Sfondo sfumato
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#0a0a1e');
        gradient.addColorStop(0.5, '#1a1a3e');
        gradient.addColorStop(1, '#0a0a1e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Fiocchi di neve decorativi
        this.renderTitleSnowflakes();

        // Calcola oscillazione titolo
        const titleBob = Math.sin(this.titleTimer / 300) * 3;
        const letterSpacing = 10;

        // Disegna logo SNOW (con sprite)
        const snowLetters = ['letter_S', 'letter_N', 'letter_O_snow', 'letter_W'];
        const snowStartX = CANVAS_WIDTH / 2 - (snowLetters.length * letterSpacing) / 2 - 8;
        const snowY = 35 + titleBob;

        for (let i = 0; i < snowLetters.length; i++) {
            const sprite = Sprites.get(snowLetters[i]);
            if (sprite) {
                const letterBob = Math.sin(this.titleTimer / 200 + i * 0.5) * 2;
                ctx.drawImage(sprite, snowStartX + i * letterSpacing, snowY + letterBob);
            }
        }

        // Disegna logo BROS (con sprite)
        const brosLetters = ['letter_B', 'letter_R', 'letter_O_bros', 'letter_S_bros'];
        const brosStartX = CANVAS_WIDTH / 2 - (brosLetters.length * letterSpacing) / 2 - 8;
        const brosY = 52 + titleBob;

        for (let i = 0; i < brosLetters.length; i++) {
            const sprite = Sprites.get(brosLetters[i]);
            if (sprite) {
                const letterBob = Math.sin(this.titleTimer / 200 + i * 0.5 + Math.PI) * 2;
                ctx.drawImage(sprite, brosStartX + i * letterSpacing, brosY + letterBob);
            }
        }

        // Fiocchi decorativi ai lati del logo
        const snowflake = Sprites.get('snowflake_blue');
        if (snowflake) {
            const flakeY = 45 + Math.sin(this.titleTimer / 400) * 4;
            ctx.drawImage(snowflake, snowStartX - 16, flakeY);
            ctx.drawImage(snowflake, brosStartX + brosLetters.length * letterSpacing + 8, flakeY);
        }

        // Sottotitolo "Nick & Tom"
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        const subtitleAlpha = 0.7 + Math.sin(this.titleTimer / 500) * 0.3;
        ctx.fillStyle = `rgba(74, 159, 255, ${subtitleAlpha})`;
        ctx.fillText('Nick & Tom', CANVAS_WIDTH / 2, 82);

        // Personaggi Nick e Tom decorativi
        const nickSprite = Sprites.get('nick_idle');
        const tomSprite = Sprites.get('tom_idle');
        if (nickSprite && tomSprite) {
            const charY = 92;
            const charBob = Math.sin(this.titleTimer / 300) * 2;
            ctx.drawImage(nickSprite, CANVAS_WIDTH / 2 - 30, charY + charBob);
            ctx.drawImage(tomSprite, CANVAS_WIDTH / 2 + 14, charY - charBob);
        }

        // Opzioni menu
        ctx.font = '8px monospace';
        const options = ['1 PLAYER', '2 PLAYERS'];
        const menuY = 135;

        options.forEach((opt, i) => {
            const isSelected = this.menuSelection === i;
            const selectPulse = isSelected ? Math.sin(this.titleTimer / 100) * 0.2 + 0.8 : 0.5;

            if (isSelected) {
                // Freccia animata
                const arrowX = CANVAS_WIDTH / 2 - 45 + Math.sin(this.titleTimer / 150) * 3;
                ctx.fillStyle = '#fff';
                ctx.fillText('>', arrowX, menuY + i * 16);
                ctx.fillStyle = `rgba(255, 255, 255, ${selectPulse})`;
            } else {
                ctx.fillStyle = '#666';
            }

            ctx.fillText(opt, CANVAS_WIDTH / 2, menuY + i * 16);
        });

        // Istruzioni
        ctx.fillStyle = '#444';
        ctx.font = '6px monospace';
        ctx.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 180);

        // Controlli
        ctx.fillStyle = '#555';
        ctx.fillText('P1: ARROWS + SPACE', CANVAS_WIDTH / 2, 195);
        ctx.fillText('P2: WASD + Q', CANVAS_WIDTH / 2, 205);

        // Credits
        ctx.fillStyle = '#333';
        ctx.fillText('© 2024 SNOW BROS CLONE', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8);

        // Effetto transizione (fade out)
        if (this.titleTransition) {
            const alpha = 1 - (this.titleTransitionTimer / 500);
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        ctx.textAlign = 'left';
    },

    renderTitleSnowflakes() {
        const ctx = this.ctx;
        const snowflake = Sprites.get('snowflake');

        for (const flake of this.titleSnowflakes) {
            if (snowflake) {
                ctx.globalAlpha = 0.3 + flake.size * 0.4;
                ctx.drawImage(
                    snowflake,
                    flake.x - 4 * flake.size,
                    flake.y - 4 * flake.size,
                    8 * flake.size,
                    8 * flake.size
                );
            } else {
                // Fallback: cerchio bianco
                ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + flake.size * 0.4})`;
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, 2 * flake.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    },

    // ===========================================
    // STAGE INTRO
    // ===========================================

    updateStageIntro() {
        this.stageIntroTimer -= this.deltaTime * FRAME_TIME;

        // Gestione fasi della transizione
        const elapsed = STAGE_INTRO_DURATION - this.stageIntroTimer;

        if (elapsed < FADE_DURATION) {
            this.stageIntroPhase = 'fade_in';
        } else if (this.stageIntroTimer > FADE_DURATION) {
            this.stageIntroPhase = 'display';
        } else {
            this.stageIntroPhase = 'fade_out';
        }

        // Fine intro, carica livello e inizia gameplay
        if (this.stageIntroTimer <= 0) {
            this.loadLevel(this.currentLevel);
            this.state = GameState.PLAYING;
            Audio.startMusic();
        }
    },

    renderStageIntro() {
        const ctx = this.ctx;
        const elapsed = STAGE_INTRO_DURATION - this.stageIntroTimer;

        // Sfondo nero
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Calcola alpha per fade
        let contentAlpha = 1;
        if (this.stageIntroPhase === 'fade_in') {
            contentAlpha = elapsed / FADE_DURATION;
        } else if (this.stageIntroPhase === 'fade_out') {
            contentAlpha = this.stageIntroTimer / FADE_DURATION;
        }

        ctx.globalAlpha = contentAlpha;

        // Testo "STAGE X"
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';

        // Effetto pulsante
        const pulse = 1 + Math.sin(elapsed / 100) * 0.05;
        ctx.save();
        ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.scale(pulse, pulse);
        ctx.fillText('STAGE ' + this.currentLevel, 0, 0);
        ctx.restore();

        // Sottotitolo decorativo
        ctx.font = '8px monospace';
        ctx.fillStyle = '#888';

        // Nome livello (opzionale, diverso per ogni stage)
        const stageNames = [
            'Snow Valley',
            'Ice Cave',
            'Frozen Lake',
            'Crystal Peaks',
            'Blizzard Pass',
            'Glacier Gorge',
            'Frost Tower',
            'Arctic Base',
            'Snowstorm Summit',
            'Twin Ghouls Lair'
        ];
        const stageName = stageNames[this.currentLevel - 1] || '';
        ctx.fillText(stageName, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

        // Icona giocatore(i)
        const nickSprite = Sprites.get('nick_idle');
        const tomSprite = Sprites.get('tom_idle');
        if (nickSprite) {
            ctx.drawImage(nickSprite, CANVAS_WIDTH / 2 - (this.numPlayers === 2 ? 25 : 8), CANVAS_HEIGHT / 2 + 30);
        }
        if (this.numPlayers === 2 && tomSprite) {
            ctx.drawImage(tomSprite, CANVAS_WIDTH / 2 + 9, CANVAS_HEIGHT / 2 + 30);
        }

        // Testo "GET READY!"
        const readyBlink = Math.floor(elapsed / 200) % 2 === 0;
        if (this.stageIntroPhase === 'display' && readyBlink) {
            ctx.fillStyle = '#ffff4a';
            ctx.font = '10px monospace';
            ctx.fillText('GET READY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
        }

        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    },

    // ===========================================
    // PLAYING
    // ===========================================

    startGame() {
        this.currentLevel = 1;
        this.scores = [0, 0];

        // Inizia con stage intro invece che gameplay diretto
        this.startStageIntro();

        Debug.log('Game started with', this.numPlayers, 'player(s)');
    },

    /**
     * Avvia la schermata di introduzione livello
     */
    startStageIntro() {
        this.state = GameState.STAGE_INTRO;
        this.stageIntroTimer = STAGE_INTRO_DURATION;
        this.stageIntroPhase = 'fade_in';
        Audio.stopMusic();
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

        // Reset timer e Pumpkin Head
        this.levelTime = LEVEL_TIME;
        this.hurryUpShown = false;
        this.hurryUpTimer = 0;
        this.pumpkinHead = null;

        Debug.log('Level', levelNum, 'loaded');
    },

    updatePlaying() {
        // Pausa
        if (Input.isPausePressed()) {
            this.state = GameState.PAUSED;
            Audio.stopMusic();
            Audio.play('pause');
            return;
        }

        // Timer livello
        this.levelTime -= this.deltaTime * FRAME_TIME;

        // Avviso HURRY UP quando mancano HURRY_TIME ms
        if (this.levelTime <= HURRY_TIME && !this.hurryUpShown) {
            this.hurryUpShown = true;
            this.hurryUpTimer = 2000; // Mostra per 2 secondi
            Audio.play('hurry');
            Debug.log('HURRY UP!');
        }

        // Aggiorna timer avviso HURRY UP
        if (this.hurryUpTimer > 0) {
            this.hurryUpTimer -= this.deltaTime * FRAME_TIME;
        }

        // Spawn Pumpkin Head quando il tempo scade
        if (this.levelTime <= 0 && !this.pumpkinHead) {
            this.spawnPumpkinHead();
        }

        // Update Pumpkin Head
        if (this.pumpkinHead) {
            this.pumpkinHead.update(this.deltaTime);
        }

        // Update players
        this.players.forEach((player, index) => {
            // Aggiorna player vivo o in animazione morte
            if (player.alive || player.dying) {
                player.update(this.deltaTime);
            }

            // Respawn se morto ma ha ancora vite
            if (!player.alive && !player.dying && player.lives > 0) {
                const levelData = Levels.get(this.currentLevel);
                const spawn = levelData.playerSpawns[index] || levelData.playerSpawns[0];
                player.respawn(spawn.x, spawn.y);
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

        // Controlla game over (tutti i player morti senza vite)
        if (this.players.every(p => p.lives <= 0 && !p.dying)) {
            this.state = GameState.GAME_OVER;
            this.gameOverSelection = 0; // Selezione menu Game Over
            Audio.stopMusic();
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

        // Player vs Pumpkin Head (invincibile)
        if (this.pumpkinHead) {
            this.players.forEach(player => {
                if (!player.alive || player.invincible) return;

                if (collideAABB(player, this.pumpkinHead)) {
                    player.hit();
                    Audio.play('hurt');
                }
            });
        }
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
        this.levelCompleteTimer = 0;
        this.levelCompletePhase = 'show';

        // Calcola bonus tempo (secondi rimanenti * punti)
        const timeSeconds = Math.max(0, Math.ceil(this.levelTime / 1000));
        this.timeBonusRemaining = timeSeconds * TIME_BONUS_PER_SECOND;
        this.timeBonusCountTimer = 0;

        Audio.stopMusic();
        Audio.play('levelComplete');
    },

    nextLevel() {
        this.currentLevel++;

        if (this.currentLevel > 10) {
            // Boss fight o vittoria
            if (this.currentLevel === 11) {
                // Avvia schermata vittoria
                this.startVictoryScreen();
            }
        } else {
            // Mostra stage intro per il prossimo livello
            this.startStageIntro();
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

        // Pumpkin Head
        if (this.pumpkinHead) {
            this.pumpkinHead.render(ctx);
        }

        // Palle di neve
        this.snowballs.forEach(s => s.render(ctx));

        // Proiettili
        this.projectiles.forEach(p => p.render(ctx));

        // Player
        this.players.forEach(p => p.render(ctx));

        // HUD
        this.renderHUD();

        // Avviso HURRY UP
        if (this.hurryUpTimer > 0) {
            this.renderHurryUp();
        }
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

        // Vite P1 (icone)
        const lifeNick = Sprites.get('life_nick');
        const player1Lives = this.players[0]?.lives || 0;
        for (let i = 0; i < player1Lives; i++) {
            if (lifeNick) {
                ctx.drawImage(lifeNick, 4 + i * 9, 13);
            } else {
                ctx.fillStyle = Colors.NICK_BLUE;
                ctx.fillRect(4 + i * 9, 14, 7, 7);
            }
        }

        // Power-up attivi P1
        this.renderPlayerPowerups(ctx, this.players[0], 4, 22);

        // Score P2 (se attivo)
        if (this.numPlayers === 2) {
            ctx.textAlign = 'right';
            ctx.fillStyle = Colors.TOM_GREEN;
            ctx.fillText('2P', CANVAS_WIDTH - 50, 10);
            ctx.fillStyle = '#fff';
            ctx.fillText(String(this.scores[1]).padStart(6, '0'), CANVAS_WIDTH - 4, 10);

            // Vite P2 (icone)
            const lifeTom = Sprites.get('life_tom');
            const player2Lives = this.players[1]?.lives || 0;
            for (let i = 0; i < player2Lives; i++) {
                if (lifeTom) {
                    ctx.drawImage(lifeTom, CANVAS_WIDTH - 11 - i * 9, 13);
                } else {
                    ctx.fillStyle = Colors.TOM_GREEN;
                    ctx.fillRect(CANVAS_WIDTH - 11 - i * 9, 14, 7, 7);
                }
            }

            // Power-up attivi P2
            this.renderPlayerPowerups(ctx, this.players[1], CANVAS_WIDTH - 4, 22, true);
        }

        // Livello e Timer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('STAGE ' + this.currentLevel, CANVAS_WIDTH / 2, 10);

        // Timer
        const timeSeconds = Math.max(0, Math.ceil(this.levelTime / 1000));
        const timerColor = timeSeconds <= 20 ? '#ff4a4a' : (timeSeconds <= 30 ? '#ffff4a' : '#fff');
        ctx.fillStyle = timerColor;
        ctx.fillText('TIME: ' + timeSeconds, CANVAS_WIDTH / 2, 20);

        ctx.textAlign = 'left';
    },

    /**
     * Renderizza icone power-up attivi per un player
     */
    renderPlayerPowerups(ctx, player, x, y, alignRight = false) {
        if (!player) return;

        const powerupTypes = [
            { key: 'speed', sprite: 'hud_speed' },
            { key: 'range', sprite: 'hud_range' },
            { key: 'fireRate', sprite: 'hud_fire_rate' },
            { key: 'fly', sprite: 'hud_fly' }
        ];

        let offsetX = 0;
        for (const pu of powerupTypes) {
            if (player.powerups[pu.key]) {
                const sprite = Sprites.get(pu.sprite);
                const drawX = alignRight ? x - 6 - offsetX : x + offsetX;

                if (sprite) {
                    // Lampeggio quando sta per scadere (ultimi 2 secondi)
                    const timeLeft = player.powerupTimers[pu.key];
                    const blink = timeLeft <= 2000 && Math.floor(timeLeft / 150) % 2 === 0;

                    if (!blink) {
                        ctx.drawImage(sprite, drawX, y);
                    }
                }

                offsetX += 8;
            }
        }
    },

    renderHurryUp() {
        const ctx = this.ctx;

        // Effetto lampeggio
        const blink = Math.floor(this.hurryUpTimer / 150) % 2 === 0;
        if (!blink) return;

        // Sfondo semi-trasparente
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, CANVAS_HEIGHT / 2 - 20, CANVAS_WIDTH, 40);

        // Testo HURRY UP!
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('HURRY UP!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);

        ctx.textAlign = 'left';
    },

    spawnPumpkinHead() {
        // Spawna Pumpkin Head dalla parte opposta al player
        let spawnX = CANVAS_WIDTH / 2;

        if (this.players.length > 0 && this.players[0].alive) {
            // Spawna dal lato opposto al primo player
            spawnX = this.players[0].x < CANVAS_WIDTH / 2 ? CANVAS_WIDTH - 20 : 20;
        }

        this.pumpkinHead = new PumpkinHead(spawnX, 20);
        Audio.play('pumpkin');
        Debug.log('Pumpkin Head spawned!');
    },

    // ===========================================
    // PAUSA
    // ===========================================

    updatePaused() {
        if (Input.isPausePressed()) {
            this.state = GameState.PLAYING;
            Audio.play('pause');
            Audio.startMusic();
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
        this.levelCompleteTimer += this.deltaTime * FRAME_TIME;

        // Fase iniziale: mostra "STAGE CLEAR" per 1.5 secondi
        if (this.levelCompletePhase === 'show' && this.levelCompleteTimer > 1500) {
            this.levelCompletePhase = 'counting';
            this.timeBonusCountTimer = 0;
        }

        // Fase conteggio: aggiungi bonus punti progressivamente
        if (this.levelCompletePhase === 'counting') {
            this.timeBonusCountTimer += this.deltaTime * FRAME_TIME;

            if (this.timeBonusCountTimer >= TIME_BONUS_COUNT_SPEED && this.timeBonusRemaining > 0) {
                this.timeBonusCountTimer = 0;

                // Aggiungi punti (100 alla volta)
                const pointsToAdd = Math.min(TIME_BONUS_PER_SECOND, this.timeBonusRemaining);
                this.timeBonusRemaining -= pointsToAdd;

                // Distribuisci punti a tutti i player vivi
                this.players.forEach(player => {
                    if (player.alive || player.lives > 0) {
                        this.addScore(player.playerNum, Math.floor(pointsToAdd / this.players.length));
                    }
                });

                Audio.play('point');
            }

            // Fine conteggio
            if (this.timeBonusRemaining <= 0) {
                this.levelCompletePhase = 'done';
                Audio.play('bonus');
            }
        }

        // Fase done: attendi conferma o auto-avanza dopo 2 secondi
        if (this.levelCompletePhase === 'done') {
            if (Input.getMenu().confirm || this.levelCompleteTimer > 6000) {
                this.nextLevel();
            }
        }
    },

    renderLevelComplete() {
        const ctx = this.ctx;

        // Overlay semi-trasparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';

        // Titolo "STAGE X CLEAR!"
        const titlePulse = 1 + Math.sin(this.levelCompleteTimer / 150) * 0.05;
        ctx.save();
        ctx.translate(CANVAS_WIDTH / 2, 70);
        ctx.scale(titlePulse, titlePulse);
        ctx.fillStyle = '#4aff4a';
        ctx.font = '14px monospace';
        ctx.fillText('STAGE ' + this.currentLevel + ' CLEAR!', 0, 0);
        ctx.restore();

        // Mostra conteggio bonus tempo
        if (this.levelCompletePhase !== 'show') {
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.fillText('TIME BONUS', CANVAS_WIDTH / 2, 100);

            // Punti bonus rimanenti (che decrescono durante il conteggio)
            const displayBonus = this.timeBonusRemaining;
            ctx.fillStyle = '#ffff4a';
            ctx.font = '12px monospace';
            ctx.fillText(String(displayBonus).padStart(5, '0'), CANVAS_WIDTH / 2, 118);
        }

        // Punteggio corrente
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.fillText('SCORE: ' + String(this.scores[0]).padStart(6, '0'), CANVAS_WIDTH / 2, 145);

        if (this.numPlayers === 2) {
            ctx.fillText('P2: ' + String(this.scores[1]).padStart(6, '0'), CANVAS_WIDTH / 2, 158);
        }

        // Messaggio continua
        if (this.levelCompletePhase === 'done') {
            const blink = Math.floor(this.levelCompleteTimer / 300) % 2 === 0;
            if (blink) {
                ctx.fillStyle = '#888';
                ctx.font = '8px monospace';
                ctx.fillText('Press ENTER to continue', CANVAS_WIDTH / 2, 190);
            }
        }

        ctx.textAlign = 'left';
    },

    // ===========================================
    // GAME OVER
    // ===========================================

    updateGameOver() {
        const menu = Input.getMenu();

        // Navigazione menu
        if (menu.up || menu.down) {
            this.gameOverSelection = this.gameOverSelection === 0 ? 1 : 0;
            Audio.play('menu');
        }

        // Conferma selezione
        if (menu.confirm) {
            if (this.gameOverSelection === 0) {
                // Continue - ricomincia dal livello corrente
                this.continueGame();
            } else {
                // Restart - torna al menu
                this.state = GameState.MENU;
                this.initTitleSnowflakes();
            }
        }
    },

    continueGame() {
        // Ripristina vite e ricomincia il livello corrente
        this.loadLevel(this.currentLevel);

        // Ripristina vite ai player
        this.players.forEach(player => {
            player.lives = PLAYER_LIVES;
        });

        this.state = GameState.PLAYING;
        Audio.startMusic();
    },

    renderGameOver() {
        const ctx = this.ctx;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Titolo GAME OVER
        ctx.fillStyle = '#f00';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 70);

        // Punteggi finali
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.fillText('SCORE: ' + String(this.scores[0]).padStart(6, '0'), CANVAS_WIDTH / 2, 95);
        if (this.numPlayers === 2) {
            ctx.fillText('P2: ' + String(this.scores[1]).padStart(6, '0'), CANVAS_WIDTH / 2, 108);
        }

        // Opzioni
        ctx.font = '10px monospace';
        const options = ['CONTINUE', 'RESTART'];

        options.forEach((opt, i) => {
            ctx.fillStyle = this.gameOverSelection === i ? '#fff' : '#666';
            const prefix = this.gameOverSelection === i ? '> ' : '  ';
            ctx.fillText(prefix + opt, CANVAS_WIDTH / 2, 140 + i * 18);
        });

        // Istruzioni
        ctx.fillStyle = '#444';
        ctx.font = '6px monospace';
        ctx.fillText('UP/DOWN to select, ENTER to confirm', CANVAS_WIDTH / 2, 200);

        ctx.textAlign = 'left';
    },

    // ===========================================
    // VICTORY
    // ===========================================

    startVictoryScreen() {
        this.state = GameState.VICTORY;
        this.victoryTimer = 0;
        Audio.stopMusic();
        Audio.play('victory');
    },

    updateVictory() {
        this.victoryTimer += this.deltaTime * FRAME_TIME;

        // Attendi conferma dopo 3 secondi
        if (this.victoryTimer > 3000 && Input.getMenu().confirm) {
            this.state = GameState.MENU;
            this.initTitleSnowflakes();
        }
    },

    renderVictory() {
        const ctx = this.ctx;

        // Sfondo sfumato celebrativo
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#001030');
        gradient.addColorStop(0.5, '#002060');
        gradient.addColorStop(1, '#001030');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Stelle decorative animate
        const numStars = 15;
        for (let i = 0; i < numStars; i++) {
            const starX = (i * 37 + this.victoryTimer / 50) % CANVAS_WIDTH;
            const starY = ((i * 23) % CANVAS_HEIGHT);
            const twinkle = Math.sin(this.victoryTimer / 200 + i) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 200, ${twinkle * 0.8})`;
            ctx.beginPath();
            ctx.arc(starX, starY, 1 + twinkle, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.textAlign = 'center';

        // Titolo "CONGRATULATIONS!" con effetto arcobaleno
        const titleY = 50 + Math.sin(this.victoryTimer / 300) * 5;
        const hue = (this.victoryTimer / 20) % 360;
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.font = '14px monospace';

        // Effetto onda sulle lettere
        const title = 'CONGRATULATIONS!';
        let xOffset = CANVAS_WIDTH / 2 - (title.length * 4);
        for (let i = 0; i < title.length; i++) {
            const letterY = titleY + Math.sin(this.victoryTimer / 150 + i * 0.5) * 3;
            const letterHue = (hue + i * 20) % 360;
            ctx.fillStyle = `hsl(${letterHue}, 80%, 60%)`;
            ctx.textAlign = 'left';
            ctx.fillText(title[i], xOffset + i * 8, letterY);
        }

        ctx.textAlign = 'center';

        // Messaggio vittoria
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText('You defeated the Twin Ghouls!', CANVAS_WIDTH / 2, 80);
        ctx.fillText('The kingdom is saved!', CANVAS_WIDTH / 2, 95);

        // Personaggi celebrativi
        const nickSprite = Sprites.get('nick_idle');
        const tomSprite = Sprites.get('tom_idle');
        const charBob = Math.sin(this.victoryTimer / 200) * 3;

        if (nickSprite) {
            ctx.drawImage(nickSprite, CANVAS_WIDTH / 2 - (this.numPlayers === 2 ? 30 : 8), 110 + charBob);
        }
        if (this.numPlayers === 2 && tomSprite) {
            ctx.drawImage(tomSprite, CANVAS_WIDTH / 2 + 14, 110 - charBob);
        }

        // Punteggio finale con bordo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(CANVAS_WIDTH / 2 - 60, 138, 120, this.numPlayers === 2 ? 40 : 25);

        ctx.fillStyle = '#ffff4a';
        ctx.font = '8px monospace';
        ctx.fillText('FINAL SCORE', CANVAS_WIDTH / 2, 150);

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText('P1: ' + String(this.scores[0]).padStart(6, '0'), CANVAS_WIDTH / 2, 163);

        if (this.numPlayers === 2) {
            ctx.fillText('P2: ' + String(this.scores[1]).padStart(6, '0'), CANVAS_WIDTH / 2, 176);
        }

        // Istruzioni (dopo 3 secondi)
        if (this.victoryTimer > 3000) {
            const blink = Math.floor(this.victoryTimer / 400) % 2 === 0;
            if (blink) {
                ctx.fillStyle = '#888';
                ctx.font = '8px monospace';
                ctx.fillText('Press ENTER to return to menu', CANVAS_WIDTH / 2, 205);
            }
        }

        // Credits
        ctx.fillStyle = '#444';
        ctx.font = '6px monospace';
        ctx.fillText('THANK YOU FOR PLAYING!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8);

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
