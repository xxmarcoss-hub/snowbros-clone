// ===========================================
// PLAYER.JS - Classe Player per Nick e Tom
// ===========================================

class Player {
    constructor(x, y, playerNum) {
        // Identità
        this.playerNum = playerNum;
        this.name = playerNum === 1 ? 'nick' : 'tom';

        // Posizione e dimensioni
        this.x = x;
        this.y = y;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;

        // Velocità
        this.vx = 0;
        this.vy = 0;

        // Stato
        this.alive = true;
        this.lives = PLAYER_LIVES;
        this.grounded = false;
        this.jumping = false;
        this.falling = false;
        this.passingThrough = false; // Per attraversare piattaforme dal basso

        // Stato morte e respawn
        this.dying = false;
        this.deathTimer = 0;
        this.deathAnimFrame = 0;

        // Stato spawn
        this.spawning = false;
        this.spawnTimer = 0;
        this.spawnAnimFrame = 0;

        // Direzione
        this.facing = 1; // 1 = destra, -1 = sinistra

        // Invincibilità
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleBlink = false;

        // Sparo
        this.shootCooldown = 0;
        this.shootDelay = 200; // ms tra uno sparo e l'altro
        this.shootRange = SNOW_RANGE;
        this.shootSpeed = SNOW_SPEED;

        // Power-up attivi
        this.powerups = {
            speed: false,
            range: false,
            fireRate: false,
            fly: false
        };
        this.powerupTimers = {
            speed: 0,
            range: 0,
            fireRate: 0,
            fly: 0
        };

        // Animazione
        this.animState = 'idle';
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 150; // ms per frame
    }

    // ===========================================
    // UPDATE
    // ===========================================

    update(deltaTime) {
        // Gestione animazione spawn
        if (this.spawning) {
            this.updateSpawn(deltaTime);
            return;
        }

        // Gestione animazione morte
        if (this.dying) {
            this.updateDeath(deltaTime);
            return;
        }

        if (!this.alive) return;

        const input = Input.getPlayer(this.playerNum);
        const dt = deltaTime;

        // Aggiorna timer
        this.updateTimers(dt);

        // Input movimento
        this.handleMovement(input, dt);

        // Input salto
        this.handleJump(input);

        // Input sparo
        this.handleShoot(input);

        // Applica fisica
        this.applyPhysics(dt);

        // Collisione piattaforme
        this.checkPlatformCollisions();

        // Limiti canvas
        this.clampToCanvas();

        // Aggiorna animazione
        this.updateAnimation(dt);
    }

    updateTimers(dt) {
        const frameMs = dt * FRAME_TIME;

        // Timer invincibilità
        if (this.invincible) {
            this.invincibleTimer -= frameMs;
            // Effetto lampeggio
            this.invincibleBlink = Math.floor(this.invincibleTimer / 100) % 2 === 0;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
                this.invincibleBlink = false;
            }
        }

        // Timer sparo
        if (this.shootCooldown > 0) {
            this.shootCooldown -= frameMs;
        }

