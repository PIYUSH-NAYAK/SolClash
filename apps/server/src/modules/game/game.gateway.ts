/**
 * GameGateway - WebSocket gateway for real-time game communication
 */

import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { GameSimulation } from './game.simulation';
import {
    PlaceCardSchema,
    StartMatchSchema,
    type PlaceCardMessage,
    type StartMatchMessage,
    type GameSnapshot,
} from '@clash-royale/shared';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(GameGateway.name);
    private clientToMatch = new Map<string, string>(); // socketId -> matchId

    constructor(private readonly gameService: GameService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        const matchId = this.clientToMatch.get(client.id);
        if (matchId) {
            // Don't immediately stop the game - give client time to reconnect
            this.logger.log(`Client ${client.id} disconnected from match ${matchId} - keeping game alive for reconnection`);
            // Only remove from map, don't stop simulation yet
            this.clientToMatch.delete(client.id);
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    /**
     * Start a new match
     */
    @SubscribeMessage('START_MATCH')
    handleStartMatch(
        @MessageBody() data: unknown,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Validate input
            const parseResult = StartMatchSchema.safeParse(data);
            if (!parseResult.success) {
                this.logger.warn(`Invalid START_MATCH data: ${parseResult.error}`);
                client.emit('ERROR', { message: 'Invalid match data' });
                return;
            }

            const matchData = parseResult.data;

            // Check if client already has an active match
            let matchId = this.clientToMatch.get(client.id);
            let simulation: GameSimulation;

            if (matchId) {
                // Rejoin existing match
                const existingSimulation = this.gameService.getGame(matchId);
                if (existingSimulation) {
                    this.logger.log(`Client ${client.id} rejoining existing match ${matchId}`);
                    simulation = existingSimulation;
                    client.emit('MATCH_STARTED', { matchId });
                    return;
                }
            }

            // Create new match
            matchId = uuidv4();
            this.clientToMatch.set(client.id, matchId);

            this.logger.log(`Creating match ${matchId} for client ${client.id}`);

            // Create game simulation with error-safe callback
            simulation = this.gameService.createGame(matchId, (snapshot: GameSnapshot) => {
                try {
                    // Only emit if client is still connected
                    if (client.connected) {
                        client.emit('GAME_UPDATE', snapshot);
                    }
                } catch (error) {
                    this.logger.error(`Error emitting game update: ${error}`);
                }
            });

            simulation.setServer(this.server);

            this.logger.log(`✅ Match ${matchId} started successfully for client ${client.id}`);
            client.emit('MATCH_STARTED', { matchId });

        } catch (error) {
            this.logger.error(`❌ Error starting match: ${error}`);
            this.logger.error(error.stack);
            client.emit('ERROR', { message: 'Failed to start match' });
        }
    }

    /**
     * Place a card
     */
    @SubscribeMessage('PLACE_CARD')
    handlePlaceCard(
        @MessageBody() data: unknown,
        @ConnectedSocket() client: Socket,
    ) {
        // Validate input
        const parseResult = PlaceCardSchema.safeParse(data);
        if (!parseResult.success) {
            this.logger.warn(`Invalid PLACE_CARD data: ${parseResult.error}`);
            client.emit('ERROR', { message: 'Invalid card placement data' });
            return;
        }

        const cardData = parseResult.data;
        const matchId = this.clientToMatch.get(client.id);

        if (!matchId) {
            this.logger.warn(`No active match for client ${client.id}`);
            client.emit('ERROR', { message: 'No active match' });
            return;
        }

        // Place card in simulation
        const entityId = this.gameService.placeCard(
            matchId,
            cardData.cardType,
            cardData.owner,
            cardData.position,
        );

        if (entityId) {
            this.logger.log(
                `Placed ${cardData.cardType} for ${cardData.owner} in match ${matchId}`,
            );
            client.emit('CARD_PLACED', {
                idempotencyId: cardData.idempotencyId,
                entityId,
            });
        } else {
            client.emit('ERROR', { message: 'Failed to place card' });
        }
    }

    /**
     * Handle ping for latency measurement
     */
    @SubscribeMessage('PING')
    handlePing(@MessageBody() data: { clientTime: number }, @ConnectedSocket() client: Socket) {
        client.emit('PONG', {
            clientTime: data.clientTime,
            serverTime: Date.now(),
        });
    }

    /**
     * Request game state sync
     */
    @SubscribeMessage('SYNC_REQUEST')
    handleSyncRequest(@ConnectedSocket() client: Socket) {
        const matchId = this.clientToMatch.get(client.id);
        if (!matchId) {
            client.emit('ERROR', { message: 'No active match' });
            return;
        }

        const simulation = this.gameService.getGame(matchId);
        if (simulation) {
            const state = simulation.getState();
            client.emit('SYNC', {
                authoritativeTick: state.tick,
                corrections: [], // TODO: Implement correction logic if needed
            });
        }
    }
}
