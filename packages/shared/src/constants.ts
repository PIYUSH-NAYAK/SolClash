/**
 * Game Configuration Constants
 * Extracted from Java core module for TypeScript implementation
 */

export const GAME_CONFIG = {
    /** Frame rate for game simulation - 30 FPS */
    FPS: 30,
    /** Tick duration in milliseconds */
    TICK_MS: 33, // ~33ms per frame at 30 FPS
    /** Maximum elixir a player can have */
    ELIXIR_MAX: 10,
    /** Elixir regeneration rate (per second) */
    ELIXIR_REGEN_RATE: 1.4,
} as const;

export const GRID = {
    /** Number of columns in game grid */
    COLUMNS: 24,
    /** Number of rows in game grid */
    ROWS: 39,
    /** Left path X coordinate */
    LEFT_PATH_X: 6,
    /** Right path X coordinate */
    RIGHT_PATH_X: 17,
    /** Bridge crossing Y coordinate */
    BRIDGE_Y: 6,
} as const;

/**
 * Speed configuration for troop movement
 * Note: SLOW (15) actually moves MORE frequently than MEDIUM (20) in the original Java code.
 * This appears to be a naming inconsistency but is preserved for parity.
 */
export const SPEED_CONFIG = {
    FAST: {
        moveInterval: 10, // Every 10 frames
        movesPerSec: 3,
    },
    MEDIUM: {
        moveInterval: 20, // Every 20 frames
        movesPerSec: 1.5,
    },
    SLOW: {
        moveInterval: 15, // Every 15 frames (WARNING: faster than MEDIUM!)
        movesPerSec: 2,
    },
} as const;

/**
 * Mirror position for opponent (flip coordinates)
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns Mirrored position
 */
export function mirrorPosition(x: number, y: number): { x: number; y: number } {
    return {
        x: GRID.COLUMNS - 1 - x, // 23 - x
        y: GRID.ROWS - 1 - y,    // 38 - y
    };
}

/**
 * Check if position is on main path
 */
export function isOnMainPath(x: number, y: number): boolean {
    return x === GRID.LEFT_PATH_X || x === GRID.RIGHT_PATH_X || y === GRID.BRIDGE_Y;
}

/**
 * Check if troop should move this frame based on speed
 */
export function isTimeForMove(speed: 'FAST' | 'MEDIUM' | 'SLOW', frame: number): boolean {
    const interval = SPEED_CONFIG[speed].moveInterval;
    return frame % interval === 0;
}

/**
 * Card stats by type
 * Note: These are Level 1 stats extracted from Java code
 */
export const CARD_STATS = {
    ARCHER: {
        cost: 3,
        health: 125,
        damage: 33,
        hitSpeed: 1.2,
        range: 5,
        speed: 'MEDIUM' as const,
        type: 'GROUND' as const,
        targets: ['AIR', 'GROUND'] as const,
    },
    GIANT: {
        cost: 5,
        health: 2000,
        damage: 126,
        hitSpeed: 1.5,
        range: 1,
        speed: 'SLOW' as const,
        type: 'GROUND' as const,
        targets: ['BUILDINGS'] as const,
    },
    BARBARIAN: {
        cost: 5,
        health: 300,
        damage: 75,
        hitSpeed: 1.5,
        range: 1,
        speed: 'MEDIUM' as const,
        type: 'GROUND' as const,
        targets: ['GROUND'] as const,
    },
} as const;

/**
 * Spell stats
 */
export const SPELL_STATS = {
    FIREBALL: {
        cost: 4,
        damage: 325,
        radius: 2.5, // Grid units
        duration: 0, // Instant damage
        type: 'INSTANT' as const,
        targets: ['AIR', 'GROUND'] as const,
    },
    ARROWS: {
        cost: 3,
        damage: 115,
        radius: 4, // Grid units (larger area)
        duration: 0, // Instant damage
        type: 'INSTANT' as const,
        targets: ['AIR', 'GROUND'] as const,
    },
} as const;

/**
 * Tower stats
 */
export const TOWER_STATS = {
    KING: {
        health: 2400,
        damage: 50,
        range: 7,
        hitSpeed: 1.0,
    },
    QUEEN: {
        health: 1400,
        damage: 50,
        range: 8,
        hitSpeed: 0.8,
    },
} as const;
