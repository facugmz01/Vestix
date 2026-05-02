import { Module, Global } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { AfipService } from './afip.service';

@Global() // Global so Sales/Returns can easily trigger electronic billing
@Module({
  providers: [InvoicingService, AfipService],
  exports: [InvoicingService]
})
export class InvoicingModule {}
