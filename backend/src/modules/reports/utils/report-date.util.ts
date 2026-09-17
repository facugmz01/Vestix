/**
 * Report Date & Timezone Utilities
 * 
 * Standardises date boundaries to Argentina Time (America/Argentina/Buenos_Aires, UTC-3).
 * Ensures midnight-to-midnight ranges in local store time map accurately to UTC database timestamps.
 */

const ARGENTINA_OFFSET_HOURS = -3; // UTC-3 all year round

/**
 * Returns current date/time components in Argentina timezone.
 */
export function getArgentinaNow(): { year: number; month: number; day: number; hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const find = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);

  return {
    year: find('year'),
    month: find('month'), // 1-12
    day: find('day'),
    hours: find('hour'),
    minutes: find('minute'),
    seconds: find('second'),
  };
}

/**
 * Helper to construct a UTC Date given local time components in Argentina (UTC-3).
 * Argentina 00:00:00-03:00 = 03:00:00 UTC.
 */
function createDateAtArgentinaTime(
  year: number,
  month: number, // 1-12
  day: number,
  hours: number,
  minutes: number,
  seconds: number,
  ms: number,
): Date {
  const utcHours = hours - ARGENTINA_OFFSET_HOURS;
  return new Date(Date.UTC(year, month - 1, day, utcHours, minutes, seconds, ms));
}

/**
 * Converts a date or string (YYYY-MM-DD) to the start of day in Argentina (00:00:00.000-03:00) as a UTC Date object.
 */
export function toStartOfDayArgentina(val?: string | Date | null): Date {
  if (!val) {
    const ar = getArgentinaNow();
    return createDateAtArgentinaTime(ar.year, ar.month, 1, 0, 0, 0, 0);
  }

  if (val instanceof Date) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(val);
    const find = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
    return createDateAtArgentinaTime(find('year'), find('month'), find('day'), 0, 0, 0, 0);
  }

  const dateOnlyMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10);
    const day = parseInt(dateOnlyMatch[3], 10);
    return createDateAtArgentinaTime(year, month, day, 0, 0, 0, 0);
  }

  const parsed = new Date(val);
  if (isNaN(parsed.getTime())) {
    const ar = getArgentinaNow();
    return createDateAtArgentinaTime(ar.year, ar.month, 1, 0, 0, 0, 0);
  }
  return toStartOfDayArgentina(parsed);
}

/**
 * Converts a date or string (YYYY-MM-DD) to the end of day in Argentina (23:59:59.999-03:00) as a UTC Date object.
 */
export function toEndOfDayArgentina(val?: string | Date | null): Date {
  if (!val) {
    return new Date();
  }

  if (val instanceof Date) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(val);
    const find = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
    return createDateAtArgentinaTime(find('year'), find('month'), find('day'), 23, 59, 59, 999);
  }

  const dateOnlyMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10);
    const day = parseInt(dateOnlyMatch[3], 10);
    return createDateAtArgentinaTime(year, month, day, 23, 59, 59, 999);
  }

  const parsed = new Date(val);
  if (isNaN(parsed.getTime())) {
    return new Date();
  }
  return toEndOfDayArgentina(parsed);
}

/**
 * Predefined ranges in Argentina local time.
 */
export function getPresetDateRange(preset: 'today' | 'yesterday' | 'week' | 'month'): { from: Date; to: Date } {
  const ar = getArgentinaNow();

  switch (preset) {
    case 'today': {
      const from = createDateAtArgentinaTime(ar.year, ar.month, ar.day, 0, 0, 0, 0);
      const to = createDateAtArgentinaTime(ar.year, ar.month, ar.day, 23, 59, 59, 999);
      return { from, to };
    }
    case 'yesterday': {
      const todayDate = new Date(Date.UTC(ar.year, ar.month - 1, ar.day));
      todayDate.setUTCDate(todayDate.getUTCDate() - 1);
      const yYear = todayDate.getUTCFullYear();
      const yMonth = todayDate.getUTCMonth() + 1;
      const yDay = todayDate.getUTCDate();
      const from = createDateAtArgentinaTime(yYear, yMonth, yDay, 0, 0, 0, 0);
      const to = createDateAtArgentinaTime(yYear, yMonth, yDay, 23, 59, 59, 999);
      return { from, to };
    }
    case 'week': {
      const todayDate = new Date(Date.UTC(ar.year, ar.month - 1, ar.day));
      const dayOfWeek = todayDate.getUTCDay(); // 0 = Sunday, 1 = Monday...
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      todayDate.setUTCDate(todayDate.getUTCDate() + diffToMonday);
      const from = createDateAtArgentinaTime(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + 1, todayDate.getUTCDate(), 0, 0, 0, 0);
      const to = createDateAtArgentinaTime(ar.year, ar.month, ar.day, 23, 59, 59, 999);
      return { from, to };
    }
    case 'month':
    default: {
      const from = createDateAtArgentinaTime(ar.year, ar.month, 1, 0, 0, 0, 0);
      const to = createDateAtArgentinaTime(ar.year, ar.month, ar.day, 23, 59, 59, 999);
      return { from, to };
    }
  }
}
