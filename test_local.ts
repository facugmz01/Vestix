import { NestFactory } from '@nestjs/core';
import { AppModule } from './backend/src/app.module';
import { StockReportService } from './backend/src/modules/reports/stock-report.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const stockReportService = app.get(StockReportService);
  
  try {
    const alerts = await stockReportService.getLowStockAlerts(undefined);
    console.log('Success:', alerts.length);
  } catch (error) {
    console.error('Error in getLowStockAlerts:', error);
  }
  
  await app.close();
}

bootstrap();
