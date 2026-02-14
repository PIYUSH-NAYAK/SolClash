import { Injectable, Logger } from '@nestjs/common';
import { GameSimulation } from './game.simulation';
import type { GameSnapshot, Owner, Position } from '@clash-royale/shared';

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    private simulations = new Map<string, GameSimulation>();

    /**
     * Create a new game simulation
     */
    createGame(matchId: string, onUpdate: (snapshot: GameSnapshot) => void): GameSimulation {
        const simulation = new GameSimulation();
        simulation.matchId = matchId;
        simulation.start(onUpdate);
        this.simulations.set(matchId, simulation);
        this.logger.log(`Created game simulation for match ${matchId}`);
        return simulation;
    }

    /**
     * Get a game simulation
     */
    getGame(matchId: string): GameSimulation | undefined {
        return this.simulations.get(matchId);
    }

    /**
     * Stop a game simulation
     */
    stopGame(matchId: string): void {
        const simulation = this.simulations.get(matchId);
        if (simulation) {
            simulation.stop();
            this.simulations.delete(matchId);
            this.logger.log(`Stopped game simulation for match ${matchId}`);
        }
    }

    /**
     * Place a card in a game
     */
    placeCard(
        matchId: string,
        cardType: string,
        owner: Owner,
        position: Position,
    ): string | null {
        const simulation = this.simulations.get(matchId);
        if (!simulation) {
            this.logger.warn(`No simulation found for match ${matchId}`);
            return null;
        }

        return simulation.placeCard(cardType, owner, position);
    }
}
