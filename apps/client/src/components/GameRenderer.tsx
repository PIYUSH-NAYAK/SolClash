'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useGameStore } from '@/stores/gameStore';
import { useSocket } from '@/hooks/useSocket';
import { GRID } from '@clash-royale/shared';
import type { Position, Tower as TowerType } from '@clash-royale/shared';

interface GameRendererProps {
  selectedCard: string | null;
  onCardPlaced?: () => void;
}

// Helper to get sprite path for entities
function getSpriteUrl(type: string, status: string, owner: string): string {
  const state = status === 'FIGHT' ? 'fight' : 'walk';
  const ownerStr = owner === 'player' ? 'player' : 'opponent';
  
  // Map card types to sprite names
  const spriteMap: Record<string, string> = {
    'ARCHER': 'Archer',
    'GIANT': 'Giant',
    'BARBARIAN': 'Barbarian',
  };
  
  const spriteName = spriteMap[type] || 'Archer';
  
  // Get dimensions from known sprites
  const dimensions: Record<string, string> = {
    'Archer_walk': '62-62',
    'Archer_fight': '65-162',
    'Giant_walk': '109-109',
    'Giant_fight': '109-109',
    'Barbarian_walk': '115-90',
    'Barbarian_fight': '120-100',
  };
  
  const key = `${spriteName}_${state}`;
  const dims = dimensions[key] || '62-62';
  
  return `/assets/troops/${spriteName}_${state}_${ownerStr}_${dims}.gif`;
}

