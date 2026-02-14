'use client';

import { useGameStore } from '@/stores/gameStore';
import { Droplet } from 'lucide-react';

export function ElixirBar() {
  const { playerElixir } = useGameStore();

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg px-6 py-3 flex items-center gap-3">
      <Droplet className="w-6 h-6 text-clash-purple fill-clash-purple" />
      <div className="flex gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-md transition-all duration-200 ${
              i < playerElixir
                ? 'bg-gradient-to-br from-clash-purple to-clash-blue shadow-lg'
                : 'bg-slate-700/50'
            }`}
          />
        ))}
      </div>
      <span className="text-2xl font-bold text-clash-purple ml-2">
        {playerElixir}
      </span>
    </div>
  );
}
