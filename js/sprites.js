// ===========================================
// SPRITES.JS - Generazione sprite pixel art
// ===========================================

const Sprites = {
    // Cache degli sprite generati
    cache: {},

    // Sprite sheet caricate
    sheets: {},

    /**
     * Genera tutti gli sprite
     */
    async generateAll() {
        // Carica sprite sheet
        await this.loadSpriteSheets();

        // Genera sprite dai sheet o proceduralmente
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

    // Animazioni caricate da sprites.json
    animations: {},

    /**
     * Carica le sprite sheet da file
     */
    async loadSpriteSheets() {
        const sheetsToLoad = [
            { name: 'nick', path: 'assets/images/snowbros_nick.png' }
        ];

        for (const sheet of sheetsToLoad) {
            try {
                const img = new Image();
                img.src = sheet.path;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => {
                        Debug.log(`Sprite sheet ${sheet.name} non trovata, uso fallback procedurale`);
                        resolve();
                    };
                });
                if (img.complete && img.naturalWidth > 0) {
                    this.sheets[sheet.name] = img;
                    Debug.log(`Sprite sheet ${sheet.name} caricata`);
                }
            } catch (e) {
                Debug.log(`Errore caricamento ${sheet.name}: ${e}`);
            }
        }

        // Carica sprite PNG estratti
        await this.loadExtractedSprites();
    },

    /**
     * Carica gli sprite PNG estratti da assets/sprites/sprites/
     */
    async loadExtractedSprites() {
        try {
            // Carica sprites.json
            const response = await fetch('assets/sprites/sprites/sprites.json');
            if (!response.ok) {
                Debug.log('sprites.json non trovato, uso fallback procedurale');
                return;
            }

            const data = await response.json();
            this.animations = data.animations;

            // Carica tutte le immagini PNG per ogni animazione
            for (const [animName, frames] of Object.entries(this.animations)) {
                for (let i = 0; i < frames.length; i++) {
                    const frame = frames[i];
                    const img = new Image();
                    img.src = `assets/sprites/sprites/${frame.file}`;

                    await new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = () => {
                            Debug.log(`Sprite ${frame.file} non trovato`);
                            resolve();
                        };
                    });

                    if (img.complete && img.naturalWidth > 0) {
                        // Salva l'immagine nella cache con nome standardizzato
                        const spriteName = `nick_${animName}_${i}`;
                        this.cache[spriteName] = img;

                        // Crea versione flippata
                        this.cache[`${spriteName}_left`] = this.flipHorizontal(img);
                    }
                }
            }

            Debug.log('Sprite PNG estratti caricati');
        } catch (e) {
            Debug.log(`Errore caricamento sprite estratti: ${e}`);
        }
    },

    /**
     * Ritaglia un frame da una sprite sheet e rimuove il background
     */
    extractFrame(sheetName, x, y, width, height) {
        const sheet = this.sheets[sheetName];
        if (!sheet) return null;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(sheet, x, y, width, height, 0, 0, width, height);

        // Rimuovi background verde (colore ~#98D898 o simile)
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Se è verde chiaro (background), rendi trasparente
            if (g > 180 && g > r + 30 && g > b + 30) {
                data[i + 3] = 0; // alpha = 0
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
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
        // Priorità 1: Usa sprite PNG estratti se disponibili
        if (this.animations && Object.keys(this.animations).length > 0) {
            this.generatePlayersFromExtracted();
            return;
        }

        // Priorità 2: Prova a caricare da sprite sheet
        if (this.sheets['nick']) {
            this.generatePlayersFromSheet();
            return;
        }

        // Fallback procedurale se nient'altro è disponibile
        this.generatePlayersProcedural();
    },

    /**
     * Genera sprite giocatori dagli sprite PNG estratti
     */
    generatePlayersFromExtracted() {
        // Gli sprite originali 'cammina_sinistra' guardano a sinistra
        // Per 'idle' gli sprite guardano a destra
        // Dobbiamo creare alias per compatibilità con il sistema esistente

        // Idle: usa idle_0 (guarda a destra nell'originale)
        if (this.cache['nick_idle_0']) {
            this.cache['nick_idle'] = this.cache['nick_idle_0'];
            this.cache['nick_idle_left'] = this.cache['nick_idle_0_left'];
        }

        // Walk: usa cammina_sinistra (gli sprite guardano a sinistra)
        // Quindi la versione base guarda a sinistra, la flippata guarda a destra
        if (this.cache['nick_cammina_sinistra_0']) {
            // walk1: frame 0 della camminata
            this.cache['nick_walk1'] = this.cache['nick_cammina_sinistra_0_left']; // flippato per guardare a destra
            this.cache['nick_walk1_left'] = this.cache['nick_cammina_sinistra_0'];  // originale guarda a sinistra
        }
        if (this.cache['nick_cammina_sinistra_1']) {
            // walk2: frame 1 della camminata
            this.cache['nick_walk2'] = this.cache['nick_cammina_sinistra_1_left'];
            this.cache['nick_walk2_left'] = this.cache['nick_cammina_sinistra_1'];
        }
        if (this.cache['nick_cammina_sinistra_2']) {
            // walk3: frame 2 della camminata (nuovo)
            this.cache['nick_walk3'] = this.cache['nick_cammina_sinistra_2_left'];
            this.cache['nick_walk3_left'] = this.cache['nick_cammina_sinistra_2'];
        }

        // Jump e Throw: usa idle come placeholder
        if (this.cache['nick_idle']) {
            this.cache['nick_jump'] = this.cache['nick_idle'];
            this.cache['nick_jump_left'] = this.cache['nick_idle_left'];
            this.cache['nick_throw'] = this.cache['nick_idle'];
            this.cache['nick_throw_left'] = this.cache['nick_idle_left'];
        }

        // Death: copia riferimenti per accesso facile
        for (let i = 0; i < 6; i++) {
            if (this.cache[`nick_muori_${i}`]) {
                this.cache[`nick_death_${i}`] = this.cache[`nick_muori_${i}`];
                this.cache[`nick_death_${i}_left`] = this.cache[`nick_muori_${i}_left`];
            }
        }

        // Spawn: copia riferimenti
        for (let i = 0; i < 5; i++) {
            if (this.cache[`nick_spawn_${i}`]) {
                // Gli sprite spawn sono già disponibili con il nome corretto
            }
        }

        // Genera Tom dagli sprite di Nick con filtro colore
        this.generateTomFromExtracted();

        Debug.log('Player sprites generati da PNG estratti');
    },

    /**
     * Genera Tom partendo dagli sprite estratti di Nick con filtro colore
     */
    generateTomFromExtracted() {
        const framesToConvert = [
            'idle', 'idle_left',
            'walk1', 'walk1_left', 'walk2', 'walk2_left', 'walk3', 'walk3_left',
            'jump', 'jump_left', 'throw', 'throw_left'
        ];

        // Aggiungi frame death
        for (let i = 0; i < 6; i++) {
            framesToConvert.push(`death_${i}`, `death_${i}_left`);
        }

        // Aggiungi frame spawn
        for (let i = 0; i < 5; i++) {
            framesToConvert.push(`spawn_${i}`, `spawn_${i}_left`);
        }

        for (const frame of framesToConvert) {
            const nickSprite = this.cache[`nick_${frame}`];
            if (nickSprite) {
                this.cache[`tom_${frame}`] = this.convertNickToTom(nickSprite);
            }
        }
    },

    /**
     * Converte uno sprite di Nick in Tom (blu -> verde)
     */
    convertNickToTom(sprite) {
        const canvas = document.createElement('canvas');
        canvas.width = sprite.width;
        canvas.height = sprite.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(sprite, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Se è blu (b > r e b > g), converti in verde
            if (b > r + 20 && b > g) {
                data[i] = Math.floor(r * 0.5);      // R ridotto
                data[i + 1] = Math.floor(b * 0.9);  // G prende valore di B
                data[i + 2] = Math.floor(g * 0.5);  // B ridotto
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    },

    /**
     * Genera sprite giocatori dalla sprite sheet originale
     */
    generatePlayersFromSheet() {
        // Coordinate frame nella sprite sheet snowbros_nick.png
        // Riga 7 (y≈144): sprite 24x24 più definiti per il gioco
        // Riga 1 (y=0): frame walk piccoli 16x24

        // Usa sprite dalla riga 7 (in basso) - sono 24x24
        const bigW = 24;
        const bigH = 24;
        const row7Y = 152;

        // Estrai frame dalla riga 7
        this.cache['nick_idle'] = this.extractFrame('nick', 0, row7Y, bigW, bigH);
        this.cache['nick_walk1'] = this.extractFrame('nick', 24, row7Y, bigW, bigH);
        this.cache['nick_walk2'] = this.extractFrame('nick', 48, row7Y, bigW, bigH);
        this.cache['nick_jump'] = this.extractFrame('nick', 72, row7Y, bigW, bigH);
        this.cache['nick_throw'] = this.extractFrame('nick', 96, row7Y, bigW, bigH);

        // Crea versioni flippate
        if (this.cache['nick_idle']) {
            this.cache['nick_idle_left'] = this.flipHorizontal(this.cache['nick_idle']);
        }
        if (this.cache['nick_walk1']) {
            this.cache['nick_walk1_left'] = this.flipHorizontal(this.cache['nick_walk1']);
        }
        if (this.cache['nick_walk2']) {
            this.cache['nick_walk2_left'] = this.flipHorizontal(this.cache['nick_walk2']);
        }
        if (this.cache['nick_jump']) {
            this.cache['nick_jump_left'] = this.flipHorizontal(this.cache['nick_jump']);
        }
        if (this.cache['nick_throw']) {
            this.cache['nick_throw_left'] = this.flipHorizontal(this.cache['nick_throw']);
        }

        // Per Tom, usa stessi frame con filtro colore verde (o genera proceduralmente)
        this.generateTomFromNick();

        Debug.log('Player sprites caricati da sprite sheet');
    },

    /**
     * Genera Tom partendo dagli sprite di Nick con filtro colore
     */
    generateTomFromNick() {
        const nickFrames = ['idle', 'walk1', 'walk2', 'jump', 'throw'];

        for (const frame of nickFrames) {
            const nickSprite = this.cache[`nick_${frame}`];
            if (nickSprite) {
                // Crea canvas per Tom
                const canvas = document.createElement('canvas');
                canvas.width = nickSprite.width;
                canvas.height = nickSprite.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(nickSprite, 0, 0);

                // Applica filtro colore: blu -> verde
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Se è blu (b > r e b > g), converti in verde
                    if (b > r + 20 && b > g) {
                        data[i] = Math.floor(r * 0.5);      // R ridotto
                        data[i + 1] = Math.floor(b * 0.9);  // G prende valore di B
                        data[i + 2] = Math.floor(g * 0.5);  // B ridotto
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                this.cache[`tom_${frame}`] = canvas;
                this.cache[`tom_${frame}_left`] = this.flipHorizontal(canvas);
            }
        }
    },

    /**
     * Fallback: genera sprite proceduralmente
     */
    generatePlayersProcedural() {
        // Palette Nick (blu)
        const nickPalette = {
            1: '#3050a0',
            2: '#5080d0',
            3: '#70a0e8',
            4: '#ffffff',
            5: '#000000',
            6: '#e06030',
            7: '#f0a070'
        };

        // Palette Tom (verde)
        const tomPalette = {
            1: '#207830',
            2: '#40a050',
            3: '#60c870',
            4: '#ffffff',
            5: '#000000',
            6: '#e06030',
            7: '#f0a070'
        };

        // Frame idle (16x16)
        const playerIdle = [
            [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
            [0,0,0,1,2,3,2,2,2,3,2,1,0,0,0,0],
            [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
            [0,0,1,2,4,4,2,2,2,4,4,2,1,0,0,0],
            [0,0,1,2,4,5,4,2,4,5,4,2,1,0,0,0],
            [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
            [0,0,1,2,2,6,6,6,6,6,2,2,1,0,0,0],
            [0,0,0,1,2,2,6,6,6,2,2,1,0,0,0,0],
            [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
            [0,0,1,1,2,2,2,2,2,2,2,1,1,0,0,0],
            [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
            [0,0,0,1,1,2,2,2,2,2,1,1,0,0,0,0],
            [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],
            [0,0,0,0,1,2,1,0,1,2,1,0,0,0,0,0],
            [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0]
        ];

        const playerWalk1 = [
            [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
            [0,0,0,1,2,3,2,2,2,3,2,1,0,0,0,0],
            [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
            [0,0,1,2,4,4,2,2,2,4,4,2,1,0,0,0],
            [0,0,1,2,4,5,4,2,4,5,4,2,1,0,0,0],
            [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
            [0,0,1,2,2,6,6,6,6,6,2,2,1,0,0,0],
            [0,0,0,1,2,2,6,6,6,2,2,1,0,0,0,0],
            [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
            [0,0,1,1,2,2,2,2,2,2,2,1,1,0,0,0],
            [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
            [0,0,0,1,1,2,2,2,2,2,1,1,0,0,0,0],
            [0,0,0,0,0,1,1,0,1,2,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,2,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0]
        ];

        const playerWalk2 = [
            [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
            [0,0,0,1,2,3,2,2,2,3,2,1,0,0,0,0],
            [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
            [0,0,1,2,4,4,2,2,2,4,4,2,1,0,0,0],
            [0,0,1,2,4,5,4,2,4,5,4,2,1,0,0,0],
            [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
            [0,0,1,2,2,6,6,6,6,6,2,2,1,0,0,0],
            [0,0,0,1,2,2,6,6,6,2,2,1,0,0,0,0],
            [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
            [0,0,1,1,2,2,2,2,2,2,2,1,1,0,0,0],
            [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
            [0,0,0,1,1,2,2,2,2,2,1,1,0,0,0,0],
            [0,0,0,0,1,2,1,0,1,1,0,0,0,0,0,0],
            [0,0,0,0,1,2,1,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0]
        ];

        const playerJump = [
            [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
            [0,0,0,1,2,3,2,2,2,3,2,1,0,0,0,0],
            [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
            [0,0,1,2,4,4,2,2,2,4,4,2,1,0,0,0],
            [0,0,1,2,4,5,4,2,4,5,4,2,1,0,0,0],
            [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
            [0,0,1,2,2,6,6,6,6,6,2,2,1,0,0,0],
            [0,0,0,1,2,2,6,6,6,2,2,1,0,0,0,0],
            [0,1,1,1,2,2,2,2,2,2,2,1,1,1,0,0],
            [1,2,2,1,2,2,2,2,2,2,2,1,2,2,1,0],
            [0,1,1,2,2,2,2,2,2,2,2,2,1,1,0,0],
            [0,0,0,1,1,2,2,2,2,2,1,1,0,0,0,0],
            [0,0,0,1,2,1,0,0,0,1,2,1,0,0,0,0],
            [0,0,1,2,1,0,0,0,0,0,1,2,1,0,0,0],
            [0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0]
        ];

        const playerThrow = [
            [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0],
            [0,0,0,1,2,3,2,2,2,3,2,1,0,0,0,0],
            [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
            [0,0,1,2,4,4,2,2,2,4,4,2,1,0,0,0],
            [0,0,1,2,4,5,4,2,4,5,4,2,1,0,0,0],
            [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
            [0,0,1,2,2,6,6,6,6,6,2,2,1,1,1,1],
            [0,0,0,1,2,2,6,6,6,2,2,1,2,2,2,1],
            [0,0,0,1,2,2,2,2,2,2,2,1,1,1,1,0],
            [0,0,1,1,2,2,2,2,2,2,2,1,1,0,0,0],
            [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
            [0,0,0,1,1,2,2,2,2,2,1,1,0,0,0,0],
            [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],
            [0,0,0,0,1,2,1,0,1,2,1,0,0,0,0,0],
            [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0]
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
        // Proiettile neve (8x8) - stile originale arcade con dettagli
        const snowProjectile = [
            [0,0,1,1,1,1,0,0],
            [0,1,2,2,2,2,1,0],
            [1,2,2,1,1,2,2,1],
            [1,2,1,1,1,1,2,1],
            [1,2,1,1,1,1,2,1],
            [1,2,2,1,1,2,2,1],
            [0,1,2,2,2,2,1,0],
            [0,0,1,1,1,1,0,0]
        ];

        // Proiettile neve frame 2 (animazione)
        const snowProjectile2 = [
            [0,0,0,1,1,0,0,0],
            [0,0,1,2,2,1,0,0],
            [0,1,2,1,1,2,1,0],
            [1,2,1,1,1,1,2,1],
            [1,2,1,1,1,1,2,1],
            [0,1,2,1,1,2,1,0],
            [0,0,1,2,2,1,0,0],
            [0,0,0,1,1,0,0,0]
        ];

        // Palla di neve rotolante (12x12) - con ombreggiatura
        const rollingSnowball = [
            [0,0,0,1,1,1,1,1,1,0,0,0],
            [0,0,1,2,2,2,2,2,2,1,0,0],
            [0,1,2,2,1,1,1,1,2,2,1,0],
            [1,2,2,1,1,1,1,1,1,2,2,1],
            [1,2,1,1,1,1,1,1,1,1,2,1],
            [1,2,1,1,1,1,1,1,1,1,2,1],
            [1,2,1,1,1,1,1,1,1,1,2,1],
            [1,2,1,1,1,1,1,1,1,1,2,1],
            [1,2,2,1,1,1,1,1,1,2,2,1],
            [0,1,2,2,1,1,1,1,2,2,1,0],
            [0,0,1,2,2,2,2,2,2,1,0,0],
            [0,0,0,1,1,1,1,1,1,0,0,0]
        ];

        const snowPalette = {
            1: '#ffffff',  // bianco
            2: '#c8e0f8'   // celeste chiaro (ombra)
        };

        this.cache['snow_projectile'] = this.createSprite(8, 8, snowProjectile, snowPalette);
        this.cache['snow_projectile2'] = this.createSprite(8, 8, snowProjectile2, snowPalette);
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
            1: '#5080d0', // blu (fedele all'originale)
            3: '#ffffff', // bianco occhi
            4: '#000000', // pupille
            5: '#e06030'  // naso arancione
        };

        const tomPalette = {
            1: '#40a050', // verde (fedele all'originale)
            3: '#ffffff',
            4: '#000000',
            5: '#e06030'
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
