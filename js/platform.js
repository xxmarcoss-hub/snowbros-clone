// ===========================================
// PLATFORM.JS - Sistema piattaforme
// ===========================================

// Tipi di piattaforma
const PlatformType = {
    SOLID: 'solid',           // Blocca sempre (muri, pavimento)
    PASSTHROUGH: 'passthrough' // Attraversabile dal basso
};

class Platform {
    constructor(x, y, width, height, type = PlatformType.PASSTHROUGH) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;

        // Proprietà per collisioni
        this.solid = true;
        this.passthrough = type === PlatformType.PASSTHROUGH;

        // Per rendering
        this.tileWidth = TILE_SIZE;
        this.tileHeight = TILE_SIZE;
        this.numTilesX = Math.ceil(width / this.tileWidth);
        this.numTilesY = Math.ceil(height / this.tileHeight);
    }

    // ===========================================
    // COLLISIONI
    // ===========================================

    /**
     * Controlla collisione con un'entità
     * Restituisce oggetto con info sulla collisione
     */
    checkCollision(entity, prevY) {
        if (!this.solid) return null;

        const entityBottom = entity.y + entity.height;
        const entityPrevBottom = prevY + entity.height;

        // Controllo overlap orizzontale
        const overlapX = entity.x + entity.width > this.x &&
                         entity.x < this.x + this.width;

        if (!overlapX) return null;

        // Per piattaforme passthrough: solo collisione dall'alto
        if (this.passthrough) {
            // L'entità deve cadere (vy >= 0) e non stare passando attraverso
            if (entity.vy >= 0 && !entity.passingThrough) {
                // Era sopra la piattaforma e ora è dentro/sotto
                if (entityPrevBottom <= this.y && entityBottom >= this.y) {
                    return {
                        type: 'top',
                        y: this.y - entity.height
                    };
                }
            }
            return null;
        }

        // Per piattaforme solide: collisione da tutti i lati
        return this.checkSolidCollision(entity, prevY);
    }

    /**
     * Collisione completa per piattaforme solide
     */
    checkSolidCollision(entity, prevY) {
        const entityRight = entity.x + entity.width;
        const entityBottom = entity.y + entity.height;

        // Verifica se c'è overlap
        if (entityRight <= this.x || entity.x >= this.x + this.width ||
            entityBottom <= this.y || entity.y >= this.y + this.height) {
            return null;
        }

        // Calcola penetrazione da ogni lato
        const overlapLeft = entityRight - this.x;
        const overlapRight = (this.x + this.width) - entity.x;
        const overlapTop = entityBottom - this.y;
        const overlapBottom = (this.y + this.height) - entity.y;

        // Trova il lato con minore penetrazione
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop) {
            return { type: 'top', y: this.y - entity.height };
        } else if (minOverlap === overlapBottom) {
            return { type: 'bottom', y: this.y + this.height };
        } else if (minOverlap === overlapLeft) {
            return { type: 'left', x: this.x - entity.width };
        } else {
            return { type: 'right', x: this.x + this.width };
        }
    }

    /**
     * Controlla se un punto è dentro la piattaforma
     */
    containsPoint(px, py) {
        return px >= this.x &&
               px <= this.x + this.width &&
               py >= this.y &&
               py <= this.y + this.height;
    }

    /**
     * Controlla se un'entità è sopra questa piattaforma
     */
    isEntityOnTop(entity) {
        const entityBottom = entity.y + entity.height;
        const onTop = Math.abs(entityBottom - this.y) < 2;
        const overlapX = entity.x + entity.width > this.x + 2 &&
                         entity.x < this.x + this.width - 2;
        return onTop && overlapX;
    }

    // ===========================================
    // RENDER
    // ===========================================

    render(ctx) {
        const sprite = Sprites.get('platform');

        if (sprite) {
            // Renderizza tile per tile
            for (let tx = 0; tx < this.numTilesX; tx++) {
                for (let ty = 0; ty < this.numTilesY; ty++) {
                    const drawX = this.x + tx * this.tileWidth;
                    const drawY = this.y + ty * this.tileHeight;

                    // Calcola dimensione effettiva del tile (per bordi)
                    const tileW = Math.min(this.tileWidth, this.x + this.width - drawX);
                    const tileH = Math.min(this.tileHeight, this.y + this.height - drawY);

                    ctx.drawImage(
                        sprite,
                        0, 0, tileW, tileH,
                        Math.floor(drawX),
                        Math.floor(drawY),
                        tileW,
                        tileH
                    );
                }
            }
        } else {
            // Fallback: rettangolo colorato
            ctx.fillStyle = this.passthrough ? Colors.PLATFORM : '#3a3a5a';
            ctx.fillRect(
                Math.floor(this.x),
                Math.floor(this.y),
                this.width,
                this.height
            );

            // Bordo superiore più chiaro per piattaforme passthrough
            if (this.passthrough) {
                ctx.fillStyle = '#8a8aaa';
                ctx.fillRect(
                    Math.floor(this.x),
                    Math.floor(this.y),
                    this.width,
                    2
                );
            }
        }

        // Debug hitbox
        if (Debug.enabled && Debug.showHitboxes) {
            ctx.strokeStyle = this.passthrough ? '#0ff' : '#f0f';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

// ===========================================
// PHYSICS HELPER - Sistema gravità globale
// ===========================================

const Physics = {
    /**
     * Applica gravità a un'entità
     */
    applyGravity(entity, dt) {
        if (!entity.grounded || entity.vy < 0) {
            entity.vy += GRAVITY * dt;
        }
        entity.vy = Math.min(entity.vy, MAX_FALL_SPEED);
    },

    /**
     * Aggiorna posizione con velocità
     */
    updatePosition(entity, dt) {
        entity.x += entity.vx * dt;
        entity.y += entity.vy * dt;
    },

    /**
     * Controlla collisione con tutte le piattaforme
     */
    checkPlatformCollisions(entity, platforms) {
        const prevY = entity.y - entity.vy;
        let grounded = false;

        for (const platform of platforms) {
            if (!platform || !platform.solid) continue;

            const collision = platform.checkCollision(entity, prevY);
            if (collision) {
                if (collision.type === 'top') {
                    entity.y = collision.y;
                    entity.vy = 0;
                    grounded = true;
                    if (entity.passingThrough !== undefined) {
                        entity.passingThrough = false;
                    }
                } else if (collision.type === 'bottom') {
                    entity.y = collision.y;
                    entity.vy = 0;
                } else if (collision.type === 'left' || collision.type === 'right') {
                    entity.x = collision.x;
                    entity.vx = 0;
                }
            }
        }

        return grounded;
    },

    /**
     * Controlla collisione con bordi schermo
     */
    checkScreenBounds(entity, wrap = true) {
        // Wrap orizzontale
        if (wrap) {
            if (entity.x + entity.width < 0) {
                entity.x = CANVAS_WIDTH;
            } else if (entity.x > CANVAS_WIDTH) {
                entity.x = -entity.width;
            }
        } else {
            // Blocca ai bordi
            entity.x = clamp(entity.x, 0, CANVAS_WIDTH - entity.width);
        }

        // Limite superiore
        if (entity.y < 0) {
            entity.y = 0;
            if (entity.vy < 0) entity.vy = 0;
        }

        // Pavimento (bordo inferiore)
        if (entity.y + entity.height >= CANVAS_HEIGHT - 8) {
            entity.y = CANVAS_HEIGHT - 8 - entity.height;
            entity.vy = 0;
            return true; // grounded
        }

        return false;
    },

    /**
     * Controlla collisione AABB tra due entità
     */
    checkEntityCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
};
