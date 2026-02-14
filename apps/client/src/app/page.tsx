'use client';

import { GameArena } from '@/components/GameArena';
import { MainMenu } from '@/components/MainMenu';
import { useGameStore } from '@/stores/gameStore';
import { useSocket } from '@/hooks/useSocket';

export default function Home() {
  const { gameStarted } = useGameStore();
  
  // Initialize socket ONCE at app level (not in GameArena)
  // This prevents socket disconnection when switching between MainMenu and GameArena
  const { startMatch, connected } = useSocket();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {!gameStarted ? <MainMenu startMatch={startMatch} connected={connected} /> : <GameArena />}
    </main>
  );
}
