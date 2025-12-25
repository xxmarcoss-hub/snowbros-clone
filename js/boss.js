// ===========================================
// BOSS.JS - Boss finale (Twin Ghouls)
// ===========================================

// Stati del boss
const BossState = {
    ENTERING: 'entering',
    IDLE: 'idle',
    MOVING: 'moving',
    ATTACKING: 'attacking',
    PHASE_CHANGE: 'phase_change',
    DYING: 'dying',
    DEAD: 'dead'
};

// Fasi del boss
const BossPhase = {
    PHASE_1: 1, // > 50% HP
    PHASE_2: 2  // <= 50% HP
};

class Boss {
    constructor(x, y) {
        // Posizione e dimensioni (più grande dei nemici)
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;

        // Vita
        this.maxHealth = 30;
        this.health = this.maxHealth;

        // Stato
        this.state = BossState.ENTERING;
        this.phase = BossPhase.PHASE_1;
        this.alive = true;

        // Movimento
        this.vx = 0;
        this.vy = 0;
        this.baseSpeed = 1.2;
        this.speed = this.baseSpeed;

        // Target position per movimento
        this.targetX = CANVAS_WIDTH / 2 - this.width / 2;
        this.targetY = 60;

        // Timer e cooldown
        this.stateTimer = 0;
        this.attackCooldown = 0;
        this.attackDelay = 2000; // ms tra attacchi

        // Invincibilità temporanea durante cambio fase
        this.invincible = false;
        this.invincibleTimer = 0;

        // Animazione
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 200;
        this.floatOffset = 0;

        // Pattern di attacco
        this.attackPattern = 0;
    }

    // ===========================================
    // UPDATE
    // ===========================================

    update(dt) {
        if (!this.alive) return;

        const frameMs = dt * FRAME_TIME;

        // Timer stato
        this.stateTimer += frameMs;

        // Timer invincibilità
        if (this.invincible) {
            this.invincibleTimer -= frameMs;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Cooldown attacco
        if (this.attackCooldown > 0) {
            this.attackCooldown -= frameMs;
        }

        // Fluttuazione
        this.floatOffset = Math.sin(this.stateTimer * 0.003) * 4;

        // Update in base allo stato
        switch (this.state) {
            case BossState.ENTERING:
                this.updateEntering(dt);
                break;
            case BossState.IDLE:
                this.updateIdle(dt, frameMs);
                break;
            case BossState.MOVING:
                this.updateMoving(dt);
                break;
            case BossState.ATTACKING:
                this.updateAttacking(dt, frameMs);
                break;
            case BossState.PHASE_CHANGE:
                this.updatePhaseChange(dt, frameMs);
                break;
            case BossState.DYING:
                this.updateDying(dt, frameMs);
                break;
        }

        // Animazione
        this.updateAnimation(dt);
    }

    updateEntering(dt) {
        // Entra dall'alto
        if (this.y < this.targetY) {
            this.y += 1 * dt;
        } else {
            this.y = this.targetY;
            this.state = BossState.IDLE;
            this.stateTimer = 0;
            Audio.play('bossAppear');
        }
    }

    updateIdle(dt, frameMs) {
        // Aspetta prima di agire
        if (this.stateTimer >= 1000) {
            this.chooseAction();
        }
    }

    updateMoving(dt) {
        // Muovi verso target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        } else {
            this.x = this.targetX;
            this.y = this.targetY;
            this.state = BossState.IDLE;
            this.stateTimer = 0;
        }
    }

    updateAttacking(dt, frameMs) {
        // Attacco dura poco
        if (this.stateTimer >= 500) {
            this.state = BossState.IDLE;
            this.stateTimer = 0;
        }
    }

    updatePhaseChange(dt, frameMs) {
        // Cambio fase con flash
        if (this.stateTimer >= 2000) {
            this.state = BossState.IDLE;
            this.stateTimer = 0;
            this.invincible = false;
            Audio.play('bossRage');
        }
    }

    updateDying(dt, frameMs) {
        // Esplosione finale
        if (this.stateTimer >= 3000) {
            this.state = BossState.DEAD;
            this.alive = false;
            this.onDeath();
        } else if (this.stateTimer % 200 < 100) {
            // Esplosioni periodiche
            SnowEffects.createExplosion(
                this.x + randomRange(0, this.width),
                this.y + randomRange(0, this.height),
                4
            );
        }
    }

    // ===========================================
    // AI
    // ===========================================

    chooseAction() {
        const actions = this.phase === BossPhase.PHASE_1
            ? ['move', 'attack', 'idle']
            : ['move', 'attack', 'attack', 'special'];

        const action = randomChoice(actions);

        switch (action) {
            case 'move':
                this.startMoving();
                break;
            case 'attack':
                this.startAttack();
                break;
            case 'special':
                this.startSpecialAttack();
                break;
            default:
                this.stateTimer = 0;
        }
    }

