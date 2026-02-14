/**
 * GameSimulation - Authoritative server-side game simulation
 * 
 * This class ports the Java `HandleXRunnable` logic into TypeScript.
 * It runs the game loop at 30 FPS and emits state updates to clients.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import {
    GAME_CONFIG,
    GRID,
    SPEED_CONFIG,
    CARD_STATS,
    SPELL_STATS,
    mirrorPosition,
    isOnMainPath,
    isTimeForMove,
    type Troop,
    type Tower,
    type Position,
    type Owner,
    type GameSnapshot,
    type GameEvent,
} from '@clash-royale/shared';
import { v4 as uuidv4 } from 'uuid';

interface GameState {
    entities: Map<string, Troop>;
    towers: Tower[];
    playerElixir: number;
    opponentElixir: number;
    tick: number;
    lastElixirTick: number;
}

@Injectable()
export class GameSimulation {
    private readonly logger = new Logger(GameSimulation.name);
    private state: GameState;
    private intervalId?: NodeJS.Timeout;
    private onUpdateCallback?: (snapshot: GameSnapshot) => void;
    private server?: Server;
    public matchId?: string;
    private startTime: number;

    constructor() {
        this.startTime = Date.now();
        this.state = this.createInitialState();
    }

    private createInitialState(): GameState {
        return {
            entities: new Map(),
            towers: this.createInitialTowers(),
            playerElixir: GAME_CONFIG.ELIXIR_MAX,
            opponentElixir: GAME_CONFIG.ELIXIR_MAX,
            tick: 0,
            lastElixirTick: 0,
        };
    }

    private createInitialTowers(): Tower[] {
        const towers: Tower[] = [];

        // Player towers
        towers.push(
            {
                id: uuidv4(),
                type: 'QUEEN',
                owner: 'player',
                position: { x: 3, y: 35 },
                health: 1400,
                maxHealth: 1400,
                damage: 50,
                range: 8,
                hitSpeed: 0.8,
            },
            {
                id: uuidv4(),
                type: 'QUEEN',
                owner: 'player',
                position: { x: 20, y: 35 },
                health: 1400,
                maxHealth: 1400,
                damage: 50,
                range: 8,
                hitSpeed: 0.8,
            },
            {
                id: uuidv4(),
                type: 'KING',
                owner: 'player',
                position: { x: 11, y: 38 },
                health: 2400,
                maxHealth: 2400,
                damage: 50,
                range: 7,
                hitSpeed: 1.0,
            },
        );

        // Opponent towers (mirrored positions)
        towers.push(
            {
                id: uuidv4(),
                type: 'QUEEN',
                owner: 'opponent',
                position: { x: 3, y: 3 },
                health: 1400,
                maxHealth: 1400,
                damage: 50,
                range: 8,
                hitSpeed: 0.8,
            },
            {
                id: uuidv4(),
                type: 'QUEEN',
                owner: 'opponent',
                position: { x: 20, y: 3 },
                health: 1400,
                maxHealth: 1400,
                damage: 50,
                range: 8,
                hitSpeed: 0.8,
            },
            {
                id: uuidv4(),
                type: 'KING',
                owner: 'opponent',
                position: { x: 11, y: 0 },
                health: 2400,
                maxHealth: 2400,
                damage: 50,
                range: 7,
                hitSpeed: 1.0,
            },
        );

        return towers;
    }

    /**
     * Start the game simulation loop
     */
    start(onUpdate: (snapshot: GameSnapshot) => void) {
        try {
            this.onUpdateCallback = onUpdate;
            this.logger.log('Starting game simulation at 30 FPS');

            // Emit initial state immediately
            this.emitGameUpdate([]);

            this.intervalId = setInterval(() => {
                try {
                    this.tick();
                } catch (error) {
                    this.logger.error(`Error in game tick: ${error}`);
                    this.logger.error(error.stack);
                }
            }, GAME_CONFIG.TICK_MS);

            this.logger.log('✅ Game simulation started successfully');
        } catch (error) {
            this.logger.error(`❌ Error starting game simulation: ${error}`);
            this.logger.error(error.stack);
            throw error;
        }
    }

    /**
     * Stop the game simulation
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
            this.logger.log('Game simulation stopped');
        }
    }

    /**
     * Main tick function - runs every ~33ms (30 FPS)
     */
    private tick() {
        this.state.tick++;
        const events: GameEvent[] = [];

        // 1. Handle movement (HandleTroopsRunnable)
        this.handleMovement(events);

        // 2. Handle combat (HandleTowersRunnable)
        this.handleCombat(events);

        // 3. Handle elixir regeneration
        this.handleElixir(events);

        // 4. Remove dead entities
        this.removeDeadEntities(events);

        // 5. Emit game update
        this.emitGameUpdate(events);

        // 6. Check victory conditions
        const { winner, reason } = this.checkVictory();
        if (winner) {
            this.logger.log(`🏆 Match ended! Winner: ${winner}, Reason: ${reason}`);
            this.stop();

            // Emit match result
            if (this.server) {
                this.server.emit('MATCH_ENDED', {
                    matchId: this.matchId,
                    winner,
                    reason,
                    duration: Math.floor((Date.now() - this.startTime) / 1000),
                });
            }
        }
    }

    /**
     * Handle troop movement (ports HandleTroopsRunnable.java)
     */
    private handleMovement(events: GameEvent[]) {
        for (const [id, troop] of this.state.entities) {
            // Skip if has target or not time to move
            if (troop.targetId || !isTimeForMove(troop.speed, this.state.tick)) {
                continue;
            }

            const newPos = this.calculateNextPosition(troop);
            if (newPos) {
                troop.position = newPos;
                troop.status = 'WALK';
            }
        }
    }

    /**
     * Calculate next position based on pathfinding algorithm
     */
    private calculateNextPosition(troop: Troop): Position | null {
        const { x, y } = troop.position;
        const isPlayer = troop.owner === 'player';

        // On main path
        if (isOnMainPath(x, y)) {
            // Bridge crossing
            if (y === GRID.BRIDGE_Y) {
                if (x >= 6 && x <= 11) return { x: x + 1, y };
                if (x >= 12 && x <= 17) return { x: x - 1, y };
            }
            // Move forward
            return { x, y: isPlayer ? y - 1 : y + 1 };
        }

        // Not on main path - move towards nearest path
        const distToLeft = Math.abs(x - GRID.LEFT_PATH_X);
        const distToRight = Math.abs(x - GRID.RIGHT_PATH_X);

        if (distToLeft < distToRight) {
            return { x: x < GRID.LEFT_PATH_X ? x + 1 : x - 1, y };
        } else {
            return { x: x < GRID.RIGHT_PATH_X ? x + 1 : x - 1, y };
        }
    }

    /**
     * Handle combat - targeting and attacks (ports HandleTowersRunnable.java)
     */
    private handleCombat(events: GameEvent[]) {
        // Troops find targets and attack
        for (const [id, troop] of this.state.entities) {
            // Find target if don't have one
            if (!troop.targetId) {
                const target = this.findNearestTarget(troop);
                if (target) {
                    troop.targetId = target.id;
                    troop.status = 'FIGHT';
                    events.push({
                        type: 'target',
                        tick: this.state.tick,
                        payload: { entityId: id, targetId: target.id },
                    });
                }
            }

            // Attack target if has one
            if (troop.targetId) {
                const hitIntervalTicks = Math.round(troop.hitSpeed * GAME_CONFIG.FPS);
                if (this.state.tick % hitIntervalTicks === 0) {
                    this.dealDamage(troop.id, troop.targetId, troop.damage, events);
                }
            }
        }

        // Towers attack
        for (const tower of this.state.towers) {
            if (!tower.targetId) {
                const target = this.findNearestTowerTarget(tower);
                if (target) {
                    tower.targetId = target.id;
                }
            }

            if (tower.targetId) {
                const hitIntervalTicks = Math.round(tower.hitSpeed * GAME_CONFIG.FPS);
                if (this.state.tick % hitIntervalTicks === 0) {
                    this.dealDamage(tower.id, tower.targetId, tower.damage, events);
                }
            }
        }
    }

    /**
     * Find nearest valid target for a troop
     */
    private findNearestTarget(troop: Troop): Troop | Tower | null {
        let nearest: Troop | Tower | null = null;
        let minDist = Infinity;

        // Check troops
        for (const [id, other] of this.state.entities) {
            if (other.owner === troop.owner) continue; // No friendly fire

            const dist = this.getDistance(troop.position, other.position);
            if (dist <= troop.range && dist < minDist) {
                nearest = other;
                minDist = dist;
            }
        }

        // Check towers
        for (const tower of this.state.towers) {
            if (tower.owner === troop.owner) continue;

            const dist = this.getDistance(troop.position, tower.position);
            if (dist <= troop.range && dist < minDist) {
                nearest = tower;
                minDist = dist;
            }
        }

        return nearest;
    }

    /**
     * Find nearest target for a tower
     */
    private findNearestTowerTarget(tower: Tower): Troop | null {
        let nearest: Troop | null = null;
        let minDist = Infinity;

        for (const [id, troop] of this.state.entities) {
            if (troop.owner === tower.owner) continue;

            const dist = this.getDistance(tower.position, troop.position);
            if (dist <= tower.range && dist < minDist) {
                nearest = troop;
                minDist = dist;
            }
        }

        return nearest;
    }

    /**
     * Deal damage to a target
     */
    private dealDamage(attackerId: string, targetId: string, damage: number, events: GameEvent[]) {
        // Check if target is troop
        const troop = this.state.entities.get(targetId);
        if (troop) {
            troop.health -= damage;
            events.push({
                type: 'damage',
                tick: this.state.tick,
                payload: { entityId: targetId, damage },
            });

            if (troop.health <= 0) {
                events.push({
                    type: 'die',
                    tick: this.state.tick,
                    payload: { entityId: targetId },
                });
            }
            return;
        }

        // Check if target is tower
        const tower = this.state.towers.find((t) => t.id === targetId);
        if (tower) {
            tower.health -= damage;
            events.push({
                type: 'damage',
                tick: this.state.tick,
                payload: { entityId: targetId, damage },
            });

            if (tower.health <= 0) {
                events.push({
                    type: 'die',
                    tick: this.state.tick,
                    payload: { entityId: targetId },
                });
            }
        }
    }

    /**
     * Handle elixir regeneration
     */
    private handleElixir(events: GameEvent[]) {
        const ticksSinceLastElixir = this.state.tick - this.state.lastElixirTick;
        const elixirPerTick = GAME_CONFIG.ELIXIR_REGEN_RATE / GAME_CONFIG.FPS;

        // Regenerate every ~21 ticks (0.7 seconds at 30 FPS)
        if (ticksSinceLastElixir >= 21) {
            if (this.state.playerElixir < GAME_CONFIG.ELIXIR_MAX) {
                this.state.playerElixir = Math.min(
                    this.state.playerElixir + 1,
                    GAME_CONFIG.ELIXIR_MAX,
                );
                events.push({
                    type: 'elixir',
                    tick: this.state.tick,
                    payload: { owner: 'player' },
                });
            }

            if (this.state.opponentElixir < GAME_CONFIG.ELIXIR_MAX) {
                this.state.opponentElixir = Math.min(
                    this.state.opponentElixir + 1,
                    GAME_CONFIG.ELIXIR_MAX,
                );
                events.push({
                    type: 'elixir',
                    tick: this.state.tick,
                    payload: { owner: 'opponent' },
                });
            }

            this.state.lastElixirTick = this.state.tick;
        }
    }

    /**
     * Remove dead entities
     */
    private removeDeadEntities(events: GameEvent[]) {
        for (const [id, entity] of this.state.entities) {
            if (entity.health <= 0) {
                this.state.entities.delete(id);

                // Clear references to this entity
                for (const [otherId, other] of this.state.entities) {
                    if (other.targetId === id) {
                        other.targetId = undefined;
                        other.status = 'WALK';
                    }
                }
            }
        }
    }

    /**
     * Emit game update to clients
     */
    private emitGameUpdate(events: GameEvent[]) {
        if (!this.onUpdateCallback) return;

        try {
            const snapshot: GameSnapshot = {
                tick: this.state.tick,
                timestamp: Date.now(),
                entities: Array.from(this.state.entities.values()).map((e) => ({
                    id: e.id,
                    type: e.type,
                    pos: e.position,
                    hp: e.health,
                    maxHp: e.maxHealth,
                    status: e.status,
                    owner: e.owner,
                    targetId: e.targetId,
                })),
                towers: this.state.towers,
                players: {
                    player: { elixir: this.state.playerElixir },
                    opponent: { elixir: this.state.opponentElixir },
                },
                events,
            };

            this.onUpdateCallback(snapshot);
        } catch (error) {
            this.logger.error(`Error in emitGameUpdate callback: ${error}`);
            // Don't rethrow - we don't want callback errors to crash the simulation
        }
    }

    /**
     * Place a card (spawn troop)
     */
    placeCard(cardType: string, owner: Owner, position: Position): string | null {
        const stats = CARD_STATS[cardType as keyof typeof CARD_STATS];
        if (!stats) {
            this.logger.warn(`Unknown card type: ${cardType}`);
            return null;
        }

        // Check elixir
        const elixir = owner === 'player' ? this.state.playerElixir : this.state.opponentElixir;
        if (elixir < stats.cost) {
            this.logger.warn(`Not enough elixir: ${elixir} < ${stats.cost}`);
            return null;
        }

        // Deduct elixir
        if (owner === 'player') {
            this.state.playerElixir -= stats.cost;
        } else {
            this.state.opponentElixir -= stats.cost;
        }

        // Mirror position for opponent
        const finalPos = owner === 'opponent'
            ? mirrorPosition(position.x, position.y)
            : position;

        // Create troop
        const id = uuidv4();
        const troop: Troop = {
            id,
            type: cardType,
            cost: stats.cost,
            position: finalPos,
            owner,
            health: stats.health,
            maxHealth: stats.health,
            status: 'WALK',
            speed: stats.speed,
            range: stats.range,
            damage: stats.damage,
            hitSpeed: stats.hitSpeed,
            entityType: stats.type,
            targets: stats.targets,
        };

        this.state.entities.set(id, troop);
        this.logger.log(`Spawned ${cardType} for ${owner} at (${finalPos.x}, ${finalPos.y})`);

        return id;
    }

    /**
     * Get Euclidean distance between two positions
     */
    private getDistance(a: Position, b: Position): number {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    /**
     * Get current game state (for debugging/testing)
     */
    getState(): GameState {
        return this.state;
    }

    setServer(server: Server) {
        this.server = server;
    }

    /**
     * Cast a spell at target position
     */
    castSpell(cardType: string, owner: Owner, position: Position): void {
        const spellStats = SPELL_STATS[cardType as keyof typeof SPELL_STATS];
        if (!spellStats) {
            throw new Error(`Unknown spell: ${cardType}`);
        }

        // Check elixir
        const elixir = owner === 'player' ? this.state.playerElixir : this.state.opponentElixir;
        if (elixir < spellStats.cost) {
            this.logger.warn(`Not enough elixir for spell: ${elixir} < ${spellStats.cost}`);
            return;
        }

        // Deduct elixir
        if (owner === 'player') {
            this.state.playerElixir -= spellStats.cost;
        } else {
            this.state.opponentElixir -= spellStats.cost;
        }

        // Damage all entities within radius
        this.state.entities.forEach((entity) => {
            const dist = this.getDistance(entity.position, position);
            if (dist <= spellStats.radius) {
                entity.health = Math.max(0, entity.health - spellStats.damage);
            }
        });

        // Damage towers within radius
        this.state.towers.forEach((tower) => {
            const dist = this.getDistance(tower.position, position);
            if (dist <= spellStats.radius) {
                tower.health = Math.max(0, tower.health - spellStats.damage);
            }
        });

        this.logger.log(`Spell ${cardType} cast at (${position.x}, ${position.y})`);
    }

    /**
     * Check victory conditions
     */
    private checkVictory(): { winner: Owner | null; reason: string } {
        const playerKing = this.state.towers.find(t => t.type === 'KING' && t.owner === 'player');
        const opponentKing = this.state.towers.find(t => t.type === 'KING' && t.owner === 'opponent');

        if (!playerKing || playerKing.health <= 0) {
            return { winner: 'opponent', reason: 'King Tower destroyed' };
        }

        if (!opponentKing || opponentKing.health <= 0) {
            return { winner: 'player', reason: 'King Tower destroyed' };
        }

        return { winner: null, reason: '' };
    }
}
