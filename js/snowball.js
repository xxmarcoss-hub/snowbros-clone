// ===========================================
// SNOWBALL.JS - Sistema meccanica neve
// ===========================================

// ===========================================
// SNOW PROJECTILE - Proiettile sparato dal player
// ===========================================

class SnowProjectile {
    constructor(x, y, direction, speed, range) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.direction = direction;
        this.speed = speed;
        this.range = range;
        this.distanceTraveled = 0;
        this.active = true;
        this.type = 'snow';
    }

    update(dt) {
        if (!this.active) return;

        const move = this.speed * this.direction * dt;
        this.x += move;
        this.distanceTraveled += Math.abs(move);

        // Disattiva se ha raggiunto la portata massima
        if (this.distanceTraveled >= this.range) {
            this.active = false;
        }

        // Disattiva se esce dallo schermo
        if (this.x < -this.width || this.x > CANVAS_WIDTH + this.width) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;

        const sprite = Sprites.get('snow_projectile');
        if (sprite) {
            ctx.drawImage(sprite, Math.floor(this.x), Math.floor(this.y));
        } else {
            ctx.fillStyle = Colors.SNOW_WHITE;
            ctx.beginPath();
            ctx.arc(this.x + 4, this.y + 4, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ===========================================
// SNOW COVERAGE - Sistema copertura nemico
// ===========================================

const SnowCoverage = {
    // Numero di hit per passare allo stato successivo
    HITS_PER_STAGE: 1,

    // Tempo prima che il nemico si liberi (ms)
    RELEASE_TIME: FREEZE_RELEASE_TIME,

    /**
     * Gestisce l'hit di neve su un nemico
     * Restituisce true se il nemico è diventato snowball
     */
    applyHit(enemy) {
        if (!enemy || enemy.state === EnemyState.SNOWBALL) {
            return false;
        }

        enemy.snowHits = (enemy.snowHits || 0) + 1;

        // Avanza stato in base agli hit
        if (enemy.snowHits >= SNOW_HITS_TO_FREEZE) {
            enemy.state = EnemyState.SNOWBALL;
            enemy.freezeTimer = this.RELEASE_TIME;
            return true;
        } else if (enemy.snowHits >= 2) {
            enemy.state = EnemyState.PARTIAL_2;
            enemy.freezeTimer = this.RELEASE_TIME;
        } else {
            enemy.state = EnemyState.PARTIAL_1;
            enemy.freezeTimer = this.RELEASE_TIME;
        }

        return false;
    },

    /**
     * Aggiorna il timer di liberazione
     * Restituisce true se il nemico si è liberato
     */
    updateFreeze(enemy, dt) {
        if (!enemy || enemy.state === EnemyState.NORMAL) {
            return false;
        }

        const frameMs = dt * FRAME_TIME;
        enemy.freezeTimer -= frameMs;

        if (enemy.freezeTimer <= 0) {
            // Il nemico si libera
            this.release(enemy);
            return true;
        }

        return false;
    },

    /**
     * Libera il nemico dalla neve
     */
    release(enemy) {
        enemy.state = EnemyState.NORMAL;
        enemy.snowHits = 0;
        enemy.freezeTimer = 0;
    },

    /**
     * Restituisce la percentuale di copertura (0-1)
     */
    getCoveragePercent(enemy) {
        if (!enemy) return 0;

        switch (enemy.state) {
            case EnemyState.PARTIAL_1:
                return 0.33;
            case EnemyState.PARTIAL_2:
                return 0.66;
            case EnemyState.SNOWBALL:
                return 1.0;
            default:
                return 0;
        }
    }
};

// ===========================================
// ROLLING SNOWBALL - Palla di neve rotolante
// ===========================================

class RollingSnowball {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;

        // Velocità
        this.vx = direction * SNOWBALL_ROLL_SPEED;
        this.vy = 0;

        // Stato
        this.active = true;
        this.grounded = false;

        // Combo e punteggio
        this.combo = 0;
        this.enemiesHit = [];

        // Limiti
        this.bounceCount = 0;
        this.maxBounces = 5;
        this.lifetime = 10000; // ms
        this.timer = 0;

        // Animazione rotazione
        this.rotation = 0;
        this.rotationSpeed = 0.3;
    }

    update(dt) {
        if (!this.active) return;

        const frameMs = dt * FRAME_TIME;

        // Timer vita
        this.timer += frameMs;
        if (this.timer >= this.lifetime) {
            this.active = false;
            return;
        }

        // Applica gravità
        if (!this.grounded) {
            this.vy += GRAVITY * dt;
            this.vy = Math.min(this.vy, MAX_FALL_SPEED);
        }

        // Aggiorna posizione
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Animazione rotazione
        this.rotation += this.rotationSpeed * Math.sign(this.vx) * dt;

        // Collisione con piattaforme
        this.checkPlatformCollisions();

        // Collisione con bordi schermo
        this.checkScreenBounds();

        // Controlla se ha finito i rimbalzi
        if (this.bounceCount >= this.maxBounces) {
            this.active = false;
        }
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
                    this.x = collision.x;
                    this.vx = -this.vx * SNOWBALL_BOUNCE_DECAY;
                    this.bounceCount++;
                    Audio.play('bounce');
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
        // Rimbalzo sui bordi laterali
        if (this.x <= 0) {
            this.x = 0;
            this.vx = Math.abs(this.vx) * SNOWBALL_BOUNCE_DECAY;
            this.bounceCount++;
            Audio.play('bounce');
        } else if (this.x + this.width >= CANVAS_WIDTH) {
            this.x = CANVAS_WIDTH - this.width;
            this.vx = -Math.abs(this.vx) * SNOWBALL_BOUNCE_DECAY;
            this.bounceCount++;
            Audio.play('bounce');
        }
    }

    /**
     * Chiamato quando colpisce un nemico
     */
    hitEnemy(enemy) {
        if (this.enemiesHit.includes(enemy)) return;

        this.enemiesHit.push(enemy);
        this.combo++;

        // Calcola punteggio con bonus combo
        const baseScore = 500;
        const comboMultiplier = Math.pow(2, this.combo - 1);
        const score = baseScore * comboMultiplier;

        return score;
    }

    /**
     * Aggiunge combo (chiamato da Game)
     */
    addCombo() {
        this.combo++;
    }

    /**
     * Restituisce punteggio corrente con combo
     */
    getScore() {
        const baseScore = 500;
        return baseScore * Math.pow(2, Math.max(0, this.combo - 1));
    }

    render(ctx) {
        if (!this.active) return;

        const sprite = Sprites.get('snow_rolling');

        if (sprite) {
            ctx.save();
            ctx.translate(
                Math.floor(this.x + this.width / 2),
                Math.floor(this.y + this.height / 2)
            );
            ctx.rotate(this.rotation);
            ctx.drawImage(
                sprite,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
            ctx.restore();
        } else {
            // Fallback: cerchio bianco
            ctx.fillStyle = Colors.SNOW_WHITE;
            ctx.beginPath();
            ctx.arc(
                Math.floor(this.x + this.width / 2),
                Math.floor(this.y + this.height / 2),
                this.width / 2,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Ombra interna per effetto 3D
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.beginPath();
            ctx.arc(
                Math.floor(this.x + this.width / 2 + 2),
                Math.floor(this.y + this.height / 2 + 2),
                this.width / 3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Mostra combo se > 1
        if (this.combo > 1) {
            ctx.fillStyle = '#ff0';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                'x' + this.combo,
                Math.floor(this.x + this.width / 2),
                Math.floor(this.y - 4)
            );
            ctx.textAlign = 'left';
        }

        // Debug hitbox
        if (Debug.enabled && Debug.showHitboxes) {
            ctx.strokeStyle = '#0f0';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

// ===========================================
// SNOW EFFECTS - Effetti particellari
// ===========================================

const SnowEffects = {
    particles: [],

    /**
     * Crea esplosione di neve
     */
    createExplosion(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = randomFloat(1, 3);

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: randomRange(2, 4),
                life: 500,
                maxLife: 500
            });
        }
    },

    /**
     * Crea scia di neve
     */
    createTrail(x, y) {
        if (Math.random() > 0.3) return;

        this.particles.push({
            x: x + randomFloat(-4, 4),
            y: y + randomFloat(-2, 2),
            vx: randomFloat(-0.5, 0.5),
            vy: randomFloat(-1, 0),
            size: randomRange(1, 3),
            life: 300,
            maxLife: 300
        });
    },

    /**
     * Aggiorna particelle
     */
    update(dt) {
        const frameMs = dt * FRAME_TIME;

        this.particles = this.particles.filter(p => {
            p.life -= frameMs;
            if (p.life <= 0) return false;

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += GRAVITY * 0.5 * dt;

            return true;
        });
    },

    /**
     * Renderizza particelle
     */
    render(ctx) {
        ctx.fillStyle = Colors.SNOW_WHITE;

        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(Math.floor(p.x), Math.floor(p.y), p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    },

    /**
     * Pulisce tutte le particelle
     */
    clear() {
        this.particles = [];
    }
};
