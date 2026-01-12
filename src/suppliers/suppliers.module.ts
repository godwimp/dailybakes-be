import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.services';
import { SuppliersController } from './v1/suppliers.controller';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
