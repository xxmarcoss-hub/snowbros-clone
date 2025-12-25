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
        this.alive = false;
        Audio.play('death');
        // Respawn gestito da Game
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

        // Avanza frame walk
        if (this.animState === 'walk' && this.animTimer >= this.animSpeed) {
            this.animFrame = (this.animFrame + 1) % 2;
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
                frame = this.animFrame === 0 ? 'walk1' : 'walk2';
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

    // ===========================================
    // RENDER
    // ===========================================

    render(ctx) {
        if (!this.alive) return;

        // Non renderizza durante blink invincibilità
        if (this.invincible && this.invincibleBlink) return;

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
            ctx.fillStyle = this.playerNum === 1 ? Colors.NICK_BLUE : Colors.TOM_GREEN;
            ctx.fillRect(
                Math.floor(this.x),
                Math.floor(this.y),
                this.width,
                this.height
            );
        }

        // Debug hitbox
        if (Debug.enabled && Debug.showHitboxes) {
            ctx.strokeStyle = '#ff0';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

// ===========================================
// SNOW PROJECTILE
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
