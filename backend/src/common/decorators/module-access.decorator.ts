import { SetMetadata } from '@nestjs/common';

export const MODULE_ACCESS_KEY = 'moduleAccess';

export const RequireModule = (moduleKey: string) =>
  SetMetadata(MODULE_ACCESS_KEY, moduleKey);
