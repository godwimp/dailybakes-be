import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './v1/reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}