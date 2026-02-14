'use client';

import { useEffect, useRef, useState } from 'react';
import { SimpleGameEngine, type GameState, type Troop, type Tower } from '@/services/SimpleGameEngine';

interface Props {
  selectedCard: string | null;
  onCardPlaced: () => void;
}

export function SimpleGameCanvas({ selectedCard, onCardPlaced }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SimpleGameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Initialize game engine
  useEffect(() => {
    const engine = new SimpleGameEngine();
    engineRef.current = engine;

    engine.start((state) => {
      setGameState(state);
    });

    return () => {
      engine.stop();
    };
  }, []);

  // Render game state
  useEffect(() => {
    if (!canvasRef.current || !gameState) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw arena background
    // Top half (opponent) - lighter green
    ctx.fillStyle = '#3a6b1f';
    ctx.fillRect(0, 0, 480, 427);

    // Bottom half (player) - darker green
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, 427, 480, 427);

    // River in middle
    ctx.fillStyle = '#4a7c9c';
    ctx.fillRect(0, 405, 480, 44);

    // Draw grid (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 480; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 854);
      ctx.stroke();
    }
    for (let y = 0; y < 854; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(480, y);
      ctx.stroke();
    }

    // Draw towers
    gameState.towers.forEach(tower => {
      drawTower(ctx, tower);
    });

    // Draw troops
    gameState.troops.forEach(troop => {
      drawTroop(ctx, troop);
    });
  }, [gameState]);

  // Handle card placement
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedCard || !engineRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only allow deployment in bottom half (player side)
    if (y < 427) {
      alert('You can only deploy troops on your side (bottom half)!');
      return;
    }

    engineRef.current.deployTroop(selectedCard, { x, y });
    onCardPlaced();
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={480}
        height={854}
        onClick={handleCanvasClick}
        className="border-4 border-clash-blue/50 rounded-xl shadow-2xl cursor-crosshair"
        style={{ width: '480px', height: '854px' }}
      />
    </div>
  );
}

function drawTower(ctx: CanvasRenderingContext2D, tower: Tower) {
  const { position, owner, type, health, maxHealth } = tower;
  const color = owner === 'player' ? '#4a90e2' : '#e24a4a';
  const size = type === 'KING' ? 40 : 30;

  // Tower body
  ctx.fillStyle = color;
  ctx.fillRect(position.x - size / 2, position.y - size / 2, size, size);

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(position.x - size / 2, position.y - size / 2, size, size);

  // Crown
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(position.x - 10, position.y - size / 2);
  ctx.lineTo(position.x, position.y - size / 2 - 10);
  ctx.lineTo(position.x + 10, position.y - size / 2);
  ctx.closePath();
  ctx.fill();

  // Health bar
  const healthPercent = health / maxHealth;
  const barWidth = size;
  const barHeight = 4;
  const barY = position.y + size / 2 + 5;

  // Background
  ctx.fillStyle = '#333333';
  ctx.fillRect(position.x - barWidth / 2, barY, barWidth, barHeight);

  // Health
  const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
  ctx.fillStyle = healthColor;
  ctx.fillRect(position.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
}

function drawTroop(ctx: CanvasRenderingContext2D, troop: Troop) {
  const { position, owner } = troop;
  const color = owner === 'player' ? '#5CA6F6' : '#FF4444';

  // Main circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(position.x, position.y, 12, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(position.x, position.y, 12, 0, Math.PI * 2);
  ctx.stroke();
}
