'use client';

import { CARD_STATS, SPELL_STATS } from '@clash-royale/shared';
import Image from 'next/image';

const DECK_CARDS = ['ARCHER', 'GIANT', 'BARBARIAN', 'FIREBALL', 'ARROWS'] as const;

// Map card types to card image paths
const CARD_IMAGES: Record<string, string> = {
  'ARCHER': '/assets/cards/ArchersCard.png',
  'GIANT': '/assets/cards/GiantCard.png',
  'BARBARIAN': '/assets/cards/BarbariansCard.png',
  'FIREBALL': '/assets/cards/FireballCard.png',
  'ARROWS': '/assets/cards/ArrowsCard.png',
};

interface DeckPanelProps {
  selectedCard: string | null;
  onCardSelect: (cardType: string) => void;
}

export function DeckPanel({ selectedCard, onCardSelect }: DeckPanelProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
      <div className="flex gap-3">
        {DECK_CARDS.map((cardType) => {
          const cardStats = CARD_STATS[cardType as keyof typeof CARD_STATS];
          const spellStats = SPELL_STATS[cardType as keyof typeof SPELL_STATS];
          const stats = cardStats || spellStats;
          const isSpell = !!spellStats;
          const isSelected = selectedCard === cardType;
          const imagePath = CARD_IMAGES[cardType];
          
          return (
            <button
              key={cardType}
              onClick={() => onCardSelect(cardType)}
              className={`
                relative bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 
                border-2 rounded-xl p-3 min-w-[110px] transition-all duration-200 
                hover:scale-105 hover:shadow-xl
                ${isSelected 
                  ? 'border-clash-gold shadow-lg shadow-clash-gold/50 scale-105' 
                  : isSpell ? 'border-clash-purple' : 'border-slate-600'}
              `}
            >
              {/* Card Image */}
              {imagePath && (
                <div className="relative w-full h-20 mb-2 rounded-lg overflow-hidden">
                  <Image
                    src={imagePath}
                    alt={cardType}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              
              <div className="text-center">
                <div className="text-xs text-clash-gold mb-1 font-bold">{stats.cost} ⚡</div>
                <div className="font-bold text-white text-sm mb-1">{cardType}</div>
                {isSpell ? (
                  <>
                    <div className="text-xs text-clash-purple font-semibold">
                      {stats.damage} DMG
                    </div>
                    <div className="text-xs text-gray-400">
                      ⭕ {(spellStats as any).radius}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-gray-400">
                      {(cardStats as any).health} HP
                    </div>
                    <div className="text-xs text-gray-400">
                      {stats.damage} DMG
                    </div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
