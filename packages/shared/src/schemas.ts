/**
 * Zod schemas for runtime validation of network messages and game state
 */
import { z } from 'zod';

// Position schema
export const PositionSchema = z.object({
    x: z.number().int().min(0).max(23),
    y: z.number().int().min(0).max(38),
});

// Owner schema
export const OwnerSchema = z.enum(['player', 'opponent']);

// Status schema
export const TroopStatusSchema = z.enum(['WALK', 'FIGHT', 'IDLE']);

// Speed schema
export const SpeedSchema = z.enum(['FAST', 'MEDIUM', 'SLOW']);

// Entity type schemas
export const EntityTypeSchema = z.enum(['GROUND', 'AIR', 'BUILDING']);
export const TargetTypeSchema = z.enum(['AIR', 'GROUND', 'BUILDINGS']);

/**
 * Client -> Server: Place card command
 */
export const PlaceCardSchema = z.object({
    cardType: z.string(),
    owner: OwnerSchema,
    position: PositionSchema,
    clientTick: z.number().int(),
    idempotencyId: z.string().uuid(),
});

export type PlaceCardMessage = z.infer<typeof PlaceCardSchema>;

/**
 * Client -> Server: Start match
 */
export const StartMatchSchema = z.object({
    opponentId: z.string().optional(),
    deckId: z.string().uuid(),
});

export type StartMatchMessage = z.infer<typeof StartMatchSchema>;

/**
 * Client -> Server: Ping
 */
export const PingSchema = z.object({
    clientTime: z.number(),
});

export type PingMessage = z.infer<typeof PingSchema>;

/**
 * Server -> Client: Game event
 */
export const GameEventSchema = z.object({
    type: z.enum(['damage', 'spawn', 'die', 'elixir', 'target']),
    tick: z.number().int(),
    payload: z.object({
        entityId: z.string().optional(),
        targetId: z.string().optional(),
        damage: z.number().optional(),
        position: PositionSchema.optional(),
        cardType: z.string().optional(),
        owner: OwnerSchema.optional(),
    }),
});

// GameEvent type is exported from types.ts

/**
 * Server -> Client: Entity snapshot
 */
export const EntitySnapshotSchema = z.object({
    id: z.string(),
    type: z.string(),
    pos: PositionSchema,
    hp: z.number(),
    maxHp: z.number(),
    status: TroopStatusSchema,
    owner: OwnerSchema,
    targetId: z.string().optional(),
});

// EntitySnapshot type is exported from types.ts

/**
 * Server -> Client: Tower snapshot
 */
export const TowerSnapshotSchema = z.object({
    id: z.string(),
    type: z.enum(['KING', 'QUEEN']),
    owner: OwnerSchema,
    position: PositionSchema,
    health: z.number(),
    maxHealth: z.number(),
    damage: z.number(),
    range: z.number(),
    hitSpeed: z.number(),
    targetId: z.string().optional(),
});

export type TowerSnapshot = z.infer<typeof TowerSnapshotSchema>;

/**
 * Server -> Client: Game update (state snapshot)
 */
export const GameUpdateSchema = z.object({
    tick: z.number().int(),
    timestamp: z.number(),
    entities: z.array(EntitySnapshotSchema),
    towers: z.array(TowerSnapshotSchema),
    players: z.object({
        player: z.object({ elixir: z.number() }),
        opponent: z.object({ elixir: z.number() }),
    }),
    events: z.array(GameEventSchema),
});

export type GameUpdateMessage = z.infer<typeof GameUpdateSchema>;

/**
 * Server -> Client: Sync correction
 */
export const SyncSchema = z.object({
    authoritativeTick: z.number().int(),
    corrections: z.array(
        z.object({
            entityId: z.string(),
            correctPosition: PositionSchema,
            correctHealth: z.number(),
        }),
    ),
});

export type SyncMessage = z.infer<typeof SyncSchema>;

/**
 * Server -> Client: Match result
 */
export const MatchResultSchema = z.object({
    matchId: z.string(),
    winnerId: z.string(),
    loserId: z.string(),
    duration: z.number(),
    finalScore: z.object({
        winner: z.number(),
        loser: z.number(),
    }),
});

export type MatchResultMessage = z.infer<typeof MatchResultSchema>;
