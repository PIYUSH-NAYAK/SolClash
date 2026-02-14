/**
 * Zustand store for global game state
 */

import { create } from 'zustand';
import type { EntitySnapshot, Tower } from '@clash-royale/shared';

interface GameState {
    // Game state
    gameStarted: boolean;
    matchId: string | null;
    tick: number;
    entities: Map<string, EntitySnapshot>;
    towers: Tower[];
    playerElixir: number;
    opponentElixir: number;

    // Actions
    setGameStarted: (started: boolean) => void;
    setMatchId: (matchId: string) => void;
    updateGameState: (snapshot: {
        tick: number;
        entities: EntitySnapshot[];
        towers: Tower[];
        players: { player: { elixir: number }; opponent: { elixir: number } };
    }) => void;
    reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    gameStarted: false,
    matchId: null,
    tick: 0,
    entities: new Map(),
    towers: [],
    playerElixir: 10,
    opponentElixir: 10,

    setGameStarted: (started) => set({ gameStarted: started }),
    setMatchId: (matchId) => set({ matchId, gameStarted: true }),

    updateGameState: (snapshot) =>
        set({
            tick: snapshot.tick,
            entities: new Map(snapshot.entities.map((e) => [e.id, e])),
            towers: snapshot.towers,
            playerElixir: snapshot.players.player.elixir,
            opponentElixir: snapshot.players.opponent.elixir,
        }),

    reset: () =>
        set({
            gameStarted: false,
            matchId: null,
            tick: 0,
            entities: new Map(),
            towers: [],
            playerElixir: 10,
            opponentElixir: 10,
        }),
}));
