import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Skips JWT and permission checks (e.g. webhooks, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
