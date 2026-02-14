import { Module } from '@nestjs/common';
import { GameModule } from './modules/game/game.module';

@Module({
    imports: [GameModule],
    controllers: [],
    providers: [],
})
export class AppModule { }
