// File Name: constants.ts
// Path: backend/src/modules/auth/constants.ts

import type { StringValue } from 'ms';

export const jwtConstants = {
  accessTokenExpiresIn: '15m' as StringValue,
  refreshTokenExpiresIn: '7d' as StringValue,
};
