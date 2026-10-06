import moment from 'moment';
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
  const tokenIsValid = moment().valueOf() < timeExpiredStr * 1000;
  return tokenIsValid ? keystoneToken : '';
};
