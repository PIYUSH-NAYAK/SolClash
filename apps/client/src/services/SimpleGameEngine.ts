/**
 * Simple client-side game engine for offline Clash Royale
 * Supports troops, spells, tower combat, and victory detection
 */

export interface Tower {
    id: string;
    type: 'KING' | 'QUEEN';
    owner: 'player' | 'opponent';
    position: { x: number; y: number };
    health: number;
    maxHealth: number;
    damage: number;
    range: number;
    attackSpeed: number;
    lastAttackTick?: number;
}

export interface Troop {
    id: string;
    type: string;
    owner: 'player' | 'opponent';
    position: { x: number; y: number };
    health: number;
    maxHealth: number;
    speed: number;
    damage: number;
    range: number;
}

export interface Spell {
    id: string;
    type: string;
    position: { x: number; y: number };
    damage: number;
    radius: number;
    timestamp: number;
}

export interface GameState {
    towers: Tower[];
    troops: Troop[];
    spells: Spell[];
    elixir: number;
    tick: number;
    gameOver: boolean;
    winner?: 'player' | 'opponent';
}

export class SimpleGameEngine {
    private towers: Tower[] = [];
    private troops: Troop[] = [];
    private spells: Spell[] = [];
    private tick = 0;
    private elixir = 5;
    private gameOver = false;
    private winner?: 'player' | 'opponent';
    private gameInterval?: NodeJS.Timeout;
    private onUpdateCallback?: (state: GameState) => void;
    private onGameOverCallback?: (winner: 'player' | 'opponent') => void;

    constructor() {
        this.initializeTowers();
    }

    private initializeTowers() {
        // Player towers (blue, bottom) - damage: 50/sec, range: 120
        this.towers.push({
            id: 'player-king',
            type: 'KING',
            owner: 'player',
            position: { x: 240, y: 750 },
            health: 2400,
            maxHealth: 2400,
            damage: 50,
            range: 120,
            attackSpeed: 1, // 1 attack per second
        });
        this.towers.push({
            id: 'player-queen-left',
            type: 'QUEEN',
            owner: 'player',
            position: { x: 120, y: 650 },
            health: 1600,
            maxHealth: 1600,
            damage: 50,
            range: 120,
            attackSpeed: 1,
        });
        this.towers.push({
            id: 'player-queen-right',
            type: 'QUEEN',
            owner: 'player',
            position: { x: 360, y: 650 },
            health: 1600,
            maxHealth: 1600,
            damage: 50,
            range: 120,
            attackSpeed: 1,
        });

        // Opponent towers (red, top)
        this.towers.push({
            id: 'opponent-king',
            type: 'KING',
            owner: 'opponent',
            position: { x: 240, y: 100 },
            health: 2400,
            maxHealth: 2400,
            damage: 50,
            range: 120,
            attackSpeed: 1,
        });
        this.towers.push({
            id: 'opponent-queen-left',
            type: 'QUEEN',
            owner: 'opponent',
            position: { x: 120, y: 200 },
            health: 1600,
            maxHealth: 1600,
            damage: 50,
            range: 120,
            attackSpeed: 1,
        });
        this.towers.push({
            id: 'opponent-queen-right',
            type: 'QUEEN',
            owner: 'opponent',
            position: { x: 360, y: 200 },
            health: 1600,
            maxHealth: 1600,
            damage: 50,
            range: 120,
            attackSpeed: 1,
        });
    }

    start(onUpdate: (state: GameState) => void, onGameOver?: (winner: 'player' | 'opponent') => void) {
        this.onUpdateCallback = onUpdate;
        this.onGameOverCallback = onGameOver;

        // Run game loop at 30 FPS
        this.gameInterval = setInterval(() => {
            if (!this.gameOver) {
                this.update();
                this.emitUpdate();
            }
        }, 1000 / 30);
    }

