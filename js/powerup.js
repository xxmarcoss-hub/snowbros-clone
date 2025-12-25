// ===========================================
// POWERUP.JS - Sistema power-up e bonus
// ===========================================

// Tipi bonus punti
const BonusType = {
    COIN: 'coin',
    SUSHI: 'sushi',
    CAKE: 'cake',
    DIAMOND: 'diamond'
};

// Valori punti bonus
const BonusValue = {
    [BonusType.COIN]: 100,
    [BonusType.SUSHI]: 500,
    [BonusType.CAKE]: 1000,
    [BonusType.DIAMOND]: 5000
};

// ===========================================
// CLASSE POWERUP
// ===========================================

class PowerUp {
    constructor(x, y, type) {
        // Posizione e dimensioni
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 12;

        // Tipo
        this.type = type;

        // Fisica
        this.vy = 0;
        this.grounded = false;

        // Stato
        this.active = true;

        // Timer scomparsa
        this.lifetime = 10000; // 10 secondi
        this.timer = 0;
        this.blinking = false;
        this.blinkTimer = 0;

        // Animazione fluttuazione
        this.floatOffset = 0;
        this.floatSpeed = 0.1;
        this.floatAmount = 2;
    }

    update(dt) {
        if (!this.active) return;

        const frameMs = dt * FRAME_TIME;

        // Timer vita
        this.timer += frameMs;

        // Inizia a lampeggiare negli ultimi 3 secondi
        if (this.timer >= this.lifetime - 3000) {
            this.blinking = true;
            this.blinkTimer += frameMs;
        }

        // Scompare dopo lifetime
        if (this.timer >= this.lifetime) {
            this.active = false;
            return;
        }

        // Gravità se non a terra
        if (!this.grounded) {
            this.vy += GRAVITY * dt * 0.5; // Cade più lentamente
            this.vy = Math.min(this.vy, POWERUP_FALL_SPEED);
            this.y += this.vy * dt;
        } else {
            // Fluttuazione quando a terra
            this.floatOffset = Math.sin(this.timer * 0.005) * this.floatAmount;
        }

        // Collisione piattaforme
        this.checkPlatformCollisions();

        // Pavimento
        if (this.y + this.height >= CANVAS_HEIGHT - 8) {
            this.y = CANVAS_HEIGHT - 8 - this.height;
            this.vy = 0;
            this.grounded = true;
        }
    }

    checkPlatformCollisions() {
        for (const platform of Game.platforms) {
            if (!platform || !platform.solid) continue;

            if (this.vy >= 0) {
                const bottom = this.y + this.height;
                const prevBottom = bottom - this.vy;

                if (
                    this.x + this.width > platform.x &&
                    this.x < platform.x + platform.width &&
                    prevBottom <= platform.y &&
                    bottom >= platform.y
                ) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                }
            }
        }
    }

    collect(player) {
        if (!this.active) return;

        this.active = false;

        // Applica effetto in base al tipo
        switch (this.type) {
            case PowerUpType.SPEED:
                player.applyPowerUp(PowerUpType.SPEED);
                break;
            case PowerUpType.RANGE:
                player.applyPowerUp(PowerUpType.RANGE);
                break;
            case PowerUpType.FIRE_RATE:
                player.applyPowerUp(PowerUpType.FIRE_RATE);
                break;
            case PowerUpType.FLY:
                player.applyPowerUp(PowerUpType.FLY);
                break;
        }

        // Effetto visivo
        PowerUpEffects.createCollectEffect(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.type
        );
    }

    render(ctx) {
        if (!this.active) return;

        // Non renderizza durante blink
        if (this.blinking && Math.floor(this.blinkTimer / 100) % 2 === 0) {
            return;
        }

        const drawY = this.grounded ? this.y + this.floatOffset : this.y;
        const sprite = Sprites.get('powerup_' + this.type);

        if (sprite) {
            ctx.drawImage(
                sprite,
                Math.floor(this.x),
                Math.floor(drawY),
                this.width,
                this.height
            );
        } else {
            // Fallback: pozione colorata
            this.renderFallback(ctx, drawY);
        }

        // Debug hitbox
        if (Debug.enabled && Debug.showHitboxes) {
            ctx.strokeStyle = '#ff0';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    renderFallback(ctx, drawY) {
        let color;
        switch (this.type) {
            case PowerUpType.SPEED:
                color = Colors.POWERUP_RED;
                break;
            case PowerUpType.RANGE:
                color = Colors.POWERUP_BLUE;
                break;
            case PowerUpType.FIRE_RATE:
                color = Colors.POWERUP_YELLOW;
                break;
            case PowerUpType.FLY:
                color = Colors.POWERUP_GREEN;
                break;
            default:
                color = '#fff';
        }

        // Bottiglia
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x + 3, drawY, 4, 3);

        // Contenuto
        ctx.fillStyle = color;
        ctx.fillRect(this.x + 1, drawY + 3, 8, 9);

        // Riflesso
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.x + 2, drawY + 4, 2, 4);
    }
}

