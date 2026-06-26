import { Module, Global } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { CryptoModule } from '../../core/crypto/crypto.module';

/**
 * @Global — SettingsService is consumed by many modules across the app.
 * Exporting it globally avoids re-importing SettingsModule everywhere.
 */
@Global()
@Module({
  imports: [CryptoModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