    startMoving() {
        // Scegli nuova posizione
        this.targetX = randomRange(32, CANVAS_WIDTH - 32 - this.width);
        this.targetY = randomRange(40, 100);
        this.state = BossState.MOVING;
        this.stateTimer = 0;
    }

    startAttack() {
        if (this.attackCooldown > 0) {
            this.stateTimer = 0;
            return;
        }

        this.state = BossState.ATTACKING;
        this.stateTimer = 0;
        this.attackCooldown = this.attackDelay;

        // Spara proiettili
        this.fireProjectiles();
    }

    startSpecialAttack() {
        if (this.attackCooldown > 0) {
            this.stateTimer = 0;
            return;
        }

        this.state = BossState.ATTACKING;
        this.stateTimer = 0;
        this.attackCooldown = this.attackDelay * 1.5;

        // Attacco speciale: raffica
        this.fireBarrage();
    }

    fireProjectiles() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height;

        // Pattern base: 3 proiettili
        const angles = this.phase === BossPhase.PHASE_1
            ? [-30, 0, 30]
            : [-45, -15, 15, 45];

        for (const angle of angles) {
            const rad = degToRad(90 + angle);
            const proj = new BossProjectile(
                centerX,
                centerY,
                Math.cos(rad) * 2,
                Math.sin(rad) * 2
            );
            Game.projectiles.push(proj);
        }

        Audio.play('bossAttack');
    }

    fireBarrage() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height;

        // Raffica circolare
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const proj = new BossProjectile(
                centerX,
                centerY,
                Math.cos(angle) * 1.5,
                Math.sin(angle) * 1.5
            );
            Game.projectiles.push(proj);
        }

        Audio.play('bossAttack');
    }

    // ===========================================
    // DANNO
    // ===========================================

    hit() {
        if (this.invincible || this.state === BossState.DYING ||
            this.state === BossState.DEAD || this.state === BossState.ENTERING) {
            return;
        }

        this.health--;
        Audio.play('bossHit');

        // Flash danno
        this.invincible = true;
        this.invincibleTimer = 200;

        // Controlla cambio fase
        if (this.health <= this.maxHealth / 2 && this.phase === BossPhase.PHASE_1) {
            this.changePhase();
        }

        // Controlla morte
        if (this.health <= 0) {
            this.startDying();
        }
    }

    changePhase() {
        this.phase = BossPhase.PHASE_2;
        this.state = BossState.PHASE_CHANGE;
        this.stateTimer = 0;
        this.invincible = true;

        // Fase 2: più veloce, attacchi più frequenti
        this.speed = this.baseSpeed * 1.5;
        this.attackDelay = 1500;

        Audio.play('bossPhaseChange');
    }

    startDying() {
        this.state = BossState.DYING;
        this.stateTimer = 0;
        this.invincible = true;
        Audio.play('bossDying');
    }

    onDeath() {
        // Punti bonus
        Game.addScore(1, 10000);
        if (Game.numPlayers === 2) {
            Game.addScore(2, 10000);
        }

        // Drop speciali
        this.dropRewards();

        // Vittoria!
        setTimeout(() => {
            Game.state = GameState.VICTORY;
            Audio.play('victory');
        }, 1000);
    }

    dropRewards() {
        // Drop multipli bonus
        const bonusTypes = [BonusType.DIAMOND, BonusType.DIAMOND,
                           BonusType.CAKE, BonusType.CAKE, BonusType.CAKE];

        for (let i = 0; i < bonusTypes.length; i++) {
            setTimeout(() => {
                if (typeof Bonus !== 'undefined') {
                    const bonus = new Bonus(
                        this.x + randomRange(0, this.width),
                        this.y,
                        bonusTypes[i]
                    );
                    Game.powerups.push(bonus);
                }
            }, i * 200);
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

    // ===========================================
    // RENDER
    // ===========================================

    render(ctx) {
        if (this.state === BossState.DEAD) return;

        const drawY = this.y + this.floatOffset;

        // Flash quando invincibile
        if (this.invincible && Math.floor(this.invincibleTimer / 50) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Sprite o fallback
        this.renderSprite(ctx, drawY);

        ctx.globalAlpha = 1;

        // Barra vita
        this.renderHealthBar(ctx);

        // Nome boss durante entering
        if (this.state === BossState.ENTERING) {
            this.renderName(ctx);
        }

        // Debug
        if (Debug.enabled && Debug.showHitboxes) {
            ctx.strokeStyle = '#f0f';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    renderSprite(ctx, drawY) {
        // Fallback: disegna boss come rettangolo con faccia
        const isPhase2 = this.phase === BossPhase.PHASE_2;
        const baseColor = isPhase2 ? '#ff4444' : '#8844ff';
        const highlightColor = isPhase2 ? '#ff8888' : '#aa66ff';

        // Corpo
        ctx.fillStyle = baseColor;
        ctx.fillRect(
            Math.floor(this.x),
            Math.floor(drawY),
            this.width,
            this.height
        );

        // Highlight
        ctx.fillStyle = highlightColor;
        ctx.fillRect(
            Math.floor(this.x + 2),
            Math.floor(drawY + 2),
            this.width - 4,
            4
        );

        // Occhi
        ctx.fillStyle = '#fff';
        const eyeY = drawY + 10;
        ctx.fillRect(this.x + 6, eyeY, 6, 6);
        ctx.fillRect(this.x + 20, eyeY, 6, 6);

        // Pupille (seguono vagamente il player più vicino)
        ctx.fillStyle = '#000';
        const pupilOffset = this.animFrame;
        ctx.fillRect(this.x + 8 + pupilOffset, eyeY + 2, 3, 3);
        ctx.fillRect(this.x + 22 + pupilOffset, eyeY + 2, 3, 3);

        // Bocca
        ctx.fillStyle = '#000';
        if (this.state === BossState.ATTACKING) {
            // Bocca aperta
            ctx.fillRect(this.x + 10, drawY + 22, 12, 6);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x + 12, drawY + 24, 8, 3);
        } else {
            // Bocca chiusa/sorriso malvagio
            ctx.fillRect(this.x + 8, drawY + 24, 16, 2);
            ctx.fillRect(this.x + 6, drawY + 22, 2, 2);
            ctx.fillRect(this.x + 24, drawY + 22, 2, 2);
        }

        // Ali/corna in fase 2
        if (isPhase2) {
            ctx.fillStyle = '#ff4444';
            // Corna
            ctx.beginPath();
            ctx.moveTo(this.x, drawY);
            ctx.lineTo(this.x - 6, drawY - 10);
            ctx.lineTo(this.x + 8, drawY);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.x + this.width, drawY);
            ctx.lineTo(this.x + this.width + 6, drawY - 10);
            ctx.lineTo(this.x + this.width - 8, drawY);
            ctx.fill();
        }
    }

    renderHealthBar(ctx) {
        const barWidth = 60;
        const barHeight = 6;
        const barX = CANVAS_WIDTH / 2 - barWidth / 2;
        const barY = 16;

        // Sfondo
        ctx.fillStyle = '#333';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        // Vita
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#4a4' :
                           healthPercent > 0.25 ? '#aa4' : '#a44';

        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Bordo
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '6px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', CANVAS_WIDTH / 2, barY - 3);
        ctx.textAlign = 'left';
    }

    renderName(ctx) {
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TWIN GHOUL', CANVAS_WIDTH / 2, this.y + this.height + 20);
        ctx.textAlign = 'left';
    }
}

// ===========================================
// PROIETTILE BOSS
// ===========================================

class BossProjectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.vx = vx;
        this.vy = vy;
        this.active = true;
        this.type = 'boss';

        this.animTimer = 0;
    }

    update(dt) {
        if (!this.active) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.animTimer += dt * FRAME_TIME;

        // Disattiva se fuori schermo
        if (this.x < -this.width || this.x > CANVAS_WIDTH + this.width ||
            this.y < -this.height || this.y > CANVAS_HEIGHT + this.height) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;

        // Proiettile rotante
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.animTimer * 0.01);

        ctx.fillStyle = '#ff44ff';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        ctx.fillStyle = '#ff88ff';
        ctx.fillRect(-this.width / 4, -this.height / 4, this.width / 2, this.height / 2);

        ctx.restore();
    }
}