// ===========================================
// CLASSE BONUS (punti)
// ===========================================

class Bonus {
    constructor(x, y, type = BonusType.COIN) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.type = type;
        this.value = BonusValue[type] || 100;

        // Fisica
        this.vy = -3; // Salta fuori
        this.vx = randomFloat(-1, 1);
        this.grounded = false;

        // Stato
        this.active = true;
        this.lifetime = 8000;
        this.timer = 0;
        this.blinking = false;
        this.blinkTimer = 0;

        // Animazione
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(dt) {
        if (!this.active) return;

        const frameMs = dt * FRAME_TIME;

        // Timer vita
        this.timer += frameMs;
        if (this.timer >= this.lifetime - 2000) {
            this.blinking = true;
            this.blinkTimer += frameMs;
        }
        if (this.timer >= this.lifetime) {
            this.active = false;
            return;
        }

        // Fisica
        if (!this.grounded) {
            this.vy += GRAVITY * dt;
            this.vy = Math.min(this.vy, MAX_FALL_SPEED);
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Attrito
        this.vx *= 0.98;

        // Collisioni
        this.checkCollisions();

        // Animazione
        this.animTimer += frameMs;
        if (this.animTimer >= 150) {
            this.animFrame = (this.animFrame + 1) % 4;
            this.animTimer = 0;
        }
    }

    checkCollisions() {
        // Piattaforme
        for (const platform of Game.platforms) {
            if (!platform || !platform.solid) continue;

            if (this.vy >= 0) {
                const bottom = this.y + this.height;
                if (
                    this.x + this.width > platform.x &&
                    this.x < platform.x + platform.width &&
                    bottom >= platform.y &&
                    bottom <= platform.y + 8
                ) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                }
            }
        }

        // Pavimento
        if (this.y + this.height >= CANVAS_HEIGHT - 8) {
            this.y = CANVAS_HEIGHT - 8 - this.height;
            this.vy = 0;
            this.grounded = true;
        }

        // Bordi schermo
        if (this.x < 0) {
            this.x = 0;
            this.vx = -this.vx * 0.5;
        } else if (this.x + this.width > CANVAS_WIDTH) {
            this.x = CANVAS_WIDTH - this.width;
            this.vx = -this.vx * 0.5;
        }
    }

    collect(player) {
        if (!this.active) return;

        this.active = false;

        // Aggiungi punti
        Game.addScore(player.playerNum, this.value);

        // Effetto
        PowerUpEffects.createScorePopup(
            this.x + this.width / 2,
            this.y,
            this.value
        );

        Audio.play('bonus');
    }

