import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameSimulation } from './game.simulation';
import { GameService } from './game.service';

@Module({
    providers: [GameGateway, GameSimulation, GameService],
    exports: [GameService],
})
export class GameModule { }