// ===========================================
// BOSS FIGHT MANAGER
// ===========================================

const BossFight = {
    boss: null,
    active: false,

    start() {
        this.boss = new Boss(CANVAS_WIDTH / 2 - 16, -40);
        this.active = true;
        Game.enemies = []; // Rimuovi nemici normali
        Audio.play('bossMusic');
    },

    update(dt) {
        if (!this.active || !this.boss) return;

        this.boss.update(dt);

        // Controlla collisione proiettili neve con boss
        for (const proj of Game.projectiles) {
            if (proj.type === 'snow' && proj.active) {
                if (collideAABB(proj, this.boss)) {
                    proj.active = false;
                    this.boss.hit();
                }
            }
        }

        // Controlla collisione proiettili boss con player
        for (const proj of Game.projectiles) {
            if (proj.type === 'boss' && proj.active) {
                for (const player of Game.players) {
                    if (player.alive && !player.invincible && collideAABB(proj, player)) {
                        proj.active = false;
                        player.hit();
                    }
                }
            }
        }

        // Controlla collisione diretta boss-player
        for (const player of Game.players) {
            if (player.alive && !player.invincible && collideAABB(player, this.boss)) {
                player.hit();
            }
        }

        // Controlla fine fight
        if (this.boss.state === BossState.DEAD) {
            this.active = false;
        }
    },

    render(ctx) {
        if (!this.active || !this.boss) return;
        this.boss.render(ctx);
    },

    isActive() {
        return this.active;
    }
};
