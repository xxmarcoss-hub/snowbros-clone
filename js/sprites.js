// ===========================================
// SPRITES.JS - Generazione sprite pixel art
// ===========================================

const Sprites = {
    // Cache degli sprite generati
    cache: {},

    /**
     * Genera tutti gli sprite
     */
    generateAll() {
        this.generatePlayers();
        this.generateEnemies();
        this.generateSnow();
        this.generatePowerUps();
        this.generatePlatforms();
        this.generatePumpkinHead();
        this.generateEffects();
        this.generateTitle();
        this.generateHUD();

        Debug.log('All sprites generated');
    },

    /**
     * Crea un canvas offscreen con uno sprite
     */
    createSprite(width, height, pixelData, palette) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        for (let y = 0; y < pixelData.length; y++) {
            for (let x = 0; x < pixelData[y].length; x++) {
                const colorIndex = pixelData[y][x];
                if (colorIndex !== 0 && palette[colorIndex]) {
                    ctx.fillStyle = palette[colorIndex];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        return canvas;
    },

    /**
     * Crea versione specchiata di uno sprite
     */
    flipHorizontal(sprite) {
        const canvas = document.createElement('canvas');
        canvas.width = sprite.width;
        canvas.height = sprite.height;
        const ctx = canvas.getContext('2d');

        ctx.translate(sprite.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, 0, 0);

        return canvas;
    },

    /**
     * Ottieni sprite dalla cache
     */
    get(name) {
        return this.cache[name];
    },

    // ===========================================
    // PLAYER SPRITES
    // ===========================================

    generatePlayers() {
        // Palette Nick (blu)
        const nickPalette = {
            1: '#4a9fff', // blu chiaro (corpo)
            2: '#2a6fcf', // blu scuro (ombra)
            3: '#ffffff', // bianco (occhi, bottoni)
            4: '#000000', // nero (pupille)
            5: '#ff9f4a', // arancione (naso carota)
            6: '#7fcfff'  // celeste (highlight)
        };

        // Palette Tom (verde)
        const tomPalette = {
            1: '#4aff4a', // verde chiaro
            2: '#2acf2a', // verde scuro
            3: '#ffffff',
            4: '#000000',
            5: '#ff9f4a',
            6: '#7fff7f'
        };

        // Frame idle (16x16)
        const playerIdle = [
            [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,1,1,6,1,1,6,1,1,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,0,1,3,3,1,1,1,3,3,1,1,0,0,0],
            [0,0,0,1,3,4,3,1,3,4,3,1,1,0,0,0],
            [0,0,0,1,1,1,1,5,1,1,1,1,1,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,0,1,2,2,2,1,0,0,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,1,1,1,3,1,1,1,3,1,1,1,0,0,0],
            [0,0,1,2,1,1,1,1,1,1,1,2,1,0,0,0],
            [0,0,1,2,1,3,1,1,1,3,1,2,1,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,1,2,2,1,2,2,1,0,0,0,0,0],
            [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,2,2,0,0,0,0,0,2,2,0,0,0,0]
        ];

        // Frame walk 1
        const playerWalk1 = [
            [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,1,1,6,1,1,6,1,1,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,0,1,3,3,1,1,1,3,3,1,1,0,0,0],
            [0,0,0,1,3,4,3,1,3,4,3,1,1,0,0,0],
            [0,0,0,1,1,1,1,5,1,1,1,1,1,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,0,1,2,2,2,1,0,0,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,1,1,1,3,1,1,1,3,1,1,1,0,0,0],
            [0,0,1,2,1,1,1,1,1,1,1,2,1,0,0,0],
            [0,0,1,2,1,3,1,1,1,3,1,2,1,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,2,2,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0]
        ];

        // Frame walk 2
        const playerWalk2 = [
            [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,1,1,6,1,1,6,1,1,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,0,1,3,3,1,1,1,3,3,1,1,0,0,0],
            [0,0,0,1,3,4,3,1,3,4,3,1,1,0,0,0],
            [0,0,0,1,1,1,1,5,1,1,1,1,1,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,0,1,2,2,2,1,0,0,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,1,1,1,3,1,1,1,3,1,1,1,0,0,0],
            [0,0,1,2,1,1,1,1,1,1,1,2,1,0,0,0],
            [0,0,1,2,1,3,1,1,1,3,1,2,1,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,1,1,1,1,2,2,0,0,0,0,0,0],
            [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0]
        ];

        // Frame jump
        const playerJump = [
            [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,1,1,6,1,1,6,1,1,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,0,1,3,3,1,1,1,3,3,1,1,0,0,0],
            [0,0,0,1,3,4,3,1,3,4,3,1,1,0,0,0],
            [0,0,0,1,1,1,1,5,1,1,1,1,1,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,0,1,2,2,2,1,0,0,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,1,1,1,1,3,1,1,1,3,1,1,1,1,0,0],
            [0,1,2,1,1,1,1,1,1,1,1,1,2,1,0,0],
            [0,0,1,1,1,3,1,1,1,3,1,1,1,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0],
            [0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0],
            [0,0,2,0,0,0,0,0,0,0,0,0,2,0,0,0]
        ];

        // Frame throw
        const playerThrow = [
            [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,1,1,6,1,1,6,1,1,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,0,1,3,3,1,1,1,3,3,1,1,0,0,0],
            [0,0,0,1,3,4,3,1,3,4,3,1,1,0,0,0],
            [0,0,0,1,1,1,1,5,1,1,1,1,1,0,0,0],
            [0,0,0,0,1,1,3,3,3,1,1,1,0,0,0,0],
            [0,0,0,0,0,1,2,2,2,1,0,0,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,3,1,1,1,3,1,1,1,1,1,0],
            [0,0,1,2,1,1,1,1,1,1,1,2,1,0,0,0],
            [0,0,1,2,1,3,1,1,1,3,1,2,1,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,1,2,2,1,2,2,1,0,0,0,0,0],
            [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,2,2,0,0,0,0,0,2,2,0,0,0,0]
        ];

        // Genera sprite Nick
        this.cache['nick_idle'] = this.createSprite(16, 16, playerIdle, nickPalette);
        this.cache['nick_idle_left'] = this.flipHorizontal(this.cache['nick_idle']);
        this.cache['nick_walk1'] = this.createSprite(16, 16, playerWalk1, nickPalette);
        this.cache['nick_walk1_left'] = this.flipHorizontal(this.cache['nick_walk1']);
        this.cache['nick_walk2'] = this.createSprite(16, 16, playerWalk2, nickPalette);
        this.cache['nick_walk2_left'] = this.flipHorizontal(this.cache['nick_walk2']);
        this.cache['nick_jump'] = this.createSprite(16, 16, playerJump, nickPalette);
        this.cache['nick_jump_left'] = this.flipHorizontal(this.cache['nick_jump']);
        this.cache['nick_throw'] = this.createSprite(16, 16, playerThrow, nickPalette);
        this.cache['nick_throw_left'] = this.flipHorizontal(this.cache['nick_throw']);

        // Genera sprite Tom
        this.cache['tom_idle'] = this.createSprite(16, 16, playerIdle, tomPalette);
        this.cache['tom_idle_left'] = this.flipHorizontal(this.cache['tom_idle']);
        this.cache['tom_walk1'] = this.createSprite(16, 16, playerWalk1, tomPalette);
        this.cache['tom_walk1_left'] = this.flipHorizontal(this.cache['tom_walk1']);
        this.cache['tom_walk2'] = this.createSprite(16, 16, playerWalk2, tomPalette);
        this.cache['tom_walk2_left'] = this.flipHorizontal(this.cache['tom_walk2']);
        this.cache['tom_jump'] = this.createSprite(16, 16, playerJump, tomPalette);
        this.cache['tom_jump_left'] = this.flipHorizontal(this.cache['tom_jump']);
        this.cache['tom_throw'] = this.createSprite(16, 16, playerThrow, tomPalette);
        this.cache['tom_throw_left'] = this.flipHorizontal(this.cache['tom_throw']);
    },

    // ===========================================
    // ENEMY SPRITES
    // ===========================================

    generateEnemies() {
        // Palette demone rosso
        const redDemonPalette = {
            1: '#ff4a4a', // rosso chiaro
            2: '#cf2a2a', // rosso scuro
            3: '#ffffff', // bianco
            4: '#000000', // nero
            5: '#ffff4a', // giallo (corna)
            6: '#ff7a7a'  // rosa
        };

        // Palette demone blu
        const blueDemonPalette = {
            1: '#4a4aff',
            2: '#2a2acf',
            3: '#ffffff',
            4: '#000000',
            5: '#ffff4a',
            6: '#7a7aff'
        };

        // Demone frame 1 (16x16)
        const demonFrame1 = [
            [0,0,0,5,0,0,0,0,0,0,0,5,0,0,0,0],
            [0,0,5,5,0,0,0,0,0,0,0,5,5,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,1,1,6,1,1,1,6,1,1,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,1,3,3,1,1,1,1,3,3,1,1,0,0,0],
            [0,0,1,3,4,3,1,1,3,4,3,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,0,1,1,3,3,3,3,3,1,1,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,1,2,1,1,1,1,1,1,1,2,1,0,0,0],
            [0,0,1,2,1,1,1,1,1,1,1,2,1,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,1,2,1,0,1,2,1,0,0,0,0,0],
            [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,2,2,0,0,0,0,0,2,2,0,0,0,0]
        ];

        // Demone frame 2 (camminata)
        const demonFrame2 = [
            [0,0,0,5,0,0,0,0,0,0,0,5,0,0,0,0],
            [0,0,5,5,0,0,0,0,0,0,0,5,5,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,1,1,6,1,1,1,6,1,1,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,1,3,3,1,1,1,1,3,3,1,1,0,0,0],
            [0,0,1,3,4,3,1,1,3,4,3,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,0,1,1,3,3,3,3,3,1,1,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,1,2,1,1,1,1,1,1,1,2,1,0,0,0],
            [0,0,1,2,1,1,1,1,1,1,1,2,1,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,2,2,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0]
        ];

        // Demone congelato parziale
        const demonFrozen1 = [
            [0,0,0,5,0,0,0,0,0,0,0,5,0,0,0,0],
            [0,0,5,5,0,0,0,0,0,0,0,5,5,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,1,1,6,1,1,1,6,1,1,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,1,3,3,1,1,1,1,3,3,1,1,0,0,0],
            [0,0,1,3,4,3,1,1,3,4,3,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,0,1,1,3,3,3,3,3,1,1,0,0,0,0],
            [0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0],
            [0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0],
            [0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0],
            [0,0,0,3,3,3,3,3,3,3,3,3,0,0,0,0],
            [0,0,0,0,3,3,3,0,3,3,3,0,0,0,0,0],
            [0,0,0,3,3,3,0,0,0,3,3,3,0,0,0,0],
            [0,0,0,3,3,0,0,0,0,0,3,3,0,0,0,0]
        ];

        // Demone congelato completo (palla di neve)
        const demonSnowball = [
            [0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0],
            [0,0,0,3,3,3,3,3,3,3,3,3,0,0,0,0],
            [0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0],
            [0,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0],
            [0,3,3,3,4,4,3,3,3,4,4,3,3,3,0,0],
            [0,3,3,3,4,4,3,3,3,4,4,3,3,3,0,0],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0],
            [0,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0],
            [0,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0],
            [0,0,3,3,3,3,3,3,3,3,3,3,3,0,0,0],
            [0,0,0,3,3,3,3,3,3,3,3,3,0,0,0,0],
            [0,0,0,0,3,3,3,3,3,3,3,0,0,0,0,0],
            [0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0]
        ];

        const snowPalette = { 3: '#ffffff', 4: '#000000' };

        // Genera demone rosso
        this.cache['demon_red_1'] = this.createSprite(16, 16, demonFrame1, redDemonPalette);
        this.cache['demon_red_1_left'] = this.flipHorizontal(this.cache['demon_red_1']);
        this.cache['demon_red_2'] = this.createSprite(16, 16, demonFrame2, redDemonPalette);
        this.cache['demon_red_2_left'] = this.flipHorizontal(this.cache['demon_red_2']);
        this.cache['demon_red_frozen1'] = this.createSprite(16, 16, demonFrozen1, redDemonPalette);
        this.cache['demon_red_snowball'] = this.createSprite(16, 16, demonSnowball, snowPalette);

        // Genera demone blu
        this.cache['demon_blue_1'] = this.createSprite(16, 16, demonFrame1, blueDemonPalette);
        this.cache['demon_blue_1_left'] = this.flipHorizontal(this.cache['demon_blue_1']);
        this.cache['demon_blue_2'] = this.createSprite(16, 16, demonFrame2, blueDemonPalette);
        this.cache['demon_blue_2_left'] = this.flipHorizontal(this.cache['demon_blue_2']);
        this.cache['demon_blue_frozen1'] = this.createSprite(16, 16, demonFrozen1, blueDemonPalette);
        this.cache['demon_blue_snowball'] = this.createSprite(16, 16, demonSnowball, snowPalette);
    },

    // ===========================================
    // SNOW SPRITES
    // ===========================================

    generateSnow() {
        // Proiettile neve piccolo (8x8)
        const snowProjectile = [
            [0,0,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,0,0]
        ];

        // Palla di neve rotolante (12x12)
        const rollingSnowball = [
            [0,0,0,1,1,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,1,0,0],
            [0,0,0,1,1,1,1,1,1,0,0,0]
        ];

        const snowPalette = { 1: '#ffffff' };

        this.cache['snow_projectile'] = this.createSprite(8, 8, snowProjectile, snowPalette);
        this.cache['snow_rolling'] = this.createSprite(12, 12, rollingSnowball, snowPalette);
    },

    // ===========================================
    // POWER-UP SPRITES
    // ===========================================

    generatePowerUps() {
        // Pozione base (10x12)
        const potion = [
            [0,0,0,0,1,1,0,0,0,0],
            [0,0,0,1,2,2,1,0,0,0],
            [0,0,0,1,2,2,1,0,0,0],
            [0,0,1,1,1,1,1,1,0,0],
            [0,1,2,2,2,2,2,2,1,0],
            [1,2,2,3,3,2,2,2,2,1],
            [1,2,3,3,3,3,2,2,2,1],
            [1,2,2,3,3,2,2,2,2,1],
            [1,2,2,2,2,2,2,2,2,1],
            [0,1,2,2,2,2,2,2,1,0],
            [0,0,1,2,2,2,2,1,0,0],
            [0,0,0,1,1,1,1,0,0,0]
        ];

        // Palette per ogni tipo
        const redPalette = { 1: '#8b4513', 2: '#ff4a4a', 3: '#ff9a9a' };
        const bluePalette = { 1: '#8b4513', 2: '#4a4aff', 3: '#9a9aff' };
        const yellowPalette = { 1: '#8b4513', 2: '#ffff4a', 3: '#ffffaa' };
        const greenPalette = { 1: '#8b4513', 2: '#4aff4a', 3: '#9aff9a' };

        this.cache['powerup_speed'] = this.createSprite(10, 12, potion, redPalette);
        this.cache['powerup_range'] = this.createSprite(10, 12, potion, bluePalette);
        this.cache['powerup_fire_rate'] = this.createSprite(10, 12, potion, yellowPalette);
        this.cache['powerup_fly'] = this.createSprite(10, 12, potion, greenPalette);
    },

    // ===========================================
    // PLATFORM SPRITES
    // ===========================================

    generatePlatforms() {
        // Blocco piattaforma (16x16)
        const platformBlock = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
            [1,3,3,3,3,3,3,3,3,3,3,3,3,3,1,2],
            [1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,2],
            [1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,2],
            [1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,2],
            [1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,2],
            [1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,2],
            [1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,2],
            [1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,2],
            [1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,2],
            [1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,2],
            [1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,2],
            [1,3,1,1,1,1,1,1,1,1,1,1,1,3,1,2],
            [1,3,3,3,3,3,3,3,3,3,3,3,3,3,1,2],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
            [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
        ];

        const platformPalette = {
            1: '#6a6a8a', // grigio medio
            2: '#4a4a6a', // grigio scuro
            3: '#8a8aaa'  // grigio chiaro
        };

        this.cache['platform'] = this.createSprite(16, 16, platformBlock, platformPalette);
    },

    // ===========================================
    // EFFECT SPRITES
    // ===========================================

    // ===========================================
    // PUMPKIN HEAD SPRITE
    // ===========================================

    generatePumpkinHead() {
        // Palette Pumpkin Head (zucca arancione maligna)
        const pumpkinPalette = {
            1: '#ff8c00', // arancione chiaro
            2: '#cc6600', // arancione scuro
            3: '#ffff00', // giallo (occhi/bocca luminosi)
            4: '#000000', // nero (contorno)
            5: '#00ff00', // verde (gambo)
            6: '#ffa500'  // arancione medio
        };

        // Pumpkin Head frame 1 (16x16)
        const pumpkinFrame1 = [
            [0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,5,5,5,5,0,0,0,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,1,1,6,1,1,1,1,6,1,1,1,0,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,3,3,1,1,1,1,3,3,1,1,1,0,0],
            [0,1,1,3,3,1,1,1,1,3,3,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,3,1,3,3,3,3,3,1,3,1,1,0,0],
            [0,1,1,1,3,1,1,1,1,1,3,1,1,1,0,0],
            [0,0,1,1,1,3,3,3,3,3,1,1,1,0,0,0],
            [0,0,0,1,2,1,1,1,1,1,2,1,0,0,0,0],
            [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
            [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ];

        // Pumpkin Head frame 2 (animazione camminata)
        const pumpkinFrame2 = [
            [0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,5,5,5,5,0,0,0,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,1,1,6,1,1,1,1,6,1,1,1,0,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,3,3,1,1,1,1,3,3,1,1,1,0,0],
            [0,1,1,3,3,1,1,1,1,3,3,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,3,1,3,3,3,3,3,1,3,1,1,0,0],
            [0,1,1,1,3,1,1,1,1,1,3,1,1,1,0,0],
            [0,0,1,1,1,3,3,3,3,3,1,1,1,0,0,0],
            [0,0,0,1,2,1,1,1,1,1,2,1,0,0,0,0],
            [0,0,0,0,2,2,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0]
        ];

        this.cache['pumpkin_1'] = this.createSprite(16, 16, pumpkinFrame1, pumpkinPalette);
        this.cache['pumpkin_1_left'] = this.flipHorizontal(this.cache['pumpkin_1']);
        this.cache['pumpkin_2'] = this.createSprite(16, 16, pumpkinFrame2, pumpkinPalette);
        this.cache['pumpkin_2_left'] = this.flipHorizontal(this.cache['pumpkin_2']);
    },

    generateEffects() {
        // Particella esplosione (8x8)
        const particle = [
            [0,0,0,1,1,0,0,0],
            [0,0,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,0,0],
            [0,0,0,1,1,0,0,0]
        ];

        this.cache['particle_white'] = this.createSprite(8, 8, particle, { 1: '#ffffff' });
        this.cache['particle_blue'] = this.createSprite(8, 8, particle, { 1: '#4a9fff' });
        this.cache['particle_yellow'] = this.createSprite(8, 8, particle, { 1: '#ffff4a' });
    },

    // ===========================================
    // TITLE SCREEN SPRITES
    // ===========================================

    generateTitle() {
        // Palette logo SNOW (celeste/bianco)
        const snowPalette = {
            1: '#4a9fff', // blu chiaro
            2: '#2a6fcf', // blu scuro (ombra)
            3: '#ffffff', // bianco (highlight)
            4: '#7fcfff'  // celeste chiaro
        };

        // Palette logo BROS (arancione/rosso)
        const brosPalette = {
            1: '#ff6b4a', // arancione
            2: '#cf3a2a', // rosso scuro (ombra)
            3: '#ffff4a', // giallo (highlight)
            4: '#ff9f7a'  // arancione chiaro
        };

        // Lettere SNOW (8x12 ciascuna)
        const letterS = [
            [0,1,1,1,1,1,1,0],
            [1,1,3,3,3,3,1,1],
            [1,1,3,0,0,0,0,0],
            [1,1,1,0,0,0,0,0],
            [0,1,1,1,1,1,0,0],
            [0,0,3,3,3,1,1,0],
            [0,0,0,0,0,3,1,1],
            [0,0,0,0,0,3,1,1],
            [0,0,0,0,0,1,1,1],
            [1,1,3,3,3,3,1,1],
            [0,1,1,1,1,1,1,0],
            [0,0,2,2,2,2,0,0]
        ];

        const letterN = [
            [1,1,0,0,0,0,1,1],
            [1,1,3,0,0,0,1,1],
            [1,1,1,3,0,0,1,1],
            [1,1,1,1,0,0,1,1],
            [1,1,3,1,1,0,1,1],
            [1,1,0,3,1,1,1,1],
            [1,1,0,0,1,1,1,1],
            [1,1,0,0,3,1,1,1],
            [1,1,0,0,0,3,1,1],
            [1,1,0,0,0,0,1,1],
            [1,1,0,0,0,0,1,1],
            [2,2,0,0,0,0,2,2]
        ];

        const letterO = [
            [0,1,1,1,1,1,1,0],
            [1,1,3,3,3,3,1,1],
            [1,1,3,0,0,3,1,1],
            [1,1,0,0,0,0,1,1],
            [1,1,0,0,0,0,1,1],
            [1,1,0,0,0,0,1,1],
            [1,1,0,0,0,0,1,1],
            [1,1,0,0,0,0,1,1],
            [1,1,0,0,0,0,1,1],
            [1,1,3,3,3,3,1,1],
            [0,1,1,1,1,1,1,0],
            [0,0,2,2,2,2,0,0]
        ];

        const letterW = [
            [1,1,0,0,0,0,1,1],
            [1,1,0,0,0,0,1,1],
            [1,1,0,0,0,0,1,1],
            [1,1,0,0,0,0,1,1],
            [1,1,0,3,3,0,1,1],
            [1,1,0,1,1,0,1,1],
            [1,1,3,1,1,3,1,1],
            [1,1,1,1,1,1,1,1],
            [1,1,1,3,3,1,1,1],
            [0,1,1,0,0,1,1,0],
            [0,1,1,0,0,1,1,0],
            [0,2,2,0,0,2,2,0]
        ];

        // Lettere BROS (8x12 ciascuna)
        const letterB = [
            [1,1,1,1,1,1,0,0],
            [1,1,3,3,3,1,1,0],
            [1,1,3,0,0,3,1,1],
            [1,1,0,0,0,3,1,1],
            [1,1,3,3,3,1,1,0],
            [1,1,1,1,1,1,1,0],
            [1,1,3,0,0,3,1,1],
            [1,1,0,0,0,0,1,1],
            [1,1,0,0,0,3,1,1],
            [1,1,3,3,3,3,1,1],
            [1,1,1,1,1,1,1,0],
            [2,2,2,2,2,2,0,0]
        ];

        const letterR = [
            [1,1,1,1,1,1,0,0],
            [1,1,3,3,3,1,1,0],
            [1,1,3,0,0,3,1,1],
            [1,1,0,0,0,3,1,1],
            [1,1,3,3,3,1,1,0],
            [1,1,1,1,1,1,0,0],
            [1,1,3,1,1,0,0,0],
            [1,1,0,3,1,1,0,0],
            [1,1,0,0,3,1,1,0],
            [1,1,0,0,0,3,1,1],
            [1,1,0,0,0,0,1,1],
            [2,2,0,0,0,0,2,2]
        ];

        // Genera lettere SNOW
        this.cache['letter_S'] = this.createSprite(8, 12, letterS, snowPalette);
        this.cache['letter_N'] = this.createSprite(8, 12, letterN, snowPalette);
        this.cache['letter_O_snow'] = this.createSprite(8, 12, letterO, snowPalette);
        this.cache['letter_W'] = this.createSprite(8, 12, letterW, snowPalette);

        // Genera lettere BROS
        this.cache['letter_B'] = this.createSprite(8, 12, letterB, brosPalette);
        this.cache['letter_R'] = this.createSprite(8, 12, letterR, brosPalette);
        this.cache['letter_O_bros'] = this.createSprite(8, 12, letterO, brosPalette);
        // Riusa S per BROS ma con palette arancione
        this.cache['letter_S_bros'] = this.createSprite(8, 12, letterS, brosPalette);

        // Fiocco di neve decorativo (8x8)
        const snowflake = [
            [0,0,0,1,1,0,0,0],
            [0,1,0,1,1,0,1,0],
            [0,0,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [0,0,1,1,1,1,0,0],
            [0,1,0,1,1,0,1,0],
            [0,0,0,1,1,0,0,0]
        ];

        this.cache['snowflake'] = this.createSprite(8, 8, snowflake, { 1: '#ffffff' });
        this.cache['snowflake_blue'] = this.createSprite(8, 8, snowflake, { 1: '#4a9fff' });
    },

    // ===========================================
    // HUD SPRITES
    // ===========================================

    generateHUD() {
        // Icona vita Nick (7x7) - faccina pupazzo di neve blu
        const lifeIconNick = [
            [0,0,1,1,1,0,0],
            [0,1,1,1,1,1,0],
            [1,3,3,1,3,3,1],
            [1,4,3,1,4,3,1],
            [1,1,1,5,1,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0]
        ];

        // Icona vita Tom (7x7) - faccina pupazzo di neve verde
        const lifeIconTom = [
            [0,0,1,1,1,0,0],
            [0,1,1,1,1,1,0],
            [1,3,3,1,3,3,1],
            [1,4,3,1,4,3,1],
            [1,1,1,5,1,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0]
        ];

        const nickPalette = {
            1: '#4a9fff', // blu
            3: '#ffffff', // bianco occhi
            4: '#000000', // pupille
            5: '#ff9f4a'  // naso arancione
        };

        const tomPalette = {
            1: '#4aff4a', // verde
            3: '#ffffff',
            4: '#000000',
            5: '#ff9f4a'
        };

        this.cache['life_nick'] = this.createSprite(7, 7, lifeIconNick, nickPalette);
        this.cache['life_tom'] = this.createSprite(7, 7, lifeIconTom, tomPalette);

        // Icone power-up per HUD (6x6) - versione mini
        const powerupIcon = [
            [0,0,1,1,0,0],
            [0,1,2,2,1,0],
            [0,1,2,2,1,0],
            [0,1,2,2,1,0],
            [0,1,2,2,1,0],
            [0,0,1,1,0,0]
        ];

        this.cache['hud_speed'] = this.createSprite(6, 6, powerupIcon, { 1: '#8b4513', 2: Colors.POWERUP_RED });
        this.cache['hud_range'] = this.createSprite(6, 6, powerupIcon, { 1: '#8b4513', 2: Colors.POWERUP_BLUE });
        this.cache['hud_fire_rate'] = this.createSprite(6, 6, powerupIcon, { 1: '#8b4513', 2: Colors.POWERUP_YELLOW });
        this.cache['hud_fly'] = this.createSprite(6, 6, powerupIcon, { 1: '#8b4513', 2: Colors.POWERUP_GREEN });
    }
};
