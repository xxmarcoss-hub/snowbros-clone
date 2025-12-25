// ===========================================
// LEVELS.JS - Definizione 10 livelli di gioco
// ===========================================

const Levels = {
    // Cache livelli
    data: {},

    /**
     * Inizializza tutti i livelli
     */
    init() {
        this.data = {
            1: this.createLevel1(),
            2: this.createLevel2(),
            3: this.createLevel3(),
            4: this.createLevel4(),
            5: this.createLevel5(),
            6: this.createLevel6(),
            7: this.createLevel7(),
            8: this.createLevel8(),
            9: this.createLevel9(),
            10: this.createLevel10()
        };
    },

    /**
     * Ottiene dati livello
     */
    get(levelNum) {
        if (!this.data[1]) {
            this.init();
        }
        return this.data[levelNum] || null;
    },

    /**
     * Numero totale livelli
     */
    getTotal() {
        return 10;
    },

    // ===========================================
    // LIVELLO 1 - Tutorial semplice
    // ===========================================
    createLevel1() {
        return {
            name: "First Steps",
            // Spawn player (P1 sinistra, P2 destra)
            playerSpawns: [
                { x: 32, y: 180 },
                { x: 208, y: 180 }
            ],
            // Piattaforme: { x, y, width, height, type }
            platforms: [
                // Pavimento
                { x: 0, y: 208, width: 256, height: 16, type: PlatformType.SOLID },
                // Piattaforme centrali
                { x: 48, y: 160, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 144, y: 160, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                // Piattaforma alta centrale
                { x: 96, y: 112, width: 64, height: 8, type: PlatformType.PASSTHROUGH }
            ],
            // Nemici: { x, y, type }
            enemies: [
                { x: 80, y: 140, type: EnemyType.RED_DEMON },
                { x: 160, y: 140, type: EnemyType.RED_DEMON }
            ]
        };
    },

    // ===========================================
    // LIVELLO 2 - Più piattaforme
    // ===========================================
    createLevel2() {
        return {
            name: "Platform Party",
            playerSpawns: [
                { x: 32, y: 180 },
                { x: 208, y: 180 }
            ],
            platforms: [
                // Pavimento
                { x: 0, y: 208, width: 256, height: 16, type: PlatformType.SOLID },
                // Livello 1
                { x: 16, y: 168, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 104, y: 168, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 192, y: 168, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                // Livello 2
                { x: 56, y: 128, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 136, y: 128, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                // Livello 3
                { x: 96, y: 88, width: 64, height: 8, type: PlatformType.PASSTHROUGH }
            ],
            enemies: [
                { x: 30, y: 148, type: EnemyType.RED_DEMON },
                { x: 120, y: 148, type: EnemyType.RED_DEMON },
                { x: 200, y: 148, type: EnemyType.RED_DEMON },
                { x: 110, y: 68, type: EnemyType.RED_DEMON }
            ]
        };
    },

    // ===========================================
    // LIVELLO 3 - Introduzione Blue Demon
    // ===========================================
    createLevel3() {
        return {
            name: "Jump Scare",
            playerSpawns: [
                { x: 120, y: 180 },
                { x: 136, y: 180 }
            ],
            platforms: [
                // Pavimento
                { x: 0, y: 208, width: 256, height: 16, type: PlatformType.SOLID },
                // Piattaforme laterali basse
                { x: 0, y: 168, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 200, y: 168, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                // Piattaforme centrali
                { x: 80, y: 144, width: 96, height: 8, type: PlatformType.PASSTHROUGH },
                // Piattaforme alte
                { x: 24, y: 104, width: 80, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 152, y: 104, width: 80, height: 8, type: PlatformType.PASSTHROUGH },
                // Top
                { x: 88, y: 64, width: 80, height: 8, type: PlatformType.PASSTHROUGH }
            ],
            enemies: [
                { x: 100, y: 124, type: EnemyType.RED_DEMON },
                { x: 150, y: 124, type: EnemyType.RED_DEMON },
                { x: 50, y: 84, type: EnemyType.BLUE_DEMON },
                { x: 180, y: 84, type: EnemyType.BLUE_DEMON }
            ]
        };
    },

    // ===========================================
    // LIVELLO 4 - Layout a scale
    // ===========================================
    createLevel4() {
        return {
            name: "Stairway",
            playerSpawns: [
                { x: 16, y: 180 },
                { x: 224, y: 180 }
            ],
            platforms: [
                // Pavimento
                { x: 0, y: 208, width: 256, height: 16, type: PlatformType.SOLID },
                // Scale sinistra (salita)
                { x: 0, y: 176, width: 40, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 32, y: 152, width: 40, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 64, y: 128, width: 40, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 96, y: 104, width: 40, height: 8, type: PlatformType.PASSTHROUGH },
                // Scale destra (salita)
                { x: 216, y: 176, width: 40, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 184, y: 152, width: 40, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 152, y: 128, width: 40, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 120, y: 104, width: 40, height: 8, type: PlatformType.PASSTHROUGH },
                // Piattaforma centrale top
                { x: 88, y: 72, width: 80, height: 8, type: PlatformType.PASSTHROUGH }
            ],
            enemies: [
                { x: 20, y: 156, type: EnemyType.RED_DEMON },
                { x: 220, y: 156, type: EnemyType.RED_DEMON },
                { x: 80, y: 108, type: EnemyType.BLUE_DEMON },
                { x: 160, y: 108, type: EnemyType.BLUE_DEMON },
                { x: 120, y: 52, type: EnemyType.RED_DEMON }
            ]
        };
    },

    // ===========================================
    // LIVELLO 5 - Arena centrale
    // ===========================================
    createLevel5() {
        return {
            name: "The Arena",
            playerSpawns: [
                { x: 32, y: 84 },
                { x: 208, y: 84 }
            ],
            platforms: [
                // Pavimento
                { x: 0, y: 208, width: 256, height: 16, type: PlatformType.SOLID },
                // Bordi alti (spawn player)
                { x: 0, y: 104, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 192, y: 104, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                // Piattaforme centrali (arena)
                { x: 48, y: 152, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 160, y: 152, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 96, y: 168, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                // Centro alto
                { x: 80, y: 120, width: 96, height: 8, type: PlatformType.PASSTHROUGH },
                // Top
                { x: 56, y: 64, width: 144, height: 8, type: PlatformType.PASSTHROUGH }
            ],
            enemies: [
                { x: 60, y: 132, type: EnemyType.RED_DEMON },
                { x: 180, y: 132, type: EnemyType.RED_DEMON },
                { x: 100, y: 100, type: EnemyType.BLUE_DEMON },
                { x: 150, y: 100, type: EnemyType.BLUE_DEMON },
                { x: 80, y: 44, type: EnemyType.RED_DEMON },
                { x: 160, y: 44, type: EnemyType.RED_DEMON }
            ]
        };
    },

    // ===========================================
    // LIVELLO 6 - Labirinto
    // ===========================================
    createLevel6() {
        return {
            name: "Maze Runner",
            playerSpawns: [
                { x: 16, y: 52 },
                { x: 224, y: 52 }
            ],
            platforms: [
                // Pavimento
                { x: 0, y: 208, width: 256, height: 16, type: PlatformType.SOLID },
                // Top spawn
                { x: 0, y: 72, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 208, y: 72, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                // Livello 1
                { x: 32, y: 112, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 100, y: 96, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 168, y: 112, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                // Livello 2
                { x: 0, y: 144, width: 72, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 92, y: 136, width: 72, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 184, y: 144, width: 72, height: 8, type: PlatformType.PASSTHROUGH },
                // Livello 3
                { x: 40, y: 176, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 152, y: 176, width: 64, height: 8, type: PlatformType.PASSTHROUGH }
            ],
            enemies: [
                { x: 50, y: 92, type: EnemyType.BLUE_DEMON },
                { x: 190, y: 92, type: EnemyType.BLUE_DEMON },
                { x: 120, y: 76, type: EnemyType.RED_DEMON },
                { x: 30, y: 124, type: EnemyType.RED_DEMON },
                { x: 210, y: 124, type: EnemyType.RED_DEMON },
                { x: 60, y: 156, type: EnemyType.BLUE_DEMON },
                { x: 180, y: 156, type: EnemyType.BLUE_DEMON }
            ]
        };
    },

    // ===========================================
    // LIVELLO 7 - Piattaforme flottanti
    // ===========================================
    createLevel7() {
        return {
            name: "Sky High",
            playerSpawns: [
                { x: 112, y: 180 },
                { x: 128, y: 180 }
            ],
            platforms: [
                // Pavimento
                { x: 0, y: 208, width: 256, height: 16, type: PlatformType.SOLID },
                // Isole flottanti
                { x: 16, y: 168, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 104, y: 176, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 192, y: 168, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                // Livello 2
                { x: 56, y: 136, width: 40, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 160, y: 136, width: 40, height: 8, type: PlatformType.PASSTHROUGH },
                // Livello 3
                { x: 0, y: 104, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 104, y: 112, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 208, y: 104, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                // Top
                { x: 48, y: 72, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 144, y: 72, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                // Centro top
                { x: 96, y: 40, width: 64, height: 8, type: PlatformType.PASSTHROUGH }
            ],
            enemies: [
                { x: 30, y: 148, type: EnemyType.BLUE_DEMON },
                { x: 210, y: 148, type: EnemyType.BLUE_DEMON },
                { x: 70, y: 116, type: EnemyType.RED_DEMON },
                { x: 170, y: 116, type: EnemyType.RED_DEMON },
                { x: 20, y: 84, type: EnemyType.BLUE_DEMON },
                { x: 220, y: 84, type: EnemyType.BLUE_DEMON },
                { x: 60, y: 52, type: EnemyType.RED_DEMON },
                { x: 180, y: 52, type: EnemyType.RED_DEMON }
            ]
        };
    },

    // ===========================================
    // LIVELLO 8 - Layout complesso
    // ===========================================
    createLevel8() {
        return {
            name: "Chaos",
            playerSpawns: [
                { x: 120, y: 36 },
                { x: 136, y: 36 }
            ],
            platforms: [
                // Pavimento
                { x: 0, y: 208, width: 256, height: 16, type: PlatformType.SOLID },
                // Spawn top
                { x: 96, y: 56, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                // Lato sinistro
                { x: 0, y: 80, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 24, y: 120, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 0, y: 160, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                // Lato destro
                { x: 200, y: 80, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 176, y: 120, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 200, y: 160, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                // Centro
                { x: 72, y: 96, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 136, y: 96, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 96, y: 136, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 72, y: 176, width: 112, height: 8, type: PlatformType.PASSTHROUGH }
            ],
            enemies: [
                { x: 20, y: 60, type: EnemyType.BLUE_DEMON },
                { x: 220, y: 60, type: EnemyType.BLUE_DEMON },
                { x: 40, y: 100, type: EnemyType.RED_DEMON },
                { x: 200, y: 100, type: EnemyType.RED_DEMON },
                { x: 85, y: 76, type: EnemyType.BLUE_DEMON },
                { x: 155, y: 76, type: EnemyType.BLUE_DEMON },
                { x: 110, y: 116, type: EnemyType.RED_DEMON },
                { x: 140, y: 116, type: EnemyType.RED_DEMON },
                { x: 100, y: 156, type: EnemyType.BLUE_DEMON }
            ]
        };
    },

    // ===========================================
    // LIVELLO 9 - Sfida finale
    // ===========================================
    createLevel9() {
        return {
            name: "Gauntlet",
            playerSpawns: [
                { x: 16, y: 180 },
                { x: 224, y: 180 }
            ],
            platforms: [
                // Pavimento
                { x: 0, y: 208, width: 256, height: 16, type: PlatformType.SOLID },
                // Multi-livello denso
                { x: 0, y: 176, width: 40, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 72, y: 184, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 136, y: 184, width: 48, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 216, y: 176, width: 40, height: 8, type: PlatformType.PASSTHROUGH },
                // Livello 2
                { x: 32, y: 144, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 100, y: 152, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 168, y: 144, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                // Livello 3
                { x: 0, y: 112, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 96, y: 120, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 192, y: 112, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                // Livello 4
                { x: 48, y: 80, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 144, y: 80, width: 64, height: 8, type: PlatformType.PASSTHROUGH },
                // Top
                { x: 88, y: 48, width: 80, height: 8, type: PlatformType.PASSTHROUGH }
            ],
            enemies: [
                { x: 90, y: 164, type: EnemyType.RED_DEMON },
                { x: 150, y: 164, type: EnemyType.RED_DEMON },
                { x: 50, y: 124, type: EnemyType.BLUE_DEMON },
                { x: 190, y: 124, type: EnemyType.BLUE_DEMON },
                { x: 20, y: 92, type: EnemyType.BLUE_DEMON },
                { x: 220, y: 92, type: EnemyType.BLUE_DEMON },
                { x: 60, y: 60, type: EnemyType.RED_DEMON },
                { x: 180, y: 60, type: EnemyType.RED_DEMON },
                { x: 110, y: 100, type: EnemyType.BLUE_DEMON },
                { x: 120, y: 28, type: EnemyType.BLUE_DEMON }
            ]
        };
    },

    // ===========================================
    // LIVELLO 10 - Pre-Boss
    // ===========================================
    createLevel10() {
        return {
            name: "Final Stand",
            playerSpawns: [
                { x: 112, y: 180 },
                { x: 128, y: 180 }
            ],
            platforms: [
                // Pavimento
                { x: 0, y: 208, width: 256, height: 16, type: PlatformType.SOLID },
                // Arena centrale
                { x: 16, y: 168, width: 72, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 168, y: 168, width: 72, height: 8, type: PlatformType.PASSTHROUGH },
                // Livello 2
                { x: 0, y: 128, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 100, y: 136, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 200, y: 128, width: 56, height: 8, type: PlatformType.PASSTHROUGH },
                // Livello 3
                { x: 40, y: 96, width: 72, height: 8, type: PlatformType.PASSTHROUGH },
                { x: 144, y: 96, width: 72, height: 8, type: PlatformType.PASSTHROUGH },
                // Top
                { x: 80, y: 56, width: 96, height: 8, type: PlatformType.PASSTHROUGH }
            ],
            enemies: [
                { x: 30, y: 148, type: EnemyType.BLUE_DEMON },
                { x: 210, y: 148, type: EnemyType.BLUE_DEMON },
                { x: 20, y: 108, type: EnemyType.BLUE_DEMON },
                { x: 220, y: 108, type: EnemyType.BLUE_DEMON },
                { x: 120, y: 116, type: EnemyType.RED_DEMON },
                { x: 55, y: 76, type: EnemyType.BLUE_DEMON },
                { x: 185, y: 76, type: EnemyType.BLUE_DEMON },
                { x: 100, y: 36, type: EnemyType.BLUE_DEMON },
                { x: 140, y: 36, type: EnemyType.BLUE_DEMON },
                { x: 120, y: 36, type: EnemyType.RED_DEMON }
            ]
        };
    }
};

// Inizializza livelli al caricamento
Levels.init();
