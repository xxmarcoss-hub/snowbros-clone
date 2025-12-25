// ===========================================
// ENEMY.JS - Sistema nemici con AI
// ===========================================

// Tipi di nemici
const EnemyType = {
    RED_DEMON: 'red_demon',
    BLUE_DEMON: 'blue_demon'
};

// ===========================================
// CLASSE BASE ENEMY
// ===========================================

class Enemy {
    constructor(x, y, type = EnemyType.RED_DEMON) {
        // Posizione e dimensioni
        this.x = x;
        this.y = y;
        this.width = ENEMY_WIDTH;
        this.height = ENEMY_HEIGHT;

        // Tipo
        this.type = type;

        // Velocità
        this.vx = 0;
        this.vy = 0;
        this.baseSpeed = ENEMY_SPEED;
        this.speed = this.baseSpeed;

        // Direzione
        this.facing = Math.random() < 0.5 ? -1 : 1;

        // Stato
        this.state = EnemyState.NORMAL;
        this.grounded = false;
        this.alive = true;

        // Sistema neve (gestito da SnowCoverage)
        this.snowHits = 0;
        this.freezeTimer = 0;

        // AI
        this.aiTimer = 0;
        this.aiDecisionInterval = randomRange(1000, 3000);
        this.patrolling = true;

        // Animazione
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 200;

        // Configura in base al tipo
        this.setupType();
    }

    setupType() {
        switch (this.type) {
            case EnemyType.RED_DEMON:
                this.speed = ENEMY_SPEED;
                this.canJump = false;
                this.spritePrefix = 'demon_red';
                break;
            case EnemyType.BLUE_DEMON:
                this.speed = ENEMY_SPEED * 1.2;
                this.canJump = true;
                this.jumpChance = 0.02;
                this.spritePrefix = 'demon_blue';
                break;
            default:
                this.speed = ENEMY_SPEED;
                this.canJump = false;
                this.spritePrefix = 'demon_red';
        }
    }

    // ===========================================
    // UPDATE
    // ===========================================

    update(dt) {
        if (!this.alive) return;

        // Se congelato, aggiorna solo il timer
        if (this.state === EnemyState.SNOWBALL) {
            this.updateFrozen(dt);
            return;
        }

        // Se parzialmente congelato, movimento rallentato
        if (this.state !== EnemyState.NORMAL) {
            this.updatePartialFreeze(dt);
        }

        // AI
        this.updateAI(dt);

        // Fisica
        this.applyPhysics(dt);

        // Collisioni
        this.checkPlatformCollisions();
        this.checkScreenBounds();

        // Animazione
        this.updateAnimation(dt);
    }

    updateFrozen(dt) {
        // Aggiorna timer liberazione
        if (SnowCoverage.updateFreeze(this, dt)) {
            // Si è liberato
            Audio.play('release');
        }

        // Leggera animazione tremolante
        this.animTimer += dt * FRAME_TIME;
        if (this.animTimer > 100) {
            this.x += randomFloat(-0.5, 0.5);
            this.animTimer = 0;
        }
    }

    updatePartialFreeze(dt) {
        // Aggiorna timer
        SnowCoverage.updateFreeze(this, dt);

        // Movimento rallentato in base alla copertura
        const slowdown = 1 - SnowCoverage.getCoveragePercent(this) * 0.7;
        this.speed = this.baseSpeed * slowdown;
    }

    // ===========================================
    // AI
    // ===========================================

    updateAI(dt) {
        const frameMs = dt * FRAME_TIME;
        this.aiTimer += frameMs;

        // Decisione periodica
        if (this.aiTimer >= this.aiDecisionInterval) {
            this.aiTimer = 0;
            this.aiDecisionInterval = randomRange(1000, 3000);
            this.makeDecision();
        }

        // Movimento base: pattuglia
        if (this.patrolling) {
            this.vx = this.facing * this.speed;
        }

        // Salto casuale (solo BlueDemon)
        if (this.canJump && this.grounded && Math.random() < this.jumpChance) {
            this.jump();
        }
    }

    makeDecision() {
        // Possibili decisioni
        const decisions = ['continue', 'turn', 'pause'];
        const weights = [0.6, 0.3, 0.1];

        const decision = this.weightedRandom(decisions, weights);

        switch (decision) {
            case 'turn':
                this.facing = -this.facing;
                break;
            case 'pause':
                this.patrolling = false;
                setTimeout(() => { this.patrolling = true; }, randomRange(500, 1500));
                break;
            default:
                // Continua
                break;
        }
    }