export function GameRenderer({ selectedCard, onCardPlaced }: GameRendererProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const entitiesRef = useRef<Map<string, PIXI.Container>>(new Map());
  const towersRef = useRef<Map<string, PIXI.Container>>(new Map());
  const entitiesLayerRef = useRef<PIXI.Container | null>(null);
  const towersLayerRef = useRef<PIXI.Container | null>(null);
  const [hoverPosition, setHoverPosition] = useState<Position | null>(null);
  
  const { entities, towers, tick } = useGameStore();
  const { placeCard } = useSocket();

  const cellWidth = 480 / GRID.COLUMNS;
  const cellHeight = 854 / GRID.ROWS;

  // Handle canvas click
  const handleCanvasClick = useCallback((event: MouseEvent) => {
    if (!selectedCard || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const gridX = Math.floor(x / cellWidth);
    const gridY = Math.floor(y / cellHeight);

    // Only allow placement in player's half (bottom half, y > 19)
    if (gridY > 19 && gridY < GRID.ROWS && gridX >= 0 && gridX < GRID.COLUMNS) {
      placeCard(selectedCard, { x: gridX, y: gridY });
      onCardPlaced?.();
    }
  }, [selectedCard, placeCard, onCardPlaced, cellWidth, cellHeight]);

  // Handle mouse move
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!selectedCard || !canvasRef.current) {
      setHoverPosition(null);
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const gridX = Math.floor(x / cellWidth);
    const gridY = Math.floor(y / cellHeight);

    if (gridY > 19 && gridY < GRID.ROWS && gridX >= 0 && gridX < GRID.COLUMNS) {
      setHoverPosition({ x: gridX, y: gridY });
    } else {
      setHoverPosition(null);
    }
  }, [selectedCard, cellWidth, cellHeight]);

  // Initialize PixiJS app with layers
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    try {
      const app = new PIXI.Application({
        width: 480,
        height: 854,
        backgroundColor: 0x1a1a2e,
        antialias: true,
        // Use these settings for better WebGL stability
        powerPreference: 'low-power',
        preserveDrawingBuffer: false,
      });

      canvasRef.current.appendChild(app.view as HTMLCanvasElement);
      appRef.current = app;

      // Handle WebGL context loss gracefully
      const canvas = app.view as HTMLCanvasElement;
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        console.warn('WebGL context lost, attempting to recover');
      });

      canvas.addEventListener('webglcontextrestored', () => {
        console.log('WebGL context restored successfully');
      });

    // Layer 1: Background - Arena with grass/terrain
    const bgGraphics = new PIXI.Graphics();
    
    // Create a gradient-like effect with multiple rectangles
    // Bottom half (player side) - darker green
    bgGraphics.beginFill(0x2d5016);
    bgGraphics.drawRect(0, 427, 480, 427);
    bgGraphics.endFill();
    
    // Top half (opponent side) - lighter green
    bgGraphics.beginFill(0x3a6b1f);
    bgGraphics.drawRect(0, 0, 480, 427);
    bgGraphics.endFill();
    
    // Mid-line (river/bridge area)
    bgGraphics.beginFill(0x4a7c9c);
    bgGraphics.drawRect(0, 405, 480, 44);
    bgGraphics.endFill();
    
    app.stage.addChild(bgGraphics);

    // Layer 2: Grid overlay (very subtle)
    const gridGraphics = new PIXI.Graphics();
    gridGraphics.lineStyle(0.5, 0xFFFFFF, 0.08);

    for (let i = 0; i <= GRID.COLUMNS; i++) {
      gridGraphics.moveTo(i * cellWidth, 0);
      gridGraphics.lineTo(i * cellWidth, 854);
    }

    for (let i = 0; i <= GRID.ROWS; i++) {
      gridGraphics.moveTo(0, i * cellHeight);
      gridGraphics.lineTo(480, i * cellHeight);
    }

    app.stage.addChild(gridGraphics);

    // Layer 3: Path indicators
    const pathGraphics = new PIXI.Graphics();
    
    // Left path highlight
    pathGraphics.beginFill(0x5CA6F6, 0.05);
    pathGraphics.drawRect(GRID.LEFT_PATH_X * cellWidth, 0, cellWidth, 854);
    
    // Right path highlight
    pathGraphics.drawRect(GRID.RIGHT_PATH_X * cellWidth, 0, cellWidth, 854);
    pathGraphics.endFill();
    
    app.stage.addChild(pathGraphics);

    // Layer 4: Mid-line
    const midLine = new PIXI.Graphics();
    midLine.lineStyle(3, 0xFFC700, 0.6);
    midLine.moveTo(0, (GRID.ROWS / 2) * cellHeight);
    midLine.lineTo(480, (GRID.ROWS / 2) * cellHeight);
    app.stage.addChild(midLine);

    // Layer 5: Towers layer
    const towersLayer = new PIXI.Container();
    towersLayer.name = 'towersLayer';
    app.stage.addChild(towersLayer);
    towersLayerRef.current = towersLayer;

    // Layer 6: Entities layer (troops on top of towers)
    const entitiesLayer = new PIXI.Container();
    entitiesLayer.name = 'entitiesLayer';
    app.stage.addChild(entitiesLayer);
    entitiesLayerRef.current = entitiesLayer;

    // Layer 7: UI/Hover layer (on top of everything)
    const uiLayer = new PIXI.Container();
    uiLayer.name = 'uiLayer';
    app.stage.addChild(uiLayer);

    // Add event listeners
    const eventCanvas = canvasRef.current;
    eventCanvas.addEventListener('click', handleCanvasClick as EventListener);
    eventCanvas.addEventListener('mousemove', handleMouseMove as EventListener);

    return () => {
      eventCanvas.removeEventListener('click', handleCanvasClick as EventListener);
      eventCanvas.removeEventListener('mousemove', handleMouseMove as EventListener);
      app.destroy(true);
      appRef.current = null;
    };
    } catch (error) {
      console.error('Error initializing PixiJS:', error);
      return () => {}; // No-op cleanup if initialization failed
    }
  }, [handleCanvasClick, handleMouseMove, cellWidth, cellHeight]);

  // Render towers in towers layer
  useEffect(() => {
    if (!appRef.current || !towersLayerRef.current) return;

    const towersLayer = towersLayerRef.current;

    // Remove old towers
    for (const [id, container] of towersRef.current) {
      if (!towers.find(t => t.id === id)) {
        towersLayer.removeChild(container);
        towersRef.current.delete(id);
      }
    }

    // Update/create towers
    towers.forEach((tower) => {
      let container = towersRef.current.get(tower.id);
      
      if (!container) {
        container = new PIXI.Container();
        towersLayer.addChild(container);
        towersRef.current.set(tower.id, container);
      }

      container.removeChildren();
      
      // Create graphics for this tower
      const graphics = new PIXI.Graphics();
      const isKing = tower.type === 'KING';
      const color = tower.owner === 'player' ? 0x4a90e2 : 0xe24a4a;
      const width = isKing ? 40 : 30;
      const height = isKing ? 50 : 40;

      // Tower body
      graphics.beginFill(color);
      graphics.drawRect(
        tower.position.x * cellWidth - width / 2,
        tower.position.y * cellHeight - height / 2,
        width,
        height
      );
      graphics.endFill();

      // Crown on top
      graphics.beginFill(0xffd700);
      graphics.drawPolygon([
        tower.position.x * cellWidth - 10, tower.position.y * cellHeight - height / 2,
        tower.position.x * cellWidth, tower.position.y * cellHeight - height / 2 - 10,
        tower.position.x * cellWidth + 10, tower.position.y * cellHeight - height / 2,
      ]);
      graphics.endFill();

      // Health bar background
      const healthBarWidth = width;
      const healthBarHeight = 4;
      const healthBarY = tower.position.y * cellHeight + height / 2 + 5;

      graphics.beginFill(0x333333);
      graphics.drawRect(
        tower.position.x * cellWidth - healthBarWidth / 2,
        healthBarY,
        healthBarWidth,
        healthBarHeight
      );
      graphics.endFill();

      // Health bar foreground
      const healthPercent = tower.health / tower.maxHealth;
      const healthColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;

      graphics.beginFill(healthColor);
      graphics.drawRect(
        tower.position.x * cellWidth - healthBarWidth / 2,
        healthBarY,
        healthBarWidth * healthPercent,
        healthBarHeight
      );
      graphics.endFill();

      container.addChild(graphics);
    });
  }, [towers, cellWidth, cellHeight]);

  // Render entities in entities layer (troops)
  useEffect(() => {
    if (!appRef.current || !entitiesLayerRef.current) return;

    const entitiesLayer = entitiesLayerRef.current;

    // Remove dead entities
    for (const [id, container] of entitiesRef.current) {
      if (!entities.has(id)) {
        entitiesLayer.removeChild(container);
        entitiesRef.current.delete(id);
      }
    }

    // Update/create entities
    entities.forEach((entity, id) => {
      let container = entitiesRef.current.get(id);
      
      if (!container) {
        container = new PIXI.Container();
        entitiesLayer.addChild(container);
        entitiesRef.current.set(id, container);
      }

      container.removeChildren();
      
      // Try to load GIF sprite
      const spriteUrl = getSpriteUrl(entity.type, entity.status, entity.owner);
      
      try {
        const texture = PIXI.Texture.from(spriteUrl);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5, 0.5);
        sprite.scale.set(0.4); // Make troops smaller to fit grid
        container.addChild(sprite);
      } catch (e) {
        // Fallback to colored circle
        const circle = new PIXI.Graphics();
        const color = entity.owner === 'player' ? 0x5CA6F6 : 0xFF4444;
        
        // Shadow
        circle.beginFill(0x000000, 0.3);
        circle.drawCircle(2, 2, 12);
        circle.endFill();
        
        // Main circle
        circle.beginFill(color);
        circle.lineStyle(2, 0xFFFFFF, 0.9);
        circle.drawCircle(0, 0, 12);
        circle.endFill();
        
        container.addChild(circle);
      }
      
      // Health bar (smaller for troops)
      const healthPercent = entity.hp / entity.maxHp;
      const healthColor = healthPercent > 0.6 ? 0x00FF88 : healthPercent > 0.3 ? 0xFFC700 : 0xFF4444;
      
      const healthBar = new PIXI.Graphics();
      
      // Background
      healthBar.beginFill(0x000000, 0.7);
      healthBar.drawRoundedRect(-15, -28, 30, 5, 2.5);
      healthBar.endFill();
      
      // Health
      healthBar.beginFill(healthColor);
      healthBar.drawRoundedRect(-14, -27, 28 * healthPercent, 3, 1.5);
      healthBar.endFill();
      
      container.addChild(healthBar);
      
      // Position the container
      container.x = entity.pos.x * cellWidth + cellWidth / 2;
      container.y = entity.pos.y * cellHeight + cellHeight / 2;
    });
  }, [entities, tick, cellWidth, cellHeight]);

  // Render hover effect in UI layer
  useEffect(() => {
    if (!appRef.current) return;

    const app = appRef.current;
    const uiLayer = app.stage.getChildByName('uiLayer') as PIXI.Container;
    if (!uiLayer) return;

    // Remove existing hover
    const existingHover = uiLayer.getChildByName('hover');
    if (existingHover) {
      uiLayer.removeChild(existingHover);
    }

    if (hoverPosition) {
      const hoverGraphics = new PIXI.Graphics();
      hoverGraphics.name = 'hover';
      hoverGraphics.beginFill(0xFFD700, 0.3);
      hoverGraphics.lineStyle(3, 0xFFD700, 0.9);
      hoverGraphics.drawRoundedRect(
        hoverPosition.x * cellWidth,
        hoverPosition.y * cellHeight,
        cellWidth,
        cellHeight,
        6
      );
      hoverGraphics.endFill();
      uiLayer.addChild(hoverGraphics);
    }
  }, [hoverPosition, cellWidth, cellHeight]);

  return (
    <div
      ref={canvasRef}
      className="rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(92,166,246,0.4)] border-4 border-clash-blue/50 hover:shadow-[0_0_80px_rgba(92,166,246,0.6)] transition-all duration-300"
      style={{ width: '480px', height: '854px', cursor: selectedCard ? 'crosshair' : 'default' }}
    />
  );
}
