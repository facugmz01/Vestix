import { Module } from '@nestjs/common';
import { OutboxProcessorService } from './outbox.service';

@Module({
  providers: [OutboxProcessorService],
})
export class OutboxModule {}