    weightedRandom(items, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * total;

        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) return items[i];
        }
        return items[items.length - 1];
    }

    jump() {
        if (!this.grounded) return;

        this.vy = PLAYER_JUMP_FORCE * 0.8;
        this.grounded = false;
        Audio.play('enemyJump');
    }

    // ===========================================
    // FISICA
    // ===========================================

    applyPhysics(dt) {
        // Gravità
        if (!this.grounded) {
            this.vy += GRAVITY * dt;
            this.vy = Math.min(this.vy, MAX_FALL_SPEED);
        }

        // Aggiorna posizione
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    checkPlatformCollisions() {
        this.grounded = false;

        for (const platform of Game.platforms) {
            if (!platform || !platform.solid) continue;

            const collision = platform.checkCollision(this, this.y - this.vy);

            if (collision) {
                if (collision.type === 'top') {
                    this.y = collision.y;
                    this.vy = 0;
                    this.grounded = true;
                } else if (collision.type === 'left' || collision.type === 'right') {
                    // Inverti direzione se colpisce un muro
                    this.x = collision.x;
                    this.facing = -this.facing;
                    this.vx = this.facing * this.speed;
                }
            }
        }

        // Pavimento
        if (this.y + this.height >= CANVAS_HEIGHT - 8) {
            this.y = CANVAS_HEIGHT - 8 - this.height;
            this.vy = 0;
            this.grounded = true;
        }
    }

    checkScreenBounds() {
        // Inverti ai bordi
        if (this.x <= 0) {
            this.x = 0;
            this.facing = 1;
        } else if (this.x + this.width >= CANVAS_WIDTH) {
            this.x = CANVAS_WIDTH - this.width;
            this.facing = -1;
        }
    }

    // ===========================================
    // COLLISIONI E DANNO
    // ===========================================

    hitBySnow() {
        if (this.state === EnemyState.SNOWBALL) return;

        const frozen = SnowCoverage.applyHit(this);

        if (frozen) {
            // Nemico completamente congelato
            this.vx = 0;
            this.vy = 0;
            Audio.play('freeze');
        } else {
            // Parzialmente congelato
            Audio.play('hit');
        }
    }

    hitBySnowball(snowball) {
        // Colpito da palla rotolante
        this.die();

        // Punteggio
        const score = snowball.hitEnemy(this);
        if (score) {
            Game.addScore(1, score); // TODO: attribuire al player corretto
        }

        // Effetti
        SnowEffects.createExplosion(
            this.x + this.width / 2,
            this.y + this.height / 2
        );
    }

    die() {
        this.alive = false;

        // Possibilità di drop power-up
        this.dropPowerUp();

        Audio.play('enemyDeath');
    }

    dropPowerUp() {
        // 30% di possibilità di drop
        if (Math.random() < 0.3) {
            Game.spawnPowerUp(
                this.x + this.width / 2,
                this.y
            );
        }
    }

    // ===========================================
    // ANIMAZIONE
    // ===========================================

    updateAnimation(dt) {
        const frameMs = dt * FRAME_TIME;
        this.animTimer += frameMs;

        if (this.animTimer >= this.animSpeed) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }
    }

    getSpriteName() {
        const dir = this.facing === -1 ? '_left' : '';

        switch (this.state) {
            case EnemyState.SNOWBALL:
                return `${this.spritePrefix}_snowball`;
            case EnemyState.PARTIAL_1:
            case EnemyState.PARTIAL_2:
                return `${this.spritePrefix}_frozen1`;
            default:
                const frame = this.animFrame + 1;
                return `${this.spritePrefix}_${frame}${dir}`;
        }
    }

    // ===========================================
    // RENDER
    // ===========================================

    render(ctx) {
        if (!this.alive) return;

        const sprite = Sprites.get(this.getSpriteName());

        if (sprite) {
            ctx.drawImage(
                sprite,
                Math.floor(this.x),
                Math.floor(this.y),
                this.width,
                this.height
            );
        } else {
            // Fallback: rettangolo colorato
            let color;
            switch (this.state) {
                case EnemyState.SNOWBALL:
                    color = Colors.SNOW_WHITE;
                    break;
                case EnemyState.PARTIAL_1:
                case EnemyState.PARTIAL_2:
                    color = '#aaccff';
                    break;
                default:
                    color = this.type === EnemyType.RED_DEMON ?
                        Colors.ENEMY_RED : Colors.ENEMY_BLUE;
            }

            ctx.fillStyle = color;
            ctx.fillRect(
                Math.floor(this.x),
                Math.floor(this.y),
                this.width,
                this.height
            );

            // Occhi
            if (this.state === EnemyState.NORMAL) {
                ctx.fillStyle = '#fff';
                const eyeX = this.facing === 1 ? this.x + 8 : this.x + 4;
                ctx.fillRect(eyeX, this.y + 4, 3, 3);
                ctx.fillRect(eyeX + 5, this.y + 4, 3, 3);
            }
        }

        // Indicatore copertura neve
        if (this.state !== EnemyState.NORMAL && this.state !== EnemyState.SNOWBALL) {
            const coverage = SnowCoverage.getCoveragePercent(this);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(
                this.x,
                this.y + this.height * (1 - coverage),
                this.width,
                this.height * coverage
            );
        }

        // Timer liberazione per snowball
        if (this.state === EnemyState.SNOWBALL && this.freezeTimer > 0) {
            const percent = this.freezeTimer / FREEZE_RELEASE_TIME;
            ctx.fillStyle = percent > 0.3 ? '#4a9fff' : '#ff4a4a';
            ctx.fillRect(
                this.x,
                this.y - 4,
                this.width * percent,
                2
            );
        }

        // Debug hitbox
        if (Debug.enabled && Debug.showHitboxes) {
            ctx.strokeStyle = '#f00';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

// ===========================================
// FACTORY PER CREAZIONE NEMICI
// ===========================================

const EnemyFactory = {
    create(x, y, type) {
        return new Enemy(x, y, type);
    },

    createRandom(x, y) {
        const types = Object.values(EnemyType);
        const type = randomChoice(types);
        return this.create(x, y, type);
    },

    spawnFromData(enemyData) {
        return enemyData.map(e => this.create(e.x, e.y, e.type));
    }
};
