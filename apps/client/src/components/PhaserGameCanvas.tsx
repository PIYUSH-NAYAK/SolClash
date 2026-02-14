'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { SimpleGameEngine, GameState } from '../services/SimpleGameEngine';
import { GameScene } from '../services/PhaserGameScene';
import { useRouter } from 'next/navigation';

interface PhaserGameCanvasProps {
  selectedCard: string | null;
  onCardPlaced: () => void;
}

const SPELL_CARDS = ['FIREBALL', 'ARROWS'];

export function PhaserGameCanvas({ selectedCard, onCardPlaced }: PhaserGameCanvasProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const gameSceneRef = useRef<GameScene | null>(null);
  const engineRef = useRef<SimpleGameEngine | null>(null);
  const router = useRouter();

  // Initialize Phaser game
  useEffect(() => {
    if (!gameContainerRef.current || phaserGameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 480,
      height: 854,
      parent: gameContainerRef.current,
      backgroundColor: '#1a1a2e',
      scene: GameScene,
      scale: {
        mode: Phaser.Scale.NONE,
      },
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    return () => {
      game.destroy(true);
      phaserGameRef.current = null;
    };
  }, []);

  // Track selected card with ref to avoid stale closure
  const selectedCardRef = useRef<string | null>(null);

  useEffect(() => {
    selectedCardRef.current = selectedCard;
  }, [selectedCard]);

  // Setup click handler after scene is ready
  useEffect(() => {
    if (!phaserGameRef.current) return;

    const game = phaserGameRef.current;
    
    // Wait for scene to be ready
    const checkScene = setInterval(() => {
      const scene = game.scene.getScene('GameScene') as GameScene;
      if (scene && scene.input) {
        clearInterval(checkScene);
        gameSceneRef.current = scene;

        // Setup click handler
        scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          // Use ref to get current selected card (not stale closure)
          if (selectedCardRef.current) {
            handleCanvasClick(pointer.x, pointer.y);
          }
        });
      }
    }, 100);

    return () => {
      clearInterval(checkScene);
    };
  }, []); // Remove selectedCard dependency

  // Initialize game engine
  useEffect(() => {
    const engine = new SimpleGameEngine();
    engineRef.current = engine;

    // Handle game state updates
    const handleUpdate = (state: GameState) => {
      if (gameSceneRef.current) {
        gameSceneRef.current.updateGameState(state);
      }
    };

    // Handle game over
    const handleGameOver = (winner: 'player' | 'opponent') => {
      setTimeout(() => {
        const message = winner === 'player' 
          ? '🎉 VICTORY! You destroyed the enemy King tower!' 
          : '💔 DEFEAT! Your King tower was destroyed!';
        
        alert(message);
        router.push('/'); // Return to home
      }, 500);
    };

    engine.start(handleUpdate, handleGameOver);

    return () => {
      engine.stop();
    };
  }, [router]);

  const handleCanvasClick = (x: number, y: number) => {
    const currentCard = selectedCardRef.current;
    if (!currentCard || !engineRef.current) return;

    const isSpell = SPELL_CARDS.includes(currentCard);

    // Troops can only deploy in bottom half (player side)
    // Spells can deploy anywhere
    if (!isSpell && y < 427) {
      alert('Troops can only deploy on your side (bottom half)!');
      return;
    }

    // Deploy spell or troop
    if (isSpell) {
      engineRef.current.deploySpell(currentCard, { x, y });
    } else {
      engineRef.current.deployTroop(currentCard, { x, y });
    }
    
    onCardPlaced();
  };

  return (
    <div 
      ref={gameContainerRef} 
      className="border-4 border-clash-blue/50 rounded-xl shadow-2xl"
      style={{ width: '480px', height: '854px' }}
    />
  );
}
