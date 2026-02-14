import Phaser from 'phaser';
import type { GameState, Tower, Troop } from './SimpleGameEngine';

export class GameScene extends Phaser.Scene {
    private towers: Map<string, Phaser.GameObjects.Container> = new Map();
    private troops: Map<string, Phaser.GameObjects.Sprite> = new Map();
    private gameState: GameState | null = null;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load tower sprites
        this.load.image('tower_king_blue', '/assets/cards/tower_king_blue.png');
        this.load.image('tower_king_red', '/assets/cards/tower_king_red.png');
        this.load.image('tower_archer_blue', '/assets/cards/tower_archer_blue.png');
        this.load.image('tower_archer_red', '/assets/cards/tower_archer_red.png');

        // Load troop GIF sprites
        this.load.image('archer_walk', '/assets/troops/Archer_walk_player_62-62.gif');
        this.load.image('archer_fight', '/assets/troops/Archer_fight_player_65-162.gif');
        this.load.image('giant_walk', '/assets/troops/Giant_walk_player_109-109.gif');
        this.load.image('giant_fight', '/assets/troops/Giant_fight_player_109-109.gif');
        this.load.image('barbarian_walk', '/assets/troops/Barbarian_walk_player_115-90.gif');
        this.load.image('barbarian_fight', '/assets/troops/Barbarian_fight_player_120-100.gif');
        this.load.image('wizard_walk', '/assets/troops/Wizard_walk_player_90-90.gif');
        this.load.image('wizard_fight', '/assets/troops/Wizard_fight_player_90-145.gif');

        // Opponent troops
        this.load.image('archer_walk_opp', '/assets/troops/Archer_walk_opponent_62-62.gif');
        this.load.image('giant_walk_opp', '/assets/troops/Giant_walk_opponent_109-109.gif');
        this.load.image('barbarian_walk_opp', '/assets/troops/Barbarian_walk_opponent_115-90.gif');
        this.load.image('wizard_walk_opp', '/assets/troops/Wizard_walk_opponent_90-90.gif');
    }

    create() {
        // Create arena background
        this.createArena();
    }

    private createArena() {
        const graphics = this.add.graphics();

        // Top half (opponent) - lighter green
        graphics.fillStyle(0x3a6b1f);
        graphics.fillRect(0, 0, 480, 427);

        // Bottom half (player) - darker green
        graphics.fillStyle(0x2d5016);
        graphics.fillRect(0, 427, 480, 427);

        // River in middle
        graphics.fillStyle(0x4a7c9c);
        graphics.fillRect(0, 405, 480, 44);

        // Grid overlay
        graphics.lineStyle(1, 0xffffff, 0.1);
        for (let x = 0; x < 480; x += 20) {
            graphics.lineTo(x, 0);
            graphics.lineTo(x, 854);
            graphics.moveTo(x + 20, 0);
        }
        for (let y = 0; y < 854; y += 20) {
            graphics.lineTo(0, y);
            graphics.lineTo(480, y);
            graphics.moveTo(0, y + 20);
        }
        graphics.strokePath();
    }

    updateGameState(state: GameState) {
        this.gameState = state;
    }

    update() {
        if (!this.gameState) return;

        // Update towers
        this.updateTowers(this.gameState.towers);

        // Update troops
        this.updateTroops(this.gameState.troops);

        // Render spells (area damage effects)
        if (this.gameState.spells && this.gameState.spells.length > 0) {
            this.gameState.spells.forEach((spell: any) => {
                // Check if we already rendered this spell
                const spellKey = spell.id;
                if (!this.children.exists((obj: any) => obj.name === spellKey)) {
                    // Determine color based on spell type
                    const color = spell.type === 'FIREBALL' ? 0xff4400 : 0x888888;

                    // Draw impact circle
                    const circle = this.add.circle(
                        spell.position.x,
                        spell.position.y,
                        spell.radius,
                        color,
                        0.4
                    );
                    circle.setName(spellKey);

                    // Add outer ring for better visibility
                    const ring = this.add.circle(
                        spell.position.x,
                        spell.position.y,
                        spell.radius,
                        color,
                        0
                    );
                    ring.setStrokeStyle(3, color);
                    ring.setName(`${spellKey}-ring`);

                    // Fade out over 1 second
                    this.tweens.add({
                        targets: [circle, ring],
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => {
                            circle.destroy();
                            ring.destroy();
                        }
                    });
                }
            });
        }
    }

    private updateTowers(towers: Tower[]) {
        // Remove destroyed towers
        for (const [id, container] of this.towers) {
            if (!towers.find(t => t.id === id)) {
                container.destroy();
                this.towers.delete(id);
            }
        }

        // Create/update towers
        towers.forEach(tower => {
            let container = this.towers.get(tower.id);

            if (!container) {
                container = this.createTower(tower);
                this.towers.set(tower.id, container);
            } else {
                this.updateTowerHealth(container, tower);
            }
        });
    }

    private createTower(tower: Tower): Phaser.GameObjects.Container {
        const container = this.add.container(tower.position.x, tower.position.y);

        // Determine tower sprite
        const isKing = tower.type === 'KING';
        const spriteKey = isKing
            ? (tower.owner === 'player' ? 'tower_king_blue' : 'tower_king_red')
            : (tower.owner === 'player' ? 'tower_archer_blue' : 'tower_archer_red');

        // Tower sprite
        const sprite = this.add.sprite(0, 0, spriteKey);
        sprite.setScale(0.6); // Scale down to fit
        container.add(sprite);

        // Health bar background
        const healthBg = this.add.rectangle(0, 40, 50, 6, 0x333333);
        container.add(healthBg);

        // Health bar foreground
        const healthPercent = tower.health / tower.maxHealth;
        const healthColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
        const healthBar = this.add.rectangle(
            -25 + (50 * healthPercent) / 2,
            40,
            50 * healthPercent,
            6,
            healthColor
        );
        container.add(healthBar);

        return container;
    }

    private updateTowerHealth(container: Phaser.GameObjects.Container, tower: Tower) {
        // Update health bar (3rd child - index 2)
        const healthBar = container.list[2] as Phaser.GameObjects.Rectangle;
        const healthPercent = tower.health / tower.maxHealth;
        const healthColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;

        healthBar.setFillStyle(healthColor);
        healthBar.width = 50 * healthPercent;
        healthBar.x = -25 + (50 * healthPercent) / 2;
    }

    private updateTroops(troops: Troop[]) {
        // Remove dead troops
        for (const [id, sprite] of this.troops) {
            if (!troops.find(t => t.id === id)) {
                sprite.destroy();
                this.troops.delete(id);
            }
        }

        // Create/update troops
        troops.forEach(troop => {
            let sprite = this.troops.get(troop.id);

            if (!sprite) {
                sprite = this.createTroop(troop);
                this.troops.set(troop.id, sprite);
            } else {
                // Update position
                sprite.setPosition(troop.position.x, troop.position.y);
            }
        });
    }

    private createTroop(troop: Troop): Phaser.GameObjects.Sprite {
        const spriteName = this.getTroopSpriteName(troop);
        const sprite = this.add.sprite(troop.position.x, troop.position.y, spriteName);

        // Scale down sprites to fit game
        sprite.setScale(0.5);

        return sprite;
    }

    private getTroopSpriteName(troop: Troop): string {
        const suffix = troop.owner === 'player' ? '' : '_opp';
        const type = troop.type.toLowerCase();

        // Use walk animation by default
        return `${type}_walk${suffix}`;
    }

    handleClick(x: number, y: number): { x: number; y: number } {
        return { x, y };
    }
}
