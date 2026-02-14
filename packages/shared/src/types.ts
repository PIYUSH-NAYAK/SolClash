/**
 * Core type definitions for Clash Royale game
 */

export interface Position {
    x: number;
    y: number;
}

export type Owner = 'player' | 'opponent';

export type TroopStatus = 'WALK' | 'FIGHT' | 'IDLE';

export type Speed = 'FAST' | 'MEDIUM' | 'SLOW';

export type EntityType = 'GROUND' | 'AIR' | 'BUILDING';

export type TargetType = 'AIR' | 'GROUND' | 'BUILDINGS';

/**
 * Base card interface
 */
export interface CardBase {
    id: string;
    cost: number;
    position: Position;
    owner: Owner;
}

/**
 * Troop entity
 */
export interface Troop extends CardBase {
    type: string; // Card type name (e.g., 'ARCHER', 'GIANT')
    health: number;
    maxHealth: number;
    status: TroopStatus;
    speed: Speed;
    range: number;
    damage: number;
    hitSpeed: number; // In seconds
    targetId?: string; // ID of current target
    entityType: EntityType;
    targets: readonly TargetType[];
}

/**
 * Building entity
 */
export interface Building extends CardBase {
    type: string;
    health: number;
    maxHealth: number;
}

/**
 * Tower entity
 */
export interface Tower {
    id: string;
    type: 'KING' | 'QUEEN';
    owner: Owner;
    position: Position;
    health: number;
    maxHealth: number;
    damage: number;
    range: number;
    hitSpeed: number;
    targetId?: string;
}

/**
 * Spell effect
 */
export interface Spell extends CardBase {
    type: string;
    radius: number;
    duration: number; // In seconds
    damage?: number;
}

/**
 * Player state
 */
export interface PlayerState {
    id: string;
    username: string;
    elixir: number;
    deck: string[]; // Array of card type names
    towers: Tower[];
    level: number;
}

/**
 * Game event
 */
export interface GameEvent {
    type: 'damage' | 'spawn' | 'die' | 'elixir' | 'target';
    tick: number;
    payload: {
        entityId?: string;
        targetId?: string;
        damage?: number;
        position?: Position;
        cardType?: string;
        owner?: Owner;
    };
}

/**
 * Entity snapshot for network transmission
 */
export interface EntitySnapshot {
    id: string;
    type: string;
    pos: Position;
    hp: number;
    maxHp: number;
    status: TroopStatus;
    owner: Owner;
    targetId?: string;
}

/**
 * Complete game state snapshot
 */
export interface GameSnapshot {
    tick: number;
    timestamp: number;
    entities: EntitySnapshot[];
    towers: Tower[];
    players: {
        player: { elixir: number };
        opponent: { elixir: number };
    };
    events: GameEvent[];
}

/**
 * Match state
 */
export interface MatchState {
    id: string;
    player1Id: string;
    player2Id: string;
    startTime: number;
    endTime?: number;
    winnerId?: string;
    currentTick: number;
}
