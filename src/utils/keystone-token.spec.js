import { setLocalStorageItem } from 'utils/local-storage';
import cookie from 'utils/cookie';
import { getValidKeystoneToken } from './keystone-token';

const expireIn = (seconds) =>
  cookie('time_expired', Math.floor(Date.now() / 1000) + seconds);

describe('getValidKeystoneToken', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'time_expired=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('returns the token while the session is valid', () => {
    setLocalStorageItem('keystone_token', 'abc');
    expireIn(3600);
    expect(getValidKeystoneToken()).toBe('abc');
  });

  it('returns empty after the session expired', () => {
    setLocalStorageItem('keystone_token', 'abc');
    expireIn(-60);
    expect(getValidKeystoneToken()).toBe('');
  });

  it('returns empty when the expiry cookie is malformed', () => {
    setLocalStorageItem('keystone_token', 'abc');
    cookie('time_expired', 'not-a-number');
    expect(getValidKeystoneToken()).toBe('');
  });

  it('returns empty when no token is stored', () => {
    expireIn(3600);
    expect(getValidKeystoneToken()).toBe('');
  });
});
