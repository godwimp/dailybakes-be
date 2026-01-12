import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './v1/sales.controller';
import { IngredientsModule } from '../ingredients/ingredients.module';

@Module({
  imports: [IngredientsModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}