import { REFRESH_TOKEN_SAFETY_MARGIN } from '../../constants';

/**
 * @param expiresIn number of seconds
 */
export function computeNextRefreshTokenTime(expiresIn: number) {
  return expiresIn ? new Date(Date.now() + expiresIn * 1000 - REFRESH_TOKEN_SAFETY_MARGIN) : undefined;
}
