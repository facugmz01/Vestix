import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class ParseBooleanQueryPipe implements PipeTransform {
  transform(value: unknown): boolean | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    const normalized = String(value).toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
    return undefined;
  }
}
