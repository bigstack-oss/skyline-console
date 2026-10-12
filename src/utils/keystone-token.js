import { getLocalStorageItem } from 'utils/local-storage';
import cookie from 'utils/cookie';

/**
 * Keystone token of the logged-in user, or '' when the session expired.
 * @returns {string}
 */
export const getValidKeystoneToken = () => {
  const keystoneToken = getLocalStorageItem('keystone_token') || '';
  const timeExpiredStr = cookie('time_expired');
  if (!keystoneToken || !timeExpiredStr) {
    return '';
  }
  // A malformed cookie becomes NaN and counts as expired.
  const tokenIsValid = Date.now() < Number(timeExpiredStr) * 1000;
  return tokenIsValid ? keystoneToken : '';
};
