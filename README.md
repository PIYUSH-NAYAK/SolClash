# Clash Royale Game - Quick Start Guide

## ✅ CSS Fixed!

If TailwindCSS wasn't loading, restart the client dev server:
```bash
# Stop the client (Ctrl+C in that terminal)
# Then restart:
pnpm --filter client dev
```

## 🎮 How to Play

1. **Main Menu**: Click "Play Now" button
2. **Select Card**: Click any card in the deck (Archer, Giant, or Barbarian) - it will glow gold
3. **Deploy**: Click on the bottom half of the map to place your troop
4. **Watch**: Your troop will automatically move toward the opponent's towers!

## 🎯 Game Mechanics Working

- ✅ **30 FPS Simulation**: Server runs authoritative game loop
- ✅ **Movement**: Troops follow pathfinding algorithm (left/right paths, bridge)
- ✅ **Combat**: Troops target nearest enemies and attack
- ✅ **Elixir**: Regenerates automatically (1.4/second)
- ✅ **Real-time Sync**: WebSocket updates every ~33ms

## 🚀 Current Features

### Server (Phase 2 Complete)
- NestJS + Socket.IO
- GameSimulation with tick loop
- Pathfinding from Java code
- Combat system with targeting
- Elixir regeneration

### Client (Phase 3 Complete)  
- Next.js + PixiJS renderer
- Interactive card placement
- Hover effects (gold highlight)
- Visual feedback (selected cards glow)
- Elixir bar animation

## 📋 Next Phase Ideas

### Phase 4: Testing & Polish
- [ ] Add spell cards (Fireball, Arrows)
- [ ] Migrate GIF assets from Java project
- [ ] Add sprite animations (walk/fight states)
- [ ] Victory/defeat conditions
- [ ] Sound effects
- [ ] Deck customization
- [ ] Better tower graphics
- [ ] Health bars on towers
- [ ] Particle effects

### Phase 5: Advanced Features
- [ ] Multiplayer matchmaking
- [ ] User authentication
- [ ] Database persistence (Prisma)
- [ ] Leaderboards
- [ ] Replay system
- [ ] Mobile responsive design

## 🐛 Troubleshooting

**CSS not loading?**
- Restart client dev server
- Check `tailwind.config.js` has correct `content` paths
- Verify `globals.css` has `@tailwind` directives

**Can't place cards?**
- Make sure you clicked a card first (should glow gold)
- Only bottom half of map is valid (player territory)
- Check browser console for errors

**Troops not moving?**
- Server must be running on port 3001
- Check server logs for "Starting game simulation"
- Verify WebSocket connection in browser DevTools

## 💡 Pro Tips

- Troops automatically find paths to opponent towers
- Place troops near the left (x=6) or right (x=17) paths for fastest movement
- Elixir costs: Archer (3), Giant (5), Barbarian (5)
- Click multiple cards quickly to queue up deployments!

---

**Enjoy the game! 🎉**
# SolClash
