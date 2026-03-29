import { SetMetadata } from '@nestjs/common';

export const ACTION_ACCESS_KEY = 'actionAccess';

export const RequireAction = (actionKey: string) =>
  SetMetadata(ACTION_ACCESS_KEY, actionKey);
