import { Module } from '@nestjs/common';
import { OutboxProcessorService } from './outbox.service';
import { IntegrationsModule } from '../../domains/integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  providers: [OutboxProcessorService],
})
export class OutboxModule {}
