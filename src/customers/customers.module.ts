import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './v1/customers.controller';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}