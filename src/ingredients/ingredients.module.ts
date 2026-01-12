import { Module } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { IngredientsController } from './v1/ingredients.controller';

@Module({
  controllers: [IngredientsController],
  providers: [IngredientsService],
  exports: [IngredientsService],
})
export class IngredientsModule {}