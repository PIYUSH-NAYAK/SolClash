/**
 * useSocket hook - Manages Socket.IO connection and game events
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/stores/gameStore';
import type { GameUpdateMessage, Position } from '@clash-royale/shared';
import { v4 as uuidv4 } from 'uuid';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const { setMatchId, updateGameState } = useGameStore();
    const isInitialized = useRef(false);

    useEffect(() => {
        // Prevent double initialization in React Strict Mode
        if (isInitialized.current) return;
        isInitialized.current = true;

        console.log('🔌 Initializing Socket.IO connection...');

        // Create socket connection ONCE
        const socket = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });

        socketRef.current = socket;

        // Connection handlers
        socket.on('connect', () => {
            console.log('✅ Connected to game server');
            setConnected(true);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from game server. Reason:', reason);
            setConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
        });

        // Game event handlers
        socket.on('MATCH_STARTED', (data: { matchId: string }) => {
            console.log('🎮 Match started:', data.matchId);
            setMatchId(data.matchId);
        });

        socket.on('GAME_UPDATE', (data: GameUpdateMessage) => {
            console.log('📦 GAME_UPDATE received. Tick:', data.tick, 'Towers:', data.towers.length, 'Entities:', data.entities.length);
            updateGameState(data);
        });

        socket.on('CARD_PLACED', (data: { idempotencyId: string; entityId: string }) => {
            console.log('🃏 Card placed:', data);
        });

        socket.on('ERROR', (data: { message: string }) => {
            console.error('⚠️ Server error:', data.message);
        });

        socket.on('PONG', (data: { clientTime: number; serverTime: number }) => {
            const latency = Date.now() - data.clientTime;
            console.log(`📡 Latency: ${latency}ms`);
        });

        // Cleanup on unmount
        return () => {
            console.log('🔌 Cleaning up socket connection');
            socket.disconnect();
            socketRef.current = null;
            isInitialized.current = false;
        };
    }, []); // Empty dependency array - only create socket once!

    const startMatch = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('START_MATCH', {
                deckId: uuidv4(), // TODO: Use actual deck selection
            });
        }
    }, []);

    const placeCard = useCallback((cardType: string, position: Position) => {
        if (socketRef.current) {
            socketRef.current.emit('PLACE_CARD', {
                cardType,
                owner: 'player',
                position,
                clientTick: Date.now(),
                idempotencyId: uuidv4(),
            });
        }
    }, []);

    const ping = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('PING', { clientTime: Date.now() });
        }
    }, []);

    return {
        startMatch,
        placeCard,
        ping,
        connected,
    };
}