        // Timer power-up
        for (const type in this.powerupTimers) {
            if (this.powerupTimers[type] > 0) {
                this.powerupTimers[type] -= frameMs;
                if (this.powerupTimers[type] <= 0) {
                    this.powerups[type] = false;
                }
            }
        }
    }

    handleMovement(input, dt) {
        const speed = this.powerups.speed ? PLAYER_SPEED * 1.5 : PLAYER_SPEED;

        if (input.left) {
            this.vx -= speed * 0.3 * dt;
            this.facing = -1;
        } else if (input.right) {
            this.vx += speed * 0.3 * dt;
            this.facing = 1;
        }

        // Limita velocità orizzontale
        const maxSpeed = speed;
        this.vx = clamp(this.vx, -maxSpeed, maxSpeed);

        // Attrito
        if (!input.left && !input.right) {
            this.vx *= FRICTION;
            if (Math.abs(this.vx) < 0.1) {
                this.vx = 0;
            }
        }
    }

    handleJump(input) {
        // Volo (power-up)
        if (this.powerups.fly && input.jump) {
            this.vy = PLAYER_JUMP_FORCE * 0.5;
            this.grounded = false;
            this.jumping = true;
            return;
        }

        // Salto normale
        if (input.jump && this.grounded) {
            this.vy = PLAYER_JUMP_FORCE;
            this.grounded = false;
            this.jumping = true;
            Audio.play('jump');
        }

        // Attraversamento piattaforma dal basso
        // Quando il giocatore salta, può passare attraverso le piattaforme
        if (this.vy < 0) {
            this.passingThrough = true;
        }
    }

    handleShoot(input) {
        if (input.shoot && this.shootCooldown <= 0) {
            this.shoot();
        }
    }

    shoot() {
        // Calcola parametri sparo
        const range = this.powerups.range ? this.shootRange * 1.5 : this.shootRange;
        const cooldown = this.powerups.fireRate ? this.shootDelay * 0.5 : this.shootDelay;

        // Crea proiettile neve
        const projX = this.facing === 1 ? this.x + this.width : this.x - 8;
        const projY = this.y + 4;

        const projectile = new SnowProjectile(
            projX,
            projY,
            this.facing,
            this.shootSpeed,
            range
        );

        Game.projectiles.push(projectile);
        this.shootCooldown = cooldown;

        // Aggiorna animazione
        this.animState = 'throw';
        this.animTimer = 0;

        Audio.play('shoot');
    }

    applyPhysics(dt) {
        // Gravità
        if (!this.grounded || this.vy < 0) {
            this.vy += GRAVITY * dt;
        }

        // Limita velocità caduta
        this.vy = Math.min(this.vy, MAX_FALL_SPEED);

        // Aggiorna posizione
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Stato caduta
        this.falling = this.vy > 0 && !this.grounded;
    }

    checkPlatformCollisions() {
        this.grounded = false;

        for (const platform of Game.platforms) {
            if (!platform || !platform.solid) continue;

            // Collisione solo dall'alto (atterraggio)
            if (this.vy >= 0 && !this.passingThrough) {
                const playerBottom = this.y + this.height;
                const playerPrevBottom = playerBottom - this.vy;

                // Controllo se il player sta atterrando sulla piattaforma
                if (
                    this.x + this.width > platform.x + 2 &&
                    this.x < platform.x + platform.width - 2 &&
                    playerPrevBottom <= platform.y &&
                    playerBottom >= platform.y
                ) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                    this.jumping = false;
                    this.passingThrough = false;
                }
            }
        }

        // Collisione col pavimento (bordo inferiore)
        if (this.y + this.height >= CANVAS_HEIGHT - 8) {
            this.y = CANVAS_HEIGHT - 8 - this.height;
            this.vy = 0;
            this.grounded = true;
            this.jumping = false;
            this.passingThrough = false;
        }
    }

    clampToCanvas() {
        // Wrap orizzontale (esce da un lato, rientra dall'altro)
        if (this.x + this.width < 0) {
            this.x = CANVAS_WIDTH;
        } else if (this.x > CANVAS_WIDTH) {
            this.x = -this.width;
        }

        // Limite verticale (non può salire sopra lo schermo)
        if (this.y < 0) {
            this.y = 0;
            this.vy = 0;
        }
    }

    // ===========================================
    // COLLISIONI E DANNO
    // ===========================================

    hit() {
        if (this.invincible || !this.alive) return;

        this.lives--;

        if (this.lives <= 0) {
            this.die();
        } else {
            // Attiva invincibilità temporanea
            this.invincible = true;
            this.invincibleTimer = INVINCIBILITY_TIME;

            // Knockback
            this.vy = PLAYER_JUMP_FORCE * 0.5;
            this.vx = -this.facing * 2;
        }
    }

    die() {
        // Inizia animazione morte
        this.dying = true;
        this.deathTimer = 1000; // 1 secondo di animazione
        this.deathAnimFrame = 0;
        this.vx = 0;
        this.vy = PLAYER_JUMP_FORCE * 0.7; // Salto all'indietro
        Audio.play('death');
    }

    updateDeath(deltaTime) {
        const dt = deltaTime;
        const frameMs = dt * FRAME_TIME;

        // Applica gravità durante animazione morte
        this.vy += GRAVITY * dt;
        this.vy = Math.min(this.vy, MAX_FALL_SPEED);
        this.y += this.vy * dt;

        // Aggiorna timer animazione
        this.deathTimer -= frameMs;

        // Calcola frame animazione morte (6 frame in ~1 secondo)
        const totalFrames = 6;
        const frameTime = 1000 / totalFrames;
        this.deathAnimFrame = Math.min(
            totalFrames - 1,
            Math.floor((1000 - this.deathTimer) / frameTime)
        );

        // Fine animazione morte
        if (this.deathTimer <= 0) {
            this.dying = false;
            this.alive = false;
        }
    }

    updateSpawn(deltaTime) {
        const dt = deltaTime;
        const frameMs = dt * FRAME_TIME;

        // Aggiorna timer animazione
        this.spawnTimer -= frameMs;

        // Calcola frame animazione spawn (5 frame in ~750ms)
        const totalFrames = 5;
        const frameTime = 750 / totalFrames;
        this.spawnAnimFrame = Math.min(
            totalFrames - 1,
            Math.floor((750 - this.spawnTimer) / frameTime)
        );

        // Fine animazione spawn
        if (this.spawnTimer <= 0) {
            this.spawning = false;
        }
    }

    respawn(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.alive = true;
        this.invincible = true;
        this.invincibleTimer = INVINCIBILITY_TIME;
        this.grounded = false;

        // Inizia animazione spawn
        this.spawning = true;
        this.spawnTimer = 750;
        this.spawnAnimFrame = 0;
    }

    /**
     * Inizializza il player con animazione di spawn (per inizio livello)
     */
    startSpawnAnimation() {
        this.spawning = true;
        this.spawnTimer = 750;
        this.spawnAnimFrame = 0;
    }

    // ===========================================
    // POWER-UP
    // ===========================================

    applyPowerUp(type) {
        switch (type) {
            case PowerUpType.SPEED:
                this.powerups.speed = true;
                this.powerupTimers.speed = POWERUP_DURATION;
                break;
            case PowerUpType.RANGE:
                this.powerups.range = true;
                this.powerupTimers.range = POWERUP_DURATION;
                break;
            case PowerUpType.FIRE_RATE:
                this.powerups.fireRate = true;
                this.powerupTimers.fireRate = POWERUP_DURATION;
                break;
            case PowerUpType.FLY:
                this.powerups.fly = true;
                this.powerupTimers.fly = POWERUP_DURATION;
                break;
        }
    }

    // ===========================================
    // ANIMAZIONE
    // ===========================================

    updateAnimation(dt) {
        const frameMs = dt * FRAME_TIME;
        this.animTimer += frameMs;

        // Determina stato animazione
        if (this.animState === 'throw') {
            // Animazione sparo dura poco
            if (this.animTimer >= 150) {
                this.animState = 'idle';
            }
        } else if (!this.grounded) {
            this.animState = 'jump';
        } else if (Math.abs(this.vx) > 0.3) {
            this.animState = 'walk';
        } else {
            this.animState = 'idle';
        }

        // Avanza frame walk (3 frame)
        if (this.animState === 'walk' && this.animTimer >= this.animSpeed) {
            this.animFrame = (this.animFrame + 1) % 3;
            this.animTimer = 0;
        }
    }

    getSpriteName() {
        const dir = this.facing === -1 ? '_left' : '';
        let frame = '';

        switch (this.animState) {
            case 'idle':
                frame = 'idle';
                break;
            case 'walk':
                // 3 frame di camminata
                frame = `walk${this.animFrame + 1}`;
                break;
            case 'jump':
                frame = 'jump';
                break;
            case 'throw':
                frame = 'throw';
                break;
            default:
                frame = 'idle';
        }

        return `${this.name}_${frame}${dir}`;
    }

    /**
     * Ottiene il nome dello sprite per lo stato attuale (inclusi spawn/death)
     */
    getCurrentSpriteName() {
        if (this.spawning) {
            return `${this.name}_spawn_${this.spawnAnimFrame}`;
        }
        if (this.dying) {
            const dir = this.facing === -1 ? '_left' : '';
            return `${this.name}_death_${this.deathAnimFrame}${dir}`;
        }
        return this.getSpriteName();
    }

    // ===========================================
    // RENDER
    // ===========================================

    render(ctx) {
        if (!this.alive && !this.dying && !this.spawning) return;

        // Non renderizza durante blink invincibilità (ma non durante spawn)
        if (this.invincible && this.invincibleBlink && !this.spawning) return;

        const spriteName = this.getCurrentSpriteName();
        const sprite = Sprites.get(spriteName);
        const drawX = Math.floor(this.x);
        const drawY = Math.floor(this.y);

        // Durante la morte con i nuovi sprite animati
        if (this.dying && sprite) {
            // Centra lo sprite rispetto alla hitbox (gli sprite death hanno dimensioni variabili)
            const offsetX = (this.width - sprite.width) / 2;
            const offsetY = this.height - sprite.height;

            ctx.drawImage(sprite, drawX + offsetX, drawY + offsetY);
        }
        // Durante lo spawn con i nuovi sprite animati
        else if (this.spawning && sprite) {
            // Centra lo sprite spawn rispetto alla hitbox (dimensioni molto variabili)
            const offsetX = (this.width - sprite.width) / 2;
            const offsetY = this.height - sprite.height;

            ctx.drawImage(sprite, drawX + offsetX, drawY + offsetY);
        }
        // Rendering normale
        else if (sprite) {
            // Per sprite normali, centra orizzontalmente e allinea in basso
            const offsetX = (this.width - sprite.width) / 2;
            const offsetY = this.height - sprite.height;

            ctx.drawImage(sprite, drawX + offsetX, drawY + offsetY);
        } else {
            // Fallback: rettangolo colorato
            ctx.fillStyle = this.playerNum === 1 ? Colors.NICK_BLUE : Colors.TOM_GREEN;
            ctx.fillRect(drawX, drawY, this.width, this.height);
        }

        // Debug hitbox
        if (Debug.enabled && Debug.showHitboxes) {
            ctx.strokeStyle = '#ff0';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

// SnowProjectile è definito in snowball.js