    stop() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
        }
    }

    deployTroop(type: string, position: { x: number; y: number }) {
        const troopStats = this.getTroopStats(type);

        this.troops.push({
            id: `troop-${Date.now()}-${Math.random()}`,
            type,
            owner: 'player',
            position: { ...position },
            health: troopStats.health,
            maxHealth: troopStats.health,
            speed: troopStats.speed,
            damage: troopStats.damage,
            range: troopStats.range,
        });
    }

    deploySpell(type: string, position: { x: number; y: number }) {
        const spellStats = this.getSpellStats(type);

        const spell: Spell = {
            id: `spell-${Date.now()}-${Math.random()}`,
            type,
            position: { ...position },
            damage: spellStats.damage,
            radius: spellStats.radius,
            timestamp: this.tick,
        };

        // Apply instant area damage
        this.applyAreaDamage(spell);

        // Add spell for visual effect (will be removed after 1 second)
        this.spells.push(spell);
        setTimeout(() => {
            this.spells = this.spells.filter(s => s.id !== spell.id);
        }, 1000);
    }

    private applyAreaDamage(spell: Spell) {
        // Damage all troops in radius
        this.troops.forEach(troop => {
            const distance = this.distance(troop.position, spell.position);
            if (distance <= spell.radius) {
                troop.health -= spell.damage;
            }
        });

        // Damage all towers in radius
        this.towers.forEach(tower => {
            const distance = this.distance(tower.position, spell.position);
            if (distance <= spell.radius) {
                tower.health -= spell.damage;
            }
        });
    }

    private getTroopStats(type: string) {
        const stats: Record<string, any> = {
            KNIGHT: { health: 600, speed: 1, damage: 75, range: 50 },
            ARCHER: { health: 200, speed: 0.8, damage: 40, range: 150 },
            GIANT: { health: 2000, speed: 0.5, damage: 100, range: 50 },
            WIZARD: { health: 340, speed: 0.7, damage: 130, range: 150 },
            BARBARIAN: { health: 300, speed: 1, damage: 75, range: 50 },
        };
        return stats[type] || stats.KNIGHT;
    }

    private getSpellStats(type: string) {
        const stats: Record<string, any> = {
            FIREBALL: { damage: 325, radius: 100 },
            ARROWS: { damage: 115, radius: 150 },
        };
        return stats[type] || stats.FIREBALL;
    }

    private update() {
        this.tick++;

        // Generate elixir every 2 seconds
        if (this.tick % 60 === 0 && this.elixir < 10) {
            this.elixir++;
        }

        // Update troops
        this.troops.forEach(troop => {
            this.updateTroop(troop);
        });

        // Update towers (attack nearby troops)
        this.towers.forEach(tower => {
            this.updateTower(tower);
        });

        // Remove dead troops
        this.troops = this.troops.filter(t => t.health > 0);

        // Remove destroyed towers
        this.towers = this.towers.filter(t => t.health > 0);

        // Check victory condition
        this.checkVictory();
    }

    private updateTower(tower: Tower) {
        // Find nearest enemy troop
        const enemyTroops = this.troops.filter(t => t.owner !== tower.owner && t.health > 0);

        if (enemyTroops.length === 0) return;

        // Find closest troop within range
        let closestTroop: Troop | null = null;
        let closestDist = Infinity;

        for (const troop of enemyTroops) {
            const dist = this.distance(tower.position, troop.position);
            if (dist <= tower.range && dist < closestDist) {
                closestDist = dist;
                closestTroop = troop;
            }
        }

        // Attack if troop in range
        if (closestTroop) {
            // Check if enough time has passed since last attack
            const ticksSinceLastAttack = tower.lastAttackTick ? this.tick - tower.lastAttackTick : Infinity;
            const ticksPerAttack = 30 / tower.attackSpeed; // 30 FPS

            if (ticksSinceLastAttack >= ticksPerAttack) {
                closestTroop.health -= tower.damage;
                tower.lastAttackTick = this.tick;
            }
        }
    }

    private updateTroop(troop: Troop) {
        // Find nearest enemy tower
        const enemyTowers = this.towers.filter(t => t.owner !== troop.owner && t.health > 0);

        if (enemyTowers.length === 0) return;

        // Find closest tower
        let closestTower = enemyTowers[0];
        let closestDist = this.distance(troop.position, closestTower.position);

        for (const tower of enemyTowers) {
            const dist = this.distance(troop.position, tower.position);
            if (dist < closestDist) {
                closestDist = dist;
                closestTower = tower;
            }
        }

        // If in range, attack
        if (closestDist <= troop.range) {
            // Attack tower
            closestTower.health -= troop.damage / 30; // Damage per frame
        } else {
            // Move toward tower
            const dx = closestTower.position.x - troop.position.x;
            const dy = closestTower.position.y - troop.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            troop.position.x += (dx / dist) * troop.speed;
            troop.position.y += (dy / dist) * troop.speed;
        }
    }

    private checkVictory() {
        // Check if player's king tower is destroyed
        const playerKing = this.towers.find(t => t.id === 'player-king');
        if (!playerKing || playerKing.health <= 0) {
            this.gameOver = true;
            this.winner = 'opponent';
            if (this.onGameOverCallback) {
                this.onGameOverCallback('opponent');
            }
            return;
        }

        // Check if opponent's king tower is destroyed
        const opponentKing = this.towers.find(t => t.id === 'opponent-king');
        if (!opponentKing || opponentKing.health <= 0) {
            this.gameOver = true;
            this.winner = 'player';
            if (this.onGameOverCallback) {
                this.onGameOverCallback('player');
            }
            return;
        }
    }

    private distance(a: { x: number; y: number }, b: { x: number; y: number }) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private emitUpdate() {
        if (this.onUpdateCallback) {
            this.onUpdateCallback({
                tick: this.tick,
                elixir: this.elixir,
                towers: [...this.towers],
                troops: [...this.troops],
                spells: [...this.spells],
                gameOver: this.gameOver,
                winner: this.winner,
            });
        }
    }

    getState(): GameState {
        return {
            tick: this.tick,
            elixir: this.elixir,
            towers: [...this.towers],
            troops: [...this.troops],
            spells: [...this.spells],
            gameOver: this.gameOver,
            winner: this.winner,
        };
    }
}