    render(ctx) {
        if (!this.active) return;

        if (this.blinking && Math.floor(this.blinkTimer / 80) % 2 === 0) {
            return;
        }

        // Renderizza in base al tipo
        switch (this.type) {
            case BonusType.COIN:
                this.renderCoin(ctx);
                break;
            case BonusType.SUSHI:
                this.renderSushi(ctx);
                break;
            case BonusType.CAKE:
                this.renderCake(ctx);
                break;
            case BonusType.DIAMOND:
                this.renderDiamond(ctx);
                break;
            default:
                this.renderCoin(ctx);
        }
    }

    renderCoin(ctx) {
        // Moneta animata (rotazione simulata)
        const widths = [8, 6, 2, 6];
        const w = widths[this.animFrame];
        const offset = (8 - w) / 2;

        ctx.fillStyle = '#ffd700';
        ctx.fillRect(
            Math.floor(this.x + offset),
            Math.floor(this.y),
            w,
            this.height
        );

        // Bordo
        ctx.fillStyle = '#daa520';
        ctx.fillRect(
            Math.floor(this.x + offset),
            Math.floor(this.y),
            1,
            this.height
        );
    }

    renderSushi(ctx) {
        // Riso
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x, this.y + 3, 8, 5);

        // Pesce
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(this.x + 1, this.y, 6, 4);
    }

    renderCake(ctx) {
        // Base
        ctx.fillStyle = '#deb887';
        ctx.fillRect(this.x, this.y + 3, 8, 5);

        // Crema
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 1, this.y + 1, 6, 3);

        // Ciliegina
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 3, this.y, 2, 2);
    }

    renderDiamond(ctx) {
        // Diamante
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(this.x + 4, this.y);
        ctx.lineTo(this.x + 8, this.y + 4);
        ctx.lineTo(this.x + 4, this.y + 8);
        ctx.lineTo(this.x, this.y + 4);
        ctx.closePath();
        ctx.fill();

        // Riflesso
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 2, this.y + 2, 2, 2);
    }
}

// ===========================================
// EFFETTI POWER-UP
// ===========================================

const PowerUpEffects = {
    effects: [],
    scorePopups: [],

    /**
     * Effetto raccolta power-up
     */
    createCollectEffect(x, y, type) {
        let color;
        switch (type) {
            case PowerUpType.SPEED:
                color = Colors.POWERUP_RED;
                break;
            case PowerUpType.RANGE:
                color = Colors.POWERUP_BLUE;
                break;
            case PowerUpType.FIRE_RATE:
                color = Colors.POWERUP_YELLOW;
                break;
            case PowerUpType.FLY:
                color = Colors.POWERUP_GREEN;
                break;
            default:
                color = '#fff';
        }

        // Crea particelle
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            this.effects.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                color: color,
                size: 3,
                life: 400,
                maxLife: 400
            });
        }
    },

    /**
     * Popup punteggio
     */
    createScorePopup(x, y, score) {
        this.scorePopups.push({
            x: x,
            y: y,
            score: score,
            life: 1000,
            maxLife: 1000
        });
    },

    /**
     * Aggiorna effetti
     */
    update(dt) {
        const frameMs = dt * FRAME_TIME;

        // Aggiorna particelle
        this.effects = this.effects.filter(e => {
            e.life -= frameMs;
            if (e.life <= 0) return false;

            e.x += e.vx * dt;
            e.y += e.vy * dt;
            e.vy += GRAVITY * 0.3 * dt;

            return true;
        });

        // Aggiorna popup
        this.scorePopups = this.scorePopups.filter(p => {
            p.life -= frameMs;
            if (p.life <= 0) return false;

            p.y -= 0.5 * dt;
            return true;
        });
    },

    /**
     * Renderizza effetti
     */
    render(ctx) {
        // Particelle
        for (const e of this.effects) {
            const alpha = e.life / e.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Score popup
        for (const p of this.scorePopups) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(p.score.toString(), p.x, p.y);
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    },

    /**
     * Pulisce effetti
     */
    clear() {
        this.effects = [];
        this.scorePopups = [];
    }
};
