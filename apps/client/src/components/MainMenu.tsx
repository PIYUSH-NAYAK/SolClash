'use client';

import { Swords, Zap, Grid3x3, Crown } from 'lucide-react';

interface MainMenuProps {
  startMatch: () => void;
  connected: boolean;
}

export function MainMenu({ startMatch, connected }: MainMenuProps) {
  const handlePlay = () => {
    startMatch();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
      <div className="max-w-4xl w-full">
        {/* Title */}
        <div className="text-center mb-12 animate-float">
          <div className="inline-block">
            <Crown className="w-16 h-16 text-clash-gold mx-auto mb-4 drop-shadow-[0_0_25px_rgba(255,199,0,0.8)]" />
          </div>
          <h1 className="text-7xl font-black mb-4 bg-gradient-to-r from-clash-gold via-yellow-400 to-clash-gold bg-clip-text text-transparent drop-shadow-2xl">
            CLASH ROYALE
          </h1>
          <p className="text-xl text-purple-300 font-semibold tracking-wider">
            Web Edition
          </p>
        </div>

        {/* Play Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={handlePlay}
            disabled={!connected}
            className="group relative px-12 py-6 bg-gradient-to-r from-clash-gold via-yellow-500 to-clash-gold text-slate-900 font-black text-2xl rounded-2xl 
                     shadow-[0_0_40px_rgba(255,199,0,0.6)] hover:shadow-[0_0_60px_rgba(255,199,0,0.9)]
                     transform hover:scale-105 active:scale-95
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                     border-4 border-yellow-600
                     overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            <span className="relative flex items-center gap-3">
              <Swords className="w-8 h-8" />
              {connected ? 'PLAY NOW' : 'CONNECTING...'}
              <Swords className="w-8 h-8" />
            </span>
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-lg border-2 border-clash-blue/50 rounded-2xl p-6 hover:border-clash-blue hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-clash-blue/50">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-clash-blue/20 rounded-xl">
                <Zap className="w-8 h-8 text-clash-blue" />
              </div>
              <h3 className="text-xl font-bold text-clash-blue">30 FPS</h3>
            </div>
            <p className="text-gray-300">
              Smooth real-time gameplay with server-authoritative simulation
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-lg border-2 border-clash-purple/50 rounded-2xl p-6 hover:border-clash-purple hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-clash-purple/50">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-clash-purple/20 rounded-xl">
                <Grid3x3 className="w-8 h-8 text-clash-purple" />
              </div>
              <h3 className="text-xl font-bold text-clash-purple">24×39 Grid</h3>
            </div>
            <p className="text-gray-300">
              Strategic battlefield with two main paths and bridge
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-lg border-2 border-clash-gold/50 rounded-2xl p-6 hover:border-clash-gold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-clash-gold/50">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-clash-gold/20 rounded-xl">
                <Crown className="w-8 h-8 text-clash-gold" />
              </div>
              <h3 className="text-xl font-bold text-clash-gold">Destroy Towers</h3>
            </div>
            <p className="text-gray-300">
              Deploy troops and spells to destroy the enemy King Tower
            </p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 text-center">
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${
            connected 
              ? 'bg-green-500/20 border-2 border-green-500/50 text-green-400' 
              : 'bg-red-500/20 border-2 border-red-500/50 text-red-400'
          }`}>
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="font-semibold">
              {connected ? 'Connected to Server' : 'Connecting to Server...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
