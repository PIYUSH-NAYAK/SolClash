'use client';

import { useState } from 'react';
import { PhaserGameCanvas } from './PhaserGameCanvas';
import { ElixirBar } from './ElixirBar';
import { DeckPanel } from './DeckPanel';
import { Swords } from 'lucide-react';

export function GameArena() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const handleCardSelect = (cardType: string) => {
    setSelectedCard(cardType);
  };

  const handleCardPlaced = () => {
    setSelectedCard(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
      <div className="flex flex-col items-center gap-8 max-w-7xl w-full">
        {/* Header */}
        <div className="text-center bg-gradient-to-r from-slate-800/50 to-slate-800/30 backdrop-blur-lg border-2 border-clash-blue/30 rounded-2xl px-8 py-4 shadow-lg w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Swords className="w-6 h-6 text-clash-gold" />
            <div className="text-sm font-mono text-gray-400">
              <span className="text-clash-blue font-bold">Offline Mode</span>
            </div>
            <Swords className="w-6 h-6 text-clash-gold" />
          </div>
          {selectedCard && (
            <div className="mt-3 text-sm text-clash-gold font-bold animate-pulse-glow px-4 py-2 bg-clash-gold/10 rounded-lg border border-clash-gold/30">
              ⚡ Click bottom half of map to deploy {selectedCard}
            </div>
          )}
        </div>

        {/* Game Canvas */}
        <PhaserGameCanvas selectedCard={selectedCard} onCardPlaced={handleCardPlaced} />

        {/* Bottom UI */}
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
          <ElixirBar />
          <DeckPanel selectedCard={selectedCard} onCardSelect={handleCardSelect} />
        </div>
      </div>
    </div>
  );
}
