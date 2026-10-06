import { setLocalStorageItem } from 'utils/local-storage';
import cookie from 'utils/cookie';
import { cosApiClientV1 } from './cosApi';

const mockGoToLoginPage = jest.fn();
jest.mock('stores/root', () => ({
  __esModule: true,
  default: { goToLoginPage: (...args) => mockGoToLoginPage(...args) },
}));

const requestInterceptor = () =>
  cosApiClientV1.interceptors.request.handlers[0].fulfilled;
const responseErrorInterceptor = () =>
  cosApiClientV1.interceptors.response.handlers[0].rejected;

const setSession = (token, expiredInSeconds) => {
  setLocalStorageItem('keystone_token', token);
  cookie('time_expired', Math.floor(Date.now() / 1000) + expiredInSeconds);
};

describe('cosApiClientV1', () => {
  beforeEach(() => {
    localStorage.clear();
    mockGoToLoginPage.mockClear();
  });

  it('sends the keystone token of the logged-in user', async () => {
    setSession('user-keystone-token', 3600);

    const config = await requestInterceptor()({
      url: '/datacenters/dc1/volumes',
      headers: {},
    });

    expect(config.headers['X-Auth-Token']).toBe('user-keystone-token');
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('does not request a separate cube-cos-api token', async () => {
    setSession('user-keystone-token', 3600);
    const post = jest.spyOn(cosApiClientV1, 'post');

    await requestInterceptor()({
      url: '/datacenters/dc1/volumes',
      headers: {},
    });

    expect(post).not.toHaveBeenCalled();
    post.mockRestore();
  });

  it('skips the token for the auth-free datacenters list', async () => {
    const config = await requestInterceptor()({
      url: '/datacenters',
      headers: {},
    });

    expect(config.headers['X-Auth-Token']).toBeUndefined();
    expect(mockGoToLoginPage).not.toHaveBeenCalled();
  });

  it('sends the user to the login page when the session expired', async () => {
    setSession('user-keystone-token', -60);

    await expect(
      requestInterceptor()({ url: '/datacenters/dc1/volumes', headers: {} })
    ).rejects.toThrow();
    expect(mockGoToLoginPage).toHaveBeenCalled();
  });

  it('sends the user to the login page on 401', async () => {
    const error = { response: { status: 401 } };

    await expect(responseErrorInterceptor()(error)).rejects.toBe(error);
    expect(mockGoToLoginPage).toHaveBeenCalled();
  });

  it('keeps the user on the page for other errors', async () => {
    const error = { response: { status: 500 } };

    await expect(responseErrorInterceptor()(error)).rejects.toBe(error);
    expect(mockGoToLoginPage).not.toHaveBeenCalled();
  });
});
